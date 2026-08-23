// App Studio: lets a user design a simple multi-screen app (from scratch, a
// template, or an AI-generated draft) and run it through a simulated App
// Store submission pipeline (Submitted → In Review → Published/Changes
// Requested). Published apps also get simulated live download/rating stats
// that grow over time. This mirrors the real Apple review workflow
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

const BLOCK_TYPES = ['heading', 'text', 'button', 'image', 'input', 'divider', 'list', 'card'];

const REVIEW_MS = 90 * 1000; // simulated review duration
const DOWNLOAD_MILESTONES = [100, 500, 1000, 5000, 10000, 50000, 100000];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
    stats: null,
    log: [{ id: 1, text: 'App created.', createdAt: now }],
    createdAt: now,
    updatedAt: now,
  };
}

// Turns a loosely-shaped spec (from a template or AI generation) into a full
// app record with real, database-assigned ids. Every field is sanitized so a
// malformed AI response can never corrupt app state.
function materializeApp(b, spec, sourceLabel) {
  const now = new Date().toISOString();
  const id = b.nextIds.apps++;
  const category = CATEGORIES.includes(spec.category) ? spec.category : '';
  const icon = String(spec.icon || '📱').trim().slice(0, 4) || '📱';
  const color = /^#[0-9a-f]{6}$/i.test(spec.color || '') ? spec.color : '#4f46e5';

  const screens = (Array.isArray(spec.screens) ? spec.screens : []).slice(0, 8).map((s) => ({
    id: b.nextIds.appScreens++,
    name: String(s.name || 'Screen').trim().slice(0, 40) || 'Screen',
    blocks: (Array.isArray(s.blocks) ? s.blocks : []).slice(0, 12).map((blk) => ({
      id: b.nextIds.appBlocks++,
      type: BLOCK_TYPES.includes(blk.type) ? blk.type : 'text',
      text: String(blk.text || '').slice(0, 400),
      linkTo: null,
    })),
  }));

  return {
    id,
    name: String(spec.name || 'My App').trim().slice(0, 30) || 'My App',
    subtitle: String(spec.subtitle || '').trim().slice(0, 30),
    description: String(spec.description || '').trim().slice(0, 2000),
    category,
    icon,
    color,
    platform: 'both',
    supportEmail: '',
    privacyPolicyUrl: '',
    screens,
    status: 'draft',
    submittedAt: null,
    publishedAt: null,
    stats: null,
    log: [{ id: 1, text: sourceLabel || 'App created.', createdAt: now }],
    createdAt: now,
    updatedAt: now,
  };
}

// Deep-clones an existing app under new ids, remapping button "linkTo"
// screen references so the duplicate's internal navigation still works.
function duplicateApp(b, source) {
  const now = new Date().toISOString();
  const id = b.nextIds.apps++;
  const screenIdMap = new Map();
  const screens = source.screens.map((s) => {
    const newId = b.nextIds.appScreens++;
    screenIdMap.set(s.id, newId);
    return {
      id: newId,
      name: s.name,
      blocks: s.blocks.map((blk) => ({ id: b.nextIds.appBlocks++, type: blk.type, text: blk.text, linkTo: blk.linkTo || null })),
    };
  });
  screens.forEach((s) => s.blocks.forEach((blk) => {
    if (blk.linkTo) blk.linkTo = screenIdMap.get(blk.linkTo) || null;
  }));

  let name = `${source.name} Copy`;
  if (name.length > 30) name = name.slice(0, 30);

  return {
    ...source,
    id,
    name,
    screens,
    status: 'draft',
    submittedAt: null,
    publishedAt: null,
    stats: null,
    log: [{ id: 1, text: `Duplicated from "${source.name}".`, createdAt: now }],
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

// Validates a proposed linkTo value against the app's own screens — returns
// a safe value (the id, or null) that can never point outside this app.
function sanitizeLinkTo(app, linkTo) {
  if (linkTo === undefined) return undefined;
  if (linkTo === null || linkTo === '') return null;
  const target = app.screens.find((s) => s.id === Number(linkTo));
  return target ? target.id : null;
}

// Reorders screens/blocks to match a drag-and-drop drop result. Only
// accepts orderIds that are exactly a permutation of the current ids, so a
// stale or tampered order can never drop or duplicate an item.
function reorderScreens(app, orderIds) {
  const ids = (orderIds || []).map(Number);
  const currentIds = app.screens.map((s) => s.id);
  if (ids.length !== currentIds.length || !currentIds.every((id) => ids.includes(id))) return false;
  const byId = new Map(app.screens.map((s) => [s.id, s]));
  app.screens = ids.map((id) => byId.get(id));
  touch(app);
  return true;
}

function reorderBlocks(app, screen, orderIds) {
  const ids = (orderIds || []).map(Number);
  const currentIds = screen.blocks.map((b) => b.id);
  if (ids.length !== currentIds.length || !currentIds.every((id) => ids.includes(id))) return false;
  const byId = new Map(screen.blocks.map((b) => [b.id, b]));
  screen.blocks = ids.map((id) => byId.get(id));
  touch(app);
  return true;
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

function publishApp(app, now) {
  app.status = 'published';
  app.publishedAt = now.toISOString();
  app.stats = { downloads: randInt(50, 400), rating: +(3.8 + Math.random() * 1.1).toFixed(1), ratingCount: randInt(5, 40) };
  logEntry(app, 'Approved. Your app is live on the App Store.');
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
    publishApp(app, now);
  }
  touch(app);
  return true;
}

// Grows a live app's downloads/rating a little on every tick, and drops a
// milestone note into the log when download counts cross round numbers.
function growPublishedApp(app) {
  if (app.status !== 'published' || !app.stats) return;
  const before = app.stats.downloads;
  app.stats.downloads += randInt(5, 60);
  app.stats.ratingCount += randInt(0, 3);
  const drift = (Math.random() - 0.5) * 0.1;
  app.stats.rating = Math.min(5, Math.max(3.5, +(app.stats.rating + drift).toFixed(2)));

  const crossed = DOWNLOAD_MILESTONES.find((m) => before < m && app.stats.downloads >= m);
  if (crossed) logEntry(app, `Passed ${crossed.toLocaleString('en-US')} downloads.`);
}

function tickApps(b, now = new Date()) {
  for (const app of b.apps) {
    if (app.status === 'in_review') reviewApp(app, now);
    else if (app.status === 'published') growPublishedApp(app);
  }
}

// ---- Templates ----

const TEMPLATES = {
  todo: {
    name: 'TaskFlow',
    subtitle: 'Get things done, daily',
    description:
      'TaskFlow helps you organize your day with simple to-do lists, reminders, and a satisfying way to track what you finish.',
    category: 'Productivity',
    icon: '✅',
    color: '#4f46e5',
    screens: [
      { name: 'Today', blocks: [
        { type: 'heading', text: 'Today' },
        { type: 'list', text: 'Finish project brief | Call the plumber | Pack for trip' },
        { type: 'button', text: '+ Add Task' },
      ] },
      { name: 'Lists', blocks: [
        { type: 'heading', text: 'Your Lists' },
        { type: 'card', text: 'Work — 4 tasks' },
        { type: 'card', text: 'Home — 2 tasks' },
        { type: 'card', text: 'Shopping — 6 tasks' },
      ] },
      { name: 'Stats', blocks: [
        { type: 'heading', text: 'This Week' },
        { type: 'text', text: 'You completed 18 tasks this week — 20% more than last week.' },
        { type: 'divider', text: '' },
        { type: 'text', text: 'Keep the streak going!' },
      ] },
      { name: 'Profile', blocks: [
        { type: 'heading', text: 'Your Profile' },
        { type: 'input', text: 'Name' },
        { type: 'input', text: 'Email' },
        { type: 'button', text: 'Save Changes' },
      ] },
    ],
  },
  store: {
    name: 'Shopfront',
    subtitle: 'Shop the drop',
    description:
      'Shopfront is a clean, fast storefront for browsing products, checking details, and checking out in a couple of taps.',
    category: 'Business',
    icon: '🛍️',
    color: '#b45309',
    screens: [
      { name: 'Shop', blocks: [
        { type: 'heading', text: 'New Arrivals' },
        { type: 'image', text: 'Featured product photo' },
        { type: 'card', text: 'Canvas Tote — $28' },
        { type: 'card', text: 'Ceramic Mug — $16' },
      ] },
      { name: 'Product', blocks: [
        { type: 'heading', text: 'Canvas Tote' },
        { type: 'image', text: 'Product photo' },
        { type: 'text', text: 'Durable, hand-stitched canvas tote in three colors.' },
        { type: 'button', text: 'Add to Cart — $28' },
      ] },
      { name: 'Cart', blocks: [
        { type: 'heading', text: 'Your Cart' },
        { type: 'list', text: 'Canvas Tote x1 — $28 | Ceramic Mug x2 — $32' },
        { type: 'divider', text: '' },
        { type: 'button', text: 'Checkout — $60' },
      ] },
      { name: 'Account', blocks: [
        { type: 'heading', text: 'Account' },
        { type: 'input', text: 'Shipping address' },
        { type: 'input', text: 'Payment method' },
        { type: 'button', text: 'Save' },
      ] },
    ],
  },
  fitness: {
    name: 'PulseFit',
    subtitle: 'Train smarter, every day',
    description:
      'PulseFit builds you a workout plan, tracks every session, and celebrates your streaks so you keep showing up.',
    category: 'Health & Fitness',
    icon: '🏋️',
    color: '#15803d',
    screens: [
      { name: 'Home', blocks: [
        { type: 'heading', text: 'Good morning!' },
        { type: 'text', text: "Today's workout: Upper Body Strength (32 min)" },
        { type: 'button', text: 'Start Workout' },
      ] },
      { name: 'Plan', blocks: [
        { type: 'heading', text: 'This Week' },
        { type: 'list', text: 'Mon — Upper Body | Wed — Legs | Fri — Cardio | Sun — Rest' },
      ] },
      { name: 'Progress', blocks: [
        { type: 'heading', text: 'Your Progress' },
        { type: 'card', text: '12-day streak 🔥' },
        { type: 'text', text: 'Total workouts logged: 47' },
      ] },
      { name: 'Profile', blocks: [
        { type: 'heading', text: 'Profile' },
        { type: 'input', text: 'Goal weight' },
        { type: 'input', text: 'Height' },
        { type: 'button', text: 'Save' },
      ] },
    ],
  },
  social: {
    name: 'Ripple',
    subtitle: 'Share your moment',
    description:
      'Ripple is a simple social feed for sharing short updates and photos with friends and seeing what they are up to.',
    category: 'Social Networking',
    icon: '💬',
    color: '#7c6ff0',
    screens: [
      { name: 'Feed', blocks: [
        { type: 'heading', text: 'Feed' },
        { type: 'card', text: 'Amara: Sunset run 🏃‍♀️🌅' },
        { type: 'card', text: 'Diego: Just shipped v2!' },
      ] },
      { name: 'Post', blocks: [
        { type: 'heading', text: 'New Post' },
        { type: 'image', text: 'Add a photo' },
        { type: 'input', text: "What's on your mind?" },
        { type: 'button', text: 'Share' },
      ] },
      { name: 'Notifications', blocks: [
        { type: 'heading', text: 'Notifications' },
        { type: 'list', text: 'Amara liked your post | Diego commented: nice! | 3 new followers' },
      ] },
      { name: 'Profile', blocks: [
        { type: 'heading', text: 'Your Profile' },
        { type: 'text', text: '128 followers · 94 following' },
        { type: 'button', text: 'Edit Profile' },
      ] },
    ],
  },
  recipe: {
    name: 'Simmer',
    subtitle: 'Cook something good',
    description:
      'Simmer collects your favorite recipes, plans your week of meals, and turns your menu into a ready-made grocery list.',
    category: 'Food & Drink',
    icon: '🍲',
    color: '#b91c1c',
    screens: [
      { name: 'Discover', blocks: [
        { type: 'heading', text: 'Tonight, try…' },
        { type: 'image', text: 'Recipe photo' },
        { type: 'card', text: '20-Minute Garlic Pasta' },
      ] },
      { name: 'Recipe', blocks: [
        { type: 'heading', text: 'Garlic Pasta' },
        { type: 'text', text: 'Serves 2 · 20 min · Easy' },
        { type: 'list', text: 'Pasta | Garlic | Olive oil | Parmesan | Chili flakes' },
        { type: 'button', text: 'Add to Grocery List' },
      ] },
      { name: 'Grocery List', blocks: [
        { type: 'heading', text: 'Grocery List' },
        { type: 'list', text: 'Pasta | Garlic | Parmesan' },
        { type: 'button', text: 'Mark All Bought' },
      ] },
      { name: 'Saved', blocks: [
        { type: 'heading', text: 'Saved Recipes' },
        { type: 'card', text: 'Garlic Pasta' },
        { type: 'card', text: 'Weekend Pancakes' },
      ] },
    ],
  },
};

function templateSummaries() {
  return Object.entries(TEMPLATES).map(([id, t]) => ({ id, name: t.name, icon: t.icon, description: t.description, category: t.category }));
}

// ---- AI generation (with a deterministic fallback when no API key) ----

const CATEGORY_KEYWORDS = [
  [/fitness|workout|gym|run|exercise|health/i, 'Health & Fitness', '🏋️'],
  [/shop|store|ecommerce|e-commerce|market|sell|product/i, 'Business', '🛍️'],
  [/food|recipe|cook|restaurant|meal/i, 'Food & Drink', '🍲'],
  [/travel|trip|flight|itinerary|vacation/i, 'Travel', '✈️'],
  [/game|play|puzzle|arcade/i, 'Games', '🎮'],
  [/social|friend|chat|follow|post|share/i, 'Social Networking', '💬'],
  [/money|finance|budget|invest|expense|bank/i, 'Finance', '💰'],
  [/learn|course|study|school|teach|language/i, 'Education', '📚'],
  [/task|todo|to-do|productiv|note|plan/i, 'Productivity', '✅'],
  [/pet|dog|cat|animal/i, 'Lifestyle', '🐾'],
];

function guessCategoryAndIcon(prompt) {
  for (const [re, category, icon] of CATEGORY_KEYWORDS) {
    if (re.test(prompt)) return { category, icon };
  }
  return { category: 'Utilities', icon: '📱' };
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// A deterministic, no-API-key-required generator. Always succeeds, so the
// "Generate with AI" feature works even without ANTHROPIC_API_KEY set —
// same fallback approach as the Support agent's draftReply in agents.js.
function fallbackGenerate(prompt) {
  const { category, icon } = guessCategoryAndIcon(prompt);
  const words = prompt.trim().split(/\s+/).slice(0, 5).join(' ') || 'My App';
  const name = toTitleCase(words).slice(0, 30);
  return {
    name,
    subtitle: 'Built for exactly this',
    description: `${name} helps with: ${prompt.trim()}. Designed to be simple, fast, and genuinely useful every day.`,
    category,
    icon,
    color: '#4f46e5',
    screens: [
      { name: 'Welcome', blocks: [
        { type: 'heading', text: `Welcome to ${name}` },
        { type: 'text', text: prompt.trim() },
        { type: 'image', text: 'Hero image' },
        { type: 'button', text: 'Get Started' },
      ] },
      { name: 'Home', blocks: [
        { type: 'heading', text: 'What you can do' },
        { type: 'list', text: 'Track your progress | Get smart suggestions | Stay on top of things' },
        { type: 'card', text: 'Your next step is one tap away.' },
      ] },
      { name: 'Explore', blocks: [
        { type: 'heading', text: 'Explore' },
        { type: 'card', text: 'Featured item one' },
        { type: 'card', text: 'Featured item two' },
        { type: 'button', text: 'See More' },
      ] },
      { name: 'Profile', blocks: [
        { type: 'heading', text: 'Your Profile' },
        { type: 'input', text: 'Name' },
        { type: 'input', text: 'Email' },
        { type: 'button', text: 'Save Changes' },
      ] },
    ],
  };
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found');
  return JSON.parse(candidate.slice(start, end + 1));
}

async function generateAppSpec(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackGenerate(prompt);

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
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: `Design a simple mobile app based on this idea: "${prompt}".

Respond with ONLY a single valid JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "name": string (<=30 chars),
  "subtitle": string (<=30 chars, a punchy tagline),
  "description": string (2-3 sentences, >=40 chars),
  "category": one of ${JSON.stringify(CATEGORIES)},
  "icon": string (a single emoji),
  "color": string (a hex color like "#4f46e5"),
  "screens": array of 3-5 objects: { "name": string, "blocks": array of 2-5 objects: { "type": one of ${JSON.stringify(BLOCK_TYPES)}, "text": string } }
}
For "list" blocks, put items separated by " | ". Keep all text realistic and specific to the idea, not generic placeholder text.`,
          },
        ],
      }),
    });
    if (!res.ok) return fallbackGenerate(prompt);
    const json = await res.json();
    const text = json.content?.[0]?.text;
    if (!text) return fallbackGenerate(prompt);
    return extractJson(text);
  } catch {
    return fallbackGenerate(prompt);
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBlockHtml(block, screenIndexById) {
  switch (block.type) {
    case 'heading':
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case 'text':
      return `<p>${escapeHtml(block.text)}</p>`;
    case 'button': {
      const gotoIndex = block.linkTo != null ? screenIndexById.get(block.linkTo) : undefined;
      const attr = gotoIndex !== undefined ? ` data-goto="${gotoIndex}"` : '';
      return `<button class="block-btn"${attr}>${escapeHtml(block.text)}</button>`;
    }
    case 'image':
      return `<div class="block-image">${escapeHtml(block.text || 'Image')}</div>`;
    case 'input':
      return `<input class="block-input" placeholder="${escapeHtml(block.text)}" />`;
    case 'divider':
      return '<hr class="block-divider" />';
    case 'list':
      return `<ul class="block-list">${block.text
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul>`;
    case 'card':
      return `<div class="block-card">${escapeHtml(block.text)}</div>`;
    default:
      return '';
  }
}

// EXPORT NOTE: this generates a real, working single-file PWA — not a
// no-op mock. It's a legitimate starting point (wrap it with Capacitor or
// Cordova to build native iOS/Android binaries), but it is not itself a
// submission to Apple/Google; see the in-app "Going live for real" panel.
function exportAppHtml(app) {
  const screenIndexById = new Map(app.screens.map((s, i) => [s.id, i]));
  const screensNav = app.screens
    .map((s, i) => `<button class="tab" data-i="${i}">${escapeHtml(s.name)}</button>`)
    .join('');
  const screensContent = app.screens
    .map(
      (s, i) =>
        `<section class="screen" data-i="${i}" style="${i === 0 ? '' : 'display:none'}">${s.blocks
          .map((b) => renderBlockHtml(b, screenIndexById))
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
  .block-divider { border: none; border-top: 1px solid #e5e7ec; margin: 16px 0; }
  .block-list { margin: 8px 0; padding-left: 20px; font-size: 14px; line-height: 1.7; }
  .block-card { background: #fff; border: 1px solid #e5e7ec; border-radius: 10px; padding: 12px 14px; margin: 10px 0; font-size: 13.5px; box-shadow: 0 1px 2px rgba(16,24,40,0.06); }
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
function showScreen(i) {
  document.querySelectorAll('.screen').forEach((s) => s.style.display = s.dataset.i === String(i) ? 'block' : 'none');
  document.querySelectorAll('nav.tabbar .tab').forEach((b) => b.classList.toggle('active', b.dataset.i === String(i)));
}
document.querySelectorAll('nav.tabbar .tab').forEach((btn, i) => {
  if (i === 0) btn.classList.add('active');
  btn.addEventListener('click', () => showScreen(Number(btn.dataset.i)));
});
document.querySelectorAll('[data-goto]').forEach((btn) => {
  btn.addEventListener('click', () => showScreen(Number(btn.dataset.goto)));
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
  materializeApp,
  duplicateApp,
  findApp,
  findScreen,
  findBlock,
  sanitizeLinkTo,
  reorderScreens,
  reorderBlocks,
  touch,
  logEntry,
  validateForSubmission,
  submitApp,
  reviewApp,
  tickApps,
  templateSummaries,
  TEMPLATES,
  generateAppSpec,
  exportAppHtml,
};
