import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db/mongodb';
import { ensureSeedData } from '@/lib/db/seed';
import { setSessionCookie } from '@/lib/auth/session';
import { UserDoc } from '@/types';

export async function POST(req: NextRequest) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const rawEmail = email.toLowerCase().trim();
    const aliasMap: Record<string, string> = {
      'alex@founder.io': 'founder@founderhub.com',
      'priya@builder.dev': 'developer@founderhub.com',
      'vikram@capital.vc': 'investor@founderhub.com',
      'aarav@foundershub.dev': 'founder@founderhub.com',
      'priya@foundershub.dev': 'developer@founderhub.com',
      'rohit@foundershub.dev': 'investor@founderhub.com'
    };
    const lookupEmail = aliasMap[rawEmail] || rawEmail;

    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');
    const user = await usersCol.findOne({ email: lookupEmail });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    await setSessionCookie({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl,
      theme: user.theme || 'dark'
    });

    return NextResponse.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        bio: user.bio,
        skills: user.skills,
        sectorsOfInterest: user.sectorsOfInterest,
        theme: user.theme || 'dark',
        identityVerificationStatus: user.identityVerificationStatus,
        totalPoints: user.totalPoints
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}
