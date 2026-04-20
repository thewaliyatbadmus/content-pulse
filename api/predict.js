// This file runs on Vercel's servers, NOT in the user's browser.
// That means your API key stays secret, safely stored in Vercel's environment variables.

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Make sure the API key is set up
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'AI predictions are not set up yet.',
    });
  }

  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts) || posts.length < 3) {
      return res.status(400).json({ error: 'Need at least 3 posts to analyze' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a Gen Z social media strategist. Here is post data with engagement scores (higher = better performance):\n\n${JSON.stringify(posts, null, 2)}\n\nBased on what's working, give 4 specific post ideas this brand should try next. For each idea include: a catchy hook/caption opener, the pillar, the format, the best platform, and reasoning grounded in the data.\n\nReturn ONLY a JSON array with objects containing these fields: hook, pillar, format, platform, reasoning. No markdown fences, no preamble, just the raw JSON array.`,
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const text = data.content.find(c => c.type === 'text')?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();

    return res.status(200).json({ predictions: clean });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
