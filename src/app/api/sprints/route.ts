import { NextRequest, NextResponse } from 'next/server';
import { authorizeStartupOwner } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { SprintDoc, StartupDoc, DepartmentDoc, TimelineEventDoc } from '@/types';

export const DEFAULT_DEPARTMENTS = [
  'Development',
  'Marketing',
  'Design (UI/UX)',
  'Product/Management',
  'Sales',
  'Customer Support',
  'Operations',
  'Finance'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startupId, durationDays, commitmentType, commitmentValue } = body;

    if (!startupId) {
      return NextResponse.json({ error: 'startupId is required' }, { status: 400 });
    }

    const { user, startup } = await authorizeStartupOwner(startupId);

    const validDurations = [14, 21, 30];
    const duration = validDurations.includes(Number(durationDays)) ? Number(durationDays) as 14 | 21 | 30 : 21;

    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();

    const db = await getDb();
    const sprintsCol = db.collection<SprintDoc>('sprints');
    const departmentsCol = db.collection<DepartmentDoc>('departments');
    const startupsCol = db.collection<StartupDoc>('startups');
    const timelineCol = db.collection<TimelineEventDoc>('timeline');

    const sprintId = `spr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newSprint: SprintDoc = {
      _id: sprintId,
      startupId,
      durationDays: duration,
      startDate,
      endDate,
      status: 'active',
      founderCommitment: {
        type: commitmentType === 'deposit' ? 'deposit' : 'hours',
        value: Number(commitmentValue) || (commitmentType === 'deposit' ? 25000 : 25)
      },
      lastActivityAt: startDate,
      executionScore: 30
    };

    await sprintsCol.insertOne(newSprint);

    // Automatically create the eight default departments
    const deptDocs: DepartmentDoc[] = DEFAULT_DEPARTMENTS.map(name => ({
      _id: `dept_${startupId}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      startupId,
      sprintId,
      name,
      memberIds: [user.userId], // Founder is a member of every department
      description: `${name} department for ${startup.name} execution sprint.`
    }));

    // Remove any stale department docs for this startup if re-launching
    await departmentsCol.deleteMany({ startupId });
    await departmentsCol.insertMany(deptDocs);

    // Update startup to sprint_active stage
    await startupsCol.updateOne({ _id: startupId }, {
      $set: {
        stage: 'sprint_active',
        activeSprintId: sprintId,
        executionScore: Math.max(startup.executionScore, 35)
      }
    });

    // Append to timeline
    await timelineCol.insertOne({
      _id: `tml_${Date.now()}`,
      startupId,
      eventType: 'sprint_started',
      actorId: user.userId,
      actorName: user.name,
      details: `Opened ${duration}-day execution sprint with 8 departments. Founder committed ${newSprint.founderCommitment.value} ${newSprint.founderCommitment.type === 'deposit' ? 'INR refundable deposit' : 'hours/week'}.`,
      createdAt: startDate
    });

    return NextResponse.json({
      success: true,
      sprint: newSprint,
      departments: deptDocs
    }, { status: 201 });

  } catch (error: any) {
    if (error.message === 'NOT_STARTUP_OWNER' || error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized to open sprint for this startup' }, { status: 403 });
    }
    console.error('Open sprint error:', error);
    return NextResponse.json({ error: 'Failed to open sprint' }, { status: 500 });
  }
}
