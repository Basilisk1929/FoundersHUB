import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { ApplicationDoc, StartupDoc, DepartmentDoc, TimelineEventDoc } from '@/types';

export async function GET() {
  try {
    const { user } = await requireAuth();
    const db = await getDb();
    const applicationsCol = db.collection<ApplicationDoc>('applications');

    if (user.role === 'developer') {
      const myApps = await applicationsCol.find({ developerId: user.userId }).toArray();
      return NextResponse.json({ applications: myApps });
    }

    if (user.role === 'founder') {
      const startupsCol = db.collection<StartupDoc>('startups');
      const myStartups = await startupsCol.find({ founderId: user.userId }).toArray();
      const startupIds = myStartups.map(s => s._id);

      const founderApps = await applicationsCol.find({ startupId: { $in: startupIds } }).toArray();
      return NextResponse.json({ applications: founderApps });
    }

    return NextResponse.json({ applications: [] });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Fetch applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    if (user.role !== 'developer') {
      return NextResponse.json({ error: 'Only developers can apply to departments' }, { status: 403 });
    }

    const body = await req.json();
    const { startupId, departmentId, coverNote, resumeUrl, answers } = body;

    if (!startupId || !departmentId) {
      return NextResponse.json({ error: 'Startup ID and Department ID are required' }, { status: 400 });
    }

    const db = await getDb();
    const startupsCol = db.collection<StartupDoc>('startups');
    const departmentsCol = db.collection<DepartmentDoc>('departments');
    const applicationsCol = db.collection<ApplicationDoc>('applications');

    const startup = await startupsCol.findOne({ _id: startupId });
    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404 });
    }

    const department = await departmentsCol.findOne({ _id: departmentId });
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if developer has already applied to a department in this startup
    const existing = await applicationsCol.findOne({
      startupId,
      developerId: user.userId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existing) {
      return NextResponse.json({
        error: `You already have an active application to the "${existing.departmentName || 'department'}" department for this startup.`
      }, { status: 409 });
    }

    const newApp: ApplicationDoc = {
      _id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      startupId,
      startupName: startup.name,
      departmentId,
      departmentName: department.name,
      developerId: user.userId,
      developerName: user.name,
      developerEmail: user.email,
      coverNote: coverNote?.trim() || '',
      resumeUrl: resumeUrl || 'https://files.foundershub.dev/resumes/default-builder.pdf',
      answers: answers || {},
      status: 'pending',
      appliedAt: new Date().toISOString()
    };

    await applicationsCol.insertOne(newApp);

    // Notify founder via timeline
    const timelineCol = db.collection<TimelineEventDoc>('timeline');
    await timelineCol.insertOne({
      _id: `tml_${Date.now()}`,
      startupId,
      departmentId,
      eventType: 'joined',
      actorId: user.userId,
      actorName: user.name,
      details: `${user.name} applied to join the ${department.name} department.`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      application: newApp
    }, { status: 201 });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Submit application error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}
