import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { authorizeStartupOwner } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { StartupDoc, TimelineEventDoc } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const startupsCol = db.collection<StartupDoc>('startups');
    const startup = await startupsCol.findOne({ _id: id });

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 });
    }

    const hasProblem = Boolean(startup.problemStatement && startup.problemStatement.trim().length >= 30);
    const hasValidation = Boolean(startup.validationEvidence && startup.validationEvidence.trim().length >= 20);
    const hasEquity = Boolean(startup.proposedEquitySplit && Object.keys(startup.proposedEquitySplit).length > 0);

    const items = [
      {
        id: 'problem_statement',
        label: 'Written Problem Statement',
        description: 'Clear, concise description of the friction, market inefficiency, or customer pain.',
        completed: hasProblem,
        currentValue: startup.problemStatement || ''
      },
      {
        id: 'validation_evidence',
        label: 'Validation Evidence',
        description: 'Customer interviews, waitlist metrics, prototype tests, or research links proving demand.',
        completed: hasValidation,
        currentValue: startup.validationEvidence || ''
      },
      {
        id: 'equity_split',
        label: 'Initial Proposed Equity Split',
        description: 'Transparent distribution proposed for founders and future sprint contributors.',
        completed: hasEquity,
        currentValue: startup.proposedEquitySplit
      }
    ];

    const completedCount = items.filter(i => i.completed).length;
    const canPublish = completedCount === 3;

    return NextResponse.json({
      items,
      completedCount,
      totalCount: items.length,
      canPublish,
      stage: startup.stage,
      ownershipHash: startup.ownershipHash,
      ownershipTimestamp: startup.ownershipTimestamp
    });
  } catch (error: any) {
    console.error('Readiness check error:', error);
    return NextResponse.json({ error: 'Failed to inspect readiness gate' }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, startup } = await authorizeStartupOwner(id);

    const hasProblem = Boolean(startup.problemStatement && startup.problemStatement.trim().length >= 30);
    const hasValidation = Boolean(startup.validationEvidence && startup.validationEvidence.trim().length >= 20);
    const hasEquity = Boolean(startup.proposedEquitySplit && Object.keys(startup.proposedEquitySplit).length > 0);

    if (!hasProblem || !hasValidation || !hasEquity) {
      return NextResponse.json({
        error: 'Readiness Gate blocked. All 3 criteria (problem statement, validation evidence, equity split) must be satisfied before publishing.'
      }, { status: 400 });
    }

    // Generate cryptographic ownership snapshot hash
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({
      startupId: startup._id,
      founderId: user.userId,
      name: startup.name,
      problemStatement: startup.problemStatement,
      validationEvidence: startup.validationEvidence,
      timestamp
    });

    const ownershipHash = crypto.createHash('sha256').update(payload).digest('hex');

    const db = await getDb();
    const startupsCol = db.collection<StartupDoc>('startups');
    const timelineCol = db.collection<TimelineEventDoc>('timeline');

    await startupsCol.updateOne({ _id: id }, {
      $set: {
        stage: 'published',
        visibility: 'public',
        ownershipHash,
        ownershipTimestamp: timestamp,
        executionScore: Math.max(startup.executionScore, 35)
      }
    });

    // Write to audit trail
    await timelineCol.insertOne({
      _id: `tml_${Date.now()}`,
      startupId: id,
      eventType: 'readiness_gate_passed',
      actorId: user.userId,
      actorName: user.name,
      details: `Passed Readiness Gate & published to Discover. Cryptographic Proof Hash: ${ownershipHash.slice(0, 16)}...`,
      createdAt: timestamp
    });

    const updated = await startupsCol.findOne({ _id: id });
    return NextResponse.json({
      success: true,
      message: 'Startup published to Discover feed!',
      startup: updated,
      ownershipHash
    });
  } catch (error: any) {
    if (error.message === 'NOT_STARTUP_OWNER' || error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    console.error('Publish readiness error:', error);
    return NextResponse.json({ error: 'Failed to publish startup' }, { status: 500 });
  }
}
