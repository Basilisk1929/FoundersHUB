import { NextRequest, NextResponse } from 'next/server';
import { authorizeDepartmentAccess } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { TaskDoc, TimelineEventDoc, UserDoc, ExpenseDoc, FileCommitDoc, SprintDoc, DepartmentDoc } from '@/types';
import { calculateExecutionScore } from '@/lib/execution-score';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Strict department boundary enforcement:
    // If user is founder of startup -> allowed
    // If user is developer -> allowed ONLY if in department.memberIds
    // Otherwise throws DEPARTMENT_ACCESS_DENIED
    const { user, department, startup } = await authorizeDepartmentAccess(id);

    const db = await getDb();
    const tasksCol = db.collection<TaskDoc>('tasks');
    const timelineCol = db.collection<TimelineEventDoc>('timeline');
    const usersCol = db.collection<UserDoc>('users');
    const expensesCol = db.collection<ExpenseDoc>('expenses');
    const filesCol = db.collection<FileCommitDoc>('files');
    const sprintsCol = db.collection<SprintDoc>('sprints');

    // Query tasks ONLY for this authorized department
    const tasks = await tasksCol.find({ departmentId: id }).toArray();

    // Query members belonging to this department
    const members = await usersCol.find({ _id: { $in: department.memberIds } }).toArray();
    const sanitizedMembers = members.map(m => ({
      _id: m._id,
      name: m.name,
      role: m.role,
      bio: m.bio,
      photoUrl: m.photoUrl,
      skills: m.skills || [],
      totalPoints: m.totalPoints || 0
    }));

    // Department-scoped or startup-wide timeline
    const deptTimeline = await timelineCol.find({
      $or: [
        { departmentId: id },
        { startupId: startup._id }
      ]
    }).sort({ createdAt: -1 }).toArray();

    // Files uploaded in this department
    const files = await filesCol.find({ departmentId: id }).sort({ createdAt: -1 }).toArray();

    // Active sprint info
    const sprint = startup.activeSprintId ? await sprintsCol.findOne({ _id: startup.activeSprintId }) : null;

    // Department Execution Score
    const deptScore = calculateExecutionScore(sprint, tasks, deptTimeline);

    // Founder-only data: Expenses (runway & burn rate)
    const isFounder = startup.founderId === user.userId;
    const expenses = isFounder ? await expensesCol.find({ startupId: startup._id }).toArray() : [];

    return NextResponse.json({
      department,
      startup: {
        _id: startup._id,
        name: startup.name,
        founderId: startup.founderId,
        stage: startup.stage,
        executionScore: startup.executionScore,
        proposedEquitySplit: startup.proposedEquitySplit
      },
      sprint,
      deptScore,
      tasks,
      members: sanitizedMembers,
      timeline: deptTimeline.slice(0, 30),
      files,
      expenses,
      isFounder,
      currentUserId: user.userId
    });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'DEPARTMENT_ACCESS_DENIED') {
      return NextResponse.json({
        error: 'Forbidden. You are not a member of this department. Multi-department access requires founder approval.'
      }, { status: 403 });
    }
    if (error.message === 'DEPARTMENT_NOT_FOUND') {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    console.error('Fetch department error:', error);
    return NextResponse.json({ error: 'Failed to fetch department workspace' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, department, startup } = await authorizeDepartmentAccess(id);
    if (startup.founderId !== user.userId) {
      return NextResponse.json({ error: 'Only founder can manage department membership' }, { status: 403 });
    }
    const body = await req.json();
    const { action, memberId } = body;

    const db = await getDb();
    const deptCol = db.collection<DepartmentDoc>('departments');

    if (action === 'remove_member' && memberId) {
      const updatedMembers = department.memberIds.filter(m => m !== memberId);
      await deptCol.updateOne(
        { _id: id },
        { $set: { memberIds: updatedMembers } }
      );
      return NextResponse.json({ success: true, message: 'Member unassigned from department' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update department' }, { status: 500 });
  }
}

