const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { generateBriefing } = require('./ceoBrain');
const { AGENTS, runAgents } = require('./agents');

const app = express();
const PORT = process.env.PORT || 4173;

// On Vercel the filesystem is read-only (no data/ dir to persist to), so the
// session secret and session store must not touch disk there.
const IS_SERVERLESS = Boolean(process.env.VERCEL);

const SECRET_PATH = path.join(__dirname, 'data', 'session-secret.txt');
function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (IS_SERVERLESS) {
    console.warn('SESSION_SECRET is not set — using a per-instance secret, so sessions will not survive cold starts. Set SESSION_SECRET in your Vercel project env vars.');
    return crypto.randomBytes(32).toString('hex');
  }
  if (fs.existsSync(SECRET_PATH)) return fs.readFileSync(SECRET_PATH, 'utf-8').trim();
  const secret = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.dirname(SECRET_PATH), { recursive: true });
  fs.writeFileSync(SECRET_PATH, secret, 'utf-8');
  return secret;
}

// Postgres-backed sessions when DATABASE_URL is set (required on Vercel, since
// there's no persistent disk for a file store); a local file store otherwise.
function createSessionStore() {
  if (db.pool) {
    const PgSession = require('connect-pg-simple')(session);
    return new PgSession({ pool: db.pool, createTableIfMissing: true });
  }
  const FileStore = require('session-file-store')(session);
  return new FileStore({ path: path.join(__dirname, 'data', 'sessions'), logFn: () => {} });
}

app.set('trust proxy', 1);
app.use(express.json());
app.use(
  session({
    store: createSessionStore(),
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

// Agents normally run continuously in the background, independent of any page
// view. There's no long-running process on Vercel to host that loop, so this
// same tick is instead exposed below as a cron-triggered endpoint. Registered
// ahead of the requireAuth gate below, since Vercel Cron calls it directly
// rather than as a logged-in user — it's protected by CRON_SECRET instead,
// which Vercel's cron scheduler sends back as the Authorization header.
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

if (IS_SERVERLESS) {
  app.get('/api/cron/agents-tick', asyncRoute(async (req, res) => {
    if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await agentsTick();
    res.status(204).end();
  }));
} else {
  setInterval(agentsTick, 60_000);
  agentsTick();
}

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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Static files served last so /api/* auth above still applies to API calls made from any page.
app.use(express.static(path.join(__dirname, 'public')));

if (!IS_SERVERLESS) {
  app.listen(PORT, () => {
    console.log(`CEO dashboard running at http://localhost:${PORT}`);
  });
}

module.exports = app;
