import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { MessageDoc, DepartmentDoc, StartupDoc } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
    }

    const db = await getDb();

    // If department thread, verify access
    if (threadId.startsWith('dept_')) {
      const deptId = threadId.replace('dept_', '');
      const deptCol = db.collection<DepartmentDoc>('departments');
      const dept = await deptCol.findOne({ _id: deptId });
      if (!dept) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 });
      }

      const startupsCol = db.collection<StartupDoc>('startups');
      const startup = await startupsCol.findOne({ _id: dept.startupId });

      const isFounder = startup?.founderId === user.userId;
      const isMember = dept.memberIds.includes(user.userId);

      if (!isFounder && !isMember) {
        return NextResponse.json({ error: 'Access to this department chat is denied' }, { status: 403 });
      }
    }

    const messagesCol = db.collection<MessageDoc>('messages');
    const messages = await messagesCol.find({ threadId }).sort({ createdAt: 1 });

    return NextResponse.json({ messages });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await req.json();
    const { threadId, text, departmentId, startupId } = body;

    if (!threadId || !text || text.trim().length === 0) {
      return NextResponse.json({ error: 'threadId and non-empty text are required' }, { status: 400 });
    }

    const db = await getDb();

    if (threadId.startsWith('dept_')) {
      const deptId = departmentId || threadId.replace('dept_', '');
      const deptCol = db.collection<DepartmentDoc>('departments');
      const dept = await deptCol.findOne({ _id: deptId });
      if (!dept) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 });
      }

      const startupsCol = db.collection<StartupDoc>('startups');
      const startup = await startupsCol.findOne({ _id: dept.startupId });

      const isFounder = startup?.founderId === user.userId;
      const isMember = dept.memberIds.includes(user.userId);

      if (!isFounder && !isMember) {
        return NextResponse.json({ error: 'Cannot post to department you are not a member of' }, { status: 403 });
      }
    }

    const messagesCol = db.collection<MessageDoc>('messages');
    const newMessage: MessageDoc = {
      _id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      threadId,
      startupId,
      departmentId,
      senderId: user.userId,
      senderName: user.name,
      senderRole: user.role,
      text: text.trim().slice(0, 1000),
      createdAt: new Date().toISOString()
    };

    await messagesCol.insertOne(newMessage);

    return NextResponse.json({ message: newMessage }, { status: 201 });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
