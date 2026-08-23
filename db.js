const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

const emptyDb = () => ({ users: [], businesses: {}, nextUserId: 1, nextBusinessId: 1 });

function emptyBusinessData(name, ceoName) {
  return {
    business: { name: name || 'My Business', ceoName: ceoName || 'CEO', lastBriefingAt: null },
    departments: ['Sales', 'Finance', 'Marketing', 'Ops', 'Product'],
    team: [],
    metrics: {
      cashOnHand: 0,
      cashLastWeek: 0,
      weeklyRevenue: 0,
      revenueTarget: 0,
      overdueInvoicesTotal: 0,
      overdueInvoicesCount: 0,
      updatedAt: new Date().toISOString(),
    },
    tasks: [],
    updates: [],
    pulse: [],
    agentLog: [],
    nextIds: { tasks: 1, updates: 1, pulse: 1, team: 1, agentLog: 1 },
  };
}

// Backfills fields added after a business record was first created, so older
// records don't crash on missing agentLog/nextIds.agentLog.
function normalize(b) {
  if (!b.agentLog) b.agentLog = [];
  if (!b.nextIds.agentLog) b.nextIds.agentLog = 1;
  return b;
}

function migrate(raw) {
  // Legacy single-tenant shape had a top-level "business" object directly.
  if (raw.business && !raw.businesses) {
    const legacyData = {
      business: raw.business,
      departments: raw.departments || ['Sales', 'Finance', 'Marketing', 'Ops', 'Product'],
      team: raw.team || [],
      metrics: raw.metrics,
      tasks: raw.tasks || [],
      updates: raw.updates || [],
      pulse: raw.pulse || [],
      nextIds: raw.nextIds || { tasks: 1, updates: 1, pulse: 1, team: 1 },
    };
    return { users: [], businesses: { 1: legacyData }, nextUserId: 1, nextBusinessId: 2 };
  }
  return raw;
}

function normalizeAll(data) {
  Object.values(data.businesses).forEach(normalize);
  return data;
}

// ---- Storage backend ----
// Uses Postgres (a single JSON-blob row) when DATABASE_URL is set, e.g. when
// deployed with a real Render/Railway Postgres instance attached — so data
// survives redeploys. Falls back to a local JSON file for local development.
let backend;
let pgPool = null;

if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });
  pgPool = pool;
  const ready = pool.query('CREATE TABLE IF NOT EXISTS store (id INTEGER PRIMARY KEY, data JSONB NOT NULL)');

  backend = {
    async read() {
      await ready;
      const { rows } = await pool.query('SELECT data FROM store WHERE id = 1');
      if (rows.length === 0) {
        const fresh = emptyDb();
        await pool.query('INSERT INTO store (id, data) VALUES (1, $1)', [JSON.stringify(fresh)]);
        return fresh;
      }
      return normalizeAll(migrate(rows[0].data));
    },
    async write(data) {
      await ready;
      await pool.query('UPDATE store SET data = $1 WHERE id = 1', [JSON.stringify(data)]);
    },
  };
} else {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyDb(), null, 2), 'utf-8');
  }
  backend = {
    async read() {
      const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      return normalizeAll(migrate(raw));
    },
    async write(data) {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    },
  };
}

async function read() {
  return backend.read();
}

async function write(data) {
  return backend.write(data);
}

// Serializes every read-modify-write so a slow mutator (e.g. one that awaits a
// network call) can't be interleaved with, and silently overwritten by,
// another request's write. All mutations should go through this instead of
// calling read()/write() directly.
let queue = Promise.resolve();
function update(mutator) {
  const run = queue.then(async () => {
    const data = await read();
    const result = await mutator(data);
    await write(data);
    return result;
  });
  queue = run.then(
    () => {},
    () => {}
  );
  return run;
}

// Returns an unclaimed seeded business (the original demo data) if one exists,
// so the first person to sign up inherits it instead of starting empty.
function claimUnclaimedBusiness(data) {
  const claimedIds = new Set(data.users.map((u) => u.businessId));
  const unclaimedId = Object.keys(data.businesses).find((id) => !claimedIds.has(Number(id)));
  return unclaimedId ? Number(unclaimedId) : null;
}

module.exports = { read, write, update, emptyBusinessData, claimUnclaimedBusiness, pool: pgPool };
