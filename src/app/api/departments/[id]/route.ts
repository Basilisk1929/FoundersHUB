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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, department, startup } = await authorizeDepartmentAccess(id);
    const body = await req.json();
    const { type, message, fileName, content, topic } = body;

    const db = await getDb();
    const timelineCol = db.collection<TimelineEventDoc>('timeline');

    if (type === 'chat') {
      if (!message || !message.trim()) {
        return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
      }
      const messagesCol = db.collection('messages');
      const newMsg = {
        _id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        departmentId: id,
        startupId: startup._id,
        senderId: user.userId,
        senderName: user.name,
        senderRole: user.role,
        message: message.trim(),
        createdAt: new Date().toISOString()
      };
      await messagesCol.insertOne(newMsg);
      return NextResponse.json({ message: newMsg }, { status: 201 });
    }

    if (type === 'save_sop' || type === 'save_file') {
      const filesCol = db.collection<FileCommitDoc>('files');
      const sopName = fileName || `SOP_${department.name.replace(/\s+/g, '_')}_${Date.now()}.md`;
      const fileText = content || message || '';
      const fileDoc: FileCommitDoc = {
        _id: `fil_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        startupId: startup._id,
        departmentId: id,
        fileName: sopName,
        fileSize: Buffer.byteLength(fileText, 'utf8'),
        fileUrl: `data:text/markdown;charset=utf-8,${encodeURIComponent(fileText)}`,
        uploadedBy: user.userId,
        uploaderName: user.name,
        commitMessage: `SOP for ${department.name}: ${topic || 'Standard Operating Procedure'}`,
        version: (await filesCol.countDocuments({ departmentId: id })) + 1,
        createdAt: new Date().toISOString()
      };
      await filesCol.insertOne(fileDoc);

      await timelineCol.insertOne({
        _id: `tml_${Date.now()}`,
        startupId: startup._id,
        departmentId: id,
        eventType: 'file_committed',
        actorId: user.userId,
        actorName: user.name,
        details: `Saved SOP "${sopName}" to ${department.name} vault.`,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({ file: fileDoc, success: true }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid type specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process department request' }, { status: 500 });
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
    const { action, memberId, targetDepartmentId } = body;

    const db = await getDb();
    const deptCol = db.collection<DepartmentDoc>('departments');
    const timelineCol = db.collection<TimelineEventDoc>('timeline');
    const usersCol = db.collection<UserDoc>('users');

    if (action === 'remove_member' && memberId) {
      const updatedMembers = department.memberIds.filter(m => m !== memberId);
      await deptCol.updateOne(
        { _id: id },
        { $set: { memberIds: updatedMembers } }
      );
      return NextResponse.json({ success: true, message: 'Member unassigned from department' });
    }

    if ((action === 'transfer_member' || action === 'reassign_member') && memberId && targetDepartmentId) {
      if (id === targetDepartmentId) {
        return NextResponse.json({ error: 'Target department must be different' }, { status: 400 });
      }
      const targetDept = await deptCol.findOne({ _id: targetDepartmentId, startupId: startup._id });
      if (!targetDept) {
        return NextResponse.json({ error: 'Target department not found in this startup' }, { status: 404 });
      }

      // Remove from source department
      const sourceUpdatedMembers = (department.memberIds || []).filter(m => m !== memberId);
      await deptCol.updateOne(
        { _id: id },
        { $set: { memberIds: sourceUpdatedMembers } }
      );

      // Add to target department
      const targetExisting = targetDept.memberIds || [];
      const targetUpdatedMembers = targetExisting.includes(memberId) ? targetExisting : [...targetExisting, memberId];
      await deptCol.updateOne(
        { _id: targetDepartmentId },
        { $set: { memberIds: targetUpdatedMembers } }
      );

      // Update active application if any exists
      const appCol = db.collection('applications');
      await appCol.updateMany(
        { startupId: startup._id, developerId: memberId, status: 'accepted' },
        { $set: { departmentId: targetDepartmentId, departmentName: targetDept.name } }
      );

      const memberUser = await usersCol.findOne({ _id: memberId });
      const memberName = memberUser?.name || memberId;

      await timelineCol.insertOne({
        _id: `tml_${Date.now()}`,
        startupId: startup._id,
        departmentId: targetDepartmentId,
        eventType: 'role_granted',
        actorId: user.userId,
        actorName: user.name,
        details: `Founder transferred builder ${memberName} from ${department.name} to ${targetDept.name}.`,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: `Transferred ${memberName} to ${targetDept.name}`,
        sourceDepartmentId: id,
        targetDepartmentId
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update department' }, { status: 500 });
  }
}

