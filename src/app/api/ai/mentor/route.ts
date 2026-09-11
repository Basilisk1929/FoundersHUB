import { NextRequest } from 'next/server';
import { authorizeDepartmentAccess } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { TaskDoc, TimelineEventDoc } from '@/types';
import { callGemini, GeminiMessage } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { departmentId, message, history = [] } = body;

    if (!departmentId || !message) {
      return new Response(JSON.stringify({ error: 'departmentId and message are required' }), { status: 400 });
    }

    const { department, startup } = await authorizeDepartmentAccess(departmentId);

    const db = await getDb();
    const tasksCol = db.collection<TaskDoc>('tasks');
    const timelineCol = db.collection<TimelineEventDoc>('timeline');

    const tasks = await tasksCol.find({ departmentId }).toArray();
    const timeline = await timelineCol.find({ departmentId }).toArray();

    const completed = tasks.filter(t => t.status === 'done');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const blocked = tasks.filter(t => t.status === 'blocked');

    const contextSummary = `
Department: ${department.name}
Startup: ${startup.name} (${startup.tagline})
Total Tasks: ${tasks.length} (Done: ${completed.length}, In Progress: ${inProgress.length}, Blocked: ${blocked.length})
Active Deliverables: ${tasks.slice(0, 5).map(t => `"${t.title}" (${t.contributionPoints} pts, ${t.status})`).join(', ')}
Members Count: ${department.memberIds.length}
Recent Blockers: ${blocked.map(b => b.title).join(', ') || 'None'}
`;

    const openAiKey = process.env.OPENAI_API_KEY;

    const sysContext = `You are the expert AI Department Mentor for the "${department.name}" department at "${startup.name}". You act as a staff-level principal in this domain (e.g. Staff Software Engineer for Engineering, VP Design for Design, VP Growth for Marketing). Department real-time context:
${contextSummary}
Provide deeply practical, domain-specific mentorship, architectural advice, implementation steps, and sprint velocity optimization. Format with markdown.`;

    const formattedHistory: GeminiMessage[] = Array.isArray(history)
      ? history.map((h: any) => ({
          role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
          content: typeof h.text === 'string' ? h.text : (h.content || '')
        }))
      : [];

    const geminiResult = await callGemini(message, {
      systemPrompt: sysContext,
      history: formattedHistory,
      temperature: 0.7,
      maxOutputTokens: 900
    });

    if (geminiResult && geminiResult.text) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = geminiResult.text.split(' ');
          for (const word of words) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`));
            await new Promise(r => setTimeout(r, 12));
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
    }

    if (openAiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            stream: true,
            messages: [
              {
                role: 'system',
                content: `You are the AI Department Mentor for the ${department.name} department at ${startup.name}. You have real-time access to the department status:\n${contextSummary}\nProvide actionable, domain-specific guidance, risk mitigation suggestions, and sprint advice.`
              },
              { role: 'user', content: message }
            ]
          })
        });

        if (response.ok && response.body) {
          return new Response(response.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          });
        }
      } catch (err) {
        console.warn('[AI Mentor] Streaming API failed, using grounded fallback generator:', err);
      }
    }

    // High-fidelity fallback streaming response
    let responseText = `### 💡 ${department.name} Mentor Insights for ${startup.name}\n\n` +
      `**Current Status**: ${completed.length}/${tasks.length} tasks completed (${blocked.length} blocked).\n\n` +
      `• **Key Focus Area**: Tackle "${inProgress[0]?.title || 'core sprint deliverable'}" to unblock downstream milestones.\n` +
      `• **Risk Warning**: ${blocked.length > 0 ? `Urgent: Unblock "${blocked[0]?.title}" immediately to avoid stalling department velocity.` : 'No critical blockers logged in this department.'}\n` +
      `• **Execution Tip**: Break large tickets into 15-25 contribution point tasks so junior and senior builders can make measurable daily PR commits.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const word of responseText.split(' ')) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`));
          await new Promise(r => setTimeout(r, 20));
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
