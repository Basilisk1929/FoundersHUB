import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FileCommitDoc, TimelineEventDoc } from '@/types';

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.svg', '.zip', '.mp4', '.json'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const departmentId = formData.get('departmentId') as string | null;
    const startupId = formData.get('startupId') as string | null;
    const commitMessage = (formData.get('commitMessage') as string) || 'Added file commit';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({
        error: `Invalid file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`
      }, { status: 400 });
    }

    // Generate random safe filename
    const safeName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeName}`;

    // If departmentId is provided, log to repository commits
    if (departmentId && startupId) {
      const db = await getDb();
      const filesCol = db.collection<FileCommitDoc>('files');
      const timelineCol = db.collection<TimelineEventDoc>('timeline');

      const existingCount = await filesCol.countDocuments({ departmentId });
      const version = existingCount + 1;

      const commitDoc: FileCommitDoc = {
        _id: `fil_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        startupId,
        departmentId,
        fileName: originalName,
        fileSize: file.size,
        fileUrl,
        uploadedBy: user.userId,
        uploaderName: user.name,
        commitMessage,
        version,
        createdAt: new Date().toISOString()
      };

      await filesCol.insertOne(commitDoc);

      await timelineCol.insertOne({
        _id: `tml_${Date.now()}`,
        startupId,
        departmentId,
        eventType: 'file_committed',
        actorId: user.userId,
        actorName: user.name,
        details: `Committed file "${originalName}" (v${version}) to repository: "${commitMessage}".`,
        createdAt: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        fileUrl,
        commit: commitDoc
      }, { status: 201 });
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: originalName
    }, { status: 201 });

  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
