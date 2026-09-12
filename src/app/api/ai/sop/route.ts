import { NextRequest, NextResponse } from 'next/server';
import { authorizeDepartmentAccess } from '@/lib/auth/rbac';
import { getGeminiApiKey } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { departmentId, topic } = body;

    const { department, startup } = await authorizeDepartmentAccess(departmentId);

    const geminiKey = getGeminiApiKey();
    if (geminiKey) {
      try {
        const prompt = `Generate a comprehensive Standard Operating Procedure (SOP) JSON for the ${department.name} department of the venture "${startup.name}" in the ${startup.sector} sector.
Context:
Problem Statement: ${startup.problemStatement}
Venture Description: ${startup.description || startup.tagline}
Validation Evidence: ${startup.validationEvidence}
Topic: "${topic || `${department.name} Sprint Workflow`}".
Return JSON with fields: title (string), department (string), startup (string), version ("1.0"), effectiveDate ("${new Date().toISOString().split('T')[0]}"), purpose (string tailored to solving this problem), steps (array of 4 objects with step (number), name (string), action (string with concrete steps)), complianceNotes (string).`;
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
      title: `SOP: ${topic || `${department.name} Execution Protocol`}`,
      department: department.name,
      startup: startup.name,
      version: '1.0',
      effectiveDate: new Date().toISOString().split('T')[0],
      purpose: `Establish an execution standard for all builders in ${department.name} at ${startup.name}, ensuring that every commit and PR directly solves our core problem: "${startup.problemStatement.slice(0, 120)}...".`,
      steps: [
        {
          step: 1,
          name: 'Task Ingestion & Problem Verification',
          action: `Review ticket specifications against ${startup.name}'s customer requirements. Move task to "In Progress" and self-assign before writing code or assets.`
        },
        {
          step: 2,
          name: 'Implementation & Local Testing',
          action: 'Build against the specification. Run unit and integration tests locally before submission.'
        },
        {
          step: 3,
          name: 'Peer Review & Acceptance Sign-off',
          action: 'Move the ticket to "Review". Tag peer builders in department chat for verification.'
        },
        {
          step: 4,
          name: 'Completion & Dynamic Points Vesting',
          action: 'Once approved, move to "Done". Contribution points automatically vest into your equity ledger.'
        }
      ],
      complianceNotes: 'All contributions must adhere to DPIIT Startup India alignment and FoundersHub verifiable delivery guidelines.'
    };

    return NextResponse.json({ sop });

  } catch (error: any) {
    console.error('SOP Generator error:', error);
    return NextResponse.json({ error: 'Failed to generate SOP' }, { status: 500 });
  }
}
