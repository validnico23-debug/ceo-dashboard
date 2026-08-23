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
  if (!res.ok) {
    window.location.href = '/login.html';
    return null;
  }
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

const EMOJI_SUGGESTIONS = ['📱', '🚀', '💡', '🎯', '🛒', '📸', '🎵', '💬', '🏋️', '🍔', '🧾', '✈️', '🐾', '📚', '🎮'];
const STATUS_LABELS = { draft: 'draft', in_review: 'in review', changes_requested: 'changes requested', published: 'published' };

let categories = [];
let apps = [];
let currentApp = null;
let previewIndex = 0;
let saveTimer = null;

// ---- Bootstrapping ----

async function init() {
  const me = await requireAuthOrRedirect();
  if (!me) return;
  document.getElementById('user-email').textContent = me.email;

  const meta = await api('/api/app-studio/meta');
  categories = meta.categories;
  const catSelect = document.getElementById('category-select');
  catSelect.innerHTML =
    '<option value="">Choose a category…</option>' + categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');

  const emojiWrap = document.getElementById('emoji-suggestions');
  emojiWrap.innerHTML = EMOJI_SUGGESTIONS.map((e) => `<button type="button" data-emoji="${e}">${e}</button>`).join('');
  emojiWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-emoji]');
    if (!btn) return;
    document.querySelector('#app-details-form [name=icon]').value = btn.dataset.emoji;
    saveDetails();
  });

  await loadApps();
  wireStaticEvents();
}

async function loadApps(selectId) {
  apps = await api('/api/apps');
  renderAppList();
  if (apps.length === 0) {
    currentApp = null;
    document.getElementById('no-app-selected').style.display = 'block';
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
  apps.forEach((a) => {
    const div = document.createElement('div');
    div.className = 'app-list-item' + (currentApp && currentApp.id === a.id ? ' active' : '');
    div.innerHTML = `<span class="icon">${escapeHtml(a.icon)}</span><div class="info"><div class="name">${escapeHtml(a.name)}</div><div class="sub">${a.screenCount} screen${a.screenCount === 1 ? '' : 's'} · ${STATUS_LABELS[a.status]}</div></div>`;
    div.addEventListener('click', () => selectApp(a.id));
    wrap.appendChild(div);
  });
}

async function selectApp(id) {
  currentApp = await api(`/api/apps/${id}`);
  previewIndex = 0;
  document.getElementById('no-app-selected').style.display = 'none';
  document.getElementById('app-editor').style.display = 'block';
  renderAppList();
  renderDetails();
  renderScreens();
  renderPreview();
  renderStatus();
}

// ---- App details form ----

function renderDetails() {
  const form = document.getElementById('app-details-form');
  form.name.value = currentApp.name || '';
  form.subtitle.value = currentApp.subtitle || '';
  form.icon.value = currentApp.icon || '';
  form.color.value = currentApp.color || '#4f46e5';
  form.category.value = currentApp.category || '';
  form.platform.value = currentApp.platform || 'both';
  form.description.value = currentApp.description || '';
  form.supportEmail.value = currentApp.supportEmail || '';
  form.privacyPolicyUrl.value = currentApp.privacyPolicyUrl || '';
}

function showSavedHint() {
  const hint = document.getElementById('save-hint');
  hint.classList.add('show');
  clearTimeout(showSavedHint._t);
  showSavedHint._t = setTimeout(() => hint.classList.remove('show'), 1200);
}

async function saveDetails() {
  const form = document.getElementById('app-details-form');
  const data = Object.fromEntries(new FormData(form).entries());
  currentApp = await api(`/api/apps/${currentApp.id}`, { method: 'PATCH', body: JSON.stringify(data) });
  showSavedHint();
  renderPreview();
  renderStatus();
  await refreshListEntry();
}

async function refreshListEntry() {
  apps = await api('/api/apps');
  renderAppList();
}

// ---- Screens & blocks ----

const BLOCK_TYPE_LABELS = { heading: 'Heading', text: 'Text', button: 'Button', image: 'Image', input: 'Input' };

function renderScreens() {
  const wrap = document.getElementById('screens-editor');
  wrap.innerHTML = '';
  if (currentApp.screens.length === 0) {
    wrap.innerHTML = '<div class="empty-note">No screens yet — add your first one below.</div>';
    return;
  }
  currentApp.screens.forEach((screen, sIdx) => {
    const div = document.createElement('div');
    div.className = 'screen-block';
    div.innerHTML = `
      <div class="screen-block-head">
        <input type="text" value="${escapeHtml(screen.name)}" data-screen="${screen.id}" class="screen-name-input" />
        <button class="icon-btn" data-action="screen-up" data-screen="${screen.id}" ${sIdx === 0 ? 'disabled' : ''}>↑</button>
        <button class="icon-btn" data-action="screen-down" data-screen="${screen.id}" ${sIdx === currentApp.screens.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="icon-btn" data-action="screen-delete" data-screen="${screen.id}">✕</button>
      </div>
      <div class="content-blocks" data-blocks-for="${screen.id}"></div>
      <form class="add-block-form" data-add-block-for="${screen.id}">
        <select name="type">
          ${Object.entries(BLOCK_TYPE_LABELS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
        </select>
        <input type="text" name="text" placeholder="Content…" required />
        <button class="btn small primary" type="submit">Add</button>
      </form>
    `;
    const blocksWrap = div.querySelector(`[data-blocks-for="${screen.id}"]`);
    if (screen.blocks.length === 0) {
      blocksWrap.innerHTML = '<div class="empty-note">No content yet.</div>';
    } else {
      screen.blocks.forEach((block, bIdx) => {
        const row = document.createElement('div');
        row.className = 'content-block-row';
        row.innerHTML = `
          <span class="type-tag">${BLOCK_TYPE_LABELS[block.type] || block.type}</span>
          <input type="text" value="${escapeHtml(block.text)}" data-block="${block.id}" data-screen="${screen.id}" class="block-text-input" />
          <button class="icon-btn" data-action="block-up" data-screen="${screen.id}" data-block="${block.id}" ${bIdx === 0 ? 'disabled' : ''}>↑</button>
          <button class="icon-btn" data-action="block-down" data-screen="${screen.id}" data-block="${block.id}" ${bIdx === screen.blocks.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="icon-btn" data-action="block-delete" data-screen="${screen.id}" data-block="${block.id}">✕</button>
        `;
        blocksWrap.appendChild(row);
      });
    }
    wrap.appendChild(div);
  });
}

function wireStaticEvents() {
  document.getElementById('app-details-form').addEventListener('input', (e) => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDetails, 500);
  });
  document.getElementById('app-details-form').addEventListener('change', (e) => {
    if (e.target.name === 'color' || e.target.name === 'category' || e.target.name === 'platform') saveDetails();
  });
  document.getElementById('app-details-form').addEventListener('submit', (e) => e.preventDefault());

  document.getElementById('new-app-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    const created = await api('/api/apps', { method: 'POST', body: JSON.stringify(data) });
    form.reset();
    await loadApps(created.id);
  });

  document.getElementById('delete-app-btn').addEventListener('click', async () => {
    if (!currentApp) return;
    if (!confirm(`Delete "${currentApp.name}"? This can't be undone.`)) return;
    await api(`/api/apps/${currentApp.id}`, { method: 'DELETE' });
    currentApp = null;
    await loadApps();
  });

  document.getElementById('new-screen-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form).entries());
    await api(`/api/apps/${currentApp.id}/screens`, { method: 'POST', body: JSON.stringify(data) });
    form.reset();
    currentApp = await api(`/api/apps/${currentApp.id}`);
    renderScreens();
    renderPreview();
    renderStatus();
    await refreshListEntry();
  });

  document.getElementById('screens-editor').addEventListener('click', handleScreensClick);
  document.getElementById('screens-editor').addEventListener('submit', handleAddBlockSubmit);
  document.getElementById('screens-editor').addEventListener('blur', handleScreensBlur, true);

  document.getElementById('submit-btn').addEventListener('click', handleSubmitForReview);
  document.getElementById('check-review-btn').addEventListener('click', handleCheckReview);

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/login.html';
  });
}

async function handleScreensClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, screen, block } = btn.dataset;
  if (action === 'screen-up' || action === 'screen-down') {
    await api(`/api/apps/${currentApp.id}/screens/${screen}/move`, {
      method: 'POST',
      body: JSON.stringify({ direction: action === 'screen-up' ? 'up' : 'down' }),
    });
  } else if (action === 'screen-delete') {
    if (!confirm('Delete this screen?')) return;
    await api(`/api/apps/${currentApp.id}/screens/${screen}`, { method: 'DELETE' });
  } else if (action === 'block-up' || action === 'block-down') {
    await api(`/api/apps/${currentApp.id}/screens/${screen}/blocks/${block}/move`, {
      method: 'POST',
      body: JSON.stringify({ direction: action === 'block-up' ? 'up' : 'down' }),
    });
  } else if (action === 'block-delete') {
    await api(`/api/apps/${currentApp.id}/screens/${screen}/blocks/${block}`, { method: 'DELETE' });
  } else {
    return;
  }
  currentApp = await api(`/api/apps/${currentApp.id}`);
  renderScreens();
  renderPreview();
  renderStatus();
  await refreshListEntry();
}

async function handleAddBlockSubmit(e) {
  const form = e.target.closest('form[data-add-block-for]');
  if (!form) return;
  e.preventDefault();
  const screenId = form.dataset.addBlockFor;
  const data = Object.fromEntries(new FormData(form).entries());
  await api(`/api/apps/${currentApp.id}/screens/${screenId}/blocks`, { method: 'POST', body: JSON.stringify(data) });
  currentApp = await api(`/api/apps/${currentApp.id}`);
  renderScreens();
  renderPreview();
  renderStatus();
  await refreshListEntry();
}

async function handleScreensBlur(e) {
  if (e.target.classList?.contains('screen-name-input')) {
    const screenId = e.target.dataset.screen;
    await api(`/api/apps/${currentApp.id}/screens/${screenId}`, { method: 'PATCH', body: JSON.stringify({ name: e.target.value }) });
    currentApp = await api(`/api/apps/${currentApp.id}`);
    renderPreview();
  } else if (e.target.classList?.contains('block-text-input')) {
    const { screen, block } = e.target.dataset;
    await api(`/api/apps/${currentApp.id}/screens/${screen}/blocks/${block}`, {
      method: 'PATCH',
      body: JSON.stringify({ text: e.target.value }),
    });
    currentApp = await api(`/api/apps/${currentApp.id}`);
    renderPreview();
  }
}

// ---- Preview ----

function renderPreview() {
  const header = document.getElementById('preview-header');
  header.style.background = currentApp.color || '#4f46e5';
  header.innerHTML = `<span class="icon">${escapeHtml(currentApp.icon || '📱')}</span><div><div class="name">${escapeHtml(currentApp.name || 'My App')}</div><div class="sub">${escapeHtml(currentApp.subtitle || '')}</div></div>`;

  const tabbar = document.getElementById('preview-tabbar');
  const body = document.getElementById('preview-body');

  if (currentApp.screens.length === 0) {
    tabbar.innerHTML = '';
    body.innerHTML = '<div class="empty-note">Add a screen to see it here.</div>';
    return;
  }
  if (previewIndex >= currentApp.screens.length) previewIndex = 0;

  tabbar.innerHTML = currentApp.screens
    .map((s, i) => `<button data-i="${i}" class="${i === previewIndex ? 'active' : ''}" style="${i === previewIndex ? `color:${currentApp.color}` : ''}">${escapeHtml(s.name)}</button>`)
    .join('');
  tabbar.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      previewIndex = Number(b.dataset.i);
      renderPreview();
    });
  });

  const screen = currentApp.screens[previewIndex];
  if (screen.blocks.length === 0) {
    body.innerHTML = '<div class="empty-note">This screen has no content yet.</div>';
    return;
  }
  body.innerHTML = screen.blocks
    .map((block) => {
      switch (block.type) {
        case 'heading':
          return `<h2>${escapeHtml(block.text)}</h2>`;
        case 'text':
          return `<p>${escapeHtml(block.text)}</p>`;
        case 'button':
          return `<button class="prev-btn" style="background:${currentApp.color}">${escapeHtml(block.text)}</button>`;
        case 'image':
          return `<div class="prev-image">${escapeHtml(block.text || 'Image')}</div>`;
        case 'input':
          return `<input class="prev-input" placeholder="${escapeHtml(block.text)}" disabled />`;
        default:
          return '';
      }
    })
    .join('');
}

// ---- Status & submission ----

function renderStatus() {
  const badge = document.getElementById('status-badge');
  badge.textContent = STATUS_LABELS[currentApp.status];
  badge.className = `status-badge ${currentApp.status}`;

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = currentApp.status === 'in_review';
  submitBtn.textContent =
    currentApp.status === 'in_review' ? 'In review…' : currentApp.status === 'published' ? 'Resubmit update' : 'Submit for review';

  document.getElementById('check-review-btn').style.display = currentApp.status === 'in_review' ? 'inline-flex' : 'none';
  document.getElementById('export-btn').href = `/api/apps/${currentApp.id}/export`;

  document.getElementById('submit-issues').style.display = 'none';

  const log = document.getElementById('app-log');
  log.innerHTML = '';
  currentApp.log.forEach((entry) => {
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
      box.innerHTML = `<strong>Not ready to submit yet:</strong><ul>${err.issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
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
  btn.textContent = 'Check review status';
}

init();
