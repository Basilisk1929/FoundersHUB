import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { FundingRequestDoc, StartupDoc, TimelineEventDoc } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await requireAuth();
    const body = await req.json();
    const { status } = body;

    if (!status || !['accepted', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Status must be accepted, rejected, or completed' }, { status: 400 });
    }

    const db = await getDb();
    const fundingCol = db.collection<FundingRequestDoc>('fundingRequests');
    const request = await fundingCol.findOne({ _id: id });

    if (!request) {
      return NextResponse.json({ error: 'Funding request not found' }, { status: 404 });
    }

    const startupsCol = db.collection<StartupDoc>('startups');
    const startup = await startupsCol.findOne({ _id: request.startupId });

    if (!startup || startup.founderId !== user.userId) {
      return NextResponse.json({ error: 'Only the startup founder can respond to funding requests' }, { status: 403 });
    }

    await fundingCol.updateOne({ _id: id }, {
      $set: {
        status,
        processedAt: new Date().toISOString()
      }
    });

    const timelineCol = db.collection<TimelineEventDoc>('timeline');

    if (status === 'accepted' || status === 'completed') {
      if (request.type === 'investment') {
        // Increment funded total
        const newTotal = (startup.totalFundedAmount || 0) + (request.amount || 0);
        await startupsCol.updateOne({ _id: startup._id }, {
          $set: {
            totalFundedAmount: newTotal,
            stage: 'funded'
          }
        });

        await timelineCol.insertOne({
          _id: `tml_${Date.now()}`,
          startupId: startup._id,
          eventType: 'funding_accepted',
          actorId: user.userId,
          actorName: user.name,
          details: `Accepted investment commitment of ₹${(request.amount || 0).toLocaleString()} from ${request.investorName || 'Investor'} (1% simulated platform fee: ₹${(request.platformFeeAmount || 0).toLocaleString()}).`,
          createdAt: new Date().toISOString()
        });
      } else if (request.type === 'branding_partnership' && request.brandingLogoUrl) {
        // Add to branding partnership strip
        const startsAt = new Date().toISOString();
        const durationDays = request.sponsorshipDurationDays || 30;
        const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

        await startupsCol.updateOne({ _id: startup._id }, {
          $push: {
            brandingPartnerships: {
              investorId: request.investorId,
              brandName: request.investorName || 'Partner',
              brandingLogoUrl: request.brandingLogoUrl,
              sponsorshipDurationDays: durationDays,
              startsAt,
              expiresAt
            }
          }
        });

        await timelineCol.insertOne({
          _id: `tml_${Date.now()}`,
          startupId: startup._id,
          eventType: 'funding_accepted',
          actorId: user.userId,
          actorName: user.name,
          details: `Accepted ${durationDays}-day branding partnership with ${request.investorName || 'Partner'}. Logo now displayed in "Powered By" strip.`,
          createdAt: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Funding request ${status} successfully.`,
      status
    });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Respond funding request error:', error);
    return NextResponse.json({ error: 'Failed to respond to funding request' }, { status: 500 });
  }
}
