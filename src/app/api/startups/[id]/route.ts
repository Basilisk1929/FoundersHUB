import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { authorizeStartupOwner } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { StartupDoc, DepartmentDoc, SprintDoc, TaskDoc, TimelineEventDoc } from '@/types';

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

    const currentUser = await getCurrentUser();
    const isOwner = currentUser?.userId === startup.founderId;

    // Visibility check
    if (startup.visibility === 'private' && !isOwner) {
      return NextResponse.json({ error: 'This startup is currently private' }, { status: 403 });
    }

    // Fetch related active sprint and departments if any
    const sprintsCol = db.collection<SprintDoc>('sprints');
    const departmentsCol = db.collection<DepartmentDoc>('departments');
    const timelineCol = db.collection<TimelineEventDoc>('timeline');

    const sprint = startup.activeSprintId ? await sprintsCol.findOne({ _id: startup.activeSprintId }) : null;
    const departments = await departmentsCol.find({ startupId: id }).toArray();
    const timeline = await timelineCol.find({ startupId: id }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      startup,
      sprint,
      departments: departments.map(d => ({
        _id: d._id,
        name: d.name,
        memberCount: d.memberIds.length,
        isMember: currentUser ? d.memberIds.includes(currentUser.userId) : false
      })),
      timeline: timeline.slice(0, 15),
      isOwner
    });
  } catch (error: any) {
    console.error('Fetch startup by ID error:', error);
    return NextResponse.json({ error: 'Failed to fetch startup' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await authorizeStartupOwner(id);
    const body = await req.json();

    const allowedUpdates: (keyof StartupDoc)[] = [
      'name', 'tagline', 'description', 'problemStatement', 
      'validationEvidence', 'sector', 'tags', 'proposedEquitySplit',
      'pitchDeckUrl', 'pitchVideoUrl', 'images', 'visibility',
      'isFundingPaused', 'minTicketSize', 'brandingPartnerships'
    ];

    const updateFields: Partial<StartupDoc> = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        (updateFields as any)[key] = body[key];
      }
    }

    const db = await getDb();
    const startupsCol = db.collection<StartupDoc>('startups');
    await startupsCol.updateOne({ _id: id }, { $set: updateFields });

    const updated = await startupsCol.findOne({ _id: id });
    return NextResponse.json({ startup: updated });
  } catch (error: any) {
    if (error.message === 'NOT_STARTUP_OWNER' || error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized to modify this startup' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update startup' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await authorizeStartupOwner(id);

    const db = await getDb();
    const startupsCol = db.collection<StartupDoc>('startups');
    const sprintsCol = db.collection<SprintDoc>('sprints');
    const departmentsCol = db.collection<DepartmentDoc>('departments');
    const tasksCol = db.collection<TaskDoc>('tasks');

    await startupsCol.deleteOne({ _id: id });
    await sprintsCol.deleteMany({ startupId: id });
    await departmentsCol.deleteMany({ startupId: id });
    await tasksCol.deleteMany({ startupId: id });

    return NextResponse.json({ success: true, message: 'Startup deleted successfully' });
  } catch (error: any) {
    if (error.message === 'NOT_STARTUP_OWNER' || error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized to delete this startup' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete startup' }, { status: 500 });
  }
}
