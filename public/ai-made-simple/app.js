(function () {
"use strict";

/* =========================================================================
   ICONS — small inline SVGs, monochrome, currentColor
   ========================================================================= */
const ICONS = {
  mail: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  document: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 13h6M9 17h6M9 9h2"/></svg>',
  map: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z"/><path d="M9 7v13M15 4v13"/></svg>',
  book: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5c3-1.5 6-1.5 8 0v14c-2-1.5-5-1.5-8 0z"/><path d="M20 5c-3-1.5-6-1.5-8 0v14c2-1.5 5-1.5 8 0z"/></svg>',
  chat: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.5 7.2L4 20l1.1-4.2A8 8 0 1121 12z"/></svg>',
  mic: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v4M8 22h8"/></svg>',
  copy: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>',
  check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  checkCircle: '<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 6-6"/></svg>',
  arrowLeft: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  chevronRight: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 01-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 010-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 014 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 010 4h-.09a1.7 1.7 0 00-1.55 1z"/></svg>',
  logo: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l10 5-10 5L2 10z"/><path d="M6 12v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4"/><path d="M20 10.5V16"/></svg>',
  lightbulb: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7c.6.5 1 1.2 1 2.05V17h6v-.25c0-.85.4-1.55 1-2.05A7 7 0 0012 2z"/></svg>',
  shield: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5z"/></svg>',
  save: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h11l4 4v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M9 3v6h7V3M9 21v-8h7v8"/></svg>',
  speaker: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 8a5 5 0 010 8"/></svg>',
  refresh: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 10-3.2 6.9M21 5v6h-6"/></svg>',
  star: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3-4.8-4.3 6.4-.6z"/></svg>',
  sliders: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h13M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
};
function icon(name) { return ICONS[name] || ""; }

/* =========================================================================
   CLAUDE (the only AI this app teaches)
   ========================================================================= */
const CLAUDE = { name: "Claude", url: "https://claude.ai", color: "#c1633c" };

/* =========================================================================
   PRACTICE EXERCISES — the three hands-on guided walkthroughs
   ========================================================================= */
const PRACTICE_TASKS = [
  { id: "email", label: "Write an email", icon: "mail",
    question: "What is the email about?",
    placeholder: "Example: Asking my landlord to fix the heater" },
  { id: "document", label: "Understand a document", icon: "document",
    question: "What is the document about, or what would you like explained?",
    placeholder: "Example: A letter from my health insurance company" },
  { id: "trip", label: "Plan a trip", icon: "map",
    question: "Where and when are you thinking of traveling?",
    placeholder: "Example: A 5-day trip to Florida in October" },
];
function getPracticeTask(id) { return PRACTICE_TASKS.find((t) => t.id === id); }

/* =========================================================================
   PROMPT GENERATION (rule-based, client-side — no real AI calls in this prototype)
   ========================================================================= */
function generatePrompt(taskId, answer, tone) {
  const a = answer.trim();
  const toneLine = tone === "formal" ? " Please keep the tone formal and professional."
    : tone === "friendly" ? " Please keep the tone warm and friendly, like talking to a friend."
    : tone === "short" ? " Please keep it as short as possible."
    : "";
  const templates = {
    email: `I want your help writing an email. Here's what it's about: "${a}". Please write a clear, polite email in simple, everyday language, with a friendly greeting, a short explanation, and a polite closing. After you write it, ask me if I'd like anything changed.${toneLine}`,
    document: `I'm going to tell you about a document I need help understanding. Please explain it in plain, simple language — no jargon. Here is what it's about: "${a}". Explain what it means, point out anything important I should notice, and tell me if there's anything I should be careful about. Explain it like you would to a friend.${toneLine}`,
    trip: `I'm planning a trip and would love your help. Here are the details: "${a}". Please suggest a simple day-by-day plan, including good things to do, and anything useful to know like weather or what to pack. Keep it easy to follow and not overwhelming. Ask me questions if you need more details.${toneLine}`,
  };
  return templates[taskId];
}

function guideSteps() {
  return [
    { title: "Open Claude in a new browser tab.", simple: "Tap the button below. It opens Claude for you.", kind: "open" },
    { title: "Copy the message below. We wrote it based on what you told us.", simple: 'Tap "Copy Message." This copies the words so you can paste them.', kind: "copy" },
    { title: "Paste the message into Claude and press the arrow (send) button.", simple: "Tap inside the empty box near the bottom of the Claude screen, paste the message, then tap the arrow.", kind: "paste" },
    { title: "Read Claude's response. If you'd like something changed, come back here and tell us what you don't like.", simple: "Read what Claude wrote back to you. Did it help? Choose an option below.", kind: "review" },
  ];
}

/* =========================================================================
   LESSONS — two tracks: beginner basics, and advanced mastery
   ========================================================================= */
const LESSONS = {
  beginner: [
    { id: "what", title: "What Claude can do", body: "Claude is an AI assistant you can chat with by typing (or talking). You can ask it questions, have it write things for you, explain topics, help you plan, or read a document for you. Think of it like a very knowledgeable, very patient assistant who is available any time, day or night.\n\nIt won't always be perfect — it can make mistakes, especially with very recent events or specific facts — but for writing, explaining, planning, and brainstorming, it is remarkably helpful.", practice: "Open Claude and ask it: \"Can you explain what you can help me with, in simple terms?\"" },
    { id: "ask", title: "How to ask a question", body: "There's no special trick to \"talking\" to Claude. Just type your question the way you'd ask a helpful friend. The more detail you give, the better the answer.\n\nFor example, instead of \"help me cook,\" try \"I have chicken, rice, and broccoli — what's a simple dinner I can make tonight?\" Being specific about your situation gets you a much more useful answer.", practice: "Ask Claude: \"What's a simple, healthy dinner I can make with chicken and rice?\"" },
    { id: "upload", title: "How to upload a photo or document", body: "Look for a small plus (+) icon near the box where you type. Tapping it lets you choose a photo or file from your device to share with Claude.\n\nOnce it's uploaded, you can ask questions about it, like \"What does this letter mean?\" or \"What is happening in this photo?\" This is very useful for understanding mail, forms, or pictures.", practice: "Try uploading a photo of a recipe or a letter, and ask Claude to summarize it in one sentence." },
    { id: "improve", title: "How to improve an answer", body: "If the first answer isn't quite right, you don't need to start over — just tell Claude what you'd like different, right in the same conversation. For example: \"Can you make that shorter?\" or \"Can you explain that more simply?\" or \"That's not quite what I meant, I meant...\"\n\nClaude remembers what you've already talked about, so it can adjust its answer based on your feedback.", practice: "Ask Claude a question, then reply with \"Can you make that answer simpler?\" and see how it changes." },
    { id: "safe", title: "What information you should never share", body: "It's best not to type passwords, Social Security numbers, bank account numbers, or private medical details into Claude (or any AI tool). You can still get great help by describing your situation without including the actual sensitive numbers or codes.\n\nFor example, instead of typing your full account number, you could say \"I have a question about a recent charge on my bank statement.\" This keeps you safe while still getting helpful answers.", practice: "Think of one thing you'd never want to type into an AI chat. Write it down as a reminder for yourself." },
  ],
  advanced: [
    { id: "sharper-prompts", title: "Write clearer, more specific prompts", body: "The single biggest thing that changes Claude's output is how specific you are. Instead of \"write a bio,\" try \"write a 3-sentence bio for my LinkedIn, in a warm but professional tone, mentioning I'm a nurse of 12 years who just started painting.\" Give Claude the context a human would need: the audience, the format, the length, the tone, and any constraints.\n\nWhen an answer isn't quite right, the fix usually isn't to write a whole new prompt — it's to add the one piece of context you left out the first time.", practice: "Take a request you'd normally type in one short sentence, and rewrite it with audience, tone, and length specified. Compare the two answers." },
    { id: "projects", title: "Use Projects to keep your work organized", body: "Claude's \"Projects\" feature gives you a dedicated space for an ongoing body of work — say, a job search, a novel, or a home renovation. You can add files and instructions once, and every conversation inside that project automatically has that context, so you stop re-explaining yourself every time.\n\nThis is the difference between treating Claude like a search box and treating it like a collaborator who remembers what you're working on.", practice: "Create a Project for something you're actively working on, add one relevant file or a few sentences of context, then start a new chat inside it and notice it already knows the background." },
    { id: "custom-instructions", title: "Set your preferences once with custom instructions", body: "If you find yourself typing the same preference over and over — \"keep answers short,\" \"avoid corporate jargon,\" \"always give me a bulleted summary first\" — set it once in your settings instead. Claude will apply it to every new conversation without being asked.\n\nThis is especially powerful for tone and format: a lot of \"Claude gave me a bad answer\" moments are actually \"Claude gave me a correct answer in the wrong shape.\"", practice: "Open your settings and add one standing preference — for example, \"Always give me the short version first, then offer to go deeper.\"" },
    { id: "long-docs", title: "Work with long documents and multiple files at once", body: "Claude is unusually good at holding a lot of material in mind at once. You can upload several files in a single conversation — a contract and your notes on it, or three drafts of the same document — and ask Claude to compare, reconcile, or synthesize across all of them, not just summarize one at a time.\n\nFor genuinely long material (a full book manuscript, a long legal document), this beats copy-pasting chunks in piecemeal, because Claude can reference earlier and later sections together.", practice: "Upload two related documents in one conversation and ask Claude to point out where they agree, disagree, or overlap." },
    { id: "iterate", title: "Iterate like a pro — treat the first answer as a draft", body: "Experienced users rarely accept Claude's first answer as final — they treat it as a first draft and give sharp, specific feedback: \"cut this to half the length,\" \"the second paragraph is weaker than the rest, redo it,\" \"argue the opposite side, then tell me which is stronger.\"\n\nYou can also just ask Claude to critique its own work: \"What's the weakest part of that answer, and how would you fix it?\" often surfaces a genuinely better next draft.", practice: "Next time Claude gives you something good but not great, don't start over — give it one specific, pointed piece of feedback and see how it revises." },
    { id: "artifacts", title: "Use Artifacts for documents, code, and visuals", body: "When you ask Claude to write something substantial — a document, a piece of code, a chart, a webpage — it often opens in a separate panel called an Artifact instead of sitting in the chat. You can keep refining it there (\"make the heading bigger,\" \"add a summary row to the table\") without losing the surrounding conversation.\n\nArtifacts are also easy to copy out whole once you're happy with them, which makes Claude much more useful for anything longer than a paragraph.", practice: "Ask Claude to draft something with real structure — a one-page outline or a simple table — and practice refining it inside the Artifact panel rather than starting over." },
  ],
};
const TRACKS = {
  beginner: { title: "Beginner Guides", subtitle: "Short lessons to get comfortable with Claude, at your pace." },
  advanced: { title: "Advanced Mastery", subtitle: "For people who already use Claude and want to get more out of it." },
};

const MORE_HELP_FAQ = [
  { q: "Claude asked me a question back instead of finishing.", a: "That's normal! Claude often asks a follow-up question to understand you better. Just answer its question in the same chat, and it will continue." },
  { q: "The response felt too long or complicated.", a: "You can simply reply with \"Can you make that shorter and simpler?\" in the same conversation. It will happily rewrite it." },
  { q: "I got an error message or nothing happened.", a: "This sometimes happens when the service is busy. Try waiting a minute, then pressing the send (arrow) button again." },
  { q: "I don't see a place to type.", a: "Look near the very bottom of the screen for a long box that says something like \"Reply to Claude.\" That's where you type." },
];

/* =========================================================================
   SAFETY DETECTION
   ========================================================================= */
function safetyWarning(text) {
  const lower = text.toLowerCase();
  const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/;
  const cardPattern = /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/;
  const keywords = ["social security", "ssn", "password", "credit card", "bank account", "routing number", "pin number", "medical diagnosis", "diagnosis"];
  const hasKeyword = keywords.some((k) => lower.includes(k));
  if (ssnPattern.test(text) || cardPattern.test(text) || hasKeyword) {
    return "A friendly reminder: it looks like this might include sensitive information (like a password, ID number, or account number). It's best not to share things like Social Security numbers, passwords, or banking details with Claude. You can describe your situation without including the actual numbers.";
  }
  return null;
}

/* =========================================================================
   STATE
   ========================================================================= */
const STORAGE_KEY = "aims_state_v2";
function defaultState() {
  return {
    onboarded: false,
    onboarding: { comfort: null, instructions: null },
    savedItems: [],
    completedLessons: [],
    accessibility: { textSize: "normal", highContrast: false, voiceNarration: false },
  };
}
let state = loadState();
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateOldState();
    return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) { return defaultState(); }
}
// Carries the onboarded flag + accessibility prefs forward from the old
// multi-tool/task-coach version of this app, so returning users aren't
// dropped back into onboarding just because the app was rebuilt.
function migrateOldState() {
  try {
    const raw = localStorage.getItem("aims_state_v1");
    if (!raw) return defaultState();
    const old = JSON.parse(raw);
    const fresh = defaultState();
    if (old.onboarded) fresh.onboarded = true;
    if (old.onboarding) {
      fresh.onboarding.comfort = old.onboarding.comfort || null;
      fresh.onboarding.instructions = old.onboarding.instructions || null;
    }
    if (old.accessibility) fresh.accessibility = Object.assign(fresh.accessibility, old.accessibility, { voiceNarration: false });
    return fresh;
  } catch (e) { return defaultState(); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

/* =========================================================================
   NAVIGATION
   ========================================================================= */
let nav = { screen: "loading", params: {} };
let navStack = [];
function goTo(screen, params = {}, opts = {}) {
  stopVoiceActivity();
  if (!opts.replace) navStack.push(nav);
  nav = { screen, params };
  render();
  window.scrollTo(0, 0);
}
function goBack(fallback = "home") {
  stopVoiceActivity();
  if (navStack.length) { nav = navStack.pop(); render(); }
  else goTo(fallback, {}, { replace: true });
  window.scrollTo(0, 0);
}
// Stops any in-flight mic listening or read-aloud speech before leaving a
// screen, so a stale recognizer can't write into the next screen's textarea
// and narration doesn't keep playing over a screen that never asked for it.
function stopVoiceActivity() {
  stopListening();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}
function resetToHome() { navStack = []; goTo("home", {}, { replace: true }); }

/* =========================================================================
   TOAST
   ========================================================================= */
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* =========================================================================
   SPEECH: recognition (mic input) + synthesis (read aloud)
   ========================================================================= */
const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;
let listeningTarget = null;
// Bumped on every stop/restart so a result or onend callback from a session
// that's no longer current becomes a no-op — closes the race where a stale
// mic session delivers text into a *different* screen's textarea after
// navigating away (every practice question reuses the same field id).
let micGeneration = 0;
function micSupported() { return !!SpeechRecognitionCtor; }
function toggleMic(targetId) {
  if (!micSupported()) { showToast("Voice typing isn't available in this browser."); return; }
  const btn = document.querySelector(`[data-mic-for="${targetId}"]`);
  if (recognizer && listeningTarget === targetId) {
    stopListening();
    return;
  }
  stopListening();
  const myGeneration = ++micGeneration;
  recognizer = new SpeechRecognitionCtor();
  recognizer.lang = "en-US";
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;
  listeningTarget = targetId;
  if (btn) btn.classList.add("listening");
  recognizer.onresult = (e) => {
    if (myGeneration !== micGeneration) return;
    const text = e.results[0][0].transcript;
    const field = document.getElementById(targetId);
    if (field) {
      field.value = field.value ? field.value + " " + text : text;
      field.dispatchEvent(new Event("input"));
    }
  };
  recognizer.onerror = () => { if (myGeneration === micGeneration) showToast("Sorry, we couldn't hear that. Please try again or type instead."); };
  recognizer.onend = () => { if (myGeneration !== micGeneration) return; if (btn) btn.classList.remove("listening"); listeningTarget = null; };
  recognizer.start();
}
function stopListening() {
  micGeneration++;
  if (recognizer) recognizer.stop();
}
function speakText(text, opts = {}) {
  if (!window.speechSynthesis) {
    if (!opts.silent) showToast("Reading aloud isn't available in this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
function speak(text) { speakText(text); }
// Auto-reads a step/lesson aloud when the "Voice Instructions" setting is on.
// Silently does nothing if unsupported or the setting is off — unlike
// speak(), this isn't a direct user action, so it shouldn't toast.
function maybeAutoSpeak(text) {
  if (!state.accessibility.voiceNarration) return;
  speakText(text, { silent: true });
}

/* =========================================================================
   UTIL
   ========================================================================= */
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function nl2br(s) { return esc(s).replace(/\n/g, "<br>"); }
function fmtDate(iso) { const d = new Date(iso); return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

/* =========================================================================
   TOP BAR
   ========================================================================= */
function topBar(opts = {}) {
  const showBack = navStack.length > 0 && opts.back !== false;
  return `
  <div class="top-bar">
    ${showBack
      ? `<button class="icon-btn" data-action="back" aria-label="Go back">${icon("arrowLeft")}</button>`
      : `<div class="top-bar-spacer"></div>`}
    <div class="brand">${icon("logo")} AI Made Simple</div>
    <button class="icon-btn" data-action="goTo" data-screen="account" aria-label="Account and settings">${icon("gear")}</button>
  </div>`;
}

function progressBar(current, total, label) {
  const pct = Math.round((current / total) * 100);
  return `
  <div class="progress-wrap">
    <div class="progress-label">${esc(label || `Step ${current} of ${total}`)}</div>
    <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
  </div>`;
}

/* =========================================================================
   RENDER: WELCOME
   ========================================================================= */
function renderWelcome() {
  return `
  <div class="hero">
    <div class="sparkle-badge">${icon("logo")}</div>
    <h1>AI Made Simple</h1>
    <p class="promise">Everything you need to learn Claude — from your very first question to getting the most out of it. No jargon, at your own pace.</p>
    <div class="stack-gap" style="margin-top:10px;">
      <button class="btn btn-primary" data-action="startOnboarding">Get Started</button>
      <button class="link-btn" data-action="skipOnboarding">I've used this before — skip ahead</button>
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: ONBOARDING
   ========================================================================= */
const ONBOARDING_QUESTIONS = [
  { key: "comfort", title: "How comfortable are you with Claude or AI tools?",
    options: [
      { value: "never", label: "I've never used it" },
      { value: "few", label: "I've tried it a few times" },
      { value: "sometimes", label: "I use it regularly" },
    ] },
  { key: "instructions", title: "Would you like written instructions, spoken instructions, or both?",
    options: [
      { value: "written", label: "Written instructions" },
      { value: "spoken", label: "Spoken instructions" },
      { value: "both", label: "Both" },
    ] },
];
function renderOnboarding(step) {
  const q = ONBOARDING_QUESTIONS[step - 1];
  const selected = state.onboarding[q.key];
  const total = ONBOARDING_QUESTIONS.length;
  return `
  ${topBar()}
  <div class="screen">
    ${progressBar(step, total, `Question ${step} of ${total}`)}
    <h1 class="page-title">${esc(q.title)}</h1>
    <div class="choice-list">
      ${q.options.map((o) => `
        <button class="choice big ${selected === o.value ? "selected" : ""}" data-action="answerOnboarding" data-step="${step}" data-key="${q.key}" data-value="${o.value}">
          <span class="choice-text">${esc(o.label)}</span>
          <span class="chevron">${icon("chevronRight")}</span>
        </button>`).join("")}
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: HOME
   ========================================================================= */
function renderHome() {
  const comfort = state.onboarding.comfort;
  const recommendBeginner = comfort === "never" || comfort === "few" || !comfort;
  return `
  ${topBar({ back: false })}
  <div class="screen">
    <h1 class="page-title center">What would you like to do?</h1>
    <p class="subtitle center">Pick whichever one sounds right — there's no wrong answer.</p>
    <div class="choice-list" style="margin-top:28px;">
      <button class="choice big" data-action="goTo" data-screen="beginner-hub">
        <span class="choice-icon">${icon("lightbulb")}</span>
        <span class="choice-text">I'm new to Claude
          <div class="choice-sub">Learn the basics, step by step${recommendBeginner ? " — recommended for you" : ""}</div>
        </span>
        <span class="chevron">${icon("chevronRight")}</span>
      </button>
      <button class="choice big" data-action="goTo" data-screen="advanced-hub">
        <span class="choice-icon">${icon("star")}</span>
        <span class="choice-text">I already use Claude
          <div class="choice-sub">Get more out of it${!recommendBeginner ? " — recommended for you" : ""}</div>
        </span>
        <span class="chevron">${icon("chevronRight")}</span>
      </button>
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: BEGINNER HUB
   ========================================================================= */
function renderBeginnerHub() {
  const lessons = LESSONS.beginner;
  return `
  ${topBar()}
  <div class="screen">
    <div class="tool-badge"><span class="tool-dot" style="background:${CLAUDE.color}"></span>${TRACKS.beginner.title}</div>
    <h1 class="page-title">Get comfortable with Claude</h1>
    <p class="subtitle">${TRACKS.beginner.subtitle}</p>

    <h2 class="section-title">Lessons</h2>
    <div class="choice-list">
      ${lessons.map((l) => {
        const done = state.completedLessons.includes(`beginner:${l.id}`);
        return `
        <button class="choice ${done ? "done" : ""}" data-action="openLesson" data-track="beginner" data-lesson="${l.id}">
          <span class="choice-icon">${done ? icon("check") : icon("book")}</span>
          <span class="choice-text">${esc(l.title)}</span>
          <span class="chevron">${icon("chevronRight")}</span>
        </button>`;
      }).join("")}
    </div>

    <h2 class="section-title">Practice with Claude</h2>
    <p class="subtitle" style="margin-bottom:14px;">Real, hands-on walkthroughs — we'll write the message for you.</p>
    <div class="choice-list">
      ${PRACTICE_TASKS.map((t) => `
        <button class="choice" data-action="selectPracticeTask" data-task="${t.id}">
          <span class="choice-icon">${icon(t.icon)}</span>
          <span class="choice-text">${esc(t.label)}</span>
          <span class="chevron">${icon("chevronRight")}</span>
        </button>`).join("")}
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: ADVANCED HUB
   ========================================================================= */
function renderAdvancedHub() {
  const lessons = LESSONS.advanced;
  return `
  ${topBar()}
  <div class="screen">
    <div class="tool-badge"><span class="tool-dot" style="background:${CLAUDE.color}"></span>${TRACKS.advanced.title}</div>
    <h1 class="page-title">Get more out of Claude</h1>
    <p class="subtitle">${TRACKS.advanced.subtitle}</p>
    <div class="choice-list">
      ${lessons.map((l) => {
        const done = state.completedLessons.includes(`advanced:${l.id}`);
        return `
        <button class="choice ${done ? "done" : ""}" data-action="openLesson" data-track="advanced" data-lesson="${l.id}">
          <span class="choice-icon">${done ? icon("check") : icon("sliders")}</span>
          <span class="choice-text">${esc(l.title)}</span>
          <span class="chevron">${icon("chevronRight")}</span>
        </button>`;
      }).join("")}
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: LESSON DETAIL (shared by both tracks)
   ========================================================================= */
function renderLessonDetail(params) {
  const lesson = (LESSONS[params.track] || []).find((l) => l.id === params.lesson);
  const simple = !!params.simple;
  const bodyText = simple ? simplifyText(lesson.body) : lesson.body;
  maybeAutoSpeak(`${lesson.title}. ${bodyText}`);
  return `
  ${topBar()}
  <div class="screen">
    <div class="simplify-row">
      <button class="icon-btn" data-action="readAloud" data-text="${esc(lesson.title + ". " + bodyText)}" aria-label="Read this lesson aloud" title="Read this lesson aloud">${icon("speaker")}</button>
      <button class="simplify-btn ${simple ? "active" : ""}" data-action="toggleLessonSimple" data-track="${params.track}" data-lesson="${params.lesson}" data-simple="${simple}">${icon("lightbulb")} Make This Simpler</button>
    </div>
    <div class="eyebrow">${esc(TRACKS[params.track].title)}</div>
    <h1 class="page-title">${esc(lesson.title)}</h1>
    <div class="lesson-body">${bodyText.split("\n\n").map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="practice-box">
      <div class="eyebrow">Try it yourself</div>
      <p style="margin-bottom:14px;">${esc(lesson.practice)}</p>
      <button class="btn btn-secondary" data-action="openTool" data-url="${esc(CLAUDE.url)}">Open Claude</button>
    </div>
    <div class="footer-actions">
      <button class="btn btn-primary" data-action="completeLesson" data-track="${params.track}" data-lesson="${params.lesson}">Mark as Done</button>
    </div>
  </div>`;
}
function simplifyText(text) {
  const firstSentence = text.split(/\n\n/)[0].split(". ")[0];
  return `${firstSentence}. That's the main idea — take your time with the rest whenever you're ready.`;
}

/* =========================================================================
   RENDER: PRACTICE QUESTION SCREEN
   ========================================================================= */
function renderPracticeQuestion(params) {
  const task = getPracticeTask(params.task);
  const value = params.answer || "";
  const warn = value ? safetyWarning(value) : null;
  return `
  ${topBar()}
  <div class="screen">
    <div class="eyebrow">${esc(task.label)}</div>
    <h1 class="page-title">${esc(task.question)}</h1>
    <div class="answer-row">
      <label class="field-label" for="answer-field" style="position:absolute;left:-9999px;">Your answer</label>
      <textarea id="answer-field" placeholder="${esc(task.placeholder)}" data-action="input" data-bind="answer">${esc(value)}</textarea>
      <button class="mic-btn" data-mic-for="answer-field" data-action="mic" ${micSupported() ? "" : "disabled"} aria-label="Speak your answer" title="${micSupported() ? "Tap to speak your answer" : "Voice typing not supported in this browser"}">${icon("mic")}</button>
    </div>
    <div id="safety-slot">${warn ? safetyBannerHtml(warn) : ""}</div>
    <div class="footer-actions">
      <button class="btn btn-primary" id="continue-btn" data-action="submitPracticeAnswer" data-task="${task.id}" ${value.trim() ? "" : "disabled"}>Continue</button>
    </div>
  </div>`;
}
function safetyBannerHtml(text) {
  return `<div class="safety-banner"><span class="icon">${icon("shield")}</span><span>${esc(text)}</span></div>`;
}

/* =========================================================================
   RENDER: GUIDE (step by step)
   ========================================================================= */
function renderGuide(params) {
  const task = getPracticeTask(params.task);
  const steps = guideSteps();
  const stepIdx = params.step || 1;
  const stepData = steps[stepIdx - 1];
  const simple = !!params.simple;
  const tone = params.tone || null;
  const prompt = generatePrompt(task.id, params.answer, tone);
  const instructionText = simple ? stepData.simple : stepData.title;
  maybeAutoSpeak(instructionText);

  let body = "";
  if (stepData.kind === "open") {
    body = `
      <button class="btn btn-primary" data-action="openTool" data-url="${esc(CLAUDE.url)}">Open Claude</button>
      <button class="btn btn-secondary btn-block" data-action="guideNext" ${guideNav(params)}>I opened it — Next Step</button>`;
  } else if (stepData.kind === "copy") {
    const copyWarn = safetyWarning(params.answer || "");
    body = `
      <div class="prompt-box" id="prompt-text">${nl2br(prompt)}</div>
      ${copyWarn ? safetyBannerHtml(copyWarn) : ""}
      <div class="chip-row" style="margin-top:14px;">
        ${toneChip("friendly", "Friendlier", params)}
        ${toneChip("formal", "More Formal", params)}
        ${toneChip("short", "Shorter", params)}
      </div>
      <button class="btn btn-primary" id="copy-btn" data-action="copyPrompt">${icon("copy")} Copy Message</button>
      <button class="btn btn-secondary btn-block" data-action="guideNext" ${guideNav(params)}>Next Step</button>`;
  } else if (stepData.kind === "paste") {
    body = `
      <div class="card card-tight muted" style="font-size:0.98rem;">Tip: the message box is usually a long empty bar near the bottom of the screen. Tap it, paste your message (press and hold, then choose "Paste"), and tap the arrow button to send it.</div>
      <button class="btn btn-secondary btn-block" data-action="guideNext" ${guideNav(params)}>Next Step</button>`;
  } else if (stepData.kind === "review") {
    body = `
      <div class="footer-actions">
        <button class="btn btn-green" data-action="taskWorked" ${guideNav(params)}>It Worked</button>
        <button class="btn btn-secondary" data-action="needMoreHelp" ${guideNav(params)}>I Need More Help</button>
      </div>`;
  }

  return `
  ${topBar()}
  <div class="screen">
    ${progressBar(stepIdx, steps.length)}
    <div class="simplify-row">
      <button class="icon-btn" data-action="readAloud" data-text="${esc(instructionText)}" aria-label="Read this step aloud" title="Read this step aloud">${icon("speaker")}</button>
      <button class="simplify-btn ${simple ? "active" : ""}" data-action="toggleSimple" ${guideNav(params)}>${icon("lightbulb")} Make This Simpler</button>
    </div>
    <h1 class="page-title">${esc(instructionText)}</h1>
    <div style="margin-top:20px;">${body}</div>
  </div>`;
}
function guideNav(params, overrideTone) {
  const tone = overrideTone !== undefined ? overrideTone : (params.tone || "");
  return `data-task="${params.task}" data-answer="${esc(params.answer)}" data-step="${params.step || 1}" data-simple="${!!params.simple}" data-tone="${tone}"`;
}
function toneChip(value, label, params) {
  const active = params.tone === value;
  return `<button class="chip ${active ? "active" : ""}" data-action="setTone" ${guideNav(params, value)}>${esc(label)}</button>`;
}

/* =========================================================================
   RENDER: SUCCESS
   ========================================================================= */
function renderSuccess(params) {
  const task = getPracticeTask(params.task);
  return `
  ${topBar({ back: false })}
  <div class="screen center">
    <div style="color:var(--green); margin:20px auto;">${icon("checkCircle")}</div>
    <h1 class="page-title">Great job — you did it!</h1>
    <p class="subtitle">You used Claude to ${esc(task.label.toLowerCase())}. That's a real skill you now have.</p>
    <div class="footer-actions">
      <button class="btn btn-primary" data-action="saveTask" data-task="${task.id}" data-answer="${esc(params.answer)}">${icon("save")} Save This Prompt</button>
      <button class="btn btn-secondary" data-action="goTo" data-screen="beginner-hub">Try Another Practice</button>
      <button class="link-btn" data-action="goTo" data-screen="home">Back to Home</button>
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: MORE HELP
   ========================================================================= */
function renderMoreHelp(params) {
  return `
  ${topBar()}
  <div class="screen">
    <h1 class="page-title">Let's figure this out together</h1>
    <p class="subtitle">Here are answers to things that trip people up. You're doing fine.</p>
    <div class="card">
      ${MORE_HELP_FAQ.map((f) => `
        <div class="help-item">
          <div class="help-q">${esc(f.q)}</div>
          <div class="muted">${esc(f.a)}</div>
        </div>`).join("")}
    </div>
    <div class="footer-actions">
      <button class="btn btn-primary" data-action="goTo" data-screen="guide" data-task="${params.task}" data-answer="${esc(params.answer)}" data-step="4">Try Again</button>
      <button class="btn btn-secondary" data-action="goTo" data-screen="home">Back to Home</button>
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: SAVED
   ========================================================================= */
function renderSaved() {
  return `
  ${topBar()}
  <div class="screen">
    <h1 class="page-title">Saved Prompts</h1>
    ${state.savedItems.length === 0
      ? `<div class="card center"><p class="muted">You haven't saved anything yet. After you finish a practice exercise, tap "Save This Prompt."</p></div>`
      : state.savedItems.slice().reverse().map((item) => `
        <div class="card card-tight">
          <div class="eyebrow">${esc(fmtDate(item.date))}</div>
          <h2 class="section-title" style="font-size:1.1rem;">${esc(getPracticeTask(item.task).label)}</h2>
          <div class="prompt-box" style="margin-top:10px;">${nl2br(item.prompt)}</div>
          <button class="btn btn-secondary" data-action="copySaved" data-id="${item.id}">${icon("copy")} Copy Again</button>
        </div>`).join("")}
  </div>`;
}

/* =========================================================================
   RENDER: ACCOUNT / ACCESSIBILITY
   ========================================================================= */
function renderAccount() {
  const a = state.accessibility;
  const sizes = [["normal", "Normal"], ["large", "Large"], ["xlarge", "Extra Large"]];
  return `
  ${topBar()}
  <div class="screen">
    <h1 class="page-title">Account &amp; Settings</h1>

    <h2 class="section-title" style="margin-top:20px;">Accessibility</h2>
    <div class="card">
      <div class="setting-row stack">
        <div><div class="setting-title">Text Size</div><div class="setting-sub">Make words bigger or smaller</div></div>
        <div class="segmented">
          ${sizes.map(([val, label]) => `<button class="${a.textSize === val ? "active" : ""}" data-action="setTextSize" data-size="${val}">${label}</button>`).join("")}
        </div>
      </div>
      <div class="setting-row">
        <div><div class="setting-title">High Contrast</div><div class="setting-sub">Bolder colors, easier to see</div></div>
        <label class="switch"><input type="checkbox" data-action="toggleContrast" aria-label="High Contrast" ${a.highContrast ? "checked" : ""}><span class="track"><span class="thumb"></span></span></label>
      </div>
      <div class="setting-row">
        <div><div class="setting-title">Voice Instructions</div><div class="setting-sub">Have steps and lessons read aloud to you</div></div>
        <label class="switch"><input type="checkbox" data-action="toggleVoice" aria-label="Voice Instructions" ${a.voiceNarration ? "checked" : ""}><span class="track"><span class="thumb"></span></span></label>
      </div>
    </div>

    <h2 class="section-title">More</h2>
    <div class="card">
      <button class="choice" data-action="goTo" data-screen="saved" style="box-shadow:none;">
        <span class="choice-icon">${icon("save")}</span><span class="choice-text">Saved Prompts</span><span class="chevron">${icon("chevronRight")}</span>
      </button>
      <button class="choice" data-action="goTo" data-screen="onboarding-1" style="box-shadow:none; margin-top:10px;">
        <span class="choice-icon">${icon("gear")}</span><span class="choice-text">Redo Setup Questions</span><span class="chevron">${icon("chevronRight")}</span>
      </button>
    </div>

    <button class="link-btn" data-action="resetDemo">${icon("refresh")} Reset Demo Data</button>
  </div>`;
}

/* =========================================================================
   MAIN RENDER DISPATCH
   ========================================================================= */
function render() {
  const app = document.getElementById("app");
  let html = "";
  if (nav.screen.startsWith("onboarding-")) {
    html = renderOnboarding(Number(nav.screen.split("-")[1]));
  } else switch (nav.screen) {
    case "welcome": html = renderWelcome(); break;
    case "home": html = renderHome(); break;
    case "beginner-hub": html = renderBeginnerHub(); break;
    case "advanced-hub": html = renderAdvancedHub(); break;
    case "lesson-detail": html = renderLessonDetail(nav.params); break;
    case "practice-question": html = renderPracticeQuestion(nav.params); break;
    case "guide": html = renderGuide(nav.params); break;
    case "success": html = renderSuccess(nav.params); break;
    case "more-help": html = renderMoreHelp(nav.params); break;
    case "saved": html = renderSaved(); break;
    case "account": html = renderAccount(); break;
    default: html = renderHome();
  }
  app.innerHTML = html;
  applyAccessibility();
}

function applyAccessibility() {
  document.documentElement.setAttribute("data-textsize", state.accessibility.textSize);
  document.body.classList.toggle("high-contrast", !!state.accessibility.highContrast);
}

/* =========================================================================
   ACTIONS
   ========================================================================= */
const actions = {
  back() { goBack(); },
  goTo(ds) {
    const screen = ds.screen;
    const params = {};
    if (ds.task) params.task = ds.task;
    if (ds.answer) params.answer = ds.answer;
    if (ds.step) params.step = Number(ds.step);
    goTo(screen, params);
  },
  startOnboarding() { goTo("onboarding-1"); },
  skipOnboarding() { state.onboarded = true; saveState(); resetToHome(); },
  answerOnboarding(ds) {
    state.onboarding[ds.key] = ds.value;
    saveState();
    const step = Number(ds.step);
    if (step < ONBOARDING_QUESTIONS.length) {
      goTo(`onboarding-${step + 1}`);
    } else {
      state.onboarded = true;
      saveState();
      resetToHome();
      showToast("All set! Let's find something to help you with.");
    }
  },
  selectPracticeTask(ds) { goTo("practice-question", { task: ds.task, answer: "" }); },
  mic(ds) {
    toggleMic(ds.micFor);
  },
  input(ds, ev, el) {
    const field = el;
    nav.params.answer = field.value;
    const btn = document.getElementById("continue-btn");
    if (btn) btn.disabled = !field.value.trim();
    const slot = document.getElementById("safety-slot");
    if (slot) {
      const warn = field.value ? safetyWarning(field.value) : null;
      slot.innerHTML = warn ? safetyBannerHtml(warn) : "";
    }
  },
  submitPracticeAnswer(ds) {
    const answer = (nav.params.answer || "").trim();
    if (!answer) return;
    goTo("guide", { task: ds.task, answer, step: 1, simple: false, tone: null });
  },
  toggleSimple(ds) {
    goTo("guide", { task: ds.task, answer: ds.answer, step: Number(ds.step), simple: ds.simple !== "true", tone: ds.tone || null }, { replace: true });
  },
  setTone(ds) {
    goTo("guide", { task: ds.task, answer: ds.answer, step: Number(ds.step), simple: ds.simple === "true", tone: ds.tone }, { replace: true });
  },
  copyPrompt() {
    const text = document.getElementById("prompt-text").innerText;
    const btn = document.getElementById("copy-btn");
    copyText(text).then((ok) => {
      if (ok) {
        if (btn) { btn.innerHTML = `${icon("check")} Copied!`; }
        showToast("Message copied — now go paste it!");
      } else {
        showToast("We couldn't copy that automatically — please select the message above and copy it by hand.");
      }
    });
  },
  guideNext(ds) {
    const nextStep = Number(ds.step) + 1;
    goTo("guide", { task: ds.task, answer: ds.answer, step: nextStep, simple: ds.simple === "true", tone: ds.tone || null });
  },
  taskWorked(ds) {
    goTo("success", { task: ds.task, answer: ds.answer });
  },
  needMoreHelp(ds) { goTo("more-help", { task: ds.task, answer: ds.answer }); },
  saveTask(ds) {
    state.savedItems.push({ id: Date.now(), task: ds.task, answer: ds.answer, prompt: generatePrompt(ds.task, ds.answer, null), date: new Date().toISOString() });
    saveState();
    showToast("Saved!");
  },
  copySaved(ds) {
    const item = state.savedItems.find((i) => String(i.id) === ds.id);
    if (item) {
      copyText(item.prompt).then((ok) => {
        showToast(ok ? "Copied!" : "We couldn't copy that automatically — please select and copy it by hand.");
      });
    }
  },
  openTool(ds) { window.open(ds.url, "_blank", "noopener"); },
  openLesson(ds) { goTo("lesson-detail", { track: ds.track, lesson: ds.lesson, simple: false }); },
  toggleLessonSimple(ds) { goTo("lesson-detail", { track: ds.track, lesson: ds.lesson, simple: ds.simple !== "true" }, { replace: true }); },
  readAloud(ds) { speak(ds.text); },
  completeLesson(ds) {
    const key = `${ds.track}:${ds.lesson}`;
    if (!state.completedLessons.includes(key)) state.completedLessons.push(key);
    saveState();
    showToast("Nice work — lesson complete!");
    goTo(ds.track === "advanced" ? "advanced-hub" : "beginner-hub", {}, { replace: true });
  },
  setTextSize(ds) { state.accessibility.textSize = ds.size; saveState(); applyAccessibility(); render(); },
  toggleContrast() { state.accessibility.highContrast = !state.accessibility.highContrast; saveState(); applyAccessibility(); render(); },
  toggleVoice() {
    state.accessibility.voiceNarration = !state.accessibility.voiceNarration;
    saveState();
    render();
  },
  resetDemo() {
    if (!confirm("This clears all saved demo data (your saved prompts and progress). Continue?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("aims_state_v1");
    state = defaultState();
    navStack = [];
    goTo("welcome", {}, { replace: true });
  },
};

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.focus(); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

/* =========================================================================
   EVENT DELEGATION
   ========================================================================= */
document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  const actionName = el.getAttribute("data-action");
  const fn = actions[actionName];
  if (!fn) return;
  ev.preventDefault();
  fn(el.dataset, ev, el);
});
document.addEventListener("input", (ev) => {
  const el = ev.target.closest("[data-action='input']");
  if (!el) return;
  actions.input(el.dataset, ev, el);
});
/* =========================================================================
   INIT
   ========================================================================= */
function init() {
  applyAccessibility();
  if (state.onboarded) goTo("home", {}, { replace: true });
  else goTo("welcome", {}, { replace: true });
  registerServiceWorker();
}
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // Relative path so this still resolves correctly if the app is ever
  // served from a sub-path other than /ai-made-simple/.
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
document.addEventListener("DOMContentLoaded", init);
})();
