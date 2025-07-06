import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/dpoService';
import { prisma } from '@/lib/prisma';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { transactionToken, orderId } = req.body;

  try {
    if (!transactionToken || !orderId) {
      throw new Error('Missing parameters');
    }

    // Verify payment with DPO
    const verification = await verifyToken(transactionToken);
    
    if (!verification.success) {
      return res.status(400).json(verification);
    }

    // Update booking status based on verification
    let paymentStatus = 'pending';
    if (verification.isPaid) {
      paymentStatus = 'paid';
    } else if (verification.result === '904') {
      paymentStatus = 'cancelled';
    }

    await prisma.booking.update({
      where: { orderId },
      data: { paymentStatus },
    });

    return res.status(200).json(verification);
  } catch (err: any) {
    console.error('[VERIFICATION] Error:', err.message);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}