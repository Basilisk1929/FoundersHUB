import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db/mongodb';
import { ensureSeedData } from '@/lib/db/seed';
import { setSessionCookie } from '@/lib/auth/session';
import { UserDoc, UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { name, email, password, role, bio, skills, sectorsOfInterest } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const validRoles: UserRole[] = ['founder', 'developer', 'investor'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Role must be founder, developer, or investor' }, { status: 400 });
    }

    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');
    const existing = await usersCol.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newUser: UserDoc = {
      _id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      bio: bio?.trim() || '',
      skills: Array.isArray(skills) ? skills : [],
      sectorsOfInterest: Array.isArray(sectorsOfInterest) ? sectorsOfInterest : [],
      theme: 'dark',
      identityVerificationStatus: 'unverified',
      createdAt: new Date().toISOString()
    };

    await usersCol.insertOne(newUser);

    await setSessionCookie({
      userId: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      theme: newUser.theme
    });

    return NextResponse.json({
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        bio: newUser.bio,
        skills: newUser.skills,
        sectorsOfInterest: newUser.sectorsOfInterest,
        theme: newUser.theme,
        identityVerificationStatus: newUser.identityVerificationStatus
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
