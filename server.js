const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bcrypt = require('bcryptjs');
const db = require('./db');
const { generateBriefing } = require('./ceoBrain');
const { AGENTS, runAgents } = require('./agents');
const appStudio = require('./appStudio');

const app = express();
const PORT = process.env.PORT || 4173;

const SECRET_PATH = path.join(__dirname, 'data', 'session-secret.txt');
function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (fs.existsSync(SECRET_PATH)) return fs.readFileSync(SECRET_PATH, 'utf-8').trim();
  const secret = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(SECRET_PATH), { recursive: true });
  fs.writeFileSync(SECRET_PATH, secret, 'utf-8');
  return secret;
}

app.set('trust proxy', 1);
app.use(express.json());
app.use(
  session({
    store: new FileStore({ path: path.join(__dirname, 'data', 'sessions'), logFn: () => {} }),
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not signed in' });
  next();
}

function asyncRoute(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// ---- Auth ----
app.post(
  '/api/auth/signup',
  asyncRoute(async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const businessName = (req.body.businessName || '').trim();
    const ceoName = (req.body.ceoName || '').trim();

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const outcome = await db.update((data) => {
      if (data.users.some((u) => u.email === email)) {
        return { error: 'An account with that email already exists' };
      }

      const claimedId = db.claimUnclaimedBusiness(data);
      let businessId;
      if (claimedId) {
        businessId = claimedId;
        if (businessName) data.businesses[businessId].business.name = businessName;
        if (ceoName) data.businesses[businessId].business.ceoName = ceoName;
      } else {
        businessId = data.nextBusinessId++;
        data.businesses[businessId] = db.emptyBusinessData(businessName, ceoName);
      }

      const user = {
        id: data.nextUserId++,
        email,
        passwordHash: bcrypt.hashSync(password, 10),
        businessId,
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      return { user, businessId };
    });

    if (outcome.error) return res.status(409).json({ error: outcome.error });

    req.session.userId = outcome.user.id;
    req.session.businessId = outcome.businessId;
    res.status(201).json({ email: outcome.user.email, businessId: outcome.businessId });
  })
);

app.post(
  '/api/auth/login',
  asyncRoute(async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const data = await db.read();
    const user = data.users.find((u) => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    req.session.userId = user.id;
    req.session.businessId = user.businessId;
    res.json({ email: user.email, businessId: user.businessId });
  })
);

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.status(204).end());
});

app.get(
  '/api/auth/me',
  asyncRoute(async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not signed in' });
    const data = await db.read();
    const user = data.users.find((u) => u.id === req.session.userId);
    if (!user) return res.status(401).json({ error: 'Not signed in' });
    res.json({ email: user.email, businessId: user.businessId });
  })
);

// All routes below require a signed-in session and are scoped to that business.
app.use('/api', requireAuth);

async function currentBusiness(req) {
  const data = await db.read();
  return data.businesses[req.session.businessId];
}

// Runs a mutator against the caller's own business, inside the serialized
// write queue, and returns whatever the mutator returns.
function updateBusiness(req, mutator) {
  return db.update((data) => mutator(data.businesses[req.session.businessId]));
}

// ---- Agents ----
app.get(
  '/api/agents',
  asyncRoute(async (req, res) => {
    const b = await currentBusiness(req);
    res.json({ agents: AGENTS, log: b.agentLog, aiDrafting: Boolean(process.env.ANTHROPIC_API_KEY) });
  })
);

app.post(
  '/api/agents/run',
  asyncRoute(async (req, res) => {
    const log = await updateBusiness(req, async (b) => {
      await runAgents(b);
      return b.agentLog;
    });
    res.json({ log });
  })
);

// Agents run continuously in the background, independent of any page view.
let agentsTickRunning = false;
async function agentsTick() {
  if (agentsTickRunning) return;
  agentsTickRunning = true;
  try {
    await db.update(async (data) => {
      for (const businessId of Object.keys(data.businesses)) {
        await runAgents(data.businesses[businessId]);
      }
    });
  } catch (err) {
    console.error('Agent tick failed:', err.message);
  } finally {
    agentsTickRunning = false;
  }
}
setInterval(agentsTick, 60_000);
agentsTick();

// App Store review moves forward in the background too, independent of any
// page view, same as the agents above.
let reviewTickRunning = false;
async function reviewTick() {
  if (reviewTickRunning) return;
  reviewTickRunning = true;
  try {
    await db.update((data) => {
      for (const businessId of Object.keys(data.businesses)) {
        appStudio.tickApps(data.businesses[businessId]);
      }
    });
  } catch (err) {
    console.error('Review tick failed:', err.message);
  } finally {
    reviewTickRunning = false;
  }
}
setInterval(reviewTick, 5_000);
reviewTick();

// ---- Briefing ----
app.get(
  '/api/briefing',
  asyncRoute(async (req, res) => {
    res.json(generateBriefing(await currentBusiness(req)));
  })
);

// ---- Business ----
app.get(
  '/api/business',
  asyncRoute(async (req, res) => {
    res.json((await currentBusiness(req)).business);
  })
);

app.patch(
  '/api/business',
  asyncRoute(async (req, res) => {
    const business = await updateBusiness(req, (b) => {
      b.business = { ...b.business, ...req.body };
      return b.business;
    });
    res.json(business);
  })
);

// ---- Departments ----
app.get(
  '/api/departments',
  asyncRoute(async (req, res) => {
    res.json((await currentBusiness(req)).departments);
  })
);

app.post(
  '/api/departments',
  asyncRoute(async (req, res) => {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Department name required' });
    const departments = await updateBusiness(req, (b) => {
      if (!b.departments.includes(name)) b.departments.push(name);
      return b.departments;
    });
    res.status(201).json(departments);
  })
);

app.delete(
  '/api/departments/:name',
  asyncRoute(async (req, res) => {
    const departments = await updateBusiness(req, (b) => {
      b.departments = b.departments.filter((d) => d !== req.params.name);
      return b.departments;
    });
    res.json(departments);
  })
);

// ---- Team ----
app.get(
  '/api/team',
  asyncRoute(async (req, res) => {
    res.json((await currentBusiness(req)).team);
  })
);

app.post(
  '/api/team',
  asyncRoute(async (req, res) => {
    const member = await updateBusiness(req, (b) => {
      const m = {
        id: b.nextIds.team++,
        name: req.body.name,
        role: req.body.role || '',
        department: req.body.department || b.departments[0] || 'Ops',
      };
      b.team.push(m);
      return m;
    });
    res.status(201).json(member);
  })
);

app.delete(
  '/api/team/:id',
  asyncRoute(async (req, res) => {
    await updateBusiness(req, (b) => {
      b.team = b.team.filter((m) => m.id !== Number(req.params.id));
    });
    res.status(204).end();
  })
);

// ---- Metrics ----
app.get(
  '/api/metrics',
  asyncRoute(async (req, res) => {
    res.json((await currentBusiness(req)).metrics);
  })
);

app.patch(
  '/api/metrics',
  asyncRoute(async (req, res) => {
    const metrics = await updateBusiness(req, (b) => {
      b.metrics = { ...b.metrics, ...req.body, updatedAt: new Date().toISOString() };
      return b.metrics;
    });
    res.json(metrics);
  })
);

// ---- Tasks ----
app.get(
  '/api/tasks',
  asyncRoute(async (req, res) => {
    res.json((await currentBusiness(req)).tasks);
  })
);

app.post(
  '/api/tasks',
  asyncRoute(async (req, res) => {
    const task = await updateBusiness(req, (b) => {
      const t = {
        id: b.nextIds.tasks++,
        title: req.body.title,
        department: req.body.department || 'Ops',
        assignee: req.body.assignee || 'Unassigned',
        priority: req.body.priority || 'medium',
        status: 'todo',
        dueDate: req.body.dueDate || null,
        completedAt: null,
        createdAt: new Date().toISOString(),
      };
      b.tasks.push(t);
      return t;
    });
    res.status(201).json(task);
  })
);

app.patch(
  '/api/tasks/:id',
  asyncRoute(async (req, res) => {
    const task = await updateBusiness(req, (b) => {
      const t = b.tasks.find((x) => x.id === Number(req.params.id));
      if (!t) return null;
      Object.assign(t, req.body);
      if (req.body.status === 'done' && !t.completedAt) t.completedAt = new Date().toISOString();
      if (req.body.status && req.body.status !== 'done') t.completedAt = null;
      return t;
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  })
);

app.delete(
  '/api/tasks/:id',
  asyncRoute(async (req, res) => {
    await updateBusiness(req, (b) => {
      b.tasks = b.tasks.filter((t) => t.id !== Number(req.params.id));
    });
    res.status(204).end();
  })
);

// ---- Updates (team/ops log) ----
app.get(
  '/api/updates',
  asyncRoute(async (req, res) => {
    res.json((await currentBusiness(req)).updates);
  })
);

app.post(
  '/api/updates',
  asyncRoute(async (req, res) => {
    const update = await updateBusiness(req, (b) => {
      const u = {
        id: b.nextIds.updates++,
        author: req.body.author || 'Unknown',
        department: req.body.department || 'Ops',
        type: req.body.type || 'update',
        text: req.body.text,
        createdAt: new Date().toISOString(),
      };
      b.updates.push(u);
      return u;
    });
    res.status(201).json(update);
  })
);

// ---- Pulse (customer/marketing) ----
app.get(
  '/api/pulse',
  asyncRoute(async (req, res) => {
    res.json((await currentBusiness(req)).pulse);
  })
);

app.post(
  '/api/pulse',
  asyncRoute(async (req, res) => {
    const entry = await updateBusiness(req, (b) => {
      const p = {
        id: b.nextIds.pulse++,
        source: req.body.source || 'lead',
        sentiment: req.body.sentiment || 'neutral',
        customer: req.body.customer || 'Unknown',
        text: req.body.text,
        createdAt: new Date().toISOString(),
      };
      b.pulse.push(p);
      return p;
    });
    res.status(201).json(entry);
  })
);

// ---- App Studio (build-your-own-app + simulated App Store submission) ----

function appListView(a) {
  return {
    id: a.id,
    name: a.name,
    kind: a.kind || 'app',
    subtitle: a.subtitle,
    icon: a.icon,
    color: a.color,
    category: a.category,
    status: a.status,
    screenCount: a.screens.length,
    downloads: a.stats?.downloads ?? null,
    updatedAt: a.updatedAt,
  };
}

app.get(
  '/api/app-studio/meta',
  (req, res) => {
    res.json({
      categories: appStudio.CATEGORIES,
      websiteCategories: appStudio.WEBSITE_CATEGORIES,
      blockTypes: appStudio.BLOCK_TYPES,
      websiteBlockTypes: appStudio.WEBSITE_BLOCK_TYPES,
      templates: appStudio.templateSummaries(),
      aiGeneration: Boolean(process.env.ANTHROPIC_API_KEY),
    });
  }
);

app.get(
  '/api/apps',
  asyncRoute(async (req, res) => {
    const b = await currentBusiness(req);
    res.json(b.apps.map(appListView));
  })
);

app.post(
  '/api/apps',
  asyncRoute(async (req, res) => {
    const name = (req.body.name || '').trim() || 'My App';
    const kind = req.body.kind === 'website' ? 'website' : 'app';
    const app_ = await updateBusiness(req, (b) => {
      const a = appStudio.emptyApp(b.nextIds.apps++, name, kind);
      b.apps.push(a);
      return a;
    });
    res.status(201).json(app_);
  })
);

app.post(
  '/api/apps/from-template',
  asyncRoute(async (req, res) => {
    const template = appStudio.TEMPLATES[req.body.templateId] || appStudio.WEBSITE_TEMPLATES[req.body.templateId];
    if (!template) return res.status(400).json({ error: 'Unknown template' });
    const app_ = await updateBusiness(req, (b) => {
      const a = appStudio.materializeApp(b, template, `Created from the "${template.name}" template.`);
      b.apps.push(a);
      return a;
    });
    res.status(201).json(app_);
  })
);

app.post(
  '/api/apps/generate',
  asyncRoute(async (req, res) => {
    const prompt = (req.body.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: 'Describe what you want to build.' });
    const kind = req.body.kind === 'website' ? 'website' : 'app';
    const spec = await appStudio.generateAppSpec(prompt.slice(0, 500), kind);
    const app_ = await updateBusiness(req, (b) => {
      const a = appStudio.materializeApp(b, spec, 'Generated by AI.');
      b.apps.push(a);
      return a;
    });
    res.status(201).json(app_);
  })
);

app.post(
  '/api/apps/:id/duplicate',
  asyncRoute(async (req, res) => {
    const app_ = await updateBusiness(req, (b) => {
      const source = appStudio.findApp(b, req.params.id);
      if (!source) return null;
      const copy = appStudio.duplicateApp(b, source);
      b.apps.push(copy);
      return copy;
    });
    if (!app_) return res.status(404).json({ error: 'App not found' });
    res.status(201).json(app_);
  })
);

app.get(
  '/api/apps/:id',
  asyncRoute(async (req, res) => {
    const b = await currentBusiness(req);
    const a = appStudio.findApp(b, req.params.id);
    if (!a) return res.status(404).json({ error: 'App not found' });
    res.json(a);
  })
);

const EDITABLE_APP_FIELDS = [
  'name',
  'subtitle',
  'description',
  'category',
  'icon',
  'color',
  'platform',
  'supportEmail',
  'privacyPolicyUrl',
];

app.patch(
  '/api/apps/:id',
  asyncRoute(async (req, res) => {
    const a = await updateBusiness(req, (b) => {
      const app_ = appStudio.findApp(b, req.params.id);
      if (!app_) return null;
      for (const field of EDITABLE_APP_FIELDS) {
        if (field in req.body) app_[field] = req.body[field];
      }
      // Editing after a rejection puts the app back in draft so it's clear
      // it needs to be resubmitted rather than looking already-handled.
      if (app_.status === 'changes_requested') app_.status = 'draft';
      appStudio.touch(app_);
      return app_;
    });
    if (!a) return res.status(404).json({ error: 'App not found' });
    res.json(a);
  })
);

app.delete(
  '/api/apps/:id',
  asyncRoute(async (req, res) => {
    await updateBusiness(req, (b) => {
      b.apps = b.apps.filter((a) => a.id !== Number(req.params.id));
    });
    res.status(204).end();
  })
);

// ---- Screens ----
app.post(
  '/api/apps/:id/screens',
  asyncRoute(async (req, res) => {
    const result = await updateBusiness(req, (b) => {
      const app_ = appStudio.findApp(b, req.params.id);
      if (!app_) return null;
      const screen = { id: b.nextIds.appScreens++, name: (req.body.name || '').trim() || 'New screen', blocks: [] };
      app_.screens.push(screen);
      if (app_.status === 'changes_requested') app_.status = 'draft';
      appStudio.touch(app_);
      return { app: app_, screen };
    });
    if (!result) return res.status(404).json({ error: 'App not found' });
    res.status(201).json(result.screen);
  })
);

app.patch(
  '/api/apps/:id/screens/:screenId',
  asyncRoute(async (req, res) => {
    const screen = await updateBusiness(req, (b) => {
      const app_ = appStudio.findApp(b, req.params.id);
      const s = app_ && appStudio.findScreen(app_, req.params.screenId);
      if (!s) return null;
      if ('name' in req.body) s.name = req.body.name;
      appStudio.touch(app_);
      return s;
    });
    if (!screen) return res.status(404).json({ error: 'Screen not found' });
    res.json(screen);
  })
);

// Drag-and-drop reordering: the client sends the full new id order after a
// drop, and the server accepts it only if it's an exact permutation of the
// current screens (see appStudio.reorderScreens).
app.post(
  '/api/apps/:id/screens/reorder',
  asyncRoute(async (req, res) => {
    const result = await updateBusiness(req, (b) => {
      const app_ = appStudio.findApp(b, req.params.id);
      if (!app_) return null;
      return appStudio.reorderScreens(app_, req.body.order) ? app_.screens : 'invalid';
    });
    if (!result) return res.status(404).json({ error: 'App not found' });
    if (result === 'invalid') return res.status(400).json({ error: 'Invalid order' });
    res.json(result);
  })
);

app.delete(
  '/api/apps/:id/screens/:screenId',
  asyncRoute(async (req, res) => {
    await updateBusiness(req, (b) => {
      const app_ = appStudio.findApp(b, req.params.id);
      if (!app_) return;
      app_.screens = app_.screens.filter((s) => s.id !== Number(req.params.screenId));
      appStudio.touch(app_);
    });
    res.status(204).end();
  })
);

// ---- Blocks ----
app.post(
  '/api/apps/:id/screens/:screenId/blocks',
  asyncRoute(async (req, res) => {
    const result = await updateBusiness(req, (b) => {
      const app_ = appStudio.findApp(b, req.params.id);
      const s = app_ && appStudio.findScreen(app_, req.params.screenId);
      if (!s) return null;
      const validTypes = app_.kind === 'website' ? appStudio.WEBSITE_BLOCK_TYPES : appStudio.BLOCK_TYPES;
      const type = validTypes.includes(req.body.type) ? req.body.type : (app_.kind === 'website' ? 'section' : 'text');
      const linkTo = appStudio.sanitizeLinkTo(app_, req.body.linkTo) ?? null;
      const block = { id: b.nextIds.appBlocks++, type, text: req.body.text || '', linkTo };
      s.blocks.push(block);
      if (app_.status === 'changes_requested') app_.status = 'draft';
      appStudio.touch(app_);
      return block;
    });
    if (!result) return res.status(404).json({ error: 'Screen not found' });
    res.status(201).json(result);
  })
);

app.patch(
  '/api/apps/:id/screens/:screenId/blocks/:blockId',
  asyncRoute(async (req, res) => {
    const block = await updateBusiness(req, (b) => {
      const app_ = appStudio.findApp(b, req.params.id);
      const s = app_ && appStudio.findScreen(app_, req.params.screenId);
      const blk = s && appStudio.findBlock(s, req.params.blockId);
      if (!blk) return null;
      if ('text' in req.body) blk.text = req.body.text;
      if ('linkTo' in req.body) blk.linkTo = appStudio.sanitizeLinkTo(app_, req.body.linkTo);
      appStudio.touch(app_);
      return blk;
    });
    if (!block) return res.status(404).json({ error: 'Block not found' });
    res.json(block);
  })
);

app.post(
  '/api/apps/:id/screens/:screenId/blocks/reorder',
  asyncRoute(async (req, res) => {
    const result = await updateBusiness(req, (b) => {
      const app_ = appStudio.findApp(b, req.params.id);
      const s = app_ && appStudio.findScreen(app_, req.params.screenId);
      if (!s) return null;
      return appStudio.reorderBlocks(app_, s, req.body.order) ? s.blocks : 'invalid';
    });
    if (!result) return res.status(404).json({ error: 'Screen not found' });
    if (result === 'invalid') return res.status(400).json({ error: 'Invalid order' });
    res.json(result);
  })
);

app.delete(
  '/api/apps/:id/screens/:screenId/blocks/:blockId',
  asyncRoute(async (req, res) => {
    await updateBusiness(req, (b) => {
      const app_ = appStudio.findApp(b, req.params.id);
      const s = app_ && appStudio.findScreen(app_, req.params.screenId);
      if (!s) return;
      s.blocks = s.blocks.filter((x) => x.id !== Number(req.params.blockId));
      appStudio.touch(app_);
    });
    res.status(204).end();
  })
);

// ---- Submission pipeline ----
app.post(
  '/api/apps/:id/submit',
  asyncRoute(async (req, res) => {
    const result = await updateBusiness(req, (b) => {
      const app_ = appStudio.findApp(b, req.params.id);
      if (!app_) return null;
      return appStudio.submitApp(app_);
    });
    if (!result) return res.status(404).json({ error: 'App not found' });
    if (!result.ok) return res.status(422).json({ error: 'Not ready to submit', issues: result.issues });
    res.json(result.app);
  })
);

// Lets a user force-check review status immediately instead of waiting for
// the background tick, same pattern as "Run agents now".
app.post(
  '/api/apps/:id/check-review',
  asyncRoute(async (req, res) => {
    const app_ = await updateBusiness(req, (b) => {
      const a = appStudio.findApp(b, req.params.id);
      if (!a) return null;
      appStudio.reviewApp(a);
      return a;
    });
    if (!app_) return res.status(404).json({ error: 'App not found' });
    res.json(app_);
  })
);

app.get(
  '/api/apps/:id/export',
  asyncRoute(async (req, res) => {
    const b = await currentBusiness(req);
    const a = appStudio.findApp(b, req.params.id);
    if (!a) return res.status(404).json({ error: 'App not found' });
    const html = appStudio.exportAppHtml(a);
    const slug = (a.name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'app';
    res.set('Content-Type', 'text/html');
    res.set('Content-Disposition', `attachment; filename="${slug}.html"`);
    res.send(html);
  })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Static files served last so /api/* auth above still applies to API calls made from any page.
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`CEO dashboard running at http://localhost:${PORT}`);
});
