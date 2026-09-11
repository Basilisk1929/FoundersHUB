import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db/mongodb';
import { StartupDoc, TaskDoc, DepartmentDoc, ExpenseDoc, SprintDoc, FundingRequestDoc } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuth();
    const body = await req.json();
    const { startupId, message, isWhatNext } = body;

    if (!startupId) {
      return new Response(JSON.stringify({ error: 'startupId is required' }), { status: 400 });
    }

    const db = await getDb();
    const startupsCol = db.collection<StartupDoc>('startups');
    const startup = await startupsCol.findOne({ _id: startupId });

    if (!startup || startup.founderId !== user.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized: You do not own this startup' }), { status: 403 });
    }

    // Gather real grounded context
    const tasksCol = db.collection<TaskDoc>('tasks');
    const departmentsCol = db.collection<DepartmentDoc>('departments');
    const expensesCol = db.collection<ExpenseDoc>('expenses');
    const sprintsCol = db.collection<SprintDoc>('sprints');
    const fundingCol = db.collection<FundingRequestDoc>('fundingRequests');

    const tasks = await tasksCol.find({ startupId }).toArray();
    const departments = await departmentsCol.find({ startupId }).toArray();
    const expenses = await expensesCol.find({ startupId }).toArray();
    const sprint = startup.activeSprintId ? await sprintsCol.findOne({ _id: startup.activeSprintId }) : null;
    const fundingRequests = await fundingCol.find({ startupId }).toArray();

    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const completedTasks = tasks.filter(t => t.status === 'done');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const criticalTasks = tasks.filter(t => t.priority === 'critical');

    const promptContext = `
Startup Name: ${startup.name}
Stage: ${startup.stage}
Execution Score: ${startup.executionScore}/100
Total Tasks: ${tasks.length} (Completed: ${completedTasks.length}, In Progress: ${inProgressTasks.length})
Critical Priority Tasks: ${criticalTasks.length}
Departments (${departments.length}): ${departments.map(d => `${d.name} (${d.memberIds.length} members)`).join(', ')}
Total Logged Expenses: $${totalExpense.toLocaleString()}
Sprint Status: ${sprint?.status || 'None'} (Duration: ${sprint?.durationDays || 0} days)
Pending Funding Requests: ${fundingRequests.filter(f => f.status === 'pending').length}
`;

    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const sysContext = `You are the AI Founder Copilot for ${startup.name}. You have real-time access to the venture data:\n${promptContext}\nProvide strategic guidance, execution advice, and investor readiness recommendations.`;
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${sysContext}\n\nUser: ${message || (isWhatNext ? 'What should I do next?' : 'Analyze my startup')}` }]
            }]
          })
        });
        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
              async start(controller) {
                const words = generatedText.split(' ');
                for (const word of words) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`));
                  await new Promise(r => setTimeout(r, 15));
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
        }
      } catch (err) {
        console.warn('[AI] Gemini call failed, falling back to contextual stream:', err);
      }
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
                content: `You are the AI Founder Copilot for ${startup.name}. You have real-time access to the startup's ground-truth execution metrics:\n${promptContext}\nProvide concise, high-velocity, actionable tactical advice. Use bullet points and clear priority rankings.`
              },
              {
                role: 'user',
                content: isWhatNext 
                  ? 'Produce 3-5 prioritized, data-grounded recommendations for what I should do next right now.' 
                  : message
              }
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
        console.warn('[AI] OpenAI streaming failed, falling back to local contextual stream:', err);
      }
    }

    // High-fidelity fallback streaming generator grounded in the live startup data
    let responseText = '';

    if (isWhatNext) {
      responseText = `### 🎯 Prioritized Action Plan for ${startup.name} (Execution Score: ${startup.executionScore}/100)\n\n` +
        `1. **Unblock Critical Tasks (${criticalTasks.filter(t => t.status !== 'done').length} pending)**:\n` +
        `   - Review "${criticalTasks[0]?.title || 'Core Architecture'}" which carries high contribution points and directly affects your sprint velocity.\n\n` +
        `2. **Department Velocity & Builder Engagement**:\n` +
        `   - You have **${departments.length} departments** active. Ensure developers in *${departments[0]?.name || 'Development'}* have assigned backlog tickets to maximize contribution point accumulation for equity vesting.\n\n` +
        `3. **Runway & Expense Discipline**:\n` +
        `   - Total recorded sprint burn is **$${totalExpense.toLocaleString()}**. Keep infrastructure costs optimized prior to presenting your pitch deck.\n\n` +
        `4. **Investor Readiness Milestone**:\n` +
        (startup.stage === 'sprint_completed'
          ? `   - 🚀 **Sprint is completed!** You have reached an execution score of **${startup.executionScore}**. You can now accept investor funding commitments or branding partnerships in your Funding Inbox.`
          : `   - Maintain sprint progress to push your execution score above 80 before final sprint completion to unlock investor syndication.`);
    } else {
      const q = message.toLowerCase();
      if (q.includes('prioritize') || q.includes('today')) {
        responseText = `Based on your live sprint metrics for **${startup.name}**:\n\n` +
          `• **Top Priority**: Push the **${inProgressTasks.length} in-progress tasks** to review status. This will immediately improve your Execution Score from **${startup.executionScore}** towards the 85+ investor benchmark.\n` +
          `• **Team Coordination**: Check team chat in the **${departments[0]?.name || 'Development'}** department to clear any architectural bottlenecks.\n` +
          `• **Funding Status**: You currently have **${fundingRequests.length} funding requests** logged.`;
      } else if (q.includes('pitch') || q.includes('investor')) {
        responseText = `### 📊 Real-Time Sprint Investor Pitch Snapshot\n\n` +
          `**Company**: ${startup.name} — *"${startup.tagline}"*\n` +
          `**Problem**: ${startup.problemStatement.slice(0, 180)}...\n` +
          `**Execution Proof**: ${completedTasks.length} deliverables completed in ${sprint?.durationDays || 21}-day sprint, driving a verified **${startup.executionScore}/100 Execution Score**.\n` +
          `**Capital Efficiency**: Total sprint burn of $${totalExpense.toLocaleString()} with transparent equity vesting tied strictly to delivered contribution points.`;
      } else {
        responseText = `Analyzing **${startup.name}** across **${departments.length} departments** and **${tasks.length} sprint tasks**.\n\n` +
          `Your team is currently operating at an Execution Score of **${startup.executionScore}/100**. ${completedTasks.length} tasks have been fully delivered. ` +
          `To accelerate velocity, review the Kanban review queue and ensure builders have clear PR milestones before the sprint concludes.`;
      }
    }

    // Stream the text token-by-token using ReadableStream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = responseText.split(' ');
        for (const word of words) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`));
          await new Promise(r => setTimeout(r, 25));
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
    console.error('Founder copilot error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process AI copilot' }), { status: 500 });
  }
}
