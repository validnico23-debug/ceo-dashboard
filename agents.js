const AGENTS = [
  { id: 'sales', name: 'Ava', role: 'Sales Agent', icon: '🟣', department: 'Sales' },
  { id: 'support', name: 'Sage', role: 'Support Agent', icon: '🟢', department: 'Ops' },
  { id: 'ops', name: 'Otto', role: 'Ops Agent', icon: '🟠', department: 'Ops' },
  { id: 'finance', name: 'Fin', role: 'Finance Agent', icon: '🔵', department: 'Finance' },
  { id: 'marketing', name: 'Milo', role: 'Marketing Agent', icon: '🟡', department: 'Marketing' },
];

const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a]));

// Uses the real Claude API to draft a reply when a key is configured; otherwise
// falls back to a plain templated line so the agent still does its job.
async function draftReply(customer, complaintText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const fallback = `Hi ${customer}, thanks for flagging this — we're looking into it now and will follow up shortly.`;
  if (!apiKey) return fallback;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `Write a short, warm, professional 2-sentence customer service reply to this complaint from ${customer}: "${complaintText}". Output only the reply text, no greeting salutation, no signature.`,
          },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    const text = json.content?.[0]?.text?.trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

function logAction(b, agentId, text) {
  const agent = AGENT_BY_ID[agentId];
  const id = b.nextIds.agentLog++;
  b.agentLog.unshift({ id, agent: agent.name, role: agent.role, icon: agent.icon, text, createdAt: new Date().toISOString() });
  b.agentLog = b.agentLog.slice(0, 40);
}

function addAgentTask(b, agentId, { title, department, priority, dueDate, now }) {
  const id = b.nextIds.tasks++;
  const task = {
    id,
    title,
    department,
    assignee: 'Unassigned',
    priority,
    status: 'todo',
    dueDate,
    completedAt: null,
    createdAt: now.toISOString(),
    createdByAgent: AGENT_BY_ID[agentId].name,
  };
  b.tasks.push(task);
  return task;
}

async function runAgents(b, now = new Date()) {
  const today = now.toISOString().slice(0, 10);

  // Sales Agent: opens a follow-up task for every new lead signal.
  for (const p of b.pulse) {
    if (p.source === 'lead' && !p.agentTaskId) {
      const task = addAgentTask(b, 'sales', {
        title: `Follow up with lead: ${p.customer}`,
        department: 'Sales',
        priority: 'medium',
        dueDate: today,
        now,
      });
      p.agentTaskId = task.id;
      logAction(b, 'sales', `Opened "${task.title}" after a new lead signal came in.`);
    }
  }

  // Support Agent: opens a high-priority task for every complaint and drafts a reply.
  for (const p of b.pulse) {
    if (p.sentiment === 'negative' && !p.agentTaskId) {
      const task = addAgentTask(b, 'support', {
        title: `Resolve complaint: ${p.customer}`,
        department: 'Ops',
        priority: 'high',
        dueDate: today,
        now,
      });
      p.agentTaskId = task.id;
      const draft = await draftReply(p.customer, p.text);
      logAction(b, 'support', `Opened "${task.title}" and drafted a reply: "${draft}"`);
    }
  }

  // Ops Agent: escalates anything overdue that isn't already high priority.
  for (const t of b.tasks) {
    if (t.status !== 'done' && t.dueDate && t.dueDate < today && t.priority !== 'high' && !t.escalatedByAgent) {
      t.priority = 'high';
      t.escalatedByAgent = true;
      logAction(b, 'ops', `Escalated "${t.title}" to high priority — it's overdue.`);
    }
  }

  // Finance Agent: keeps a standing task open while invoices are overdue.
  if (b.metrics.overdueInvoicesCount > 0) {
    const alreadyOpen = b.tasks.some((t) => t.title === 'Chase overdue invoices' && t.status !== 'done');
    if (!alreadyOpen) {
      const task = addAgentTask(b, 'finance', {
        title: 'Chase overdue invoices',
        department: 'Finance',
        priority: 'high',
        dueDate: today,
        now,
      });
      logAction(
        b,
        'finance',
        `Opened "${task.title}" — ${b.metrics.overdueInvoicesCount} invoice(s) totaling $${Math.round(b.metrics.overdueInvoicesTotal).toLocaleString('en-US')} are overdue.`
      );
    }
  }

  // Marketing Agent: keeps a content task queued roughly weekly.
  const lastContentTask = b.tasks
    .filter((t) => t.createdByAgent === 'Milo')
    .sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt))[0];
  const daysSinceContent = lastContentTask ? (now - new Date(lastContentTask.createdAt)) / 86400000 : Infinity;
  if (daysSinceContent > 7) {
    const task = addAgentTask(b, 'marketing', {
      title: 'Draft next content piece',
      department: 'Marketing',
      priority: 'medium',
      dueDate: today,
      now,
    });
    logAction(b, 'marketing', `Queued "${task.title}" to keep the publishing cadence going.`);
  }
}

module.exports = { AGENTS, runAgents };
