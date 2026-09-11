import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { createRazorpayOrder, getPublicRazorpayKey } from '@/lib/razorpay';
import { getDb } from '@/lib/db/mongodb';
import { FundingRequestDoc } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    if (user.role !== 'investor') {
      return NextResponse.json({ error: 'Only investors can initiate funding payments' }, { status: 403 });
    }

    const body = await req.json();
    const { fundingRequestId, amount } = body;

    if (!fundingRequestId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid fundingRequestId and amount are required' }, { status: 400 });
    }

    const db = await getDb();
    const fundingCol = db.collection<FundingRequestDoc>('fundingRequests');
    const fundingRequest = await fundingCol.findOne({ _id: fundingRequestId });

    if (!fundingRequest) {
      return NextResponse.json({ error: 'Funding request not found' }, { status: 404 });
    }

    const orderResult = await createRazorpayOrder(Number(amount));

    await fundingCol.updateOne({ _id: fundingRequestId }, {
      $set: {
        razorpayOrderId: orderResult.orderId,
        paymentStatus: 'created',
        platformFeeAmount: orderResult.platformFeeAmount
      }
    });

    return NextResponse.json({
      orderId: orderResult.orderId,
      amount: orderResult.amount,
      currency: orderResult.currency,
      keyId: getPublicRazorpayKey(),
      isMock: orderResult.isMock,
      platformFeeAmount: orderResult.platformFeeAmount
    });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create Razorpay order error:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
