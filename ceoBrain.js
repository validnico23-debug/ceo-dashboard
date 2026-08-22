const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

function hoursAgo(iso, now) {
  return (now.getTime() - new Date(iso).getTime()) / 36e5;
}

function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function timeOfDayGreeting(now) {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function generateBriefing(db, now = new Date()) {
  const { tasks, updates, pulse, metrics, business } = db;

  const completedRecent = tasks
    .filter((t) => t.status === 'done' && t.completedAt && hoursAgo(t.completedAt, now) <= 30)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  const openTasks = tasks.filter((t) => t.status !== 'done');
  const overdue = openTasks.filter((t) => t.dueDate && t.dueDate < now.toISOString().slice(0, 10));
  const dueToday = openTasks.filter((t) => t.dueDate === now.toISOString().slice(0, 10));

  const todayPlan = [...openTasks]
    .sort((a, b) => {
      const overdueA = a.dueDate && a.dueDate < now.toISOString().slice(0, 10) ? 0 : 1;
      const overdueB = b.dueDate && b.dueDate < now.toISOString().slice(0, 10) ? 0 : 1;
      if (overdueA !== overdueB) return overdueA - overdueB;
      const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pr !== 0) return pr;
      return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
    })
    .slice(0, 8);

  const recentBlockers = updates
    .filter((u) => u.type === 'blocker' && hoursAgo(u.createdAt, now) <= 48)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const recentComplaints = pulse
    .filter((p) => p.sentiment === 'negative' && hoursAgo(p.createdAt, now) <= 72)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const watchlist = [];
  if (metrics.overdueInvoicesCount > 0) {
    watchlist.push({
      type: 'cash',
      text: `${metrics.overdueInvoicesCount} invoice${metrics.overdueInvoicesCount > 1 ? 's' : ''} overdue, totaling ${money(metrics.overdueInvoicesTotal)}.`,
    });
  }
  if (metrics.weeklyRevenue < metrics.revenueTarget) {
    const pct = Math.round((metrics.weeklyRevenue / metrics.revenueTarget) * 100);
    watchlist.push({
      type: 'revenue',
      text: `Weekly revenue is at ${pct}% of target (${money(metrics.weeklyRevenue)} of ${money(metrics.revenueTarget)}).`,
    });
  }
  recentBlockers.forEach((b) =>
    watchlist.push({ type: 'blocker', text: `${b.department} blocker from ${b.author}: ${b.text}` })
  );
  recentComplaints.forEach((c) =>
    watchlist.push({ type: 'complaint', text: `${c.customer}: ${c.text}` })
  );
  if (overdue.length > 0) {
    watchlist.push({
      type: 'overdue-task',
      text: `${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} past due.`,
    });
  }

  const cashDelta = metrics.cashOnHand - metrics.cashLastWeek;
  const cashTrend = cashDelta === 0 ? 'flat' : cashDelta > 0 ? 'up' : 'down';

  const summaryParts = [];
  summaryParts.push(
    completedRecent.length > 0
      ? `The team closed out ${completedRecent.length} item${completedRecent.length > 1 ? 's' : ''} since the last check-in.`
      : `Nothing has been marked done since the last check-in yet.`
  );
  summaryParts.push(
    `Cash on hand is ${money(metrics.cashOnHand)}, ${cashTrend === 'flat' ? 'unchanged' : cashTrend === 'up' ? `up ${money(Math.abs(cashDelta))}` : `down ${money(Math.abs(cashDelta))}`} from last week.`
  );
  if (watchlist.length > 0) {
    summaryParts.push(`There ${watchlist.length === 1 ? 'is' : 'are'} ${watchlist.length} item${watchlist.length > 1 ? 's' : ''} worth your attention today.`);
  } else {
    summaryParts.push(`No open blockers or overdue items right now.`);
  }

  return {
    ceoName: business.ceoName,
    businessName: business.name,
    generatedAt: now.toISOString(),
    greeting: `${timeOfDayGreeting(now)}. Here's where things stand.`,
    summary: summaryParts.join(' '),
    completedRecent,
    todayPlan,
    dueTodayCount: dueToday.length,
    overdueCount: overdue.length,
    watchlist,
    metrics: {
      ...metrics,
      cashDelta,
      cashTrend,
      revenuePct: metrics.revenueTarget > 0 ? Math.round((metrics.weeklyRevenue / metrics.revenueTarget) * 100) : 0,
    },
  };
}

module.exports = { generateBriefing };
