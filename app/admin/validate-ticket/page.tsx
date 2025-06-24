"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { ThemeProvider } from "@/components/theme-provider"
import Image from "next/image"
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
import { Html5Qrcode } from "html5-qrcode"

// Mock bookings data for validation
const mockBookings = [
  {
    id: "RT001",
    bookingRef: "RT240001",
    passengerName: "Topo Rapula",
    email: "john.doe@email.com",
    phone: "+267 71 234 567",
    route: "Gaborone → OR Tambo Airport",
    date: new Date(2024, 11, 15),
    time: "07:00",
    bus: "B609BRD - Scania Irizar i6s VIP",
    seats: ["12A", "12B"],
    passengers: 2,
    totalAmount: 1000,
    paymentMethod: "Visa Card",
    paymentStatus: "Paid",
    bookingStatus: "Confirmed",
    boardingPoint: "Mogobe Plaza, Gaborone CBD",
    droppingPoint: "OR Tambo Airport",
    bookedAt: new Date(2024, 10, 28),
    specialRequests: "Window seats preferred",
    scanned: false,
    lastScanned: null,
  },
  {
    id: "RT002",
    bookingRef: "RT240002",
    passengerName: "Karabo",
    email: "jane.smith@email.com",
    phone: "+267 72 345 678",
    route: "OR Tambo Airport → Gaborone",
    date: new Date(2024, 11, 20),
    time: "08:00",
    bus: "B610BRD - Scania Higer Touring",
    seats: ["5A"],
    passengers: 1,
    totalAmount: 500,
    paymentMethod: "Mobile Money",
    paymentStatus: "Paid",
    bookingStatus: "Confirmed",
    boardingPoint: "OR Tambo Airport",
    droppingPoint: "Shell Riverwalk",
    bookedAt: new Date(2024, 10, 29),
    specialRequests: "",
    scanned: true,
    lastScanned: new Date(2024, 11, 20),
  },
]

export default function ValidateTicketPage() {
  const [searchRef, setSearchRef] = useState("")
  const [scannerActive, setScannerActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [validationStatus, setValidationStatus] = useState<"valid" | "invalid" | "already-scanned" | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState<any>(null)
  const scannerRef = useRef<HTMLDivElement>(null)

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => console.log("Scanner stopped"))
          .catch((err: any) => console.error("Error stopping scanner:", err))
      }
    }
  }, [html5QrCode])

  const startScanner = () => {
    if (!scannerRef.current) return

    setScannerActive(true)
    setScanning(true)

    const scanner = new Html5Qrcode("qr-scanner")
    setHtml5QrCode(scanner)

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success callback
          handleScanSuccess(decodedText)
          stopScanner()
        },
        (errorMessage) => {
          // Error callback
          console.log(errorMessage)
        },
      )
      .catch((err: any) => {
        console.error("Error starting scanner:", err)
        setScanning(false)
      })
  }

  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode
        .stop()
        .then(() => {
          console.log("Scanner stopped")
          setScanning(false)
        })
        .catch((err: any) => {
          console.error("Error stopping scanner:", err)
          setScanning(false)
        })
    }
  }

  const handleScanSuccess = (decodedText: string) => {
    try {
      const ticketData = JSON.parse(decodedText)
      validateTicket(ticketData)
    } catch (error) {
      console.error("Invalid QR code data:", error)
      setValidationStatus("invalid")
      setValidationResult({
        error: "Invalid QR code format",
        details: "The QR code does not contain valid ticket data",
      })
    }
  }

  const handleManualSearch = () => {
    if (!searchRef) return

    // Find booking by reference
    const booking = mockBookings.find((b) => b.bookingRef.toLowerCase() === searchRef.toLowerCase())

    if (booking) {
      setValidationResult(booking)
      setValidationStatus(booking.scanned ? "already-scanned" : "valid")
      setShowDetails(true)
    } else {
      setValidationStatus("invalid")
      setValidationResult({
        error: "Booking not found",
        details: `No booking found with reference ${searchRef}`,
      })
      setShowDetails(true)
    }
  }

  const validateTicket = (ticketData: any) => {
    // In a real app, you would verify the hash/signature here
    const booking = mockBookings.find((b) => b.bookingRef === ticketData.ref)

    if (booking) {
      setValidationResult(booking)
      setValidationStatus(booking.scanned ? "already-scanned" : "valid")
      setShowDetails(true)
    } else {
      setValidationStatus("invalid")
      setValidationResult({
        error: "Invalid ticket",
        details: "This ticket does not match any booking in our system",
      })
      setShowDetails(true)
    }
  }

  const markAsScanned = () => {
    // In a real app, you would update the database
    setValidationResult({
      ...validationResult,
      scanned: true,
      lastScanned: new Date(),
    })
    setValidationStatus("already-scanned")
  }

  const resetValidation = () => {
    setValidationResult(null)
    setValidationStatus(null)
    setShowDetails(false)
    setScannerActive(false)
    setSearchRef("")
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                  <Image
                    src="/images/reeca-travel-logo.png"
                    alt="Reeca Travel"
                    width={40}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-teal-900">Reeca Travel</h1>
                  <p className="text-xs text-amber-600">Ticket Validation</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-teal-600 border-teal-600 hover:bg-teal-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-900">
                  <QrCode className="h-5 w-5" />
                  Ticket Validation
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
                            />
                            <Button onClick={handleManualSearch} disabled={!searchRef}>
                              <Search className="h-4 w-4" />
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
                      <p className="text-gray-600 mb-4">Position the QR code within the scanner</p>
                    </div>

                    <div
                      id="qr-scanner"
                      ref={scannerRef}
                      className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden"
                    ></div>

                    <div className="flex justify-center">
                      <Button variant="outline" onClick={stopScanner} className="text-red-600 border-red-600">
                        Cancel Scan
                      </Button>
                    </div>

                    {scanning && (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-teal-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Scanning...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {showDetails && validationResult && (
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
                          This ticket has already been scanned on{" "}
                          {validationResult.lastScanned
                            ? format(validationResult.lastScanned, "MMM dd, yyyy 'at' HH:mm")
                            : "a previous date"}
                          .
                        </AlertDescription>
                      </Alert>
                    )}

                    {validationStatus === "invalid" && (
                      <Alert className="bg-red-50 border-red-200 text-red-800">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Invalid Ticket</AlertTitle>
                        <AlertDescription>{validationResult.error || "This ticket is not valid."}</AlertDescription>
                      </Alert>
                    )}

                    {validationStatus !== "invalid" && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-3 text-gray-800">Ticket Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Booking Ref:</span>
                            <span className="font-semibold ml-2">{validationResult.bookingRef}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Passenger:</span>
                            <span className="font-semibold ml-2">{validationResult.passengerName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Route:</span>
                            <span className="font-semibold ml-2">{validationResult.route}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Date & Time:</span>
                            <span className="font-semibold ml-2">
                              {format(validationResult.date, "MMM dd, yyyy")} at {validationResult.time}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Bus:</span>
                            <span className="font-semibold ml-2">{validationResult.bus}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Seats:</span>
                            <span className="font-semibold ml-2">{validationResult.seats.join(", ")}</span>
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
                        <Button onClick={markAsScanned} className="bg-teal-600 hover:bg-teal-700 text-white">
                          <CheckCircle className="h-4 w-4 mr-2" />
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
      </div>
    </ThemeProvider>
  )
}
