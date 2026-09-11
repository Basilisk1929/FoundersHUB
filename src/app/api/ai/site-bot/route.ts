import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';
import { StartupDoc } from '@/types';
import { callGemini, GeminiMessage } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, message, answers, history = [] } = body;

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
      const scored = publicStartups.map((s: StartupDoc) => {
        let score = 0;
        if (sectorInterest && s.sector.toLowerCase().includes(sectorInterest)) score += 3;
        if (skills && s.tags.some((t: string) => skills.includes(t.toLowerCase()))) score += 2;
        if (s.stage === 'sprint_active' && userRole === 'developer') score += 2;
        if (s.stage === 'sprint_completed' && userRole === 'investor') score += 4;
        return { startup: s, score };
      });

      scored.sort((a: any, b: any) => b.score - a.score);
      const topMatches = scored.slice(0, 3).map((item: any) => ({
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

    // 1. Call Gemini FIRST with complete conversational context & platform database ground truth
    if (message) {
      const allPublic = await startupsCol.find({ visibility: 'public' }).toArray();
      const sampleStartups = allPublic.slice(0, 3);
      const startupNames = sampleStartups.map((s: StartupDoc) => `"${s.name}" (${s.sector}, Stage: ${s.stage})`).join(', ');

      const sysPrompt = `You are the highly intelligent, articulate FoundersHub AI Assistant.
FoundersHub's core ethos: "Ideas are cheap. Delivery is the currency."
Platform Architecture:
1. Phase 1 - Idea Validation & 3-Point Readiness Gate:
   - Problem Statement: must be >= 30 characters explaining the specific real-world pain.
   - Validation Evidence: must be >= 20 characters providing customer signals, waitlist metrics, or user interviews.
   - Proposed Equity Split: must allocate >= 10% to the Builders Pool (default: 65% Founder, 25% Builders Pool, 10% Investors).
   - Generates an immutable SHA-256 digital fingerprint snapshot on publication.
2. Phase 2 - 8-Department Sprint Engine:
   - 8 cross-functional departments: Product & Engineering, UI/UX Design, Growth & Marketing, Sales & Partnerships, Finance & Accounting, Legal & Compliance, Operations & HR, Customer Support.
   - Sprints run for 14, 21, or 30 days.
   - Rule: Developers can join only ONE department per sprint to guarantee focus.
   - Equity Vesting: Equity is never promised; it is mathematically earned via Kanban contribution points completed from the Builders Pool.
3. Phase 3 - Post-Sprint Syndication:
   - Capital commitments are strictly locked until a sprint completes.
   - Investors back proven delivery with Razorpay test checkout (cards, UPI, netbanking).
   - 1% platform fee is automatically deducted for FoundersHub treasury.
   - Investors can also sponsor 30-Day "Powered By" branding partnerships shown on venture profiles.
4. Active Platform Context:
   - Currently ${allPublic.length} published ventures live, including ${startupNames}.

Instructions for Responses:
- Speak as an expert venture builder and technical co-founder.
- Provide direct, insightful, comprehensive answers.
- Use markdown formatting with bullet points and bold highlights.
- If the user asks technical, architectural, or startup strategy questions, give high-level, practical advice.
- Never give brief robotic 1-sentence answers. Answer the user's explicit question thoroughly and proactively suggest the next logical step.`;

      const formattedHistory: GeminiMessage[] = (history as any[]).map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        content: typeof h.text === 'string' ? h.text : (h.content || '')
      }));

      const geminiResult = await callGemini(message, {
        systemPrompt: sysPrompt,
        history: formattedHistory,
        temperature: 0.7,
        maxOutputTokens: 900
      });

      if (geminiResult && geminiResult.text) {
        return NextResponse.json({
          mode: 'support',
          text: geminiResult.text
        });
      }
    }

    // 2. Dynamic, intelligent response engine if Gemini API key is missing or quota is exhausted
    const q = (message || '').toLowerCase();
    let reply = '';

    if (q.includes('readiness') || q.includes('gate') || q.includes('publish') || q.includes('validation')) {
      reply = `### 🛡️ The 3-Point Readiness Gate Explained\n\n` +
        `FoundersHub prevents vaporware by requiring every startup idea to pass strict readiness verification before being visible to developers or investors:\n\n` +
        `1. **Problem Statement ($\ge 30$ chars)**: Must articulate a distinct, measurable pain point in the market.\n` +
        `2. **Validation Evidence ($\ge 20$ chars)**: Requires customer discovery signals, waitlist counts, or pilot agreements.\n` +
        `3. **Equitable Builders Pool Allocation ($\ge 10\\%$)**: Founders must reserve at least 10% (typically 25%) of venture equity for sprint contributors.\n\n` +
        `Upon meeting all criteria, the venture generates a cryptographic **SHA-256 digital fingerprint snapshot** guaranteeing attribution and unlocking the sprint engine.`;
    } else if (q.includes('sprint') || q.includes('how it works') || q.includes('department') || q.includes('engine')) {
      reply = `### ⚡ The 8-Department Sprint Engine\n\n` +
        `FoundersHub transforms ideas into products through time-boxed delivery cycles (14, 21, or 30 days):\n\n` +
        `• **8 Department Workspaces**: Engineering, UI/UX Design, Growth Marketing, Sales, Finance, Legal, Operations, and Support.\n` +
        `• **Single-Department Focus**: To maintain high velocity, developers join exactly ONE department per sprint.\n` +
        `• **Point-Based Equity Vesting**: Every deliverable completed on the Kanban board awards contribution points. Your share of the Builders Equity Pool is mathematically proportional to your points delivered.\n` +
        `• **Execution Score**: Startups accumulate an execution score (0-100) reflecting velocity, task completion rate, and department activity.`;
    } else if (q.includes('invest') || q.includes('fund') || q.includes('razorpay') || q.includes('money') || q.includes('ticket')) {
      reply = `### 💼 Post-Sprint Syndication & Investor Gating\n\n` +
        `Traditional startups raise money on pitch decks; FoundersHub startups raise money on **completed execution sprints**:\n\n` +
        `• **Sprint Completion Lock**: Investors can commit capital only after a sprint has been fully delivered, ensuring zero risk of vaporware.\n` +
        `• **Razorpay Checkout Integration**: Supports standard test cards, UPI, and netbanking simulators with immediate HMAC transaction verification.\n` +
        `• **1% Platform Fee**: Transparent treasury deduction of 1% on all capital commitments.\n` +
        `• **30-Day Branding Partnerships**: Companies and funds can sponsor ventures with a "Powered By" branding strip displayed on the startup profile.`;
    } else if (q.includes('equity') || q.includes('vesting') || q.includes('point') || q.includes('pool')) {
      reply = `### 📈 Dynamic Contribution-Based Equity Vesting\n\n` +
        `Forget arbitrary founder promises. Equity is calculated algorithmically:\n\n` +
        `$$\\text{Builder's Equity \\%} = \\frac{\\text{Builder's Completed Points}}{\\text{Total Department Sprint Points}} \\times \\text{Builders Pool \\%}$$\n\n` +
        `• Completed Kanban tasks award 10 to 40 contribution points based on complexity.\n` +
        `• The live **Equity Pie** dynamically displays real-time vesting.\n` +
        `• Founders maintain controlling ownership while builders are rewarded with real equity for tangible code, design, and growth deliverables.`;
    } else if (q.includes('role') || q.includes('developer') || q.includes('founder') || q.includes('investor')) {
      reply = `### 👥 Platform Roles & Permissions\n\n` +
        `• **Founders**: Publish ideas through the 3-point readiness gate, initialize sprints, assign departments, and manage venture equity.\n` +
        `• **Developers / Builders**: Browse active sprints, join a single department, claim tickets, and vest equity by shipping code and designs.\n` +
        `• **Investors**: Track verified execution scores, review completed sprint milestones, and commit funding or branding sponsorships.`;
    } else {
      reply = `### 🚀 Welcome to FoundersHub\n\n` +
        `**"Ideas are cheap. Delivery is the currency."**\n\n` +
        `FoundersHub is an execution-first venture ecosystem connecting founders, builders, and investors:\n\n` +
        `• **For Founders**: Validate your concept via the 3-Point Readiness Gate, launch an 8-department sprint, and coordinate builders.\n` +
        `• **For Builders**: Join active sprints in Engineering, Design, or Marketing and earn real equity through delivered Kanban points.\n` +
        `• **For Investors**: Back teams that have proven delivery with verified Execution Scores post-sprint.\n\n` +
        `*How can I help you today? Ask about creating a startup, joining a sprint, or exploring investment opportunities!*`;
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
