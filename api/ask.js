// api/ask.js
// Place under /api in your repo for Vercel serverless functions.
// Make sure to set OPENAI_API_KEY in Vercel project env vars.

const RATE_LIMIT_MAP = new Map(); // basic in-memory rate limiter

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    // Basic rate limit (per IP, simple)
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const WINDOW_MS = 60 * 1000; // 1 minute window
    const MAX_PER_WINDOW = 30; // change as needed

    let rec = RATE_LIMIT_MAP.get(ip);
    if (!rec || now - rec.time > WINDOW_MS) {
      rec = { count: 1, time: now };
    } else {
      rec.count += 1;
    }
    RATE_LIMIT_MAP.set(ip, rec);
    if (rec.count > MAX_PER_WINDOW) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment and try again." });
    }

    const body = req.method === "POST" ? req.body : {};
    const question = (body.question || "").trim();
    const lang = body.lang === "bn" ? "bn" : "en";

    if (!question) return res.status(400).json({ error: "Question is required." });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API key not configured on server." });
    }

    // System prompt: instruct strict factual behavior
    const systemMessage = lang === "bn"
      ? `তুমি InfoSeeker — একজন তথ্যভিত্তিক সহকারী। তুমি কেবল নিশ্চিত ও যাচাইযোগ্য তথ্য প্রদান করবে। যদি কোনো প্রশ্নের তথ্য সম্পর্কে তুমি নিশ্চিত না হও, তাহলে স্পষ্টভাবে বলো "আমি নিশ্চিত নই" এবং কোন কিছুও বানিয়ে বলবে না। উত্তর সংক্ষিপ্ত রকমে (২-৬ বাক্য), এরপর একটি লাইন লিখো 'How to verify:' (বাংলায়: 'যাচাই কিভাবে:') যেখানে ব্যবহারকারী কীভাবে যাচাই করবে সেটা সরলভাবে বলবে। শেষে একটি 'Confidence:' লেবেল দাও (High/Medium/Low)।`
      : `You are InfoSeeker — a fact-focused assistant. Provide only verified or confidently known facts. If you are not confident, explicitly reply "I am not certain" and do not invent details. Give a concise answer (2-6 sentences), then a one-line "How to verify:" suggestion, and finally a 'Confidence:' label (High/Medium/Low).`;

    // User message: include language-specific instruction
    const userMessage = lang === "bn"
      ? `প্রশ্ন: ${question}\n\nউত্তর বাংলা ভাষায় দাও। সংক্ষিপ্ত হও।`
      : `Question: ${question}\n\nAnswer in English. Be concise.`;

    // Call OpenAI Chat Completion
    const oaResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        max_tokens: 600,
        temperature: 0.0,
        top_p: 1.0
      })
    });

    const oaJson = await oaResp.json();
    // Handle OpenAI errors
    if (!oaResp.ok) {
      console.error("OpenAI error:", oaJson);
      const errMsg = oaJson?.error?.message || "OpenAI API error";
      return res.status(500).json({ error: `OpenAI error: ${errMsg}` });
    }

    const answer = oaJson?.choices?.[0]?.message?.content?.trim() || (lang === "bn" ? "উত্তর পাওয়া যায়নি।" : "No answer available.");

    return res.json({
      answer,
      model: MODEL
    });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error." });
  }
}
