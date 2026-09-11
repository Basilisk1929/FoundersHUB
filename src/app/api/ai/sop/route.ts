import { NextRequest, NextResponse } from 'next/server';
import { authorizeDepartmentAccess } from '@/lib/auth/rbac';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { departmentId, topic } = body;

    const { department, startup } = await authorizeDepartmentAccess(departmentId);

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && topic) {
      try {
        const prompt = `Generate a Standard Operating Procedure (SOP) JSON for the ${department.name} department of the startup "${startup.name}" on the topic: "${topic}". Return JSON with fields: title (string), department (string), startup (string), version ("1.0"), effectiveDate (YYYY-MM-DD), purpose (string), steps (array of 4 objects with step (number), name (string), action (string)), complianceNotes (string).`;
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
            return NextResponse.json({ sop: parsed.sop || parsed });
          }
        }
      } catch (err) {
        console.warn('[AI SOP] Gemini SOP generation failed, using standard template:', err);
      }
    }

    const sop = {
      title: `SOP: ${topic || `${department.name} Sprint Workflow`}`,
      department: department.name,
      startup: startup.name,
      version: '1.0',
      effectiveDate: new Date().toISOString().split('T')[0],
      purpose: `Establish a standardized, high-velocity execution protocol for all builders in the ${department.name} department at ${startup.name}.`,
      steps: [
        {
          step: 1,
          name: 'Task Selection & Assignment',
          action: 'Pick the highest-priority ticket in the Backlog. Move it to "In Progress" and set yourself as Assignee.'
        },
        {
          step: 2,
          name: 'Implementation & Local Verification',
          action: 'Build against the specification. Run unit and integration tests locally before submission.'
        },
        {
          step: 3,
          name: 'Code / Asset Review',
          action: 'Move the ticket to "Review". Tag peer builders in department chat for verification.'
        },
        {
          step: 4,
          name: 'Completion & Point Allocation',
          action: 'Once approved, move to "Done". Contribution points automatically vest into your equity share.'
        }
      ],
      complianceNotes: 'All work committed must be original and documented in the department repository.'
    };

    return NextResponse.json({ sop });

  } catch (error: any) {
    console.error('SOP Generator error:', error);
    return NextResponse.json({ error: 'Failed to generate SOP' }, { status: 500 });
  }
}
