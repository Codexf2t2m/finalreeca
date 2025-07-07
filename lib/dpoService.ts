import axios from 'axios';
import xml2js from 'xml2js';

interface CreateTokenRequest {
  tripId: string;
  orderId: string;
  totalPrice: number;
  userName: string;
  userEmail: string;
  boardingPoint: string;
  droppingPoint: string;
  selectedSeats: string[];
  redirectUrl: string;
  backUrl: string;
  promoCode?: string;
  discountAmount?: number;
  returnTripId?: string;
  returnBoardingPoint?: string;
  returnDroppingPoint?: string;
}

interface CreateTokenResponse {
  success: boolean;
  transactionToken?: string;
  paymentUrl?: string;
  error?: string;
  resultCode?: string;
  resultExplanation?: string;
}

// Helper for DPO date format
const toDPODateFormat = (date: Date) => {
  return date.toISOString().split('T')[0].replace(/-/g, '/');
};

export const createToken = async (requestData: CreateTokenRequest): Promise<CreateTokenResponse> => {
  try {
    // Validate environment variables
    if (!process.env.DPO_COMPANY_TOKEN) {
      console.error('[DPO] DPO_COMPANY_TOKEN is not set');
      throw new Error('Payment gateway configuration error');
    }

    if (!process.env.DPO_SERVICE_TYPE) {
      console.error('[DPO] DPO_SERVICE_TYPE is not set, using default');
    }

    // Split user name
    const nameParts = requestData.userName.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Calculate auto charge date (24 hours from now for better reliability)
    const autoChargeDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Build XML payload with proper structure
    const xmlBuilder = new xml2js.Builder({
      rootName: 'API3G',
      headless: true,
      renderOpts: { pretty: false }, // Compact XML to avoid formatting issues
      xmldec: { version: '1.0', encoding: 'UTF-8' }
    });

    const payloadData = {
      CompanyToken: process.env.DPO_COMPANY_TOKEN,
      Request: 'createToken',
      Transaction: {
        PaymentAmount: requestData.totalPrice.toFixed(2),
        PaymentCurrency: 'BWP', // Changed to Botswana Pula - adjust if needed
        CompanyRef: requestData.orderId,
        RedirectURL: requestData.redirectUrl,
        BackURL: requestData.backUrl,
        CompanyRefUnique: '0',
        CompanyAccRef: `Bus booking for ${requestData.selectedSeats.length} seat(s)`,
        PTL: '24', // Increased to 24 hours
        PTLtype: 'hours',
        customerFirstName: firstName,
        customerLastName: lastName,
        customerEmail: requestData.userEmail,
        // Remove problematic fields that might cause 403
        // TransactionChargeType: '',
        // TransactionAutoChargeDate: toDPODateFormat(autoChargeDate),
        // FraudTimeLimit: '60',
        // AllowRecurrent: ''
      },
      Services: {
        Service: {
          ServiceType: process.env.DPO_SERVICE_TYPE || '3854',
          ServiceDescription: `Bus seats: ${requestData.selectedSeats.join(', ')}`,
          ServiceDate: toDPODateFormat(new Date())
        }
      }
    };

    const xmlPayload = xmlBuilder.buildObject(payloadData);
    
    console.log('[DPO] Sending request to DPO API');
    console.log('[DPO] XML Payload:', xmlPayload.substring(0, 200) + '...');

    // Make API call to DPO with better headers and configuration
    const response = await axios.post('https://secure.3gdirectpay.com/API/v6/', xmlPayload, {
      headers: { 
        'Content-Type': 'application/xml',
        'Accept': 'application/xml',
        'User-Agent': 'Bus-Booking-System/1.0',
        'Cache-Control': 'no-cache'
      },
      timeout: 30000, // Increased timeout
      maxRedirects: 0, // Prevent redirects
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Don't throw on 4xx errors
      }
    });

    console.log('[DPO] Response status:', response.status);
    console.log('[DPO] Response headers:', response.headers);

    // Handle non-200 responses
    if (response.status !== 200) {
      console.error('[DPO] Non-200 response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data?.substring(0, 500)
      });
      
      return {
        success: false,
        error: `Payment gateway returned status ${response.status}. Please try again later.`,
      };
    }

    // Parse XML response
    const parser = new xml2js.Parser({ 
      explicitArray: false, 
      ignoreAttrs: true,
      trim: true,
      tagNameProcessors: [name => name.toLowerCase()]
    });
    
    const result = await parser.parseStringPromise(response.data);
    const api3g = result.api3g;

    console.log('[DPO] Parsed response:', {
      result: api3g?.result,
      resultexplanation: api3g?.resultexplanation,
      hasTransToken: !!api3g?.transtoken
    });

    if (!api3g) {
      return {
        success: false,
        error: 'Invalid response format from payment gateway',
      };
    }

    // Handle success
    if (api3g.result === '000') {
      const transactionToken = api3g.transtoken;
      
      if (!transactionToken) {
        console.error('[DPO] Success response but missing transaction token');
        return {
          success: false,
          error: 'Payment gateway returned success but no transaction token',
        };
      }

      // Payment URL with uppercase ID as required by DPO
      const paymentUrl = `https://secure.3gdirectpay.com/dpopayment.php?ID=${transactionToken}`;
      
      console.log('[DPO] Token created successfully:', transactionToken);
      
      return {
        success: true,
        transactionToken,
        paymentUrl,
        resultCode: api3g.result,
        resultExplanation: api3g.resultexplanation,
      };
    } 
    // Handle DPO API errors
    else {
      console.error('[DPO] API Error:', {
        result: api3g.result,
        explanation: api3g.resultexplanation
      });
      
      return {
        success: false,
        error: api3g.resultexplanation || 'Failed to create payment token',
        resultCode: api3g.result,
      };
    }

  } catch (error: any) {
    console.error('[DPO] Communication Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data?.substring(0, 500),
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    // More specific error messages based on error type
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Payment gateway request timed out. Please try again.',
      };
    }
    
    if (error.response?.status === 403) {
      return {
        success: false,
        error: 'Payment gateway access denied. Please contact support.',
      };
    }
    
    if (error.response?.status >= 500) {
      return {
        success: false,
        error: 'Payment gateway server error. Please try again later.',
      };
    }
    
    return {
      success: false,
      error: 'Payment gateway is currently unavailable. Please try again later.',
    };
  }
};

interface VerifyTokenResponse {
  success: boolean;
  status?: string;
  error?: string;
  resultExplanation?: string;
  transactionData?: {
    transactionToken: string;
    companyRef: string;
    paymentAmount: string;
    paymentCurrency: string;
    customerName?: string;
    customerEmail?: string;
    transactionStatus?: string;
    transactionRef?: string;
  };
}

export const verifyToken = async (transactionToken: string): Promise<VerifyTokenResponse> => {
  try {
    if (!process.env.DPO_COMPANY_TOKEN) {
      throw new Error('DPO company token is not configured');
    }

    const xmlBuilder = new xml2js.Builder({
      rootName: 'API3G',
      headless: true,
      renderOpts: { pretty: false },
      xmldec: { version: '1.0', encoding: 'UTF-8' }
    });
    
    const xmlPayload = xmlBuilder.buildObject({
      CompanyToken: process.env.DPO_COMPANY_TOKEN,
      Request: 'verifyToken',
      TransactionToken: transactionToken,
    });

    console.log('[DPO] Verifying token:', transactionToken);

    const response = await axios.post('https://secure.3gdirectpay.com/API/v6/', xmlPayload, {
      headers: { 
        'Content-Type': 'application/xml',
        'Accept': 'application/xml',
        'User-Agent': 'Bus-Booking-System/1.0',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      }
    });

    if (response.status !== 200) {
      console.error('[DPO] Verification non-200 response:', response.status);
      return {
        success: false,
        error: `Payment verification failed with status ${response.status}`,
      };
    }

    const parser = new xml2js.Parser({ 
      explicitArray: false, 
      ignoreAttrs: true,
      trim: true,
      tagNameProcessors: [name => name.toLowerCase()]
    });
    const result = await parser.parseStringPromise(response.data);

    const api3g = result.api3g;

    if (!api3g) {
      return {
        success: false,
        error: 'Invalid response from payment gateway',
      };
    }

    const resultCode = api3g.result;
    
    console.log('[DPO] Verification result:', {
      result: resultCode,
      explanation: api3g.resultexplanation
    });
    
    if (resultCode === '000') {
      return {
        success: true,
        status: resultCode,
        resultExplanation: api3g.resultexplanation,
        transactionData: {
          transactionToken: api3g.transactiontoken || transactionToken,
          companyRef: api3g.companyref,
          paymentAmount: api3g.transactionamount,
          paymentCurrency: api3g.transactioncurrency,
          customerName: api3g.customername,
          customerEmail: api3g.customeremail,
          transactionStatus: api3g.transactionapproval,
          transactionRef: api3g.transactionref,
        }
      };
    } else {
      return {
        success: false,
        status: resultCode,
        error: api3g.resultexplanation || 'Payment verification failed',
      };
    }
  } catch (error: any) {
    console.error('[DPO] Verification Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      response: error.response?.data?.substring(0, 500),
    });
    
    return {
      success: false,
      error: 'Payment verification service is unavailable',
    };
  }
};