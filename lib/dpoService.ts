import axios from 'axios';
import xml2js from 'xml2js';

export interface CreateTokenRequest {
  tripId: string;
  orderId: string;
  totalPrice: number;
  userName: string;
  userEmail: string;
  boardingPoint: string;
  droppingPoint: string;
  selectedSeats: string[];
  redirectUrl: string;  // Make sure this is included
  backUrl: string;      // Make sure this is included
  promoCode?: string;
  discountAmount?: number;
  returnTripId?: string;
  returnBoardingPoint?: string;
  returnDroppingPoint?: string;
  
}

export interface CreateTokenResponse {
  success: boolean;
  transactionToken?: string;
  paymentUrl?: string;
  error?: string;
  resultCode?: string;
  resultExplanation?: string;
}

export const createToken = async (requestData: CreateTokenRequest): Promise<CreateTokenResponse> => {
  try {
    const companyToken = process.env.DPO_COMPANY_TOKEN || '8D3DA73D-9D7F-4E09-96D4-3D44E7A83EA3';

    // Split user name
    const nameParts = requestData.userName.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Check if we're in development mode (localhost) and use empty URLs
    const isLocalhost = requestData.redirectUrl.includes('localhost') || requestData.backUrl.includes('localhost');
    const redirectUrl = isLocalhost ? '' : requestData.redirectUrl;
    const backUrl = isLocalhost ? '' : requestData.backUrl;

    // Build XML payload
    const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${companyToken}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${requestData.totalPrice.toFixed(2)}</PaymentAmount>
    <PaymentCurrency>BWP</PaymentCurrency>
    <CompanyRef>${requestData.orderId}</CompanyRef>
    <RedirectURL>${redirectUrl}</RedirectURL>
    <BackURL>${backUrl}</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>15</PTL>
    <customerFirstName>${firstName}</customerFirstName>
    <customerLastName>${lastName}</customerLastName>
    <customerEmail>${requestData.userEmail}</customerEmail>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>3854</ServiceType>
      <ServiceDescription>Bus ticket booking</ServiceDescription>
      <ServiceDate>${new Date().toISOString().split('T')[0].replace(/-/g, '/')} 07:00</ServiceDate>
    </Service>
  </Services>
</API3G>`;

    console.log('[DPO-SERVICE] XML Payload:', xmlPayload);

    // Send to DPO
    const response = await axios.post('https://secure.3gdirectpay.com/API/v6/', xmlPayload, {
      headers: {
        'Content-Type': 'application/xml',
        'Accept': 'application/xml'
      },
      timeout: 20000
    });

    console.log('[DPO-SERVICE] Raw response:', response.data);

    // Parse XML response
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true, trim: true });
    const result = await parser.parseStringPromise(response.data);
    const api3g = result.API3G || result.api3g;

    console.log('[DPO-SERVICE] Parsed response:', api3g);

    if (api3g && api3g.Result === '000' && api3g.TransToken) {
      return {
        success: true,
        transactionToken: api3g.TransToken,
        paymentUrl: `https://secure.3gdirectpay.com/dpopayment.php?ID=${api3g.TransToken}`,
        resultCode: api3g.Result,
        resultExplanation: api3g.ResultExplanation
      };
    } else {
      return {
        success: false,
        error: api3g?.ResultExplanation || 'Failed to create payment token',
        resultCode: api3g?.Result
      };
    }
  } catch (error: any) {
    console.error('[DPO-SERVICE] Error:', error.message);
    return {
      success: false,
      error: error.message || 'Payment gateway error'
    };
  }
};