// App Studio: lets a user design a simple multi-screen app and run it through
// a simulated App Store submission pipeline (Submitted → In Review →
// Published/Changes Requested). This mirrors the real Apple review workflow
// structurally, but is a demo pipeline — see EXPORT NOTE below and the
// "Going live for real" copy in the UI for what actual publishing requires.

const CATEGORIES = [
  'Business',
  'Productivity',
  'Lifestyle',
  'Health & Fitness',
  'Education',
  'Finance',
  'Social Networking',
  'Utilities',
  'Entertainment',
  'Food & Drink',
  'Travel',
  'Games',
];

const BLOCK_TYPES = ['heading', 'text', 'button', 'image', 'input'];

const REVIEW_MS = 90 * 1000; // simulated review duration

function emptyApp(id, name) {
  const now = new Date().toISOString();
  return {
    id,
    name: name || 'My App',
    subtitle: '',
    description: '',
    category: '',
    icon: '📱',
    color: '#4f46e5',
    platform: 'both',
    supportEmail: '',
    privacyPolicyUrl: '',
    screens: [],
    status: 'draft', // draft | in_review | changes_requested | published
    submittedAt: null,
    publishedAt: null,
    log: [{ id: 1, text: 'App created.', createdAt: now }],
    createdAt: now,
    updatedAt: now,
  };
}

function findApp(b, appId) {
  return b.apps.find((a) => a.id === Number(appId));
}

function findScreen(app, screenId) {
  return app.screens.find((s) => s.id === Number(screenId));
}

function findBlock(screen, blockId) {
  return screen.blocks.find((x) => x.id === Number(blockId));
}

function touch(app) {
  app.updatedAt = new Date().toISOString();
}

function logEntry(app, text) {
  const id = (app.log[0]?.id || 0) + 1;
  app.log.unshift({ id, text, createdAt: new Date().toISOString() });
  app.log = app.log.slice(0, 30);
}

function totalBlockCount(app) {
  return app.screens.reduce((sum, s) => sum + s.blocks.length, 0);
}

// Checks the App-Store-Connect-style listing requirements. Returns a list of
// human-readable issue strings; empty means ready to submit.
function validateForSubmission(app) {
  const issues = [];
  if (!app.name || app.name.trim().length === 0) issues.push('App name is required.');
  if (app.name && app.name.length > 30) issues.push('App name must be 30 characters or fewer.');
  if (!app.subtitle || app.subtitle.trim().length === 0) issues.push('Subtitle is required.');
  if (app.subtitle && app.subtitle.length > 30) issues.push('Subtitle must be 30 characters or fewer.');
  if (!app.description || app.description.trim().length < 40)
    issues.push('Description must be at least 40 characters.');
  if (!app.category) issues.push('Pick a category.');
  if (!app.icon || app.icon.trim().length === 0) issues.push('App icon is required.');
  if (!app.supportEmail || !app.supportEmail.includes('@')) issues.push('A valid support email is required.');
  if (!app.privacyPolicyUrl || !/^https?:\/\//i.test(app.privacyPolicyUrl))
    issues.push('A privacy policy URL (starting with http:// or https://) is required.');
  if (app.screens.length < 2) issues.push('Add at least 2 screens.');
  const emptyScreens = app.screens.filter((s) => s.blocks.length === 0);
  if (emptyScreens.length > 0) issues.push(`Screen(s) with no content: ${emptyScreens.map((s) => s.name).join(', ')}.`);
  return issues;
}

function submitApp(app) {
  const issues = validateForSubmission(app);
  if (issues.length > 0) return { ok: false, issues };
  app.status = 'in_review';
  app.submittedAt = new Date().toISOString();
  app.publishedAt = null;
  logEntry(app, 'Submitted to App Store Connect. Waiting for review.');
  touch(app);
  return { ok: true, app };
}

// Advances one app through review if enough simulated time has passed.
// Apps with thin content (fewer than 4 total blocks) come back with changes
// requested, mirroring a real rejection for insufficient app functionality —
// everything else is approved.
function reviewApp(app, now = new Date()) {
  if (app.status !== 'in_review' || !app.submittedAt) return false;
  const elapsed = now - new Date(app.submittedAt);
  if (elapsed < REVIEW_MS) return false;

  if (totalBlockCount(app) < 4) {
    app.status = 'changes_requested';
    logEntry(
      app,
      'Changes requested — Guideline 4.2 (Minimum Functionality): add more content to your screens and resubmit.'
    );
  } else {
    app.status = 'published';
    app.publishedAt = now.toISOString();
    logEntry(app, 'Approved. Your app is live on the App Store.');
  }
  touch(app);
  return true;
}

function reviewAllApps(b, now = new Date()) {
  for (const app of b.apps) reviewApp(app, now);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlockHtml(block) {
  switch (block.type) {
    case 'heading':
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case 'text':
      return `<p>${escapeHtml(block.text)}</p>`;
    case 'button':
      return `<button class="block-btn">${escapeHtml(block.text)}</button>`;
    case 'image':
      return `<div class="block-image">${escapeHtml(block.text || 'Image')}</div>`;
    case 'input':
      return `<input class="block-input" placeholder="${escapeHtml(block.text)}" />`;
    default:
      return '';
  }
}

// EXPORT NOTE: this generates a real, working single-file PWA — not a
// no-op mock. It's a legitimate starting point (wrap it with Capacitor or
// Cordova to build native iOS/Android binaries), but it is not itself a
// submission to Apple/Google; see the in-app "Going live for real" panel.
function exportAppHtml(app) {
  const screensNav = app.screens
    .map((s, i) => `<button class="tab" data-i="${i}">${escapeHtml(s.name)}</button>`)
    .join('');
  const screensContent = app.screens
    .map(
      (s, i) =>
        `<section class="screen" data-i="${i}" style="${i === 0 ? '' : 'display:none'}">${s.blocks
          .map(renderBlockHtml)
          .join('\n')}</section>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(app.name)}</title>
<style>
  :root { --accent: ${app.color}; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f6f7fa; color: #14161c; }
  header { background: var(--accent); color: #fff; padding: 18px 20px; display: flex; align-items: center; gap: 10px; }
  header .icon { font-size: 24px; }
  header h1 { font-size: 17px; margin: 0; }
  header p { margin: 2px 0 0; font-size: 12.5px; opacity: 0.85; }
  main { max-width: 420px; margin: 0 auto; padding: 20px; min-height: 60vh; }
  .screen h2 { font-size: 18px; margin: 0 0 10px; }
  .screen p { font-size: 14px; line-height: 1.5; color: #333; }
  .block-btn { display: block; width: 100%; padding: 12px; margin: 10px 0; border: none; border-radius: 10px; background: var(--accent); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
  .block-image { height: 140px; border-radius: 10px; background: #e5e7ec; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 13px; margin: 10px 0; }
  .block-input { display: block; width: 100%; padding: 10px 12px; margin: 10px 0; border: 1px solid #e5e7ec; border-radius: 10px; font-size: 14px; }
  nav.tabbar { position: sticky; bottom: 0; display: flex; border-top: 1px solid #e5e7ec; background: #fff; }
  nav.tabbar .tab { flex: 1; border: none; background: none; padding: 12px 6px; font-size: 12px; cursor: pointer; color: #6b7280; }
  nav.tabbar .tab.active { color: var(--accent); font-weight: 700; }
</style>
</head>
<body>
<header><span class="icon">${escapeHtml(app.icon)}</span><div><h1>${escapeHtml(app.name)}</h1><p>${escapeHtml(app.subtitle)}</p></div></header>
<main>${screensContent}</main>
<nav class="tabbar">${screensNav}</nav>
<script>
document.querySelectorAll('nav.tabbar .tab').forEach((btn, i) => {
  if (i === 0) btn.classList.add('active');
  btn.addEventListener('click', () => {
    document.querySelectorAll('.screen').forEach((s) => s.style.display = s.dataset.i === btn.dataset.i ? 'block' : 'none');
    document.querySelectorAll('nav.tabbar .tab').forEach((b) => b.classList.toggle('active', b === btn));
  });
});
</script>
</body>
</html>
`;
}

module.exports = {
  CATEGORIES,
  BLOCK_TYPES,
  emptyApp,
  findApp,
  findScreen,
  findBlock,
  touch,
  logEntry,
  validateForSubmission,
  submitApp,
  reviewApp,
  reviewAllApps,
  exportAppHtml,
};
