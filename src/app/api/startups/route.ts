import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { ensureSeedData } from '@/lib/db/seed';
import { StartupDoc } from '@/types';

export async function GET(req: NextRequest) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');
    const sector = searchParams.get('sector');
    const search = searchParams.get('search');
    const founderOnly = searchParams.get('founderOnly');

    const currentUser = await getCurrentUser();
    const db = await getDb();
    const startupsCol = db.collection<StartupDoc>('startups');

    let filter: Record<string, any> = {};

    if (founderOnly === 'true') {
      if (!currentUser || currentUser.role !== 'founder') {
        return NextResponse.json({ startups: [] });
      }
      filter = { founderId: currentUser.userId };
    } else {
      // Public discover view: only published, sprint_active, sprint_completed, or funded
      if (stage) {
        filter.stage = stage;
      } else {
        filter.stage = { $in: ['published', 'sprint_active', 'sprint_completed', 'funded'] };
      }
      filter.visibility = 'public';
    }

    if (sector && sector !== 'all') {
      filter.sector = sector;
    }

    let results = await startupsCol.find(filter).toArray();

    if (search && search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ startups: results });
  } catch (error: any) {
    console.error('Fetch startups error:', error);
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireRole(['founder']);
    const body = await req.json();
    const { name, tagline, description, problemStatement, validationEvidence, sector, tags, proposedEquitySplit, images } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Startup name is required' }, { status: 400 });
    }

    if (!tagline || tagline.trim().length < 5) {
      return NextResponse.json({ error: 'Tagline must be at least 5 characters' }, { status: 400 });
    }

    const db = await getDb();
    const startupsCol = db.collection<StartupDoc>('startups');

    const newStartup: StartupDoc = {
      _id: `stp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      founderId: user.userId,
      founderName: user.name,
      name: name.trim(),
      tagline: tagline.trim(),
      description: description?.trim() || '',
      problemStatement: problemStatement?.trim() || '',
      validationEvidence: validationEvidence?.trim() || '',
      sector: sector || 'AI / Software',
      tags: Array.isArray(tags) ? tags : ['Startup'],
      stage: 'draft',
      proposedEquitySplit: proposedEquitySplit || { 'Founder': 70, 'Builders Pool': 30 },
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80'],
      visibility: 'private',
      executionScore: 15,
      createdAt: new Date().toISOString()
    };

    await startupsCol.insertOne(newStartup);

    return NextResponse.json({ startup: newStartup }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN_ROLE') {
      return NextResponse.json({ error: 'Only founders can create startups' }, { status: 403 });
    }
    console.error('Create startup error:', error);
    return NextResponse.json({ error: 'Failed to create startup' }, { status: 500 });
  }
}
