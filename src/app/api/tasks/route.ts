import { NextRequest, NextResponse } from 'next/server';
import { authorizeDepartmentAccess } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { TaskDoc, UserDoc, TimelineEventDoc } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { departmentId, title, description, assigneeId, priority, contributionPoints, dueDate } = body;

    if (!departmentId || !title || title.trim().length < 3) {
      return NextResponse.json({ error: 'Department ID and valid title are required' }, { status: 400 });
    }

    const { user, department, startup } = await authorizeDepartmentAccess(departmentId);

    // Verify assignee if provided
    let assigneeName: string | undefined;
    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');

    if (assigneeId) {
      if (!department.memberIds.includes(assigneeId)) {
        return NextResponse.json({ error: 'Assignee must be a member of this department' }, { status: 400 });
      }
      const assigneeUser = await usersCol.findOne({ _id: assigneeId });
      assigneeName = assigneeUser?.name;
    }

    const tasksCol = db.collection<TaskDoc>('tasks');
    const timelineCol = db.collection<TimelineEventDoc>('timeline');

    const newTask: TaskDoc = {
      _id: `tsk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      departmentId,
      startupId: startup._id,
      title: title.trim(),
      description: description?.trim() || '',
      assigneeId: assigneeId || undefined,
      assigneeName,
      priority: ['low', 'medium', 'high', 'critical'].includes(priority) ? priority : 'medium',
      status: 'backlog',
      contributionPoints: Number(contributionPoints) || 15,
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString()
    };

    await tasksCol.insertOne(newTask);

    // Log to audit trail
    await timelineCol.insertOne({
      _id: `tml_${Date.now()}`,
      startupId: startup._id,
      departmentId,
      eventType: 'task_committed',
      actorId: user.userId,
      actorName: user.name,
      details: `Created task "${newTask.title}" [${newTask.contributionPoints} pts, Priority: ${newTask.priority}].`,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ task: newTask }, { status: 201 });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'DEPARTMENT_ACCESS_DENIED') {
      return NextResponse.json({ error: 'Forbidden: Access to this department is denied' }, { status: 403 });
    }
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
