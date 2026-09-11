import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { StartupDoc } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, message, answers } = body;

    const db = await getDb();
    const startupsCol = db.collection<StartupDoc>('startups');

    if (mode === 'matching') {
      // Fetch only published / sprint_active / sprint_completed startups
      const publicStartups = await startupsCol.find({
        visibility: 'public',
        stage: { $in: ['published', 'sprint_active', 'sprint_completed'] }
      }).toArray();

      const userRole = answers?.role || 'developer';
      const sectorInterest = (answers?.sector || '').toLowerCase();
      const skills = (answers?.skills || '').toLowerCase();

      // Rank startups based on matches
      const scored = publicStartups.map(s => {
        let score = 0;
        if (sectorInterest && s.sector.toLowerCase().includes(sectorInterest)) score += 3;
        if (skills && s.tags.some(t => skills.includes(t.toLowerCase()))) score += 2;
        if (s.stage === 'sprint_active' && userRole === 'developer') score += 2;
        if (s.stage === 'sprint_completed' && userRole === 'investor') score += 4;
        return { startup: s, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const topMatches = scored.slice(0, 3).map(item => ({
        _id: item.startup._id,
        name: item.startup.name,
        tagline: item.startup.tagline,
        sector: item.startup.sector,
        stage: item.startup.stage,
        executionScore: item.startup.executionScore,
        matchReason: userRole === 'investor'
          ? item.startup.stage === 'sprint_completed'
            ? `Verified Execution Score of ${item.startup.executionScore}/100 with completed sprint — ready for funding.`
            : `Active sprint in ${item.startup.sector} with high velocity.`
          : `Active departments hiring builders with equity vesting tied to sprint points.`
      }));

      return NextResponse.json({
        mode: 'matching',
        matches: topMatches,
        text: `Here are the top ${topMatches.length} matching execution-first startups curated for your profile:`
      });
    }

    // Support Mode
    const q = (message || '').toLowerCase();
    let reply = '';

    if (q.includes('readiness') || q.includes('gate') || q.includes('publish')) {
      reply = 'The **Readiness Gate** ensures quality before any idea is listed publicly. A founder must provide:\n1. A clear Problem Statement (30+ characters)\n2. Concrete Validation Evidence (interviews, waitlist, market data)\n3. An Initial Proposed Equity Split.\nOnce all 3 are complete, the idea moves from Draft to Published!';
    } else if (q.includes('sprint') || q.includes('how it works') || q.includes('delivery')) {
      reply = 'FoundersHub operates on **time-bound sprints** (14, 21, or 30 days). Opening a sprint creates 8 specialized departments (Development, Marketing, Design, Product, etc.). Builders join, complete Kanban tasks, and earn contribution points that dynamically vest equity!';
    } else if (q.includes('invest') || q.includes('fund') || q.includes('razorpay')) {
      reply = 'Investors can commit funds **only after a sprint completes**! This guarantees you only back startups that have demonstrated delivery. Payments run via Razorpay Test Mode with a simulated 1% platform fee, plus support for Branding Partnerships ("Powered by" strip).';
    } else if (q.includes('equity') || q.includes('points')) {
      reply = 'Equity is **execution-based, not promise-based**. Each completed Kanban task awards contribution points to the builder. The Builders Pool is dynamically split according to accumulated points, visible in the live Equity Pie chart!';
    } else {
      reply = 'Welcome to **FoundersHub** ("Ideas are cheap. Delivery is the currency."). You can explore published startups on the Discover page, join as a Developer to earn equity during active sprints, or back proven teams as an Investor once sprints conclude. What would you like help with?';
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && message) {
      try {
        const sysPrompt = "You are the FoundersHub AI Assistant. FoundersHub is a platform where 'Ideas are cheap. Delivery is the currency.' It connects Founders, Builders, and Investors through an 8-department sprint engine, points-based equity vesting, a 3-point readiness gate, and post-sprint syndication. Answer questions concisely, professionally, and helpfully.";
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${sysPrompt}\n\nUser Question: ${message}` }]
            }]
          })
        });
        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return NextResponse.json({ mode: 'support', text });
          }
        }
      } catch (err) {
        console.warn('[Site Bot] Gemini API error, falling back:', err);
      }
    }

    return NextResponse.json({
      mode: 'support',
      text: reply
    });

  } catch (error: any) {
    console.error('Site bot error:', error);
    return NextResponse.json({ error: 'Failed to answer inquiry' }, { status: 500 });
  }
}
