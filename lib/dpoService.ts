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
    // Validate environment
    if (!process.env.DPO_COMPANY_TOKEN) {
      console.error('DPO_COMPANY_TOKEN is not set');
      throw new Error('Payment gateway configuration error');
    }

    // Split user name
    const nameParts = requestData.userName.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Calculate auto charge date (15 hours from now)
    const autoChargeDate = new Date(Date.now() + 15 * 60 * 60 * 1000);

    // Build XML payload
    const xmlBuilder = new xml2js.Builder({
      rootName: 'API3G',
      headless: true,
      renderOpts: { pretty: true }
    });

    const payloadData = {
      CompanyToken: process.env.DPO_COMPANY_TOKEN,
      Request: 'createToken',
      Transaction: {
        PaymentAmount: requestData.totalPrice.toFixed(2),
        PaymentCurrency: 'USD',
        CompanyRef: requestData.orderId,
        RedirectURL: requestData.redirectUrl,
        BackURL: requestData.backUrl,
        CompanyRefUnique: '0',
        CompanyAccRef: `Bus booking ${requestData.orderId}`,
        PTL: '15',
        TransactionChargeType: '',
        TransactionAutoChargeDate: toDPODateFormat(autoChargeDate),
        PTLtype: 'hours',
        customerFirstName: firstName,
        customerLastName: lastName,
        customerEmail: requestData.userEmail,
        FraudTimeLimit: '60',
        AllowRecurrent: ''
      },
      Services: {
        Service: {
          ServiceType: process.env.DPO_SERVICE_TYPE || '3854',
          ServiceDescription: requestData.selectedSeats.join(', ') || 'Bus Seats',
          ServiceDate: toDPODateFormat(new Date())
        }
      }
    };

    const xmlPayload = xmlBuilder.buildObject(payloadData);
    
    // Make API call to DPO
    const response = await axios.post('https://secure.3gdirectpay.com/API/v6/', xmlPayload, {
      headers: { 
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      },
      timeout: 15000
    });

    // Parse XML response
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

    // Handle success
    if (api3g.result === '000') {
      const transactionToken = api3g.transtoken;
      
      if (!transactionToken) {
        console.error('Success response but missing transaction token');
        return {
          success: false,
          error: 'Payment gateway returned success but no transaction token',
        };
      }

      // CORRECTED PAYMENT URL - uses uppercase ID as required by DPO
      const paymentUrl = `https://secure.3gdirectpay.com/dpopayment.php?ID=${transactionToken}`;
      
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
      return {
        success: false,
        error: api3g.resultexplanation || 'Failed to create payment token',
        resultCode: api3g.result,
      };
    }

  } catch (error: any) {
    console.error('DPO Communication Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
    
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
      renderOpts: { pretty: true }
    });
    
    const xmlPayload = xmlBuilder.buildObject({
      CompanyToken: process.env.DPO_COMPANY_TOKEN,
      Request: 'verifyToken',
      TransactionToken: transactionToken,
    });

    const response = await axios.post('https://secure.3gdirectpay.com/API/v6/', xmlPayload, {
      headers: { 
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      },
      timeout: 10000,
    });

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
    console.error('DPO Verification Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
    });
    
    return {
      success: false,
      error: 'Payment verification service is unavailable',
    };
  }
};