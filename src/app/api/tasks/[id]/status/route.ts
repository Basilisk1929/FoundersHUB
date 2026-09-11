import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { calculateExecutionScore } from '@/lib/execution-score';
import { TaskDoc, UserDoc, StartupDoc, DepartmentDoc, TimelineEventDoc, SprintDoc } from '@/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await requireAuth();
    const body = await req.json();
    const { status, assigneeId } = body;

    const db = await getDb();
    const tasksCol = db.collection<TaskDoc>('tasks');
    const task = await tasksCol.findOne({ _id: id });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify department access
    const departmentsCol = db.collection<DepartmentDoc>('departments');
    const startupsCol = db.collection<StartupDoc>('startups');
    const usersCol = db.collection<UserDoc>('users');
    const timelineCol = db.collection<TimelineEventDoc>('timeline');
    const sprintsCol = db.collection<SprintDoc>('sprints');

    const department = await departmentsCol.findOne({ _id: task.departmentId });
    const startup = await startupsCol.findOne({ _id: task.startupId });

    if (!department || !startup) {
      return NextResponse.json({ error: 'Associated department or startup not found' }, { status: 404 });
    }

    const isFounder = startup.founderId === user.userId;
    const isMember = department.memberIds.includes(user.userId);

    if (!isFounder && !isMember) {
      return NextResponse.json({ error: 'Forbidden. You are not authorized to update tasks in this department.' }, { status: 403 });
    }

    const updates: Partial<TaskDoc> = {};
    const validStatuses = ['backlog', 'in_progress', 'review', 'done', 'blocked'];

    let pointsAwarded = 0;
    let completedTimestamp: string | undefined;

    if (status && validStatuses.includes(status)) {
      updates.status = status;
      if (status === 'done' && task.status !== 'done') {
        completedTimestamp = new Date().toISOString();
        updates.completedAt = completedTimestamp;
        pointsAwarded = task.contributionPoints || 15;

        // If assignee exists, award totalPoints
        const effectiveAssigneeId = assigneeId || task.assigneeId;
        if (effectiveAssigneeId) {
          await usersCol.updateOne(
            { _id: effectiveAssigneeId },
            { $inc: { totalPoints: pointsAwarded } }
          );

          // Append contribution record
          const contributionsCol = db.collection('contributions');
          await contributionsCol.insertOne({
            _id: `cnt_${Date.now()}`,
            startupId: startup._id,
            developerId: effectiveAssigneeId,
            taskId: task._id,
            taskTitle: task.title,
            points: pointsAwarded,
            awardedAt: completedTimestamp
          });
        }
      }
    }

    if (assigneeId !== undefined) {
      if (assigneeId && !department.memberIds.includes(assigneeId)) {
        return NextResponse.json({ error: 'Assignee must belong to this department' }, { status: 400 });
      }
      updates.assigneeId = assigneeId || undefined;
      if (assigneeId) {
        const u = await usersCol.findOne({ _id: assigneeId });
        updates.assigneeName = u?.name;
      } else {
        updates.assigneeName = undefined;
      }
    }

    await tasksCol.updateOne({ _id: id }, { $set: updates });
    const updatedTask = await tasksCol.findOne({ _id: id });

    // Recalculate startup execution score dynamically
    const allTasks = await tasksCol.find({ startupId: startup._id }).toArray();
    const sprint = startup.activeSprintId ? await sprintsCol.findOne({ _id: startup.activeSprintId }) : null;
    const events = await timelineCol.find({ startupId: startup._id }).toArray();
    const newScore = calculateExecutionScore(sprint, allTasks, events);

    await startupsCol.updateOne({ _id: startup._id }, { $set: { executionScore: newScore } });

    // Append to timeline if completed or moved
    if (status) {
      await timelineCol.insertOne({
        _id: `tml_${Date.now()}`,
        startupId: startup._id,
        departmentId: task.departmentId,
        eventType: 'task_committed',
        actorId: user.userId,
        actorName: user.name,
        details: status === 'done'
          ? `Completed task "${task.title}" (+${task.contributionPoints} pts). Execution score updated to ${newScore}.`
          : `Moved task "${task.title}" to ${status.replace('_', ' ').toUpperCase()}.`,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      task: updatedTask,
      executionScore: newScore,
      pointsAwarded
    });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update task status error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
