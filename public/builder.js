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

const ICONS = {
  close: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  grip: '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg>',
};

const EMOJI_SUGGESTIONS = ['📱', '🚀', '💡', '🎯', '🛒', '📸', '🎵', '💬', '🏋️', '🍔', '🧾', '✈️', '🐾', '📚', '🎮'];
const STATUS_LABELS = { draft: 'draft', in_review: 'in review', changes_requested: 'changes requested', published: 'published' };

let categories = [];
let templates = [];
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
  templates = meta.templates;
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

  document.getElementById('template-grid').innerHTML = templates
    .map(
      (t) =>
        `<button type="button" class="template-card" data-template="${t.id}"><span class="icon">${t.icon}</span><div class="name">${escapeHtml(t.name)}</div><div class="desc">${escapeHtml(t.description)}</div></button>`
    )
    .join('');

  if (!meta.aiGeneration) {
    document.getElementById('ai-modal-sub').textContent =
      'Describe your app idea in a sentence and get a full first draft — name, screens, and content. (Using rule-based drafting; set ANTHROPIC_API_KEY for AI-written content.)';
  }

  await loadApps();
  wireStaticEvents();
}

function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
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
    const sub = a.downloads != null ? `${a.downloads.toLocaleString('en-US')} downloads` : `${a.screenCount} screen${a.screenCount === 1 ? '' : 's'} · ${STATUS_LABELS[a.status]}`;
    div.innerHTML = `<span class="icon">${escapeHtml(a.icon)}</span><div class="info"><div class="name">${escapeHtml(a.name)}</div><div class="sub">${sub}</div></div>`;
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
  form.color.value = currentApp.color || '#2563eb';
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

const BLOCK_TYPE_LABELS = {
  heading: 'Heading',
  text: 'Text',
  button: 'Button',
  image: 'Image',
  input: 'Input',
  divider: 'Divider',
  list: 'List',
  card: 'Card',
};

function screenOptions(currentApp, selectedId, excludeId) {
  return (
    '<option value="">No link</option>' +
    currentApp.screens
      .filter((s) => s.id !== excludeId)
      .map((s) => `<option value="${s.id}" ${Number(selectedId) === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`)
      .join('')
  );
}

function renderScreens() {
  const wrap = document.getElementById('screens-editor');
  wrap.innerHTML = '';
  if (currentApp.screens.length === 0) {
    wrap.innerHTML = '<div class="empty-note">No screens yet — add your first one below.</div>';
    return;
  }
  currentApp.screens.forEach((screen) => {
    const div = document.createElement('div');
    div.className = 'screen-block';
    div.draggable = true;
    div.dataset.id = screen.id;
    div.innerHTML = `
      <div class="screen-block-head">
        <span class="drag-handle" title="Drag to reorder">${ICONS.grip}</span>
        <input type="text" value="${escapeHtml(screen.name)}" data-screen="${screen.id}" class="screen-name-input" />
        <button class="icon-btn" data-action="screen-delete" data-screen="${screen.id}" title="Delete screen">${ICONS.close}</button>
      </div>
      <div class="content-blocks" data-blocks-for="${screen.id}"></div>
      <form class="add-block-form" data-add-block-for="${screen.id}">
        <select name="type" class="block-type-select">
          ${Object.entries(BLOCK_TYPE_LABELS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
        </select>
        <input type="text" name="text" placeholder="Content… (list items: separate with |)" required />
        <select name="linkTo" class="link-to-select" style="display:none">${screenOptions(currentApp, null, screen.id)}</select>
        <button class="btn small primary" type="submit">Add</button>
      </form>
    `;
    const blocksWrap = div.querySelector(`[data-blocks-for="${screen.id}"]`);
    if (screen.blocks.length === 0) {
      blocksWrap.innerHTML = '<div class="empty-note">No content yet.</div>';
    } else {
      screen.blocks.forEach((block) => {
        const row = document.createElement('div');
        row.className = 'content-block-row';
        row.draggable = true;
        row.dataset.id = block.id;
        row.innerHTML = `
          <span class="drag-handle" title="Drag to reorder">${ICONS.grip}</span>
          <span class="type-tag">${BLOCK_TYPE_LABELS[block.type] || block.type}</span>
          <input type="text" value="${escapeHtml(block.text)}" data-block="${block.id}" data-screen="${screen.id}" class="block-text-input" />
          ${
            block.type === 'button'
              ? `<select class="link-to-select block-link-select" data-block="${block.id}" data-screen="${screen.id}">${screenOptions(currentApp, block.linkTo, screen.id)}</select>`
              : ''
          }
          <button class="icon-btn" data-action="block-delete" data-screen="${screen.id}" data-block="${block.id}" title="Delete">${ICONS.close}</button>
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

  document.getElementById('duplicate-app-btn').addEventListener('click', async () => {
    if (!currentApp) return;
    const copy = await api(`/api/apps/${currentApp.id}/duplicate`, { method: 'POST' });
    await loadApps(copy.id);
  });

  document.getElementById('open-template-modal').addEventListener('click', () => openModal('template-modal'));
  document.getElementById('close-template-modal').addEventListener('click', () => closeModal('template-modal'));
  document.getElementById('template-modal').addEventListener('click', (e) => {
    if (e.target.id === 'template-modal') closeModal('template-modal');
  });
  document.getElementById('template-grid').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-template]');
    if (!btn) return;
    btn.disabled = true;
    const created = await api('/api/apps/from-template', { method: 'POST', body: JSON.stringify({ templateId: btn.dataset.template }) });
    closeModal('template-modal');
    await loadApps(created.id);
  });

  document.getElementById('open-ai-modal').addEventListener('click', () => openModal('ai-modal'));
  document.getElementById('close-ai-modal').addEventListener('click', () => closeModal('ai-modal'));
  document.getElementById('ai-modal').addEventListener('click', (e) => {
    if (e.target.id === 'ai-modal') closeModal('ai-modal');
  });
  document.getElementById('ai-generate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = document.getElementById('ai-prompt').value.trim();
    if (!prompt) return;
    const btn = document.getElementById('ai-generate-btn');
    const errBox = document.getElementById('ai-error');
    errBox.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Generating…';
    try {
      const created = await api('/api/apps/generate', { method: 'POST', body: JSON.stringify({ prompt }) });
      document.getElementById('ai-prompt').value = '';
      closeModal('ai-modal');
      await loadApps(created.id);
    } catch (err) {
      errBox.textContent = err.message;
      errBox.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate app';
    }
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
  document.getElementById('screens-editor').addEventListener('change', handleScreensChange);
  wireScreensDragAndDrop();

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
  if (action === 'screen-delete') {
    if (!confirm('Delete this screen?')) return;
    await api(`/api/apps/${currentApp.id}/screens/${screen}`, { method: 'DELETE' });
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

// Drag-and-drop reordering via native HTML5 DnD. Both screens and blocks
// live in the same #screens-editor container, so each wiring call carries a
// guard that lets exactly one of them claim a given drag gesture: a drag
// starting inside a .content-block-row is always a block reorder (blocks
// are the innermost draggable), so the screen-level wiring backs off
// whenever the gesture started inside one.
function wireDragReorder(container, itemSelector, guard, onDrop) {
  let draggedEl = null;
  container.addEventListener('dragstart', (e) => {
    if (guard && !guard(e)) return;
    const item = e.target.closest(itemSelector);
    if (!item) return;
    draggedEl = item;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(item.dataset.id));
    item.classList.add('dragging');
  });
  container.addEventListener('dragend', () => {
    if (draggedEl) draggedEl.classList.remove('dragging');
    draggedEl = null;
  });
  container.addEventListener('dragover', (e) => {
    if (!draggedEl) return;
    const item = e.target.closest(itemSelector);
    if (!item || item === draggedEl || item.parentElement !== draggedEl.parentElement) return;
    e.preventDefault();
    const rect = item.getBoundingClientRect();
    const before = e.clientY - rect.top < rect.height / 2;
    item.classList.toggle('drag-over-before', before);
    item.classList.toggle('drag-over-after', !before);
  });
  container.addEventListener('dragleave', (e) => {
    const item = e.target.closest(itemSelector);
    if (item) item.classList.remove('drag-over-before', 'drag-over-after');
  });
  container.addEventListener('drop', async (e) => {
    if (!draggedEl) return;
    const item = e.target.closest(itemSelector);
    if (!item || item === draggedEl || item.parentElement !== draggedEl.parentElement) return;
    e.preventDefault();
    const before = item.classList.contains('drag-over-before');
    item.classList.remove('drag-over-before', 'drag-over-after');
    const siblings = Array.from(draggedEl.parentElement.querySelectorAll(`:scope > ${itemSelector}`));
    const order = siblings.map((el) => el.dataset.id);
    const filtered = order.filter((id) => id !== draggedEl.dataset.id);
    const targetIdx = filtered.indexOf(item.dataset.id);
    filtered.splice(before ? targetIdx : targetIdx + 1, 0, draggedEl.dataset.id);
    const screenId = draggedEl.closest('[data-blocks-for]')?.dataset.blocksFor;
    await onDrop(filtered, screenId);
  });
}

function wireScreensDragAndDrop() {
  const container = document.getElementById('screens-editor');

  wireDragReorder(
    container,
    '.screen-block',
    (e) => !e.target.closest('.content-block-row'),
    async (order) => {
      await api(`/api/apps/${currentApp.id}/screens/reorder`, { method: 'POST', body: JSON.stringify({ order }) });
      currentApp = await api(`/api/apps/${currentApp.id}`);
      renderScreens();
      renderPreview();
      renderStatus();
      await refreshListEntry();
    }
  );

  wireDragReorder(container, '.content-block-row', null, async (order, screenId) => {
    await api(`/api/apps/${currentApp.id}/screens/${screenId}/blocks/reorder`, { method: 'POST', body: JSON.stringify({ order }) });
    currentApp = await api(`/api/apps/${currentApp.id}`);
    renderScreens();
    renderPreview();
    renderStatus();
  });
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

async function handleScreensChange(e) {
  if (e.target.classList?.contains('block-type-select')) {
    const form = e.target.closest('form');
    form.querySelector('.link-to-select').style.display = e.target.value === 'button' ? '' : 'none';
    return;
  }
  if (e.target.classList?.contains('block-link-select')) {
    const { screen, block } = e.target.dataset;
    await api(`/api/apps/${currentApp.id}/screens/${screen}/blocks/${block}`, {
      method: 'PATCH',
      body: JSON.stringify({ linkTo: e.target.value || null }),
    });
    currentApp = await api(`/api/apps/${currentApp.id}`);
    renderPreview();
  }
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
  header.style.background = currentApp.color || '#2563eb';
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
    .map((block, i) => {
      switch (block.type) {
        case 'heading':
          return `<h2>${escapeHtml(block.text)}</h2>`;
        case 'text':
          return `<p>${escapeHtml(block.text)}</p>`;
        case 'button':
          return `<button class="prev-btn" data-block-i="${i}" style="background:${currentApp.color}">${escapeHtml(block.text)}</button>`;
        case 'image':
          return `<div class="prev-image">${escapeHtml(block.text || 'Image')}</div>`;
        case 'input':
          return `<input class="prev-input" placeholder="${escapeHtml(block.text)}" disabled />`;
        case 'divider':
          return '<hr class="prev-divider" />';
        case 'list':
          return `<ul class="prev-list">${block.text
            .split('|')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join('')}</ul>`;
        case 'card':
          return `<div class="prev-card">${escapeHtml(block.text)}</div>`;
        default:
          return '';
      }
    })
    .join('');

  body.querySelectorAll('.prev-btn[data-block-i]').forEach((btn) => {
    const block = screen.blocks[Number(btn.dataset.blockI)];
    if (!block.linkTo) return;
    const targetIdx = currentApp.screens.findIndex((s) => s.id === block.linkTo);
    if (targetIdx === -1) return;
    btn.style.cursor = 'pointer';
    btn.title = `Links to "${currentApp.screens[targetIdx].name}"`;
    btn.addEventListener('click', () => {
      previewIndex = targetIdx;
      renderPreview();
    });
  });

  renderScreenshots();
}

// ---- Screenshots ----
// Renders each screen to a canvas at real App Store resolution (1290×2796,
// the iPhone 6.7" size Apple requires) so a screenshot generated here is
// actually usable in a real submission, not just a preview thumbnail.

const SHOT_W = 1290;
const SHOT_H = 2796;

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 8) {
  const words = String(text).split(/\s+/).filter(Boolean);
  let line = '';
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
      lines += 1;
      if (lines >= maxLines) {
        ctx.fillText(line + '…', x, y);
        return y + lineHeight;
      }
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawScreenshot(canvas, app, screen) {
  canvas.width = SHOT_W;
  canvas.height = SHOT_H;
  const ctx = canvas.getContext('2d');
  const pad = 72;

  ctx.fillStyle = '#f6f7fa';
  ctx.fillRect(0, 0, SHOT_W, SHOT_H);

  const headerH = 300;
  ctx.fillStyle = app.color || '#2563eb';
  ctx.fillRect(0, 0, SHOT_W, headerH);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '72px sans-serif';
  ctx.fillText(app.icon || '📱', pad, 170);
  ctx.font = '700 52px sans-serif';
  ctx.fillText(app.name || 'My App', pad + 96, 150);
  ctx.font = '36px sans-serif';
  ctx.globalAlpha = 0.85;
  ctx.fillText(app.subtitle || '', pad + 96, 200);
  ctx.globalAlpha = 1;

  const tabH = 130;
  let y = headerH + 90;
  const contentW = SHOT_W - pad * 2;

  for (const block of screen.blocks) {
    if (y > SHOT_H - tabH - 60) break;
    switch (block.type) {
      case 'heading':
        ctx.fillStyle = '#14161c';
        ctx.font = '700 56px sans-serif';
        y = wrapText(ctx, block.text, pad, y, contentW, 66, 2) + 20;
        break;
      case 'text':
        ctx.fillStyle = '#333333';
        ctx.font = '40px sans-serif';
        y = wrapText(ctx, block.text, pad, y, contentW, 52, 4) + 16;
        break;
      case 'button': {
        const h = 108;
        ctx.fillStyle = app.color || '#2563eb';
        roundRect(ctx, pad, y, contentW, h, 18);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(block.text, SHOT_W / 2, y + h / 2 + 14);
        ctx.textAlign = 'left';
        y += h + 24;
        break;
      }
      case 'image':
        ctx.fillStyle = '#e5e7ec';
        roundRect(ctx, pad, y, contentW, 320, 18);
        ctx.fill();
        ctx.fillStyle = '#6b7280';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(block.text || 'Image', SHOT_W / 2, y + 320 / 2 + 12);
        ctx.textAlign = 'left';
        y += 320 + 24;
        break;
      case 'input': {
        const h = 96;
        ctx.strokeStyle = '#dfe1e6';
        ctx.lineWidth = 3;
        roundRect(ctx, pad, y, contentW, h, 16);
        ctx.stroke();
        ctx.fillStyle = '#9498a3';
        ctx.font = '36px sans-serif';
        ctx.fillText(block.text, pad + 24, y + h / 2 + 12);
        y += h + 24;
        break;
      }
      case 'divider':
        ctx.strokeStyle = '#e5e7ec';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(SHOT_W - pad, y);
        ctx.stroke();
        y += 48;
        break;
      case 'list':
        ctx.fillStyle = '#14161c';
        ctx.font = '40px sans-serif';
        block.text
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((item) => {
            ctx.fillText('•', pad, y);
            y = wrapText(ctx, item, pad + 40, y, contentW - 40, 52, 2) + 8;
          });
        y += 8;
        break;
      case 'card':
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e5e7ec';
        ctx.lineWidth = 2;
        roundRect(ctx, pad, y, contentW, 140, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#14161c';
        ctx.font = '38px sans-serif';
        wrapText(ctx, block.text, pad + 24, y + 60, contentW - 48, 48, 2);
        y += 140 + 24;
        break;
    }
  }

  const tabY = SHOT_H - tabH;
  ctx.strokeStyle = '#e5e7ec';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, tabY);
  ctx.lineTo(SHOT_W, tabY);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, tabY + 1, SHOT_W, tabH - 1);
  const slotW = SHOT_W / currentApp.screens.length;
  ctx.textAlign = 'center';
  ctx.font = '32px sans-serif';
  currentApp.screens.forEach((s, i) => {
    ctx.fillStyle = s.id === screen.id ? app.color || '#2563eb' : '#6b7280';
    ctx.font = s.id === screen.id ? '700 32px sans-serif' : '32px sans-serif';
    ctx.fillText(s.name, slotW * i + slotW / 2, tabY + tabH / 2 + 12);
  });
  ctx.textAlign = 'left';
}

function renderScreenshots() {
  const grid = document.getElementById('screenshots-grid');
  grid.innerHTML = '';
  if (currentApp.screens.length === 0) {
    grid.innerHTML = '<div class="empty-note">Add a screen to generate screenshots.</div>';
    return;
  }
  currentApp.screens.forEach((screen) => {
    const tile = document.createElement('div');
    tile.className = 'screenshot-tile';
    const canvas = document.createElement('canvas');
    drawScreenshot(canvas, currentApp, screen);
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = screen.name;
    const link = document.createElement('a');
    link.className = 'btn small';
    link.textContent = 'Download';
    link.href = canvas.toDataURL('image/png');
    const slug = (currentApp.name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'app';
    link.download = `${slug}-${(screen.name || 'screen').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    tile.append(canvas, label, link);
    grid.appendChild(tile);
  });
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

  const stats = document.getElementById('live-stats');
  if (currentApp.status === 'published' && currentApp.stats) {
    stats.style.display = 'flex';
    stats.innerHTML = `
      <div class="stat"><div class="value">${currentApp.stats.downloads.toLocaleString('en-US')}</div><div class="label">Downloads</div></div>
      <div class="stat"><div class="value">${currentApp.stats.rating.toFixed(1)}</div><div class="label">Rating · ${currentApp.stats.ratingCount.toLocaleString('en-US')} reviews</div></div>
    `;
  } else {
    stats.style.display = 'none';
  }

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
