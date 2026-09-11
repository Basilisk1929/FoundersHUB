import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { UserDoc } from '@/types';

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await req.json();
    const { bio, photoUrl, theme, skills, sectorsOfInterest, identityDetails } = body;

    const db = await getDb();
    const usersCol = db.collection<UserDoc>('users');

    const updateFields: Partial<UserDoc> = {};
    if (typeof bio === 'string') updateFields.bio = bio.slice(0, 500);
    if (typeof photoUrl === 'string') updateFields.photoUrl = photoUrl;
    if (theme === 'light' || theme === 'dark') updateFields.theme = theme;
    if (Array.isArray(skills)) updateFields.skills = skills.map(s => String(s).slice(0, 50));
    if (Array.isArray(sectorsOfInterest)) updateFields.sectorsOfInterest = sectorsOfInterest.map(s => String(s).slice(0, 50));

    // Handle Identity Verification Signal (Self-attestation / Document Mock)
    if (identityDetails && identityDetails.idType && identityDetails.idLast4) {
      updateFields.identityVerificationStatus = 'self_attested';
      updateFields.identityDetails = {
        idType: identityDetails.idType === 'pan' ? 'pan' : 'aadhaar',
        idLast4: String(identityDetails.idLast4).slice(-4),
        documentName: identityDetails.documentName || 'ID_Document.pdf',
        attestedAt: new Date().toISOString()
      };
    }

    await usersCol.updateOne({ _id: user.userId }, { $set: updateFields });
    const updated = await usersCol.findOne({ _id: user.userId });

    return NextResponse.json({
      user: {
        _id: updated?._id,
        name: updated?.name,
        email: updated?.email,
        role: updated?.role,
        photoUrl: updated?.photoUrl,
        bio: updated?.bio,
        skills: updated?.skills,
        sectorsOfInterest: updated?.sectorsOfInterest,
        theme: updated?.theme,
        identityVerificationStatus: updated?.identityVerificationStatus,
        identityDetails: updated?.identityDetails
      }
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
