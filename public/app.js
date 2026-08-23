const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function fmtRelative(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

async function api(path, opts) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...opts,
  });
  if (res.status === 401) {
    window.location.href = '/login.html';
    throw new Error('Not signed in');
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

async function requireAuthOrRedirect() {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (!res.ok) {
    window.location.href = '/login.html';
    return null;
  }
  return res.json();
}

async function loadAll() {
  const [business, briefing, tasks, updates, pulse, departments, team, metrics, agentsData] = await Promise.all([
    api('/api/business'),
    api('/api/briefing'),
    api('/api/tasks'),
    api('/api/updates'),
    api('/api/pulse'),
    api('/api/departments'),
    api('/api/team'),
    api('/api/metrics'),
    api('/api/agents'),
  ]);
  renderBusiness(business);
  renderBriefing(briefing);
  renderMetrics({ ...briefing.metrics, dueTodayCount: briefing.dueTodayCount, overdueCount: briefing.overdueCount });
  renderTasks(tasks);
  renderUpdates(updates);
  renderPulse(pulse);
  renderDeptSelects(departments);
  renderTeamDatalist(team);
  renderDepartmentsSettings(departments);
  renderTeamSettings(team);
  renderAgents(agentsData);
  if (!settingsPopulated) {
    populateSettingsForms(business, metrics);
    settingsPopulated = true;
  }
}

let settingsPopulated = false;

function populateSettingsForms(business, metrics) {
  const bf = document.getElementById('business-form');
  bf.name.value = business.name;
  bf.ceoName.value = business.ceoName;

  const mf = document.getElementById('metrics-form');
  mf.cashOnHand.value = metrics.cashOnHand;
  mf.cashLastWeek.value = metrics.cashLastWeek;
  mf.weeklyRevenue.value = metrics.weeklyRevenue;
  mf.revenueTarget.value = metrics.revenueTarget;
  mf.overdueInvoicesTotal.value = metrics.overdueInvoicesTotal;
  mf.overdueInvoicesCount.value = metrics.overdueInvoicesCount;
}

function renderDeptSelects(departments) {
  document.querySelectorAll('select.dept-select').forEach((sel) => {
    const current = sel.value;
    sel.innerHTML = departments.map((d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    if (departments.includes(current)) sel.value = current;
  });
}

function renderTeamDatalist(team) {
  const list = document.getElementById('team-list');
  list.innerHTML = team.map((m) => `<option value="${escapeHtml(m.name)}">`).join('');
}

function renderDepartmentsSettings(departments) {
  const wrap = document.getElementById('departments-list');
  wrap.innerHTML = '';
  departments.forEach((d) => {
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.innerHTML = `<span>${escapeHtml(d)}</span>`;
    const btn = document.createElement('button');
    btn.className = 'btn small';
    btn.textContent = 'Remove';
    btn.onclick = async () => {
      await api(`/api/departments/${encodeURIComponent(d)}`, { method: 'DELETE' });
      await loadAll();
    };
    div.appendChild(btn);
    wrap.appendChild(div);
  });
  if (departments.length === 0) wrap.innerHTML = '<div class="empty-note">No departments yet.</div>';
}

function renderTeamSettings(team) {
  const wrap = document.getElementById('team-list-display');
  wrap.innerHTML = '';
  team.forEach((m) => {
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.innerHTML = `<span>${escapeHtml(m.name)} — ${escapeHtml(m.role || 'No role set')} <span style="color:var(--text-dim)">(${escapeHtml(m.department)})</span></span>`;
    const btn = document.createElement('button');
    btn.className = 'btn small';
    btn.textContent = 'Remove';
    btn.onclick = async () => {
      await api(`/api/team/${m.id}`, { method: 'DELETE' });
      await loadAll();
    };
    div.appendChild(btn);
    wrap.appendChild(div);
  });
  if (team.length === 0) wrap.innerHTML = '<div class="empty-note">No team members yet.</div>';
}

function renderBusiness(business) {
  document.getElementById('biz-name').textContent = `· ${business.name}`;
}

function renderBriefing(b) {
  document.getElementById('ceo-initial').textContent = b.ceoName.charAt(0);
  document.getElementById('ceo-name').textContent = `${b.ceoName}, CEO`;
  document.getElementById('ceo-time').textContent = b.greeting;
  document.getElementById('briefing-summary').textContent = b.summary;

  const doneList = document.getElementById('done-list');
  doneList.innerHTML = '';
  if (b.completedRecent.length === 0) {
    doneList.innerHTML = '<li class="empty-note">Nothing completed yet since the last check-in.</li>';
  } else {
    b.completedRecent.forEach((t) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="tag done">✓</span><div><div>${escapeHtml(t.title)}</div><div style="color:var(--text-dim);font-size:11.5px;margin-top:2px">${t.department} · ${t.assignee} · ${fmtTime(t.completedAt)}</div></div>`;
      doneList.appendChild(li);
    });
  }

  const planList = document.getElementById('plan-list');
  planList.innerHTML = '';
  if (b.todayPlan.length === 0) {
    planList.innerHTML = '<li class="empty-note">Nothing on the board right now.</li>';
  } else {
    b.todayPlan.forEach((t) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="tag pri-${t.priority}">${t.priority}</span><div><div>${escapeHtml(t.title)}</div><div style="color:var(--text-dim);font-size:11.5px;margin-top:2px">${t.department} · ${t.assignee}${t.dueDate ? ' · due ' + fmtDate(t.dueDate) : ''}</div></div>`;
      planList.appendChild(li);
    });
  }

  const watchWrap = document.getElementById('watchlist-wrap');
  const watch = document.getElementById('watchlist');
  watch.innerHTML = '';
  if (b.watchlist.length > 0) {
    watchWrap.style.display = 'block';
    b.watchlist.forEach((w) => {
      const li = document.createElement('li');
      li.textContent = w.text;
      watch.appendChild(li);
    });
  } else {
    watchWrap.style.display = 'none';
  }
}

function renderMetrics(m) {
  const row = document.getElementById('metrics-row');
  row.innerHTML = '';
  const cards = [
    {
      label: 'Cash on hand',
      value: money(m.cashOnHand),
      sub: `${m.cashTrend === 'up' ? '▲' : m.cashTrend === 'down' ? '▼' : '—'} ${money(Math.abs(m.cashDelta))} vs last week`,
      cls: m.cashTrend === 'down' ? 'down' : m.cashTrend === 'up' ? 'up' : '',
    },
    {
      label: 'Weekly revenue',
      value: money(m.weeklyRevenue),
      sub: `${m.revenuePct}% of ${money(m.revenueTarget)} target`,
      cls: m.revenuePct >= 100 ? 'up' : '',
    },
    {
      label: 'Overdue invoices',
      value: m.overdueInvoicesCount,
      sub: m.overdueInvoicesCount > 0 ? `${money(m.overdueInvoicesTotal)} outstanding` : 'All caught up',
      cls: m.overdueInvoicesCount > 0 ? 'down' : 'up',
    },
    {
      label: 'Open tasks',
      value: m.dueTodayCount !== undefined ? m.dueTodayCount : '—',
      sub: `${m.overdueCount || 0} overdue`,
      cls: m.overdueCount > 0 ? 'down' : '',
    },
  ];
  cards.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'metric-card';
    div.innerHTML = `<div class="metric-label">${c.label}</div><div class="metric-value">${c.value}</div><div class="metric-sub ${c.cls}">${c.sub}</div>`;
    row.appendChild(div);
  });
}

function renderAgents({ agents, log, aiDrafting }) {
  document.getElementById('agents-sub').textContent = aiDrafting
    ? 'Running continuously in the background, drafting replies with Claude.'
    : 'Running continuously in the background on rule-based logic. Set ANTHROPIC_API_KEY to let Support draft real AI replies.';

  const grid = document.getElementById('agent-grid');
  grid.innerHTML = '';
  agents.forEach((a) => {
    const div = document.createElement('div');
    div.className = 'agent-card';
    div.innerHTML = `<div class="icon">${a.icon}</div><div class="name">${a.name}</div><div class="role">${a.role}</div><div class="status"><span class="blip"></span>Active</div>`;
    grid.appendChild(div);
  });

  const feed = document.getElementById('agent-log-feed');
  feed.innerHTML = '';
  if (log.length === 0) {
    feed.innerHTML = '<div class="empty-note">No autonomous actions yet — agents check in every minute.</div>';
  } else {
    log.slice(0, 10).forEach((entry) => {
      const div = document.createElement('div');
      div.className = 'feed-item';
      div.innerHTML = `<div class="meta"><span class="agent-log-icon">${entry.icon}</span> <strong>${escapeHtml(entry.agent)}</strong> · ${entry.role} · ${fmtRelative(entry.createdAt)}</div>${escapeHtml(entry.text)}`;
      feed.appendChild(div);
    });
  }
}

function renderTasks(tasks) {
  ['todo', 'in_progress', 'done'].forEach((status) => {
    const col = document.getElementById(`col-${status}`);
    col.innerHTML = '';
    tasks
      .filter((t) => t.status === status)
      .forEach((t) => {
        const div = document.createElement('div');
        div.className = 'task';
        div.innerHTML = `
          <div class="title">${escapeHtml(t.title)}${t.createdByAgent ? ` <span class="agent-badge">via ${escapeHtml(t.createdByAgent)}</span>` : ''}</div>
          <div class="meta"><span>${t.department} · ${escapeHtml(t.assignee)}</span><span class="tag pri-${t.priority}">${t.priority}</span></div>
          <div class="actions"></div>
        `;
        const actions = div.querySelector('.actions');
        if (status !== 'todo') {
          const back = document.createElement('button');
          back.className = 'btn small';
          back.textContent = status === 'done' ? '↺ Reopen' : '← To do';
          back.onclick = () => updateTask(t.id, { status: status === 'done' ? 'todo' : 'todo' });
          actions.appendChild(back);
        }
        if (status !== 'done') {
          const next = document.createElement('button');
          next.className = 'btn small primary';
          next.textContent = status === 'todo' ? 'Start →' : 'Complete ✓';
          next.onclick = () => updateTask(t.id, { status: status === 'todo' ? 'in_progress' : 'done' });
          actions.appendChild(next);
        }
        col.appendChild(div);
      });
  });
}

async function updateTask(id, patch) {
  await api(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  await loadAll();
}

function renderUpdates(updates) {
  const feed = document.getElementById('updates-feed');
  feed.innerHTML = '';
  [...updates].reverse().slice(0, 8).forEach((u) => {
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `<div class="meta"><span class="dot ${u.type}"></span>${u.author} · ${u.department} · ${fmtTime(u.createdAt)}</div>${escapeHtml(u.text)}`;
    feed.appendChild(div);
  });
  if (updates.length === 0) feed.innerHTML = '<div class="empty-note">No updates yet.</div>';
}

function renderPulse(pulse) {
  const feed = document.getElementById('pulse-feed');
  feed.innerHTML = '';
  [...pulse].reverse().slice(0, 8).forEach((p) => {
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `<div class="meta"><span class="dot ${p.sentiment}"></span>${escapeHtml(p.customer)} · ${p.source} · ${fmtTime(p.createdAt)}</div>${escapeHtml(p.text)}`;
    feed.appendChild(div);
  });
  if (pulse.length === 0) feed.innerHTML = '<div class="empty-note">No customer signals yet.</div>';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.dueDate) delete data.dueDate;
  await api('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
  form.reset();
  await loadAll();
});

document.getElementById('update-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  await api('/api/updates', { method: 'POST', body: JSON.stringify(data) });
  form.reset();
  await loadAll();
});

document.getElementById('pulse-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  await api('/api/pulse', { method: 'POST', body: JSON.stringify(data) });
  form.reset();
  await loadAll();
});

document.getElementById('business-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await api('/api/business', { method: 'PATCH', body: JSON.stringify(data) });
  await loadAll();
});

document.getElementById('metrics-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const raw = Object.fromEntries(new FormData(e.target).entries());
  const data = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number(v)]));
  await api('/api/metrics', { method: 'PATCH', body: JSON.stringify(data) });
  await loadAll();
});

document.getElementById('department-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  await api('/api/departments', { method: 'POST', body: JSON.stringify(data) });
  form.reset();
  await loadAll();
});

document.getElementById('team-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  await api('/api/team', { method: 'POST', body: JSON.stringify(data) });
  form.reset();
  await loadAll();
});

document.getElementById('run-agents-btn').addEventListener('click', async (e) => {
  e.target.disabled = true;
  e.target.textContent = 'Running…';
  await api('/api/agents/run', { method: 'POST' });
  await loadAll();
  e.target.disabled = false;
  e.target.textContent = 'Run agents now';
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.href = '/login.html';
});

(async () => {
  const me = await requireAuthOrRedirect();
  if (!me) return;
  document.getElementById('user-email').textContent = me.email;
  loadAll().catch((err) => {
    document.getElementById('briefing-summary').textContent = 'Failed to load dashboard: ' + err.message;
  });
})();
