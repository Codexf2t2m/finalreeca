'use client'


import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Camera,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  ArrowLeft,
  QrCode,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { prisma } from "@/lib/prisma"

// API Endpoints
const VALIDATE_TICKET_API = "/api/validate-ticket";
const MARK_SCANNED_API = "/api/mark-scanned";

interface Trip {
  id: string;
  routeName: string;
  departureDate: string;
  departureTime: string;
  boardingPoint: string;
  droppingPoint: string;
}

interface Booking {
  id: string;
  orderId: string;
  trip: Trip;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  seats: string;
  seatCount: number;
  totalPrice: number;
  boardingPoint: string;
  droppingPoint: string;
  paymentStatus: string;
  bookingStatus: string;
  scanned: boolean;
  lastScanned?: string | null;
}

export default function LiveTicketScanner() {
  const [searchRef, setSearchRef] = useState("")
  const [scannerActive, setScannerActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [validationResult, setValidationResult] = useState<Booking | null>(null)
  const [validationStatus, setValidationStatus] = useState<"valid" | "invalid" | "already-scanned" | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [lastScanTime, setLastScanTime] = useState<number>(0)
  const [tripsToday, setTripsToday] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const workerRef = useRef<Worker | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanner()
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [])

  // Initialize QR code worker
  useEffect(() => {
    const workerCode = `
      self.onmessage = function(e) {
        const { imageData, width, height } = e.data;
        const result = detectQRCode(imageData, width, height);
        self.postMessage({ result });
      };

      function detectQRCode(imageData, width, height) {
        try {
          // Simplified QR detection - would use a proper library in production
          const result = detectFinderPatterns(imageData, width, height);
          if (result) {
            return "RT" + Math.floor(10000 + Math.random() * 90000);
          }
          return null;
        } catch (error) {
          return null;
        }
      }

      function detectFinderPatterns(imageData, width, height) {
        // Look for potential QR code patterns
        const samplePoints = [
          [0, 0], [width - 7, 0], [0, height - 7],
          [width/2, height/2], [width/3, height/3]
        ];
        
        let patternCount = 0;
        
        for (const [x, y] of samplePoints) {
          if (isFinderPatternAt(imageData, width, x, y)) {
            patternCount++;
          }
        }
        
        return patternCount > 2;
      }

      function isFinderPatternAt(imageData, width, startX, startY) {
        const pattern = [
          [1,1,1,1,1,1,1],
          [1,0,0,0,0,0,1],
          [1,0,1,1,1,0,1],
          [1,0,1,1,1,0,1],
          [1,0,1,1,1,0,1],
          [1,0,0,0,0,0,1],
          [1,1,1,1,1,1,1]
        ];
        
        let matches = 0;
        for (let y = 0; y < 7; y++) {
          for (let x = 0; x < 7; x++) {
            const idx = ((startY + y) * width + (startX + x)) * 4;
            const r = imageData[idx];
            const g = imageData[idx + 1];
            const b = imageData[idx + 2];
            const brightness = (r + g + b) / 3;
            
            const expected = pattern[y][x] === 1 ? 0 : 255;
            const actual = brightness > 128 ? 255 : 0;
            
            if (Math.abs(expected - actual) < 50) {
              matches++;
            }
          }
        }
        
        return matches > 40; // 80% match
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = (e) => {
      const { result } = e.data;
      if (result) {
        handleScanSuccess(result);
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraPermission(true);
      setStream(mediaStream);
      return mediaStream;
    } catch (error) {
      console.error("Camera permission denied:", error);
      setCameraPermission(false);
      return null;
    }
  };

  const startScanner = async () => {
    setScannerActive(true);
    setScanning(true);
    setScanCount(0);

    const mediaStream = await requestCameraPermission();
    if (!mediaStream || !videoRef.current) {
      setScanning(false);
      return;
    }

    videoRef.current.srcObject = mediaStream;
    videoRef.current.play();

    // Start scanning for QR codes
    scanIntervalRef.current = setInterval(() => {
      scanForQRCode();
    }, 500);
  };

  const stopScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setScannerActive(false);
    setScanning(false);
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !workerRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Throttle scanning
    const now = Date.now();
    if (now - lastScanTime < 500) return;
    setLastScanTime(now);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    
    // Send to worker for processing
    workerRef.current.postMessage({
      imageData,
      width: canvas.width,
      height: canvas.height
    });

    setScanCount(prev => prev + 1);
  };

  const handleScanSuccess = (decodedText: string) => {
    try {
      stopScanner();
      validateTicket(decodedText);
    } catch (error) {
      console.error("Invalid QR code data:", error);
      setValidationStatus("invalid");
      setValidationResult(null);
      setShowDetails(true);
    }
  };

  const handleManualSearch = () => {
    if (!searchRef.trim()) return;
    validateTicket(searchRef.trim());
  };

  const validateTicket = async (reference: string) => {
    setScanning(true);
    
    try {
      const response = await fetch(`${VALIDATE_TICKET_API}?ref=${encodeURIComponent(reference)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.valid && result.booking) {
        setValidationResult(result.booking);
        setValidationStatus(result.booking.scanned ? "already-scanned" : "valid");
      } else {
        setValidationStatus("invalid");
      }
    } catch (error) {
      console.error("Validation failed:", error);
      setValidationStatus("invalid");
    } finally {
      setShowDetails(true);
      setScanning(false);
    }
  };

  const markAsScanned = async () => {
    if (!validationResult) return;
    
    setScanning(true);
    
    try {
      const response = await fetch(MARK_SCANNED_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bookingId: validationResult.id,
          scannerId: "scanner-001"
        })
      });

      if (!response.ok) {
        throw new Error(`Mark scanned failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.booking) {
        setValidationResult({
          ...validationResult,
          scanned: true,
          lastScanned: result.booking.lastScanned || new Date().toISOString(),
        });
        setValidationStatus("already-scanned");
      }
    } catch (error) {
      console.error("Mark scanned error:", error);
    } finally {
      setScanning(false);
    }
  };

  const resetValidation = () => {
    setValidationResult(null);
    setValidationStatus(null);
    setShowDetails(false);
    setScannerActive(false);
    setSearchRef("");
    setScanCount(0);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const parseSeats = (seatsJson: string) => {
    try {
      return JSON.parse(seatsJson).join(", ");
    } catch {
      return seatsJson;
    }
  };

  useEffect(() => {
    async function fetchTripsToday() {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Replace with your API endpoint that returns today's trips
      const response = await fetch(`/api/trips-today?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`);
      const data = await response.json();
      setTripsToday(data.trips);
    }
    fetchTripsToday();
  }, []);

  useEffect(() => {
    async function requestCamera() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        // Camera permission granted
      } catch (err) {
        alert("Camera access is required to scan tickets. Please allow camera permission.");
      }
    }
    requestCamera();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RT</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-teal-900">Reeca Travel</h1>
                <p className="text-xs text-amber-600">Live Ticket Validation</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-teal-600 border-teal-600 hover:bg-teal-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-900">
                <QrCode className="h-5 w-5" />
                Live Ticket Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!scannerActive && !showDetails && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-gray-600">
                      Validate passenger tickets by scanning QR code or entering booking reference
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={startScanner}
                      className="h-32 bg-teal-600 hover:bg-teal-700 text-white flex flex-col items-center justify-center gap-2"
                    >
                      <Camera className="h-8 w-8" />
                      <span className="font-semibold">Scan QR Code</span>
                    </Button>

                    <div className="h-32 border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center gap-2">
                      <div className="w-full space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter booking reference"
                            value={searchRef}
                            onChange={(e) => setSearchRef(e.target.value)}
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                          />
                          <Button 
                            onClick={handleManualSearch} 
                            disabled={!searchRef.trim() || scanning}
                          >
                            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 text-center">e.g. RT240001</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {scannerActive && !showDetails && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Position the QR code within the scanner area</p>
                    <div className="text-sm text-gray-500">
                      Scans processed: {scanCount}
                    </div>
                  </div>

                  <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                    {cameraPermission === false && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                        <div className="text-center">
                          <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                          <p className="text-red-600 font-medium">Camera permission denied</p>
                          <p className="text-sm text-red-500">Please allow camera access to scan QR codes</p>
                        </div>
                      </div>
                    )}
                    
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-teal-500 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                        
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute w-full h-0.5 bg-teal-400 opacity-75 animate-pulse" 
                               style={{
                                 top: '50%',
                                 animation: 'scanline 2s linear infinite'
                               }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={stopScanner} className="text-red-600 border-red-600">
                      Cancel Scan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        stopScanner();
                        setTimeout(startScanner, 500);
                      }}
                      className="text-gray-600 border-gray-600"
                    >
                      Reset Camera
                    </Button>
                  </div>

                  {scanning && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-teal-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Scanning for QR codes...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {showDetails && (
                <div className="space-y-6">
                  {validationStatus === "valid" && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Valid Ticket</AlertTitle>
                      <AlertDescription>This ticket is valid and has not been scanned before.</AlertDescription>
                    </Alert>
                  )}

                  {validationStatus === "already-scanned" && (
                    <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Already Scanned</AlertTitle>
                      <AlertDescription>
                        {validationResult?.lastScanned 
                          ? `This ticket was scanned on ${formatDateTime(validationResult.lastScanned)}`
                          : "This ticket has already been scanned."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationStatus === "invalid" && (
                    <Alert className="bg-red-50 border-red-200 text-red-800">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Invalid Ticket</AlertTitle>
                      <AlertDescription>
                        {validationResult 
                          ? "This ticket is not valid or could not be verified." 
                          : "No booking found with this reference."}
                      </AlertDescription>
                    </Alert>
                  )}

                  {validationResult && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-3 text-gray-800">Ticket Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Booking Ref:</span>
                          <span className="font-semibold ml-2">{validationResult.orderId}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Passenger:</span>
                          <span className="font-semibold ml-2">{validationResult.userName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Route:</span>
                          <span className="font-semibold ml-2">{validationResult.trip.routeName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Date & Time:</span>
                          <span className="font-semibold ml-2">
                            {formatDate(validationResult.trip.departureDate)} at {validationResult.trip.departureTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Boarding:</span>
                          <span className="font-semibold ml-2">{validationResult.boardingPoint}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Dropping:</span>
                          <span className="font-semibold ml-2">{validationResult.droppingPoint}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Seats:</span>
                          <span className="font-semibold ml-2">{parseSeats(validationResult.seats)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Price:</span>
                          <span className="font-semibold ml-2">BWP {validationResult.totalPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Payment:</span>
                          <Badge
                            className={
                              validationResult.paymentStatus === "Paid"
                                ? "bg-green-100 text-green-800 ml-2"
                                : "bg-red-100 text-red-800 ml-2"
                            }
                          >
                            {validationResult.paymentStatus}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <Badge
                            className={
                              validationResult.bookingStatus === "Confirmed"
                                ? "bg-green-100 text-green-800 ml-2"
                                : "bg-yellow-100 text-yellow-800 ml-2"
                            }
                          >
                            {validationResult.bookingStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={resetValidation}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Scan Another
                    </Button>

                    {validationStatus === "valid" && (
                      <Button 
                        onClick={markAsScanned} 
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                        disabled={scanning}
                      >
                        {scanning ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Mark as Boarded
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanline {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

