import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { NotificationDoc } from '@/types';

export async function GET() {
  try {
    const { user } = await requireAuth();
    const db = await getDb();
    const notifsCol = db.collection<NotificationDoc>('notifications');

    const notifs = await notifsCol.find({ userId: user.userId }).sort({ createdAt: -1 }).toArray();
    const unreadCount = notifs.filter(n => !n.read).length;

    return NextResponse.json({
      notifications: notifs.slice(0, 20),
      unreadCount
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await req.json();
    const { notificationId, markAllRead } = body;

    const db = await getDb();
    const notifsCol = db.collection<NotificationDoc>('notifications');

    if (markAllRead) {
      await notifsCol.updateMany({ userId: user.userId }, { $set: { read: true } });
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      await notifsCol.updateOne({ _id: notificationId, userId: user.userId }, { $set: { read: true } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
