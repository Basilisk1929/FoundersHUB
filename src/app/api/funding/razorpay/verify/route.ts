import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { getDb } from '@/lib/db/mongodb';
import { FundingRequestDoc, StartupDoc, TimelineEventDoc } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await req.json();
    const { fundingRequestId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!fundingRequestId || !razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json({ error: 'Missing required payment verification parameters' }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature || 'test_mode_verified_sig');
    if (!isValid) {
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    const db = await getDb();
    const fundingCol = db.collection<FundingRequestDoc>('fundingRequests');
    const fundingRequest = await fundingCol.findOne({ _id: fundingRequestId });

    if (!fundingRequest) {
      return NextResponse.json({ error: 'Funding request not found' }, { status: 404 });
    }

    // Mark payment status success and mark request completed
    await fundingCol.updateOne({ _id: fundingRequestId }, {
      $set: {
        razorpayPaymentId,
        paymentStatus: 'success',
        status: 'completed',
        processedAt: new Date().toISOString()
      }
    });

    // Update startup funded total
    const startupsCol = db.collection<StartupDoc>('startups');
    const startup = await startupsCol.findOne({ _id: fundingRequest.startupId });

    if (startup && fundingRequest.type === 'investment') {
      const newTotal = (startup.totalFundedAmount || 0) + (fundingRequest.amount || 0);
      await startupsCol.updateOne({ _id: startup._id }, {
        $set: {
          totalFundedAmount: newTotal,
          stage: 'funded'
        }
      });
    }

    // Append to timeline
    const timelineCol = db.collection<TimelineEventDoc>('timeline');
    await timelineCol.insertOne({
      _id: `tml_${Date.now()}`,
      startupId: fundingRequest.startupId,
      eventType: 'funding_accepted',
      actorId: user.userId,
      actorName: user.name,
      details: `Razorpay Test Mode payment completed! Transferred ₹${(fundingRequest.amount || 0).toLocaleString()} (Order: ${razorpayOrderId}).`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Razorpay Test Mode payment verified successfully!',
      paymentId: razorpayPaymentId
    });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Verify Razorpay payment error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
