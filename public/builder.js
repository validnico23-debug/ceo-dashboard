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
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.issues = body.issues;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

async function requireAuthOrRedirect() {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (!res.ok) { window.location.href = '/login.html'; return null; }
  return res.json();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
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

const STATUS_LABELS = { draft: 'draft', in_review: 'in review', changes_requested: 'changes requested', published: 'published' };

let templates = [];
let apps = [];
let currentApp = null;
let previewIndex = 0;
let sidebarTab = 'all';
let templateTab = 'app';
let newKind = 'app';

// ---- Init ----

async function init() {
  const me = await requireAuthOrRedirect();
  if (!me) return;
  document.getElementById('user-email').textContent = me.email;

  const meta = await api('/api/app-studio/meta');
  templates = meta.templates || [];

  renderTemplateGrid();
  await loadApps();
  wireStaticEvents();
}

function renderTemplateGrid() {
  const grid = document.getElementById('template-grid');
  const filtered = templates.filter((t) => (t.kind || 'app') === templateTab);
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-note" style="grid-column:1/-1;padding:20px 0">No ${templateTab} templates yet.</div>`;
    return;
  }
  grid.innerHTML = filtered.map((t) =>
    `<button type="button" class="template-card" data-template="${t.id}">
      <span class="icon">${t.icon}</span>
      <div class="name">${escapeHtml(t.name)}</div>
      <div class="desc">${escapeHtml(t.description)}</div>
    </button>`
  ).join('');
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ---- App list ----

async function loadApps(selectId) {
  apps = await api('/api/apps');
  renderAppList();
  if (apps.length === 0) {
    currentApp = null;
    document.getElementById('no-app-selected').style.display = 'flex';
    document.getElementById('app-editor').style.display = 'none';
    return;
  }
  const targetId = selectId || currentApp?.id || apps[0].id;
  const stillExists = apps.some((a) => a.id === targetId);
  await selectApp(stillExists ? targetId : apps[0].id);
}

function renderAppList() {
  const wrap = document.getElementById('apps-list');
  wrap.innerHTML = '';
  const filtered = sidebarTab === 'all' ? apps : apps.filter((a) => (a.kind || 'app') === sidebarTab);
  if (filtered.length === 0 && apps.length > 0) {
    wrap.innerHTML = `<div class="empty-note" style="padding:10px 0">No ${sidebarTab}s yet.</div>`;
    return;
  }
  filtered.forEach((a) => {
    const kind = a.kind || 'app';
    const isWebsite = kind === 'website';
    const div = document.createElement('div');
    div.className = 'app-list-item' + (currentApp && currentApp.id === a.id ? ' active' : '');
    const unitLabel = isWebsite ? 'visits' : 'downloads';
    const sub = a.downloads != null
      ? `${a.downloads.toLocaleString('en-US')} ${unitLabel}`
      : STATUS_LABELS[a.status];
    div.innerHTML = `
      <span class="kind-chip ${kind}">${kind}</span>
      <span class="icon">${isWebsite ? '🌐' : escapeHtml(a.icon || '📱')}</span>
      <div class="info">
        <div class="name">${escapeHtml(a.name)}</div>
        <div class="sub">${sub}</div>
      </div>`;
    div.addEventListener('click', () => selectApp(a.id));
    wrap.appendChild(div);
  });
}

async function selectApp(id) {
  currentApp = await api(`/api/apps/${id}`);
  previewIndex = 0;
  document.getElementById('no-app-selected').style.display = 'none';
  document.getElementById('app-editor').style.display = 'flex';
  renderAppList();
  renderEditorHeader();
  renderChat();
  renderPreview();
  renderStatus();
}

async function refreshListEntry() {
  apps = await api('/api/apps');
  renderAppList();
}

// ---- Editor header ----

function renderEditorHeader() {
  const isWebsite = (currentApp.kind || 'app') === 'website';
  const kind = isWebsite ? 'website' : 'app';
  const badge = document.getElementById('editor-kind-badge');
  badge.textContent = kind;
  badge.className = `kind-badge ${kind}`;
  document.getElementById('editor-app-name').textContent = currentApp.name || 'Untitled';
}

// ---- Chat ----

function renderChat() {
  const thread = document.getElementById('chat-thread');
  const messages = currentApp.messages || [];

  if (messages.length === 0) {
    const isWebsite = (currentApp.kind || 'app') === 'website';
    thread.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-icon">${isWebsite ? '🌐' : '📱'}</div>
        <div class="chat-empty-text">Tell me what to change — add a ${isWebsite ? 'page' : 'screen'}, tweak the colors, rework the content. I'll update the preview instantly.</div>
      </div>`;
    return;
  }

  thread.innerHTML = '';
  messages.forEach((msg) => {
    const div = document.createElement('div');
    div.className = `chat-msg ${msg.role}`;
    div.innerHTML = `
      <div class="chat-bubble">${escapeHtml(msg.text)}</div>
      <div class="chat-ts">${fmtRelative(msg.ts)}</div>`;
    thread.appendChild(div);
  });
  thread.scrollTop = thread.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !currentApp) return;

  const sendBtn = document.getElementById('chat-send-btn');
  input.value = '';
  input.style.height = '';
  input.disabled = true;
  sendBtn.disabled = true;

  const thread = document.getElementById('chat-thread');
  const emptyEl = thread.querySelector('.chat-empty');
  if (emptyEl) emptyEl.remove();

  // Optimistic user bubble
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-msg user';
  userDiv.innerHTML = `<div class="chat-bubble">${escapeHtml(text)}</div><div class="chat-ts">just now</div>`;
  thread.appendChild(userDiv);
  thread.scrollTop = thread.scrollHeight;

  // Thinking indicator
  const thinkingDiv = document.createElement('div');
  thinkingDiv.className = 'chat-msg assistant';
  thinkingDiv.innerHTML = `<div class="chat-bubble chat-thinking">Thinking…</div>`;
  thread.appendChild(thinkingDiv);
  thread.scrollTop = thread.scrollHeight;

  try {
    const result = await api(`/api/apps/${currentApp.id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message: text }),
    });
    currentApp = result.app;

    thinkingDiv.innerHTML = `
      <div class="chat-bubble">${escapeHtml(result.reply)}</div>
      <div class="chat-ts">just now</div>`;

    thread.scrollTop = thread.scrollHeight;
    renderEditorHeader();
    renderPreview();
    renderStatus();
    await refreshListEntry();
  } catch (err) {
    thinkingDiv.innerHTML = `<div class="chat-bubble chat-error">${escapeHtml(err.message)}</div>`;
  } finally {
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// ---- Static events ----

function wireStaticEvents() {
  // Sidebar: filter tabs
  document.querySelectorAll('.sidebar-tabs .stab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tabs .stab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      sidebarTab = btn.dataset.tab;
      renderAppList();
    });
  });

  // Sidebar: kind toggle (new item)
  document.querySelectorAll('.new-kind-toggle .nk-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.new-kind-toggle .nk-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      newKind = btn.dataset.kind;
      document.getElementById('new-kind-hidden').value = newKind;
      document.getElementById('new-prompt-input').placeholder =
        newKind === 'website' ? 'Describe your website…' : 'Describe your app…';
    });
  });

  // New item form: generate with AI
  document.getElementById('new-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = document.getElementById('new-prompt-input').value.trim();
    if (!prompt) return;
    const btn = document.getElementById('new-create-btn');
    btn.disabled = true;
    btn.textContent = 'Building…';
    try {
      const created = await api('/api/apps/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, kind: newKind }),
      });
      document.getElementById('new-prompt-input').value = '';
      await loadApps(created.id);
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Build it';
    }
  });

  // Chat: send button
  document.getElementById('chat-send-btn').addEventListener('click', sendChatMessage);

  // Chat: Enter to send, Shift+Enter for newline
  document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Chat: auto-resize textarea
  document.getElementById('chat-input').addEventListener('input', (e) => {
    const ta = e.target;
    ta.style.height = '';
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
  });

  // Delete / duplicate
  document.getElementById('delete-app-btn').addEventListener('click', async () => {
    if (!currentApp) return;
    const kindLabel = (currentApp.kind || 'app') === 'website' ? 'website' : 'app';
    if (!confirm(`Delete "${currentApp.name}"? This can't be undone.`)) return;
    await api(`/api/apps/${currentApp.id}`, { method: 'DELETE' });
    currentApp = null;
    await loadApps();
  });

  document.getElementById('duplicate-app-btn').addEventListener('click', async () => {
    if (!currentApp) return;
    const copy = await api(`/api/apps/${currentApp.id}/duplicate`, { method: 'POST' });
    await loadApps(copy.id);
  });

  // Template modal
  document.getElementById('open-template-modal').addEventListener('click', () => openModal('template-modal'));
  document.getElementById('close-template-modal').addEventListener('click', () => closeModal('template-modal'));
  document.getElementById('template-modal').addEventListener('click', (e) => {
    if (e.target.id === 'template-modal') closeModal('template-modal');
  });
  document.querySelectorAll('.template-tabs .ttab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.template-tabs .ttab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      templateTab = btn.dataset.ttab;
      renderTemplateGrid();
    });
  });
  document.getElementById('template-grid').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-template]');
    if (!btn) return;
    btn.disabled = true;
    try {
      const created = await api('/api/apps/from-template', { method: 'POST', body: JSON.stringify({ templateId: btn.dataset.template }) });
      closeModal('template-modal');
      await loadApps(created.id);
    } finally {
      btn.disabled = false;
    }
  });

  // Empty state
  document.getElementById('es-template-btn').addEventListener('click', () => openModal('template-modal'));

  // Submit / review / deploy
  document.getElementById('submit-btn').addEventListener('click', handleSubmitForReview);
  document.getElementById('check-review-btn').addEventListener('click', handleCheckReview);
  document.getElementById('deploy-btn').addEventListener('click', handleDeploy);

  // Logout
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/login.html';
  });
}

// ---- Preview ----

function renderPreview() {
  const isWebsite = (currentApp.kind || 'app') === 'website';
  const html = currentApp.previewHtml || '';

  document.getElementById('phone-preview').style.display = isWebsite ? 'none' : '';
  document.getElementById('browser-preview').style.display = isWebsite ? '' : 'none';

  const placeholder = `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#888;font-size:14px;text-align:center;padding:24px">Describe what you want to build in the chat →</div>`;

  if (isWebsite) {
    const fakeDomain = (currentApp.name || 'mysite').toLowerCase().replace(/[^a-z0-9]+/g, '') + '.com';
    document.getElementById('browser-url').textContent = fakeDomain;
    document.getElementById('web-iframe').srcdoc = html || placeholder;
  } else {
    document.getElementById('app-iframe').srcdoc = html || placeholder;
  }
}

// ---- Status & submission ----

function renderStatus() {
  const isWebsite = (currentApp.kind || 'app') === 'website';
  const badge = document.getElementById('status-badge');
  badge.textContent = STATUS_LABELS[currentApp.status];
  badge.className = `status-badge ${currentApp.status}`;

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = currentApp.status === 'in_review';
  if (currentApp.status === 'in_review') {
    submitBtn.textContent = isWebsite ? 'Publishing…' : 'In review…';
  } else if (currentApp.status === 'published') {
    submitBtn.textContent = isWebsite ? 'Republish' : 'Resubmit update';
  } else {
    submitBtn.textContent = isWebsite ? 'Publish website' : 'Submit for review';
  }

  document.getElementById('check-review-btn').style.display = currentApp.status === 'in_review' ? 'inline-flex' : 'none';
  document.getElementById('check-review-btn').textContent = isWebsite ? 'Check status' : 'Check review status';
  document.getElementById('export-btn').href = `/api/apps/${currentApp.id}/export`;
  document.getElementById('submit-issues').style.display = 'none';

  const deployLive = document.getElementById('deploy-live');
  if (currentApp.deployUrl) {
    deployLive.style.display = 'flex';
    const link = document.getElementById('deploy-live-link');
    link.href = currentApp.deployUrl;
    link.textContent = currentApp.deployUrl.replace(/^https?:\/\//, '');
  } else {
    deployLive.style.display = 'none';
  }

  const stats = document.getElementById('live-stats');
  if (currentApp.status === 'published' && currentApp.stats) {
    stats.style.display = 'flex';
    if (isWebsite) {
      stats.innerHTML = `<div class="stat"><div class="value">${currentApp.stats.downloads.toLocaleString('en-US')}</div><div class="label">Visits</div></div>`;
    } else {
      stats.innerHTML = `
        <div class="stat"><div class="value">${currentApp.stats.downloads.toLocaleString('en-US')}</div><div class="label">Downloads</div></div>
        <div class="stat"><div class="value">${currentApp.stats.rating?.toFixed(1) ?? '—'}</div><div class="label">Rating · ${currentApp.stats.ratingCount?.toLocaleString('en-US') ?? 0} reviews</div></div>`;
    }
  } else {
    stats.style.display = 'none';
  }

  const log = document.getElementById('app-log');
  log.innerHTML = '';
  (currentApp.log || []).forEach((entry) => {
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `<div class="meta">${fmtRelative(entry.createdAt)}</div>${escapeHtml(entry.text)}`;
    log.appendChild(div);
  });
}

async function handleSubmitForReview() {
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  try {
    currentApp = await api(`/api/apps/${currentApp.id}/submit`, { method: 'POST' });
    renderStatus();
    await refreshListEntry();
  } catch (err) {
    if (err.issues) {
      const box = document.getElementById('submit-issues');
      box.style.display = 'block';
      box.innerHTML = `<strong>Not ready yet:</strong><ul>${err.issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
    } else {
      alert(err.message);
    }
  } finally {
    renderStatus();
  }
}

async function handleCheckReview() {
  const btn = document.getElementById('check-review-btn');
  btn.disabled = true;
  btn.textContent = 'Checking…';
  currentApp = await api(`/api/apps/${currentApp.id}/check-review`, { method: 'POST' });
  renderStatus();
  await refreshListEntry();
  btn.disabled = false;
  const isWebsite = (currentApp.kind || 'app') === 'website';
  btn.textContent = isWebsite ? 'Check status' : 'Check review status';
}

async function handleDeploy() {
  const btn = document.getElementById('deploy-btn');
  btn.disabled = true;
  btn.textContent = 'Deploying…';
  try {
    const result = await api(`/api/apps/${currentApp.id}/deploy`, { method: 'POST' });
    currentApp = result.app;
    renderStatus();
    await refreshListEntry();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Deploy live';
  }
}

init();
