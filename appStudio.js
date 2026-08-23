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

const WEBSITE_CATEGORIES = [
  'Business',
  'Portfolio',
  'Blog',
  'E-commerce',
  'Agency',
  'Nonprofit',
  'Restaurant',
  'Personal',
];

const BLOCK_TYPES = ['heading', 'text', 'button', 'image', 'input', 'divider', 'list', 'card'];
const WEBSITE_BLOCK_TYPES = ['hero', 'nav', 'section', 'columns', 'cta', 'image', 'text', 'divider', 'footer'];

const REVIEW_MS = 90 * 1000; // simulated review duration
const DOWNLOAD_MILESTONES = [100, 500, 1000, 5000, 10000, 50000, 100000];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function emptyApp(id, name, kind = 'app') {
  const now = new Date().toISOString();
  const isWebsite = kind === 'website';
  return {
    id,
    kind,
    name: name || (isWebsite ? 'My Website' : 'My App'),
    subtitle: '',
    description: '',
    category: '',
    icon: isWebsite ? '🌐' : '📱',
    color: '#2563eb',
    platform: 'both',
    supportEmail: '',
    privacyPolicyUrl: '',
    screens: [],
    status: 'draft', // draft | in_review | changes_requested | published
    submittedAt: null,
    publishedAt: null,
    stats: null,
    messages: [],
    log: [{ id: 1, text: isWebsite ? 'Website created.' : 'App created.', createdAt: now }],
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
  const kind = spec.kind === 'website' ? 'website' : 'app';
  const isWebsite = kind === 'website';
  const validTypes = isWebsite ? WEBSITE_BLOCK_TYPES : BLOCK_TYPES;
  const validCategories = isWebsite ? WEBSITE_CATEGORIES : CATEGORIES;
  const category = validCategories.includes(spec.category) ? spec.category : '';
  const defaultIcon = isWebsite ? '🌐' : '📱';
  const icon = String(spec.icon || defaultIcon).trim().slice(0, 4) || defaultIcon;
  const color = /^#[0-9a-f]{6}$/i.test(spec.color || '') ? spec.color : '#2563eb';
  const pageName = isWebsite ? 'Page' : 'Screen';

  const screens = (Array.isArray(spec.screens) ? spec.screens : []).slice(0, 8).map((s) => ({
    id: b.nextIds.appScreens++,
    name: String(s.name || pageName).trim().slice(0, 40) || pageName,
    blocks: (Array.isArray(s.blocks) ? s.blocks : []).slice(0, 12).map((blk) => ({
      id: b.nextIds.appBlocks++,
      type: validTypes.includes(blk.type) ? blk.type : (isWebsite ? 'section' : 'text'),
      text: String(blk.text || '').slice(0, 400),
      linkTo: null,
    })),
  }));

  return {
    id,
    kind,
    name: String(spec.name || (isWebsite ? 'My Website' : 'My App')).trim().slice(0, 30) || (isWebsite ? 'My Website' : 'My App'),
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
    messages: [],
    log: [{ id: 1, text: sourceLabel || (isWebsite ? 'Website created.' : 'App created.'), createdAt: now }],
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
    kind: source.kind || 'app',
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

// Checks submission requirements. Returns human-readable issue strings; empty = ready to submit.
function validateForSubmission(app) {
  const isWebsite = app.kind === 'website';
  const issues = [];
  const noun = isWebsite ? 'Website' : 'App';
  if (!app.name || app.name.trim().length === 0) issues.push(`${noun} name is required.`);
  if (app.name && app.name.length > 30) issues.push(`${noun} name must be 30 characters or fewer.`);
  if (!app.description || app.description.trim().length < 40)
    issues.push('Description must be at least 40 characters.');
  if (!app.category) issues.push('Pick a category.');
  if (!isWebsite) {
    if (!app.subtitle || app.subtitle.trim().length === 0) issues.push('Subtitle is required.');
    if (app.subtitle && app.subtitle.length > 30) issues.push('Subtitle must be 30 characters or fewer.');
    if (!app.icon || app.icon.trim().length === 0) issues.push('App icon is required.');
    if (!app.supportEmail || !app.supportEmail.includes('@')) issues.push('A valid support email is required.');
    if (!app.privacyPolicyUrl || !/^https?:\/\//i.test(app.privacyPolicyUrl))
      issues.push('A privacy policy URL (starting with http:// or https://) is required.');
  }
  const pageLabel = isWebsite ? 'pages' : 'screens';
  if (app.screens.length < 2) issues.push(`Add at least 2 ${pageLabel}.`);
  const empty = app.screens.filter((s) => s.blocks.length === 0);
  if (empty.length > 0) issues.push(`${isWebsite ? 'Page(s)' : 'Screen(s)'} with no content: ${empty.map((s) => s.name).join(', ')}.`);
  return issues;
}

function submitApp(app) {
  const issues = validateForSubmission(app);
  if (issues.length > 0) return { ok: false, issues };
  app.status = 'in_review';
  app.submittedAt = new Date().toISOString();
  app.publishedAt = null;
  const msg = app.kind === 'website'
    ? 'Publishing website…'
    : 'Submitted to App Store Connect. Waiting for review.';
  logEntry(app, msg);
  touch(app);
  return { ok: true, app };
}

function publishApp(app, now) {
  app.status = 'published';
  app.publishedAt = now.toISOString();
  if (app.kind === 'website') {
    app.stats = { downloads: randInt(20, 300), rating: null, ratingCount: null };
    logEntry(app, 'Your website is live.');
  } else {
    app.stats = { downloads: randInt(50, 400), rating: +(3.8 + Math.random() * 1.1).toFixed(1), ratingCount: randInt(5, 40) };
    logEntry(app, 'Approved. Your app is live on the App Store.');
  }
}

// Advances one item through review. Websites publish after 5 s; apps after REVIEW_MS.
// Apps with thin content (fewer than 4 blocks total) get a changes-requested rejection.
function reviewApp(app, now = new Date()) {
  if (app.status !== 'in_review' || !app.submittedAt) return false;
  const ms = app.kind === 'website' ? 5000 : REVIEW_MS;
  const elapsed = now - new Date(app.submittedAt);
  if (elapsed < ms) return false;

  if (app.kind !== 'website' && totalBlockCount(app) < 4) {
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

// Grows live stats on every tick, dropping milestone log entries.
function growPublishedApp(app) {
  if (app.status !== 'published' || !app.stats) return;
  const before = app.stats.downloads;
  app.stats.downloads += app.kind === 'website' ? randInt(30, 200) : randInt(5, 60);
  if (app.kind !== 'website' && app.stats.rating != null) {
    app.stats.ratingCount += randInt(0, 3);
    const drift = (Math.random() - 0.5) * 0.1;
    app.stats.rating = Math.min(5, Math.max(3.5, +(app.stats.rating + drift).toFixed(2)));
  }
  const statLabel = app.kind === 'website' ? 'visits' : 'downloads';
  const crossed = DOWNLOAD_MILESTONES.find((m) => before < m && app.stats.downloads >= m);
  if (crossed) logEntry(app, `Passed ${crossed.toLocaleString('en-US')} ${statLabel}.`);
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
    color: '#2563eb',
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
    color: '#0d9488',
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

const WEBSITE_TEMPLATES = {
  landing: {
    kind: 'website',
    name: 'LaunchPad',
    subtitle: 'Ship faster, grow smarter',
    description: 'A clean SaaS landing page with a hero, features section, pricing, and a clear call-to-action.',
    category: 'Business',
    icon: '🚀',
    color: '#2563eb',
    screens: [
      { name: 'Home', blocks: [
        { type: 'nav', text: 'LaunchPad | Features | Pricing | Sign up' },
        { type: 'hero', text: 'Ship faster. Grow smarter.' },
        { type: 'section', text: 'Everything you need to launch your product in days, not months.' },
        { type: 'columns', text: 'Fast setup | Works anywhere | No code needed' },
        { type: 'cta', text: 'Start free trial' },
      ] },
      { name: 'Features', blocks: [
        { type: 'section', text: 'Built for speed and scale.' },
        { type: 'columns', text: 'Real-time analytics | Team collaboration | One-click deploy' },
        { type: 'cta', text: 'See all features' },
      ] },
      { name: 'Pricing', blocks: [
        { type: 'section', text: 'Simple, transparent pricing.' },
        { type: 'columns', text: 'Free — $0/mo | Pro — $29/mo | Team — $99/mo' },
        { type: 'cta', text: 'Get started free' },
        { type: 'footer', text: '© 2025 LaunchPad. All rights reserved.' },
      ] },
    ],
  },
  portfolio: {
    kind: 'website',
    name: 'Showcase',
    subtitle: 'Work that speaks for itself',
    description: 'A clean portfolio site to show off your projects, skills, and experience to potential clients.',
    category: 'Portfolio',
    icon: '🎨',
    color: '#0d9488',
    screens: [
      { name: 'Home', blocks: [
        { type: 'nav', text: 'Showcase | Work | About | Contact' },
        { type: 'hero', text: "Hi — I design things that work." },
        { type: 'section', text: "I'm a product designer based in New York." },
        { type: 'columns', text: 'UX Design | Brand Identity | Motion' },
      ] },
      { name: 'Work', blocks: [
        { type: 'section', text: 'Selected projects' },
        { type: 'columns', text: 'Mobile app redesign | Brand identity | E-commerce site' },
        { type: 'image', text: 'Featured project screenshot' },
      ] },
      { name: 'Contact', blocks: [
        { type: 'section', text: "Let's work together." },
        { type: 'text', text: 'hello@yourname.com' },
        { type: 'cta', text: 'Send a message' },
        { type: 'footer', text: '© 2025 Showcase' },
      ] },
    ],
  },
  blog: {
    kind: 'website',
    name: 'Wordsmith',
    subtitle: 'Ideas worth reading',
    description: 'A minimal blog for sharing articles, essays, and updates with a growing readership.',
    category: 'Blog',
    icon: '✍️',
    color: '#7c3aed',
    screens: [
      { name: 'Home', blocks: [
        { type: 'nav', text: 'Wordsmith | Articles | About' },
        { type: 'hero', text: 'Ideas worth reading.' },
        { type: 'columns', text: 'How I built this | On focus | The case for slow' },
        { type: 'cta', text: 'Read latest' },
      ] },
      { name: 'Article', blocks: [
        { type: 'section', text: 'How I built this in a weekend' },
        { type: 'text', text: 'It started with a simple question: why is this so hard?' },
        { type: 'divider', text: '' },
        { type: 'text', text: "And here's what I learned along the way." },
      ] },
      { name: 'About', blocks: [
        { type: 'section', text: 'About me' },
        { type: 'text', text: 'I write about design, technology, and building things.' },
        { type: 'cta', text: 'Subscribe' },
        { type: 'footer', text: '© 2025 Wordsmith' },
      ] },
    ],
  },
  ecommerce: {
    kind: 'website',
    name: 'Storefront',
    subtitle: 'Your brand, your store',
    description: 'A clean online storefront for selling products directly to customers with a simple checkout flow.',
    category: 'E-commerce',
    icon: '🛍️',
    color: '#16a34a',
    screens: [
      { name: 'Home', blocks: [
        { type: 'nav', text: 'Storefront | Shop | About | Cart' },
        { type: 'hero', text: 'New arrivals just dropped.' },
        { type: 'columns', text: 'Tee — $29 | Hoodie — $59 | Hat — $24' },
        { type: 'cta', text: 'Shop now' },
      ] },
      { name: 'Product', blocks: [
        { type: 'image', text: 'Product photo' },
        { type: 'section', text: 'Classic Tee — $29' },
        { type: 'text', text: 'Made from 100% organic cotton. Pre-washed, relaxed fit.' },
        { type: 'cta', text: 'Add to cart' },
      ] },
      { name: 'Cart', blocks: [
        { type: 'section', text: 'Your cart' },
        { type: 'text', text: 'Classic Tee × 1 — $29' },
        { type: 'divider', text: '' },
        { type: 'cta', text: 'Checkout — $29' },
        { type: 'footer', text: '© 2025 Storefront. Free returns.' },
      ] },
    ],
  },
};

function templateSummaries() {
  const appTemplates = Object.entries(TEMPLATES).map(([id, t]) => ({ id, kind: 'app', name: t.name, icon: t.icon, description: t.description, category: t.category }));
  const webTemplates = Object.entries(WEBSITE_TEMPLATES).map(([id, t]) => ({ id, kind: 'website', name: t.name, icon: t.icon, description: t.description, category: t.category }));
  return [...appTemplates, ...webTemplates];
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
    color: '#2563eb',
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

function fallbackGenerateWebsite(prompt) {
  const words = prompt.trim().split(/\s+/).slice(0, 5).join(' ') || 'My Site';
  const name = toTitleCase(words).slice(0, 30);
  return {
    kind: 'website',
    name,
    subtitle: 'Built for the web',
    description: `${name}: ${prompt.trim()}. A clean, fast website built to share your ideas with the world.`,
    category: 'Business',
    icon: '🌐',
    color: '#2563eb',
    screens: [
      { name: 'Home', blocks: [
        { type: 'nav', text: `${name} | About | Contact` },
        { type: 'hero', text: prompt.trim() },
        { type: 'columns', text: 'Feature one | Feature two | Feature three' },
        { type: 'cta', text: 'Get started' },
      ] },
      { name: 'About', blocks: [
        { type: 'section', text: `About ${name}` },
        { type: 'text', text: `We built ${name} because ${prompt.trim().toLowerCase()}.` },
      ] },
      { name: 'Contact', blocks: [
        { type: 'section', text: 'Get in touch' },
        { type: 'text', text: 'hello@example.com' },
        { type: 'cta', text: 'Send a message' },
        { type: 'footer', text: `© 2025 ${name}` },
      ] },
    ],
  };
}

async function generateAppSpec(prompt, kind = 'app') {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return kind === 'website' ? fallbackGenerateWebsite(prompt) : fallbackGenerate(prompt);

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
            content: kind === 'website'
              ? `Design a simple website based on this idea: "${prompt}".

Respond with ONLY a single valid JSON object matching exactly this shape:
{
  "kind": "website",
  "name": string (<=30 chars, the site/brand name),
  "subtitle": string (<=30 chars, a punchy tagline),
  "description": string (2-3 sentences, >=40 chars),
  "category": one of ${JSON.stringify(WEBSITE_CATEGORIES)},
  "icon": string (a single emoji),
  "color": string (a hex color like "#2563eb"),
  "screens": array of 3-5 page objects: { "name": string, "blocks": array of 2-6 objects: { "type": one of ${JSON.stringify(WEBSITE_BLOCK_TYPES)}, "text": string } }
}
Block types: hero=big headline, nav=navigation bar (pipe-separated links), section=section heading + body, columns=feature cards (pipe-separated items), cta=call-to-action button, image=image placeholder, text=body paragraph, divider=horizontal rule, footer=footer text.
Keep all text realistic and specific to the idea, not generic placeholder text.`
              : `Design a simple mobile app based on this idea: "${prompt}".

Respond with ONLY a single valid JSON object (no markdown fences, no commentary) matching exactly this shape:
{
  "name": string (<=30 chars),
  "subtitle": string (<=30 chars, a punchy tagline),
  "description": string (2-3 sentences, >=40 chars),
  "category": one of ${JSON.stringify(CATEGORIES)},
  "icon": string (a single emoji),
  "color": string (a hex color like "#2563eb"),
  "screens": array of 3-5 objects: { "name": string, "blocks": array of 2-5 objects: { "type": one of ${JSON.stringify(BLOCK_TYPES)}, "text": string } }
}
For "list" blocks, put items separated by " | ". Keep all text realistic and specific to the idea, not generic placeholder text.`,
          },
        ],
      }),
    });
    const fallback = kind === 'website' ? fallbackGenerateWebsite(prompt) : fallbackGenerate(prompt);
    if (!res.ok) return fallback;
    const json = await res.json();
    const text = json.content?.[0]?.text;
    if (!text) return fallback;
    return extractJson(text);
  } catch {
    return kind === 'website' ? fallbackGenerateWebsite(prompt) : fallbackGenerate(prompt);
  }
}

// Applies an AI-returned spec patch to an existing app in-place.
function applySpec(b, app, spec) {
  if (!spec || typeof spec !== 'object') return;
  const isWebsite = app.kind === 'website';
  const validTypes = isWebsite ? WEBSITE_BLOCK_TYPES : BLOCK_TYPES;
  const validCats = isWebsite ? WEBSITE_CATEGORIES : CATEGORIES;
  const defIcon = isWebsite ? '🌐' : '📱';
  const pName = isWebsite ? 'Page' : 'Screen';

  if (spec.name) app.name = String(spec.name).trim().slice(0, 30) || app.name;
  if (spec.subtitle != null) app.subtitle = String(spec.subtitle).trim().slice(0, 30);
  if (spec.description != null) app.description = String(spec.description).trim().slice(0, 2000);
  if (spec.category && validCats.includes(spec.category)) app.category = spec.category;
  if (spec.icon) app.icon = String(spec.icon).trim().slice(0, 4) || app.icon;
  if (spec.color && /^#[0-9a-f]{6}$/i.test(spec.color)) app.color = spec.color;
  if (Array.isArray(spec.screens)) {
    app.screens = spec.screens.slice(0, 8).map((s) => ({
      id: b.nextIds.appScreens++,
      name: String(s.name || pName).trim().slice(0, 40) || pName,
      blocks: (Array.isArray(s.blocks) ? s.blocks : []).slice(0, 12).map((blk) => ({
        id: b.nextIds.appBlocks++,
        type: validTypes.includes(blk.type) ? blk.type : (isWebsite ? 'section' : 'text'),
        text: String(blk.text || '').slice(0, 400),
        linkTo: null,
      })),
    }));
  }
}

// Takes a user chat message and updates an existing app via AI (or a fallback).
// Returns { reply, spec } where spec (if present) should be applied via applySpec.
async function chatEditApp(app, message) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const isWebsite = app.kind === 'website';
  const validTypes = isWebsite ? WEBSITE_BLOCK_TYPES : BLOCK_TYPES;
  const validCats = isWebsite ? WEBSITE_CATEGORIES : CATEGORIES;

  if (!apiKey) {
    return { reply: `Got it! Noted your request. Connect an ANTHROPIC_API_KEY to enable AI-powered edits.` };
  }

  const currentState = JSON.stringify({
    name: app.name, subtitle: app.subtitle, description: app.description,
    category: app.category, icon: app.icon, color: app.color,
    screens: (app.screens || []).map((s) => ({
      name: s.name,
      blocks: s.blocks.map((bl) => ({ type: bl.type, text: bl.text })),
    })),
  });

  const prompt = `You are editing an existing ${app.kind}. Current state:\n${currentState}\n\nUser says: "${message.slice(0, 600)}"\n\nRespond ONLY with valid JSON (no markdown fences):\n{\n  "reply": "1-2 sentence casual confirmation of what you changed",\n  "spec": { complete updated ${app.kind} state — same shape as the current state, keeping everything that wasn't changed. Valid block types: ${JSON.stringify(validTypes)}. Valid categories: ${JSON.stringify(validCats)}. }\n}`;

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
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error('AI request failed');
    const json = await res.json();
    const text = json.content?.[0]?.text;
    if (!text) throw new Error('No content');
    const parsed = extractJson(text);
    if (!parsed || typeof parsed !== 'object') throw new Error('Bad JSON');
    return { reply: String(parsed.reply || 'Done!'), spec: parsed.spec || null };
  } catch {
    return { reply: `Got it! I've noted "${message.slice(0, 60)}…" — try again if the update didn't go through.` };
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
  WEBSITE_CATEGORIES,
  BLOCK_TYPES,
  WEBSITE_BLOCK_TYPES,
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
  WEBSITE_TEMPLATES,
  generateAppSpec,
  exportAppHtml,
  applySpec,
  chatEditApp,
};
