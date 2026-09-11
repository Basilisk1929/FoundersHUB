import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db/mongodb';
import { ensureSeedData } from '@/lib/db/seed';
import { UserDoc } from '@/types';

export async function GET() {
  try {
    await ensureSeedData();
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');
    const user = await usersCol.findOne({ _id: session.userId });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        bio: user.bio,
        skills: user.skills || [],
        sectorsOfInterest: user.sectorsOfInterest || [],
        theme: user.theme || 'dark',
        identityVerificationStatus: user.identityVerificationStatus || 'unverified',
        identityDetails: user.identityDetails,
        totalPoints: user.totalPoints || 0
      }
    });
  } catch (error: any) {
    console.error('Fetch me error:', error);
    return NextResponse.json({ user: null });
  }
}
