import { NextRequest } from 'next/server';
import { authorizeDepartmentAccess } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { TaskDoc, TimelineEventDoc, FileCommitDoc, SprintDoc } from '@/types';
import { callGemini, GeminiMessage } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { departmentId, message, history = [], action } = body;

    if (!departmentId || (!message && !action)) {
      return new Response(JSON.stringify({ error: 'departmentId and message/action are required' }), { status: 400 });
    }

    const { department, startup } = await authorizeDepartmentAccess(departmentId);

    const db = await getDb();
    const tasksCol = db.collection<TaskDoc>('tasks');
    const filesCol = db.collection<FileCommitDoc>('files');
    const sprintsCol = db.collection<SprintDoc>('sprints');

    const tasks = await tasksCol.find({ departmentId }).toArray();
    const files = await filesCol.find({ departmentId }).toArray();
    const sprint = startup.activeSprintId ? await sprintsCol.findOne({ _id: startup.activeSprintId }) : null;

    const completed = tasks.filter(t => t.status === 'done');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const blocked = tasks.filter(t => t.status === 'blocked');

    const userPrompt = message || (
      action === 'sop' 
        ? `Generate a formal Standard Operating Procedure (SOP) for ${department.name} tailored to solve our problem: "${startup.problemStatement}"`
        : `Generate a prioritized 3-week sprint deliverable roadmap and Kanban tasks for ${department.name} to address our core problem: "${startup.problemStatement}"`
    );

    // Deep context grounding including problem statement and descriptions
    const fullStartupContext = `
VENTURE GROUND-TRUTH SPECIFICATION:
- Startup Name: ${startup.name}
- Tagline: ${startup.tagline}
- Sector: ${startup.sector}
- Core Problem Statement: ${startup.problemStatement || 'Not specified'}
- Detailed Venture Description: ${startup.description || startup.tagline}
- Validation Evidence: ${startup.validationEvidence || 'Early user interviews and initial waitlist'}
- Sector Tags: ${(startup.tags || []).join(', ') || startup.sector}
- Current Stage: ${startup.stage} (Execution Score: ${startup.executionScore}/100)

DEPARTMENT & REPOSITORY STATUS:
- Department: ${department.name}
- Department Description: ${department.description || `${department.name} execution wing`}
- Active Builders Count: ${department.memberIds.length}
- Sprint Timeline: ${sprint?.durationDays || 21}-day cycle (Status: ${sprint?.status || 'active'})
- Existing Department Deliverables (${tasks.length} total, ${completed.length} completed, ${inProgress.length} in-progress, ${blocked.length} blocked):
${tasks.map(t => `  * [${t.priority.toUpperCase()}] "${t.title}" (${t.contributionPoints} pts, Status: ${t.status}) - ${t.description || 'No description'}`).slice(0, 10).join('\n') || '  (No tasks created yet in this department)'}
- Uploaded Department Assets & Files:
${files.map(f => `  * ${f.fileName} (${f.uploaderName || 'Team'})`).join('\n') || '  (No files uploaded to vault yet)'}
`;

    const sysContext = `You are the expert Staff-Level AI Department Mentor for the "${department.name}" department at "${startup.name}".
You act as a senior principal leader (Staff Software Architect for Engineering, VP Design for Product/UX, VP Marketing for Growth, etc.).

CRITICAL INSTRUCTIONS:
1. Ground all your advice directly in the startup's actual Problem Statement ("${startup.problemStatement}") and Product Description. Never give generic boilerplate.
2. Provide actionable, practical code architecture, workflows, best practices, and velocity tips.
3. When the user asks for tasks, backlog tickets, sprint planning, or roadmap deliverables (or action === 'plan'):
   - Provide a concise architectural explanation.
   - ALWAYS output a JSON codeblock with tag \`\`\`tasks_json containing an array of 3-5 structured tasks that address the problem statement. Format:
\`\`\`tasks_json
[
  {
    "title": "Concrete task title",
    "description": "Specific implementation instructions referencing ${startup.name}'s requirements",
    "priority": "critical" | "high" | "medium" | "low",
    "contributionPoints": 25
  }
]
\`\`\`
4. When the user asks for a Standard Operating Procedure (or action === 'sop'):
   - Provide the complete document in markdown.
   - ALWAYS output a JSON codeblock with tag \`\`\`sop_json containing:
\`\`\`sop_json
{
  "title": "SOP: ${department.name} Execution Protocol",
  "department": "${department.name}",
  "version": "1.0",
  "effectiveDate": "${new Date().toISOString().split('T')[0]}",
  "purpose": "Purpose directly targeting ${startup.name}'s solution",
  "steps": [
    { "step": 1, "name": "Step Title", "action": "Actionable instructions" },
    { "step": 2, "name": "Step Title", "action": "Actionable instructions" },
    { "step": 3, "name": "Step Title", "action": "Actionable instructions" },
    { "step": 4, "name": "Step Title", "action": "Actionable instructions" }
  ],
  "complianceNotes": "Compliance instructions"
}
\`\`\`

Here is the real-time context:
${fullStartupContext}
`;

    const formattedHistory: GeminiMessage[] = Array.isArray(history)
      ? history.map((h: any) => ({
          role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
          content: typeof h.text === 'string' ? h.text : (h.content || '')
        }))
      : [];

    // 1. Try Google Gemini with multi-model fallback
    const geminiResult = await callGemini(userPrompt, {
      systemPrompt: sysContext,
      history: formattedHistory,
      temperature: 0.7,
      maxOutputTokens: 1400
    });

    let finalResponseText = '';

    if (geminiResult && geminiResult.text) {
      finalResponseText = geminiResult.text;
    } else if (process.env.GROQ_API_KEY) {
      // 2. Try Groq (Ultra fast Llama-3.1-8b)
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 1200,
            messages: [
              { role: 'system', content: sysContext },
              ...formattedHistory.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content })),
              { role: 'user', content: userPrompt }
            ]
          })
        });
        if (groqRes.ok) {
          const groqData = await groqRes.json();
          finalResponseText = groqData.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.warn('[AI Mentor] Groq call failed:', err);
      }
    } else if (process.env.OPENAI_API_KEY) {
      // 3. Try OpenAI
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.7,
            max_tokens: 1200,
            messages: [
              { role: 'system', content: sysContext },
              ...formattedHistory.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content })),
              { role: 'user', content: userPrompt }
            ]
          })
        });
        if (openAiRes.ok) {
          const openAiData = await openAiRes.json();
          finalResponseText = openAiData.choices?.[0]?.message?.content || '';
        }
      } catch (err) {
        console.warn('[AI Mentor] OpenAI call failed:', err);
      }
    }

    // 4. Intelligent Contextual Generative Engine (Dynamic fallback customized to user prompt & startup context)
    if (!finalResponseText) {
      const p = userPrompt.toLowerCase();
      const isTaskRequest = action === 'plan' || p.includes('task') || p.includes('plan') || p.includes('deliverable') || p.includes('roadmap') || p.includes('kanban') || p.includes('backlog');
      const isSopRequest = action === 'sop' || p.includes('sop') || p.includes('standard operating procedure') || p.includes('protocol') || p.includes('guideline');

      if (isTaskRequest) {
        const generatedTasks = [
          {
            title: `${department.name}: Architecture & Core Pipeline Setup`,
            description: `Design the foundational specifications and repository contracts for ${startup.name} addressing: "${startup.problemStatement.slice(0, 120)}...". Establish unit test harnesses with >80% coverage.`,
            priority: 'critical',
            contributionPoints: 30
          },
          {
            title: `Implement Domain Workflow for ${startup.name}`,
            description: `Execute the high-priority deliverables required to support "${startup.tagline}". Ensure modular decoupling and edge latency optimization.`,
            priority: 'high',
            contributionPoints: 25
          },
          {
            title: `Integrate Validation Gate & Telemetry`,
            description: `Connect monitoring, telemetry logging, and user validation checkpoints to measure progress against: "${startup.validationEvidence.slice(0, 100)}...".`,
            priority: 'medium',
            contributionPoints: 20
          },
          {
            title: `QA Hardening & Department Sign-off`,
            description: `Conduct peer code reviews, stress testing, and documentation verification before marking sprint deliverables as Done.`,
            priority: 'medium',
            contributionPoints: 15
          }
        ];

        finalResponseText = `### 🚀 ${department.name} Sprint Roadmap for ${startup.name}\n\n` +
          `**Venture Mission**: *"${startup.tagline}"*\n` +
          `**Target Problem**: ${startup.problemStatement}\n\n` +
          `I have synthesized the strategic requirements for your **${department.name}** team across the current **${sprint?.durationDays || 21}-day sprint**. Here are the prioritized deliverables structured to maximize your team's execution velocity and contribution point allocation:\n\n` +
          generatedTasks.map((t, idx) => `**${idx + 1}. ${t.title}** (${t.contributionPoints} pts | Priority: ${t.priority.toUpperCase()})\n${t.description}\n`).join('\n') +
          `\nClick **"Add All Tasks to Kanban"** below to push these tickets directly into your department's active backlog.\n\n` +
          `\`\`\`tasks_json\n${JSON.stringify(generatedTasks, null, 2)}\n\`\`\``;

      } else if (isSopRequest) {
        const generatedSop = {
          title: `SOP: ${department.name} Quality & Execution Protocol`,
          department: department.name,
          version: '1.0',
          effectiveDate: new Date().toISOString().split('T')[0],
          purpose: `Establish a rigorous delivery standard for all builders in ${department.name} at ${startup.name}, ensuring that every pull request and deliverable directly solves our core problem: "${startup.problemStatement.slice(0, 120)}...".`,
          steps: [
            {
              step: 1,
              name: 'Problem Grounding & Ticket Ingestion',
              action: `Review ticket specifications against ${startup.name}'s customer validation requirements. Verify that prerequisites and API contracts are satisfied before moving the task to "In Progress".`
            },
            {
              step: 2,
              name: 'Implementation & Local Validation',
              action: 'Build the deliverable according to department standards. Write automated tests and verify edge cases locally.'
            },
            {
              step: 3,
              name: 'Peer Review & Acceptance Sign-off',
              action: 'Submit pull request and tag team members in the department communication channel for review.'
            },
            {
              step: 4,
              name: 'Deployment & Dynamic Points Vesting',
              action: 'Once reviewed and verified, mark task as "Done". Contribution points automatically vest into your builder equity ledger.'
            }
          ],
          complianceNotes: `All contributions must comply with DPIIT Startup India integrity standards and FoundersHub verifiable delivery guidelines.`
        };

        finalResponseText = `### 📄 Standard Operating Procedure: ${department.name}\n\n` +
          `**Startup**: ${startup.name}\n` +
          `**Effective Date**: ${generatedSop.effectiveDate} (Version ${generatedSop.version})\n\n` +
          `#### 🎯 Purpose\n${generatedSop.purpose}\n\n` +
          `#### 📋 Operational Steps\n` +
          generatedSop.steps.map(s => `**Step ${s.step}: ${s.name}**\n${s.action}\n`).join('\n') +
          `\n#### 🔒 Compliance & Integrity\n${generatedSop.complianceNotes}\n\n` +
          `\`\`\`sop_json\n${JSON.stringify(generatedSop, null, 2)}\n\`\`\``;

      } else {
        // Detailed contextual advice responding to specific questions
        finalResponseText = `### 💡 ${department.name} Technical Guidance for ${startup.name}\n\n` +
          `Addressing your inquiry: **"${userPrompt}"** in the context of solving: *"${startup.problemStatement}"*.\n\n` +
          `#### 1. Strategic Alignment & Architecture\n` +
          `To achieve product-market delivery for **${startup.name}** in the **${startup.sector}** domain, your ${department.name} team must prioritize low latency, robust data isolation, and clear test contracts. Make sure deliverables align with your recorded validation evidence (*"${startup.validationEvidence.slice(0, 90)}..."*).\n\n` +
          `#### 2. Immediate Tactical Next Steps\n` +
          `• **Current Sprint Health**: ${completed.length} of ${tasks.length} tasks delivered (${blocked.length} blocked).\n` +
          `• **Key Focus**: Tackle "${inProgress[0]?.title || 'high-priority backlog deliverables'}" to prevent downstream integration blockers.\n` +
          `• **Velocity Recommendation**: Break any complex deliverable exceeding 30 contribution points into smaller sub-tasks (15-20 pts) so builders can ship and earn daily vested equity.\n\n` +
          `Need structured tickets or a formal SOP? Click **"Generate Sprint Plan"** or **"Generate SOP Document"** above!`;
      }
    }

    // Stream the final response smoothly using SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = finalResponseText.split(' ');
        for (const word of words) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`));
          await new Promise(r => setTimeout(r, 10));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error: any) {
    console.error('Department AI mentor error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process AI mentor inquiry' }), { status: 500 });
  }
}
