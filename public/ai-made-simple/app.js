(function () {
"use strict";

/* =========================================================================
   ICONS — small inline SVGs, monochrome, currentColor
   ========================================================================= */
const ICONS = {
  mail: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  document: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/><path d="M9 13h6M9 17h6M9 9h2"/></svg>',
  map: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z"/><path d="M9 7v13M15 4v13"/></svg>',
  id: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M6 17c0-2 1.5-3 3-3s3 1 3 3M14 9h4M14 13h4"/></svg>',
  image: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-8 8"/></svg>',
  briefcase: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18"/></svg>',
  book: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5c3-1.5 6-1.5 8 0v14c-2-1.5-5-1.5-8 0z"/><path d="M20 5c-3-1.5-6-1.5-8 0v14c2-1.5 5-1.5 8 0z"/></svg>',
  share: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4"/></svg>',
  chat: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.5 7.2L4 20l1.1-4.2A8 8 0 1121 12z"/></svg>',
  mic: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v4M8 22h8"/></svg>',
  copy: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>',
  check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  checkCircle: '<svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 6-6"/></svg>',
  arrowLeft: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  chevronRight: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 01-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 010-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 014 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 010 4h-.09a1.7 1.7 0 00-1.55 1z"/></svg>',
  sparkle: '<svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 6.9L22 12l-7.6 3.1L12 22l-2.4-6.9L2 12l7.6-3.1z"/></svg>',
  lightbulb: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7c.6.5 1 1.2 1 2.05V17h6v-.25c0-.85.4-1.55 1-2.05A7 7 0 0012 2z"/></svg>',
  shield: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3v6c0 5-3.4 8.4-8 11-4.6-2.6-8-6-8-11V5z"/></svg>',
  lock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
  save: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h11l4 4v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M9 3v6h7V3M9 21v-8h7v8"/></svg>',
  speaker: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 8a5 5 0 010 8"/></svg>',
  family: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21v-1a6 6 0 016-6h0a6 6 0 016 6v1M15.5 14.2A5 5 0 0122 19v1"/></svg>',
  refresh: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 10-3.2 6.9M21 5v6h-6"/></svg>',
};
function icon(name) { return ICONS[name] || ""; }

/* =========================================================================
   AI TOOLS
   ========================================================================= */
const AI_TOOLS = {
  chatgpt: { id: "chatgpt", name: "ChatGPT", url: "https://chat.openai.com", color: "#0f9d8a", maker: "OpenAI" },
  claude: { id: "claude", name: "Claude", url: "https://claude.ai", color: "#c1633c", maker: "Anthropic" },
  gemini: { id: "gemini", name: "Gemini", url: "https://gemini.google.com", color: "#3f6fd1", maker: "Google" },
  copilot: { id: "copilot", name: "Microsoft Copilot", url: "https://copilot.microsoft.com", color: "#2f6fb0", maker: "Microsoft" },
};

/* =========================================================================
   TASKS
   ========================================================================= */
const TASKS = [
  { id: "email", label: "Write an email", icon: "mail",
    question: "What is the email about?",
    placeholder: "Example: Asking my landlord to fix the heater",
    tool: "claude",
    reason: "Claude is especially good at writing that sounds natural and warm, like a real person wrote it." },
  { id: "document", label: "Understand a document", icon: "document",
    question: "What is the document about, or what would you like explained?",
    placeholder: "Example: A letter from my health insurance company",
    tool: "chatgpt",
    reason: "ChatGPT is great at reading documents and explaining them in plain, everyday language." },
  { id: "trip", label: "Plan a trip", icon: "map",
    question: "Where and when are you thinking of traveling?",
    placeholder: "Example: A 5-day trip to Florida in October",
    tool: "chatgpt",
    reason: "ChatGPT is very good at organizing a clear, day-by-day plan you can actually follow." },
  { id: "resume", label: "Create a résumé", icon: "id",
    question: "What job or type of work is this résumé for?",
    placeholder: "Example: A part-time job at a local library",
    tool: "claude",
    reason: "Claude writes clear, confident résumé language and organizes it neatly." },
  { id: "image", label: "Make an AI image", icon: "image",
    question: "What picture would you like AI to create?",
    placeholder: "Example: A watercolor painting of a lighthouse at sunset",
    tool: "chatgpt",
    reason: "ChatGPT can create images right inside the chat, so it's simple to get started." },
  { id: "work", label: "Get help with work", icon: "briefcase",
    question: "What are you working on?",
    placeholder: "Example: Summarizing notes from a meeting",
    tool: "chatgpt",
    reason: "ChatGPT is a strong all-around helper for everyday work tasks." },
  { id: "learn", label: "Learn something new", icon: "book",
    question: "What would you like to learn about?",
    placeholder: "Example: How the stock market works",
    tool: "claude",
    reason: "Claude is patient and explains things step by step, like a good teacher." },
  { id: "social", label: "Create a social media post", icon: "share",
    question: "What is the post about?",
    placeholder: "Example: Sharing photos from my granddaughter's birthday",
    tool: "chatgpt",
    reason: "ChatGPT is quick at writing short, friendly posts with a few options to choose from." },
  { id: "other", label: "Ask the coach something else", icon: "chat",
    question: "What would you like help with?",
    placeholder: "Type anything you'd like help with",
    tool: "chatgpt",
    reason: "ChatGPT is a reliable general-purpose helper for almost anything you ask." },
];
function getTask(id) { return TASKS.find((t) => t.id === id); }

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
    resume: `I want help creating a résumé. Here's what it's for: "${a}". Please help me write clear, confident résumé content, organized into simple sections. Ask me questions about my work history if you need more information.${toneLine}`,
    image: `Please create an image based on this description: "${a}". Make it look polished and visually appealing. If you need more detail to make it better, please ask me first.${toneLine}`,
    work: `I need help with something for work. Here's what I'm working on: "${a}". Please help me in a clear, step-by-step way, using simple language and explaining anything I might not understand.${toneLine}`,
    learn: `I would like to learn about this topic: "${a}". Please explain it to me like I'm a complete beginner, using simple words and everyday examples. Keep it short at first, and offer to go deeper if I want to know more.${toneLine}`,
    social: `I want to create a social media post. Here's what it's about: "${a}". Please write a short, warm, friendly post, and give me two or three options to choose from.${toneLine}`,
    other: `Here is what I would like help with: "${a}". Please help me in a clear, simple, step-by-step way, and explain anything I might not understand.${toneLine}`,
  };
  return templates[taskId] || templates.other;
}

function guideSteps(task, tool) {
  const t = AI_TOOLS[tool];
  return [
    {
      title: `Open ${t.name} in a new browser tab.`,
      simple: `Tap the button below. It opens ${t.name} for you.`,
      kind: "open",
    },
    {
      title: `Copy the message below. We wrote it based on what you told us.`,
      simple: `Tap "Copy Message." This copies the words so you can paste them.`,
      kind: "copy",
    },
    {
      title: `Paste the message into ${t.name} and press the arrow (send) button.`,
      simple: `Tap inside the empty box near the bottom of the ${t.name} screen, paste the message, then tap the arrow.`,
      kind: "paste",
    },
    {
      title: `Read ${t.name}'s response. If you'd like something changed, come back here and tell us what you don't like.`,
      simple: `Read what ${t.name} wrote back to you. Did it help? Choose an option below.`,
      kind: "review",
    },
  ];
}

/* =========================================================================
   LESSONS
   ========================================================================= */
const LESSONS = {
  chatgpt: [
    { id: "what", title: "What ChatGPT can do", body: "ChatGPT is a computer program you can chat with by typing (or talking). You can ask it questions, have it write things for you, explain topics, help you plan, or even make pictures. Think of it like a very knowledgeable, very patient assistant who is available any time, day or night.\n\nIt won't always be perfect — it can make mistakes, especially with very recent events or specific facts — but for writing, explaining, planning, and brainstorming, it is remarkably helpful.", practice: "Open ChatGPT and ask it: \"Can you explain what you can help me with, in simple terms?\"" },
    { id: "ask", title: "How to ask a question", body: "There's no special trick to \"talking\" to ChatGPT. Just type your question the way you'd ask a helpful friend. The more detail you give, the better the answer.\n\nFor example, instead of \"help me cook,\" try \"I have chicken, rice, and broccoli — what's a simple dinner I can make tonight?\" Being specific about your situation gets you a much more useful answer.", practice: "Ask ChatGPT: \"What's a simple, healthy dinner I can make with chicken and rice?\"" },
    { id: "upload", title: "How to upload a photo or document", body: "Look for a small plus (+) or paperclip icon near the box where you type. Tapping it lets you choose a photo or file from your device to share with ChatGPT.\n\nOnce it's uploaded, you can ask questions about it, like \"What does this letter mean?\" or \"What is happening in this photo?\" This is very useful for understanding mail, forms, or pictures.", practice: "Try uploading a photo of a recipe or a letter, and ask ChatGPT to summarize it in one sentence." },
    { id: "improve", title: "How to improve an answer", body: "If the first answer isn't quite right, you don't need to start over — just tell ChatGPT what you'd like different, right in the same conversation. For example: \"Can you make that shorter?\" or \"Can you explain that more simply?\" or \"That's not quite what I meant, I meant...\"\n\nChatGPT remembers what you've already talked about, so it can adjust its answer based on your feedback.", practice: "Ask ChatGPT a question, then reply with \"Can you make that answer simpler?\" and see how it changes." },
    { id: "safe", title: "What information you should never share", body: "It's best not to type passwords, Social Security numbers, bank account numbers, or private medical details into ChatGPT (or any AI tool). You can still get great help by describing your situation without including the actual sensitive numbers or codes.\n\nFor example, instead of typing your full account number, you could say \"I have a question about a recent charge on my bank statement.\" This keeps you safe while still getting helpful answers.", practice: "Think of one thing you'd never want to type into an AI chat. Write it down as a reminder for yourself." },
  ],
  claude: [
    { id: "what", title: "What Claude can do", body: "Claude is an AI assistant, similar to ChatGPT, made by a company called Anthropic. Claude is especially known for thoughtful, natural-sounding writing and for being careful and clear in its explanations.\n\nYou can ask Claude to write letters and emails, summarize long documents, brainstorm ideas, or simply have a conversation about something you're curious about.", practice: "Open Claude and ask: \"What kinds of things are you especially good at helping with?\"" },
    { id: "write", title: "How to write and improve documents", body: "Claude has a helpful feature: when it writes something long (like a letter or an essay), it often shows it in a separate panel that you can edit together. You can ask for changes like \"make it shorter\" or \"make paragraph two friendlier,\" and Claude updates just that part.\n\nThis makes it easy to fine-tune writing without retyping the whole thing.", practice: "Ask Claude to write a two-sentence thank-you note, then ask it to \"make it warmer.\"" },
    { id: "upload", title: "How to upload files", body: "Look for a small plus (+) icon near the message box. It lets you attach a photo, PDF, or document. Once uploaded, you can ask Claude questions about it, like \"Can you summarize this?\" or \"What are the key dates in this document?\"\n\nThis is especially useful for long letters, contracts, or forms you don't want to read line by line.", practice: "Upload a document (or describe one) and ask Claude to summarize it in three sentences." },
    { id: "projects", title: "How to create projects", body: "Claude lets you create \"Projects\" — a dedicated space to keep related conversations and files together. For example, you could make a project called \"Family Recipes\" and keep all your recipe conversations and uploaded photos in one tidy place.\n\nThis is a nice way to stay organized if you use Claude for more than one ongoing topic.", practice: "If you see a \"Projects\" option, try creating one called \"Just Practicing\" to explore." },
    { id: "differ", title: "How Claude differs from ChatGPT", body: "Claude and ChatGPT can both help with most everyday tasks. Claude tends to shine at natural, careful writing and working with long documents. ChatGPT tends to shine at quick answers, image creation, and very broad general knowledge.\n\nThere's no wrong choice — for most tasks either one will work well. Over time you may develop a favorite, and that's perfectly fine.", practice: "Ask the same simple question to both Claude and ChatGPT, and compare how each one answers." },
  ],
  gemini: [
    { id: "what", title: "What Gemini can do", body: "Gemini is Google's AI assistant. Like ChatGPT and Claude, you can chat with it, ask questions, get writing help, and more. Because it's made by Google, it often connects smoothly with Google products you may already use, like Gmail, Google Docs, and Google Search.", practice: "Open Gemini and ask: \"What can you help me do?\"" },
    { id: "google", title: "How to use it with Google products", body: "If you use Gmail, Google Docs, or Google Photos, Gemini can often work directly inside those apps. For example, in Gmail you may see a \"Help me write\" option, and in Docs a similar writing helper.\n\nThis means you don't always need to leave the app you're already using — the AI help comes to you.", practice: "Next time you're writing an email in Gmail, look for a small AI or \"Help me write\" icon." },
    { id: "ask", title: "How to ask questions", body: "Just like the other AI tools, you can type a question in plain language. Gemini is especially handy for questions where up-to-date information matters, since it's connected to Google's search knowledge.\n\nTry asking about things like current weather, general facts, or \"what's a good way to...\" questions.", practice: "Ask Gemini: \"What's a simple way to keep my garden watered while I'm on vacation?\"" },
    { id: "photos", title: "How to work with photos and documents", body: "Gemini can look at a photo or document you share and answer questions about it — for example, identifying a plant in a photo, or summarizing a letter. Look for an image or attachment icon near the typing box.", practice: "Try uploading a photo of something in your home and ask Gemini what it is or how to care for it." },
  ],
  copilot: [
    { id: "what", title: "What Copilot can do", body: "Microsoft Copilot is an AI assistant built into Windows, Microsoft Edge, and Microsoft Office apps like Word and Outlook. If you already use those programs, Copilot can help you write emails, summarize documents, and answer questions right where you're working.", practice: "Open Copilot and ask: \"How can you help me with Microsoft Word or Outlook?\"" },
  ],
};

const NOT_SURE_OPTIONS = [
  { key: "write", label: "I mostly want help writing things", tool: "claude" },
  { key: "google", label: "I want quick answers, and I use Gmail or Google a lot", tool: "gemini" },
  { key: "general", label: "I want one all-purpose helper for anything", tool: "chatgpt" },
  { key: "office", label: "I use Microsoft Word, Outlook, or Windows a lot", tool: "copilot" },
];

const MORE_HELP_FAQ = [
  { q: "The AI asked me a question back instead of finishing.", a: "That's normal! AI tools often ask a follow-up question to understand you better. Just answer its question in the same chat, and it will continue." },
  { q: "The response felt too long or complicated.", a: "You can simply reply with \"Can you make that shorter and simpler?\" in the same conversation. It will happily rewrite it." },
  { q: "I got an error message or nothing happened.", a: "This sometimes happens when a service is busy. Try waiting a minute, then pressing the send (arrow) button again." },
  { q: "I don't see a place to type.", a: "Look near the very bottom of the screen for a long box that says something like \"Message ChatGPT\" or \"Reply to Claude.\" That's where you type." },
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
    return "A friendly reminder: it looks like this might include sensitive information (like a password, ID number, or account number). It's best not to share things like Social Security numbers, passwords, or banking details with AI tools. You can describe your situation without including the actual numbers.";
  }
  return null;
}

/* =========================================================================
   STATE
   ========================================================================= */
const STORAGE_KEY = "aims_state_v1";
function monthKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}`; }
function defaultState() {
  return {
    onboarded: false,
    onboarding: { comfort: null, goal: null, instructions: null },
    plan: "free",
    tasksCompletedThisMonth: 0,
    monthKey: monthKey(),
    savedItems: [],
    completedLessons: [],
    accessibility: { textSize: "normal", highContrast: false, voiceNarration: false },
  };
}
let state = loadState();
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = Object.assign(defaultState(), JSON.parse(raw));
    if (parsed.monthKey !== monthKey()) { parsed.monthKey = monthKey(); parsed.tasksCompletedThisMonth = 0; }
    return parsed;
  } catch (e) { return defaultState(); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function refreshMonthIfNeeded() {
  const key = monthKey();
  if (state.monthKey !== key) {
    state.monthKey = key;
    state.tasksCompletedThisMonth = 0;
    saveState();
  }
}

/* =========================================================================
   NAVIGATION
   ========================================================================= */
let nav = { screen: "loading", params: {} };
let navStack = [];
function goTo(screen, params = {}, opts = {}) {
  if (!opts.replace) navStack.push(nav);
  nav = { screen, params };
  render();
  window.scrollTo(0, 0);
}
function goBack(fallback = "home") {
  if (navStack.length) { nav = navStack.pop(); render(); }
  else goTo(fallback, {}, { replace: true });
  window.scrollTo(0, 0);
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
function micSupported() { return !!SpeechRecognitionCtor; }
function toggleMic(targetId) {
  if (!micSupported()) { showToast("Voice typing isn't available in this browser."); return; }
  const btn = document.querySelector(`[data-mic-for="${targetId}"]`);
  if (recognizer && listeningTarget === targetId) {
    recognizer.stop();
    return;
  }
  if (recognizer) recognizer.stop();
  recognizer = new SpeechRecognitionCtor();
  recognizer.lang = "en-US";
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;
  listeningTarget = targetId;
  if (btn) btn.classList.add("listening");
  recognizer.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const field = document.getElementById(targetId);
    if (field) {
      field.value = field.value ? field.value + " " + text : text;
      field.dispatchEvent(new Event("input"));
    }
  };
  recognizer.onerror = () => showToast("Sorry, we couldn't hear that. Please try again or type instead.");
  recognizer.onend = () => { if (btn) btn.classList.remove("listening"); listeningTarget = null; };
  recognizer.start();
}
function speak(text) {
  if (!window.speechSynthesis) { showToast("Reading aloud isn't available in this browser."); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
// Auto-reads a step/lesson aloud when the "Voice Instructions" setting is on.
// Silently does nothing if unsupported or the setting/plan doesn't allow it —
// unlike speak(), this is not a direct user action, so it shouldn't toast.
function maybeAutoSpeak(text) {
  if (state.plan !== "premium" || !state.accessibility.voiceNarration) return;
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
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
    <div class="brand">${icon("sparkle")} AI Made Simple</div>
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
    <div class="sparkle-badge">${icon("sparkle")}</div>
    <h1>AI Made Simple</h1>
    <p class="promise">You don't need to understand AI. Tell us what you want to do, and we'll walk you through it — one simple step at a time.</p>
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
  { key: "comfort", title: "How comfortable are you with AI?",
    options: [
      { value: "never", label: "I've never used it" },
      { value: "few", label: "I've tried it a few times" },
      { value: "sometimes", label: "I use it sometimes" },
    ] },
  { key: "goal", title: "What would you most like AI to help you with?",
    options: [
      { value: "everyday", label: "Everyday tasks" },
      { value: "work", label: "Work" },
      { value: "writing", label: "Writing" },
      { value: "learning", label: "Learning" },
      { value: "technology", label: "Technology" },
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
  return `
  ${topBar()}
  <div class="screen">
    ${progressBar(step, 3, `Question ${step} of 3`)}
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
  return `
  ${topBar({ back: false })}
  <div class="screen">
    <h1 class="page-title center">What would you like help with today?</h1>
    <p class="subtitle center">Pick whichever one sounds right — there's no wrong answer.</p>
    <div class="choice-list" style="margin-top:28px;">
      <button class="choice big" data-action="goTo" data-screen="task-select">
        <span class="choice-icon">${icon("lightbulb")}</span>
        <span class="choice-text">I know what I want to do
          <div class="choice-sub">Write an email, plan a trip, and more</div>
        </span>
        <span class="chevron">${icon("chevronRight")}</span>
      </button>
      <button class="choice big" data-action="goTo" data-screen="ai-select">
        <span class="choice-icon">${icon("book")}</span>
        <span class="choice-text">I want to learn a specific AI
          <div class="choice-sub">Short, simple lessons at your pace</div>
        </span>
        <span class="chevron">${icon("chevronRight")}</span>
      </button>
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: TASK SELECT
   ========================================================================= */
function renderTaskSelect() {
  return `
  ${topBar()}
  <div class="screen">
    <h1 class="page-title">What do you need help with?</h1>
    <p class="subtitle">Choose the task closest to what you have in mind.</p>
    <div class="choice-list">
      ${TASKS.map((t) => `
        <button class="choice" data-action="selectTask" data-task="${t.id}">
          <span class="choice-icon">${icon(t.icon)}</span>
          <span class="choice-text">${esc(t.label)}</span>
          <span class="chevron">${icon("chevronRight")}</span>
        </button>`).join("")}
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: AI SELECT
   ========================================================================= */
function renderAiSelect() {
  const items = [
    { id: "chatgpt", label: "ChatGPT" },
    { id: "claude", label: "Claude" },
    { id: "gemini", label: "Google Gemini" },
    { id: "copilot", label: "Microsoft Copilot" },
    { id: "notsure", label: "I'm not sure which one to use" },
  ];
  return `
  ${topBar()}
  <div class="screen">
    <h1 class="page-title">Which AI would you like to learn?</h1>
    <p class="subtitle">Each lesson takes less than 5 minutes.</p>
    <div class="choice-list">
      ${items.map((it) => `
        <button class="choice" data-action="${it.id === "notsure" ? "goTo" : "openLessonLibrary"}" ${it.id === "notsure" ? 'data-screen="not-sure"' : `data-ai="${it.id}"`}>
          <span class="choice-icon">${it.id === "notsure" ? icon("chat") : icon("sparkle")}</span>
          <span class="choice-text">${esc(it.label)}</span>
          <span class="chevron">${icon("chevronRight")}</span>
        </button>`).join("")}
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: NOT SURE
   ========================================================================= */
function renderNotSure() {
  return `
  ${topBar()}
  <div class="screen">
    <h1 class="page-title">Let's find the right one for you</h1>
    <p class="subtitle">Choose whichever sounds most like you.</p>
    <div class="choice-list">
      ${NOT_SURE_OPTIONS.map((o) => `
        <button class="choice" data-action="notSurePick" data-tool="${o.tool}">
          <span class="choice-text">${esc(o.label)}</span>
          <span class="chevron">${icon("chevronRight")}</span>
        </button>`).join("")}
    </div>
  </div>`;
}
function renderNotSureResult(params) {
  const tool = AI_TOOLS[params.tool];
  return `
  ${topBar()}
  <div class="screen">
    <div class="card center">
      <div class="tool-badge" style="margin:0 auto 14px;"><span class="tool-dot" style="background:${tool.color}"></span>${esc(tool.name)}</div>
      <h2 class="section-title">We think ${esc(tool.name)} is a great fit for you.</h2>
      <p class="muted">You can always try the others too — there's no wrong choice.</p>
    </div>
    <div class="footer-actions">
      <button class="btn btn-primary" data-action="openLessonLibrary" data-ai="${tool.id}">Learn ${esc(tool.name)} Basics</button>
      <button class="btn btn-secondary" data-action="goTo" data-screen="home">Back to Home</button>
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: QUESTION SCREEN
   ========================================================================= */
function renderQuestion(params) {
  const task = getTask(params.task);
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
      <button class="btn btn-primary" id="continue-btn" data-action="submitAnswer" data-task="${task.id}" ${value.trim() ? "" : "disabled"}>Continue</button>
    </div>
  </div>`;
}
function safetyBannerHtml(text) {
  return `<div class="safety-banner"><span class="icon">${icon("shield")}</span><span>${esc(text)}</span></div>`;
}

/* =========================================================================
   RENDER: RECOMMENDATION
   ========================================================================= */
function renderRecommendation(params) {
  const task = getTask(params.task);
  const tool = AI_TOOLS[task.tool];
  return `
  ${topBar()}
  <div class="screen">
    <div class="eyebrow">Our recommendation</div>
    <h1 class="page-title">Here's what we suggest</h1>
    <div class="card">
      <div class="tool-badge"><span class="tool-dot" style="background:${tool.color}"></span>${esc(tool.name)}</div>
      <p style="font-size:1.1rem;">We recommend <strong>${esc(tool.name)}</strong> for this task. ${esc(task.reason)}</p>
      <div class="divider"></div>
      <p class="muted" style="margin-bottom:0;">You'll find it at <strong>${esc(tool.url.replace("https://", ""))}</strong> — we'll open it for you in the next step.</p>
    </div>
    <div class="footer-actions">
      <button class="btn btn-primary" data-action="beginGuide" data-task="${task.id}" data-answer="${esc(params.answer)}" data-tool="${tool.id}">Start the Guide</button>
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: GUIDE (step by step)
   ========================================================================= */
function renderGuide(params) {
  const task = getTask(params.task);
  const tool = AI_TOOLS[params.tool];
  const steps = guideSteps(task, params.tool);
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
      <button class="btn btn-primary" data-action="openTool" data-url="${esc(tool.url)}">Open ${esc(tool.name)}</button>
      <button class="btn btn-secondary btn-block" data-action="guideNext" ${guideNav(params)}>I opened it — Next Step</button>`;
  } else if (stepData.kind === "copy") {
    const copyWarn = safetyWarning(params.answer || "");
    body = `
      <div class="prompt-box" id="prompt-text">${nl2br(prompt)}</div>
      ${copyWarn ? safetyBannerHtml(copyWarn) : ""}
      <div class="chip-row" style="margin-top:14px;">
        ${toneChip("friendlier", "friendly", "Friendlier", params)}
        ${toneChip("formal", "formal", "More Formal", params)}
        ${toneChip("shorter", "short", "Shorter", params)}
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
  return `data-task="${params.task}" data-answer="${esc(params.answer)}" data-tool="${params.tool}" data-step="${params.step || 1}" data-simple="${!!params.simple}" data-tone="${tone}"`;
}
function toneChip(key, value, label, params) {
  const locked = state.plan !== "premium";
  const active = params.tone === value;
  return `<button class="chip ${locked ? "locked" : ""} ${active ? "active" : ""}" data-action="setTone" ${guideNav(params, value)}>${esc(label)}${locked ? `<span class="lock-tag">${icon("lock")}</span>` : ""}</button>`;
}

/* =========================================================================
   RENDER: SUCCESS
   ========================================================================= */
function renderSuccess(params) {
  const task = getTask(params.task);
  const tool = AI_TOOLS[params.tool];
  return `
  ${topBar({ back: false })}
  <div class="screen center">
    <div style="color:var(--green); margin:20px auto;">${icon("checkCircle")}</div>
    <h1 class="page-title">Great job — you did it!</h1>
    <p class="subtitle">You used ${esc(tool.name)} to ${esc(task.label.toLowerCase())}. That's a real AI skill you now have.</p>
    <div class="footer-actions">
      <button class="btn btn-primary" data-action="saveTask" data-task="${task.id}" data-answer="${esc(params.answer)}" data-tool="${params.tool}">${icon("save")} Save This Prompt</button>
      <button class="btn btn-secondary" data-action="goTo" data-screen="task-select">Do Another Task</button>
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
      <button class="btn btn-primary" data-action="goTo" data-screen="guide" data-task="${params.task}" data-answer="${esc(params.answer)}" data-tool="${params.tool}" data-step="4">Try Again</button>
      <button class="btn btn-secondary" data-action="goTo" data-screen="home">Back to Home</button>
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: LIMIT REACHED
   ========================================================================= */
function renderLimitReached() {
  return `
  ${topBar()}
  <div class="screen center">
    <div style="color:var(--blue); margin:16px auto;">${icon("sparkle")}</div>
    <h1 class="page-title">You've used your 5 free guided tasks this month</h1>
    <p class="subtitle">No problem — your free tasks will refresh next month. Or, upgrade any time to get unlimited guided tasks right now.</p>
    <div class="footer-actions">
      <button class="btn btn-primary" data-action="goTo" data-screen="subscription">See Premium ($5.99/mo)</button>
      <button class="link-btn" data-action="goTo" data-screen="home">Maybe Later</button>
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: LESSON LIBRARY
   ========================================================================= */
function renderLessonLibrary(params) {
  const tool = AI_TOOLS[params.ai];
  const lessons = LESSONS[params.ai] || [];
  return `
  ${topBar()}
  <div class="screen">
    <div class="tool-badge"><span class="tool-dot" style="background:${tool.color}"></span>${esc(tool.name)} Basics</div>
    <h1 class="page-title">Simple lessons, at your pace</h1>
    <p class="subtitle">Each one takes less than 5 minutes.</p>
    <div class="choice-list">
      ${lessons.map((l) => {
        const done = state.completedLessons.includes(`${params.ai}:${l.id}`);
        return `
        <button class="choice ${done ? "done" : ""}" data-action="openLesson" data-ai="${params.ai}" data-lesson="${l.id}">
          <span class="choice-icon">${done ? icon("check") : icon("book")}</span>
          <span class="choice-text">${esc(l.title)}</span>
          <span class="chevron">${icon("chevronRight")}</span>
        </button>`;
      }).join("")}
    </div>
  </div>`;
}

/* =========================================================================
   RENDER: LESSON DETAIL
   ========================================================================= */
const SIMPLE_LESSON_INTRO = "Here's the short version: ";
function renderLessonDetail(params) {
  const tool = AI_TOOLS[params.ai];
  const lesson = (LESSONS[params.ai] || []).find((l) => l.id === params.lesson);
  const simple = !!params.simple;
  const bodyText = simple ? simplifyText(lesson.body) : lesson.body;
  maybeAutoSpeak(`${lesson.title}. ${bodyText}`);
  return `
  ${topBar()}
  <div class="screen">
    <div class="simplify-row">
      <button class="icon-btn" data-action="readAloud" data-text="${esc(lesson.title + ". " + bodyText)}" aria-label="Read this lesson aloud" title="Read this lesson aloud">${icon("speaker")}</button>
      <button class="simplify-btn ${simple ? "active" : ""}" data-action="toggleLessonSimple" data-ai="${params.ai}" data-lesson="${params.lesson}" data-simple="${simple}">${icon("lightbulb")} Make This Simpler</button>
    </div>
    <div class="eyebrow">${esc(tool.name)}</div>
    <h1 class="page-title">${esc(lesson.title)}</h1>
    <div class="lesson-body">${bodyText.split("\n\n").map((p) => `<p>${esc(p)}</p>`).join("")}</div>
    <div class="practice-box">
      <div class="eyebrow">Try it yourself</div>
      <p style="margin-bottom:14px;">${esc(lesson.practice)}</p>
      <button class="btn btn-secondary" data-action="openTool" data-url="${esc(tool.url)}">Open ${esc(tool.name)}</button>
    </div>
    <div class="footer-actions">
      <button class="btn btn-primary" data-action="completeLesson" data-ai="${params.ai}" data-lesson="${params.lesson}">Mark as Done</button>
    </div>
  </div>`;
}
function simplifyText(text) {
  const firstSentence = text.split(/\n\n/)[0].split(". ")[0];
  return `${firstSentence}. That's the main idea — take your time with the rest whenever you're ready.`;
}

/* =========================================================================
   RENDER: SAVED
   ========================================================================= */
function renderSaved() {
  const isPremium = state.plan === "premium";
  return `
  ${topBar()}
  <div class="screen">
    <h1 class="page-title">Saved Prompts &amp; Tasks</h1>
    ${!isPremium ? `
      <div class="card center">
        <div class="badge-lock" style="margin-bottom:10px;">${icon("lock")} Premium feature</div>
        <p class="muted">Saving your prompts and tasks is part of the Premium plan, so you can find them again anytime without retyping.</p>
        <button class="btn btn-primary btn-block" data-action="goTo" data-screen="subscription">Upgrade to Save Tasks</button>
      </div>` : ""}
    ${isPremium && state.savedItems.length === 0 ? `
      <div class="card center"><p class="muted">You haven't saved anything yet. After you finish a guided task, tap "Save This Prompt."</p></div>` : ""}
    ${isPremium ? state.savedItems.slice().reverse().map((item) => `
      <div class="card card-tight">
        <div class="eyebrow">${esc(fmtDate(item.date))} · ${esc(AI_TOOLS[item.tool].name)}</div>
        <h2 class="section-title" style="font-size:1.1rem;">${esc(getTask(item.task).label)}</h2>
        <div class="prompt-box" style="margin-top:10px;">${nl2br(item.prompt)}</div>
        <button class="btn btn-secondary" data-action="copySaved" data-id="${item.id}">${icon("copy")} Copy Again</button>
      </div>`).join("") : ""}
  </div>`;
}

/* =========================================================================
   RENDER: SUBSCRIPTION
   ========================================================================= */
function renderSubscription(params) {
  const isPremium = state.plan === "premium";
  const confirming = !!(params && params.confirming);
  return `
  ${topBar()}
  <div class="screen">
    <h1 class="page-title">Choose Your Plan</h1>
    <p class="subtitle">Clear pricing. Cancel anytime, right from this screen.</p>

    <div class="plan-card ${!isPremium ? "current" : ""}">
      ${!isPremium ? `<div class="current-tag">Your current plan</div>` : ""}
      <h2 class="section-title">Free</h2>
      <div class="plan-price">$0 <span>/ month</span></div>
      <ul class="feature-list">
        <li><span class="tick">${icon("check")}</span> 5 guided tasks per month</li>
        <li><span class="tick">${icon("check")}</span> Basic beginner lessons</li>
        <li><span class="tick">${icon("check")}</span> Access to ChatGPT, Claude, and Gemini guides</li>
      </ul>
    </div>

    <div class="plan-card ${isPremium ? "current" : ""}">
      ${isPremium ? `<div class="current-tag">Your current plan</div>` : ""}
      <h2 class="section-title">Premium</h2>
      <div class="plan-price">$5.99 <span>/ month</span></div>
      <ul class="feature-list">
        <li><span class="tick">${icon("check")}</span> Unlimited guided tasks</li>
        <li><span class="tick">${icon("check")}</span> Personalized prompts, with tone options</li>
        <li><span class="tick">${icon("check")}</span> Saved tasks and prompts</li>
        <li><span class="tick">${icon("check")}</span> Voice instructions read aloud</li>
        <li><span class="tick">${icon("check")}</span> New lessons and guides</li>
        <li><span class="tick">${icon("check")}</span> Help choosing the right AI</li>
        <li><span class="tick">${icon("check")}</span> Family support option</li>
      </ul>
      ${isPremium
        ? `<button class="btn btn-danger-outline btn-block" data-action="cancelPremium">Cancel Subscription</button>`
        : confirming
          ? `<div class="card card-tight" style="background:var(--blue-light); border:none;">
               <p style="margin-bottom:14px;"><strong>You'll be charged $5.99 per month.</strong> You can cancel any time, with no fees or phone calls.</p>
               <button class="btn btn-primary btn-block" data-action="confirmUpgrade">Confirm — $5.99/month</button>
               <button class="link-btn" data-action="goTo" data-screen="subscription">Never mind</button>
             </div>`
          : `<button class="btn btn-primary btn-block" data-action="goTo" data-screen="subscription" data-confirming="1">Upgrade to Premium</button>`}
    </div>
    <p class="muted center" style="font-size:0.85rem;">This is a working prototype — no real payment is collected.</p>
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
        <label class="switch"><input type="checkbox" data-action="toggleContrast" ${a.highContrast ? "checked" : ""}><span class="track"><span class="thumb"></span></span></label>
      </div>
      <div class="setting-row">
        <div><div class="setting-title">Voice Instructions ${state.plan !== "premium" ? '<span class="badge-lock">' + icon("lock") + " Premium</span>" : ""}</div><div class="setting-sub">Have steps read aloud to you</div></div>
        <label class="switch"><input type="checkbox" data-action="toggleVoice" ${a.voiceNarration ? "checked" : ""} ${state.plan !== "premium" ? "disabled" : ""}><span class="track"><span class="thumb"></span></span></label>
      </div>
    </div>

    <h2 class="section-title">Your Plan</h2>
    <div class="card">
      <div class="setting-row" style="border:none; padding-bottom:0;">
        <div><div class="setting-title">${state.plan === "premium" ? "Premium — $5.99/mo" : "Free Plan"}</div>
        <div class="setting-sub">${state.plan === "premium" ? "Unlimited guided tasks and more" : `${5 - state.tasksCompletedThisMonth} of 5 free tasks left this month`}</div></div>
        <button class="btn btn-secondary btn-sm" data-action="goTo" data-screen="subscription">Manage</button>
      </div>
    </div>

    ${state.plan === "premium" ? `
    <h2 class="section-title">Family Support</h2>
    <div class="card">
      <p class="muted" style="margin-bottom:14px;">Invite a family member so they can help you get set up, or keep an eye on things together.</p>
      <button class="btn btn-secondary" data-action="inviteFamily">${icon("family")} Invite a Family Member</button>
    </div>` : ""}

    <h2 class="section-title">More</h2>
    <div class="card">
      <button class="choice" data-action="goTo" data-screen="saved" style="box-shadow:none;">
        <span class="choice-icon">${icon("save")}</span><span class="choice-text">Saved Prompts &amp; Tasks</span><span class="chevron">${icon("chevronRight")}</span>
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
  switch (nav.screen) {
    case "welcome": html = renderWelcome(); break;
    case "onboarding-1": html = renderOnboarding(1); break;
    case "onboarding-2": html = renderOnboarding(2); break;
    case "onboarding-3": html = renderOnboarding(3); break;
    case "home": html = renderHome(); break;
    case "task-select": html = renderTaskSelect(); break;
    case "ai-select": html = renderAiSelect(); break;
    case "not-sure": html = renderNotSure(); break;
    case "not-sure-result": html = renderNotSureResult(nav.params); break;
    case "question": html = renderQuestion(nav.params); break;
    case "recommendation": html = renderRecommendation(nav.params); break;
    case "guide": html = renderGuide(nav.params); break;
    case "success": html = renderSuccess(nav.params); break;
    case "more-help": html = renderMoreHelp(nav.params); break;
    case "limit-reached": html = renderLimitReached(); break;
    case "lesson-library": html = renderLessonLibrary(nav.params); break;
    case "lesson-detail": html = renderLessonDetail(nav.params); break;
    case "saved": html = renderSaved(); break;
    case "subscription": html = renderSubscription(nav.params); break;
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
  goTo(ds, ev) {
    const screen = ds.screen;
    const params = {};
    if (ds.confirming) params.confirming = true;
    if (ds.task) params.task = ds.task;
    if (ds.answer) params.answer = ds.answer;
    if (ds.tool) params.tool = ds.tool;
    if (ds.step) params.step = Number(ds.step);
    goTo(screen, params);
  },
  startOnboarding() { goTo("onboarding-1"); },
  skipOnboarding() { state.onboarded = true; saveState(); resetToHome(); },
  answerOnboarding(ds) {
    state.onboarding[ds.key] = ds.value;
    saveState();
    const step = Number(ds.step);
    if (step < 3) {
      goTo(`onboarding-${step + 1}`);
    } else {
      state.onboarded = true;
      saveState();
      resetToHome();
      showToast("All set! Let's find something to help you with.");
    }
  },
  selectTask(ds) { goTo("question", { task: ds.task, answer: "" }); },
  openLessonLibrary(ds) { goTo("lesson-library", { ai: ds.ai }); },
  notSurePick(ds) { goTo("not-sure-result", { tool: ds.tool }); },
  mic(ds) {
    toggleMic(ds.micFor);
  },
  input(ds, ev, el) {
    // live-bind textarea to nav.params + safety banner + continue button, without full re-render
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
  submitAnswer(ds) {
    const task = ds.task;
    const answer = (nav.params.answer || "").trim();
    if (!answer) return;
    refreshMonthIfNeeded();
    if (state.plan !== "premium" && state.tasksCompletedThisMonth >= 5) {
      goTo("limit-reached");
      return;
    }
    goTo("recommendation", { task, answer });
  },
  beginGuide(ds) {
    goTo("guide", { task: ds.task, answer: ds.answer, tool: ds.tool, step: 1, simple: false, tone: null });
  },
  toggleSimple(ds) {
    goTo("guide", { task: ds.task, answer: ds.answer, tool: ds.tool, step: Number(ds.step), simple: ds.simple !== "true", tone: ds.tone || null }, { replace: true });
  },
  setTone(ds) {
    if (state.plan !== "premium") { showToast("Tone options are a Premium feature."); return; }
    goTo("guide", { task: ds.task, answer: ds.answer, tool: ds.tool, step: Number(ds.step), simple: ds.simple === "true", tone: ds.tone }, { replace: true });
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
    goTo("guide", { task: ds.task, answer: ds.answer, tool: ds.tool, step: nextStep, simple: ds.simple === "true", tone: ds.tone || null });
  },
  taskWorked(ds) {
    if (state.plan !== "premium") {
      refreshMonthIfNeeded();
      state.tasksCompletedThisMonth += 1;
      saveState();
    }
    goTo("success", { task: ds.task, answer: ds.answer, tool: ds.tool });
  },
  needMoreHelp(ds) { goTo("more-help", { task: ds.task, answer: ds.answer, tool: ds.tool }); },
  saveTask(ds) {
    if (state.plan !== "premium") { showToast("Saving prompts is a Premium feature. Visit Account to upgrade."); return; }
    state.savedItems.push({ id: Date.now(), task: ds.task, answer: ds.answer, tool: ds.tool, prompt: generatePrompt(ds.task, ds.answer, null), date: new Date().toISOString() });
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
  openLesson(ds) { goTo("lesson-detail", { ai: ds.ai, lesson: ds.lesson, simple: false }); },
  toggleLessonSimple(ds) { goTo("lesson-detail", { ai: ds.ai, lesson: ds.lesson, simple: ds.simple !== "true" }, { replace: true }); },
  readAloud(ds) {
    if (state.plan !== "premium") { showToast("Voice instructions are a Premium feature."); return; }
    speak(ds.text);
  },
  completeLesson(ds) {
    const key = `${ds.ai}:${ds.lesson}`;
    if (!state.completedLessons.includes(key)) state.completedLessons.push(key);
    saveState();
    showToast("Nice work — lesson complete!");
    goTo("lesson-library", { ai: ds.ai }, { replace: true });
  },
  confirmUpgrade() {
    state.plan = "premium";
    saveState();
    showToast("You're now on Premium!");
    goTo("subscription", {}, { replace: true });
  },
  cancelPremium() {
    state.plan = "free";
    saveState();
    showToast("Your subscription has been canceled.");
    goTo("subscription", {}, { replace: true });
  },
  inviteFamily() { showToast("Invitation sent! (Demo only — no real email is sent.)"); },
  setTextSize(ds) { state.accessibility.textSize = ds.size; saveState(); applyAccessibility(); render(); },
  toggleContrast() { state.accessibility.highContrast = !state.accessibility.highContrast; saveState(); applyAccessibility(); render(); },
  toggleVoice() {
    if (state.plan !== "premium") { showToast("Voice instructions are a Premium feature."); render(); return; }
    state.accessibility.voiceNarration = !state.accessibility.voiceNarration;
    saveState();
    render();
  },
  resetDemo() {
    if (!confirm("This clears all saved demo data (your plan, saved tasks, and progress). Continue?")) return;
    localStorage.removeItem(STORAGE_KEY);
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
document.addEventListener("change", (ev) => {
  const el = ev.target.closest("[data-action]");
  if (!el) return;
  const actionName = el.getAttribute("data-action");
  if (actionName === "toggleContrast" || actionName === "toggleVoice") {
    actions[actionName](el.dataset, ev);
  }
});

/* =========================================================================
   INIT
   ========================================================================= */
function init() {
  applyAccessibility();
  if (state.onboarded) goTo("home", {}, { replace: true });
  else goTo("welcome", {}, { replace: true });
}
document.addEventListener("DOMContentLoaded", init);
})();
