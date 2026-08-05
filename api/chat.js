// Emergency Code Alpha -- patient chat proxy (Vercel serverless function)
//
// This runs on Vercel's servers, never in the player's browser. It exists
// for one reason: a browser can never safely hold a real Anthropic API
// key (anyone can view a downloaded file's source), so this function
// holds that key privately (as an environment variable, set in Vercel's
// dashboard -- never written in this file) and forwards chat requests on
// the game's behalf. The game calls this endpoint by URL; it never talks
// to Anthropic directly anymore.
//
// No npm install needed -- this only uses Node's built-in fetch, which
// Vercel's default Node runtime already includes.

export default async function handler(req, res) {
  // Lets the game call this from anywhere -- a local file on your
  // computer, a website, wherever it's opened from.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Browsers send a preflight OPTIONS request before the real POST --
  // this has to be answered for the actual call to go through at all.
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST is supported.' });
    return;
  }

  const { system, messages } = req.body || {};
  if (!system || !Array.isArray(messages)) {
    res.status(400).json({ error: 'Missing "system" prompt or "messages" array.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'This server has no ANTHROPIC_API_KEY environment variable configured yet.' });
    return;
  }

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        // Haiku is a deliberate choice, not a placeholder -- patient chat
        // replies are short, in-character conversational lines (the
        // system prompt itself enforces 1-3 sentences), which doesn't
        // need a frontier-reasoning model. Haiku costs roughly half of
        // Sonnet on both input and output. Swap to 'claude-sonnet-5' for
        // slightly richer dialogue if you don't mind the extra cost.
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await anthropicResponse.json();

    // Forward Anthropic's response (and status code) straight through --
    // the game already knows how to read a normal Anthropic response
    // shape, so there's nothing to reshape here.
    res.status(anthropicResponse.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Could not reach Anthropic right now.' });
  }
}
