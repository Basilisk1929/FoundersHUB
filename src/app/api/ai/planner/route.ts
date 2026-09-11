import { NextRequest, NextResponse } from 'next/server';
import { authorizeDepartmentAccess } from '@/lib/auth/rbac';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { departmentId, sprintDays = 21 } = body;

    const { department, startup } = await authorizeDepartmentAccess(departmentId);

    const weekCount = Math.ceil(sprintDays / 7);
    const plan: any[] = [];

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const prompt = `Generate a structured ${sprintDays}-day sprint roadmap for the ${department.name} department of the venture "${startup.name}" (${startup.tagline}). Return JSON with an array of objects for each week, having fields: week (number), title (string), goals (array of 3 strings), and suggestedTasks (array of 2 objects with title, points 10-30, priority 'high'|'medium').`;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        if (res.ok) {
          const data = await res.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            const weeks = Array.isArray(parsed) ? parsed : (parsed.weeks || parsed.plan || plan);
            return NextResponse.json({
              department: department.name,
              startup: startup.name,
              durationDays: sprintDays,
              weeks
            });
          }
        }
      } catch (err) {
        console.warn('[AI Planner] Gemini roadmap generation failed, using standard plan:', err);
      }
    }

    for (let w = 1; w <= weekCount; w++) {
      plan.push({
        week: w,
        title: `Week ${w}: ${w === 1 ? 'Architecture & Setup' : w === 2 ? 'Core Implementation & Integration' : 'Hardening, QA & Delivery'}`,
        goals: [
          `Define critical path dependencies for ${department.name}`,
          `Execute high-point Kanban deliverables`,
          `Validate milestones with ${startup.name} leadership`
        ],
        suggestedTasks: [
          { title: `${department.name} Milestone Alpha`, points: 25, priority: 'high' },
          { title: `Integration test & verification for sprint W${w}`, points: 20, priority: 'medium' }
        ]
      });
    }

    return NextResponse.json({
      department: department.name,
      startup: startup.name,
      durationDays: sprintDays,
      weeks: plan
    });

  } catch (error: any) {
    console.error('AI Planner error:', error);
    return NextResponse.json({ error: 'Failed to generate sprint plan' }, { status: 500 });
  }
}
