import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { calculatePlatformFee } from '@/lib/razorpay';
import { FundingRequestDoc, StartupDoc, TimelineEventDoc } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const startupId = searchParams.get('startupId');

    const db = await getDb();
    const fundingCol = db.collection<FundingRequestDoc>('fundingRequests');

    if (user.role === 'investor') {
      const requests = await fundingCol.find({ investorId: user.userId }).toArray();
      return NextResponse.json({ fundingRequests: requests });
    }

    if (user.role === 'founder') {
      let filter: Record<string, any> = {};
      if (startupId) {
        filter.startupId = startupId;
      } else {
        const startupsCol = db.collection<StartupDoc>('startups');
        const myStartups = await startupsCol.find({ founderId: user.userId }).toArray();
        filter.startupId = { $in: myStartups.map(s => s._id) };
      }
      const requests = await fundingCol.find(filter).toArray();
      return NextResponse.json({ fundingRequests: requests });
    }

    return NextResponse.json({ fundingRequests: [] });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Fetch funding requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch funding requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    if (user.role !== 'investor') {
      return NextResponse.json({ error: 'Only investors can submit funding commitments' }, { status: 403 });
    }

    const body = await req.json();
    const {
      startupId,
      type,
      amount,
      message,
      contactDetails,
      brandingLogoUrl,
      sponsorshipDurationDays,
      agreementAccepted
    } = body;

    if (!startupId) {
      return NextResponse.json({ error: 'Startup ID is required' }, { status: 400 });
    }

    if (!agreementAccepted) {
      return NextResponse.json({ error: 'You must review and accept the agreement terms' }, { status: 400 });
    }

    const db = await getDb();
    const startupsCol = db.collection<StartupDoc>('startups');
    const startup = await startupsCol.findOne({ _id: startupId });

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 });
    }

    // MANDATORY GATING RULE: Only unlocked once sprint is completed!
    if (startup.stage !== 'sprint_completed' && startup.stage !== 'funded') {
      return NextResponse.json({
        error: `Funding is locked. This startup is in "${startup.stage}". Investors can commit funds only after an execution sprint is completed.`
      }, { status: 400 });
    }

    const fundingType = type === 'branding_partnership' ? 'branding_partnership' : 'investment';
    const commitAmount = Number(amount) || 0;
    const platformFee = calculatePlatformFee(commitAmount);

    const fundingCol = db.collection<FundingRequestDoc>('fundingRequests');
    const newRequest: FundingRequestDoc = {
      _id: `fnd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      startupId,
      startupName: startup.name,
      investorId: user.userId,
      investorName: user.name,
      type: fundingType,
      amount: commitAmount,
      message: message?.trim() || '',
      contactDetails: contactDetails?.trim() || user.email,
      brandingLogoUrl: fundingType === 'branding_partnership' ? (brandingLogoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80') : undefined,
      sponsorshipDurationDays: fundingType === 'branding_partnership' ? (Number(sponsorshipDurationDays) || 30) : undefined,
      agreementAccepted: true,
      status: 'pending',
      platformFeeAmount: platformFee,
      requestedAt: new Date().toISOString()
    };

    await fundingCol.insertOne(newRequest);

    // Append to timeline
    const timelineCol = db.collection<TimelineEventDoc>('timeline');
    await timelineCol.insertOne({
      _id: `tml_${Date.now()}`,
      startupId,
      eventType: 'funding_requested',
      actorId: user.userId,
      actorName: user.name,
      details: `${user.name} submitted a ${fundingType === 'investment' ? `₹${commitAmount.toLocaleString()} investment commitment` : `branding partnership`} (Test Mode).`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Funding commitment submitted to founder for review.',
      fundingRequest: newRequest
    }, { status: 201 });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Create funding request error:', error);
    return NextResponse.json({ error: 'Failed to submit funding request' }, { status: 500 });
  }
}
