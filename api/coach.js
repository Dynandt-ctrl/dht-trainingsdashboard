// Vercel serverless function — praat met de Claude API namens de chatbot.
// Vereist: environment variable ANTHROPIC_API_KEY in je Vercel-projectinstellingen
// (Project -> Settings -> Environment Variables). De key zelf staat nooit in deze code
// of in je browser, dus hij lekt niet naar bezoekers van je site.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "ANTHROPIC_API_KEY ontbreekt. Voeg hem toe bij je Vercel-project onder Settings -> Environment Variables en deploy opnieuw.",
    });
    return;
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages (array) is verplicht" });
    return;
  }

  const SYSTEM_PROMPT = `Je bent een behulpzame sport- en voedingscoach, ingebouwd in een persoonlijk trainingsdashboard.
Geef praktisch, direct en wetenschappelijk onderbouwd advies in het Nederlands over krachttraining, cardio, voeding, macro's en herstel.
Houd antwoorden kort en concreet, met uitleg waarom iets zo werkt wanneer dat nuttig is.
Je bent geen arts: verwijs bij blessures, pijn of medische klachten naar een arts of fysiotherapeut in plaats van zelf een diagnose of behandeling te geven.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({
        error: data?.error?.message || "Onbekende fout bij de Claude API",
      });
      return;
    }

    const textBlock = Array.isArray(data.content)
      ? data.content.find((b) => b.type === "text")
      : null;

    res.status(200).json({ text: textBlock ? textBlock.text : "" });
  } catch (err) {
    res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
}
