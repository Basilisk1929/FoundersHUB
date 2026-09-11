import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { ApplicationDoc, StartupDoc, DepartmentDoc, TimelineEventDoc } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await requireAuth();
    const body = await req.json();
    const { status } = body;

    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be accepted or rejected' }, { status: 400 });
    }

    const db = await getDb();
    const applicationsCol = db.collection<ApplicationDoc>('applications');
    const application = await applicationsCol.findOne({ _id: id });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const startupsCol = db.collection<StartupDoc>('startups');
    const startup = await startupsCol.findOne({ _id: application.startupId });

    if (!startup || startup.founderId !== user.userId) {
      return NextResponse.json({ error: 'Only the startup founder can review applications' }, { status: 403 });
    }

    // Update application status
    await applicationsCol.updateOne({ _id: id }, { $set: { status } });

    // If accepted, add developer to the department memberIds
    if (status === 'accepted') {
      const departmentsCol = db.collection<DepartmentDoc>('departments');
      await departmentsCol.updateOne(
        { _id: application.departmentId },
        { $push: { memberIds: application.developerId } }
      );

      // Append to timeline
      const timelineCol = db.collection<TimelineEventDoc>('timeline');
      await timelineCol.insertOne({
        _id: `tml_${Date.now()}`,
        startupId: startup._id,
        departmentId: application.departmentId,
        eventType: 'joined',
        actorId: application.developerId,
        actorName: application.developerName,
        details: `${application.developerName} joined the ${application.departmentName || 'department'} team.`,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully.`,
      status
    });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Review application error:', error);
    return NextResponse.json({ error: 'Failed to review application' }, { status: 500 });
  }
}
