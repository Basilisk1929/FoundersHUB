import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { calculateExecutionScore } from '@/lib/execution-score';
import { computeEquityBreakdown } from '@/lib/equity';
import { SprintDoc, StartupDoc, TaskDoc, TimelineEventDoc, UserDoc } from '@/types';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await requireAuth();

    const db = await getDb();
    const sprintsCol = db.collection<SprintDoc>('sprints');
    const startupsCol = db.collection<StartupDoc>('startups');
    const tasksCol = db.collection<TaskDoc>('tasks');
    const timelineCol = db.collection<TimelineEventDoc>('timeline');
    const usersCol = db.collection<UserDoc>('users');

    const sprint = await sprintsCol.findOne({ _id: id });
    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }

    const startup = await startupsCol.findOne({ _id: sprint.startupId });
    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 });
    }

    // Only startup founder can finalize sprint
    if (startup.founderId !== user.userId) {
      return NextResponse.json({ error: 'Only the startup founder can complete the sprint' }, { status: 403 });
    }

    const tasks = await tasksCol.find({ startupId: startup._id }).toArray();
    const timeline = await timelineCol.find({ startupId: startup._id }).toArray();
    const members = await usersCol.find().toArray();

    // Finalize dynamic execution score
    const finalScore = calculateExecutionScore(sprint, tasks, timeline);

    // Compute vested equity distribution
    const equitySlices = computeEquityBreakdown(
      startup.founderName || 'Founder',
      startup.proposedEquitySplit,
      tasks.filter(t => t.status === 'done'),
      members
    );

    const vestedSplit: Record<string, number> = {};
    for (const slice of equitySlices) {
      vestedSplit[slice.name] = slice.percentage;
    }

    const completedAt = new Date().toISOString();

    // Update Sprint record
    await sprintsCol.updateOne({ _id: id }, {
      $set: {
        status: 'completed',
        executionScore: finalScore,
        lastActivityAt: completedAt
      }
    });

    // Update Startup record to sprint_completed (Gating condition for Investor Funding!)
    await startupsCol.updateOne({ _id: startup._id }, {
      $set: {
        stage: 'sprint_completed',
        executionScore: finalScore,
        vestedEquitySplit: vestedSplit
      }
    });

    // Append to timeline
    await timelineCol.insertOne({
      _id: `tml_${Date.now()}`,
      startupId: startup._id,
      eventType: 'sprint_completed',
      actorId: user.userId,
      actorName: user.name,
      details: `Execution sprint completed! Final Execution Score: ${finalScore}/100. Equity vested to builders based on contribution points. Investor Funding is now UNLOCKED.`,
      createdAt: completedAt
    });

    return NextResponse.json({
      success: true,
      message: 'Sprint marked completed. Equity vested and investor funding unlocked!',
      finalExecutionScore: finalScore,
      vestedEquitySplit: vestedSplit
    });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Complete sprint error:', error);
    return NextResponse.json({ error: 'Failed to complete sprint' }, { status: 500 });
  }
}
