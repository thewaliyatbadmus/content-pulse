// This endpoint analyzes a single post in depth using Claude AI.
// It receives the target post ID and all posts for context,
// then asks the AI to identify patterns specific to this one post.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'AI analysis is not set up yet.',
    });
  }

  try {
    const { targetPostId, allPosts } = req.body;

    if (!targetPostId || !Array.isArray(allPosts) || allPosts.length < 1) {
      return res.status(400).json({ error: 'Need a target post and the full post list' });
    }

    const target = allPosts.find(p => p.id === targetPostId);
    if (!target) {
      return res.status(400).json({ error: 'Target post not found in posts list' });
    }

    const others = allPosts.filter(p => p.id !== targetPostId);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `You are a sharp social media strategist giving honest, specific feedback to a content creator.

Here is the post they want analyzed:
${JSON.stringify(target, null, 2)}

Here is the rest of their content for context:
${JSON.stringify(others, null, 2)}

Give a focused analysis in 3-4 short paragraphs:
1. What this specific post did well OR poorly, using concrete numbers from the data
2. What likely caused it — look at the caption, format, time, platform, and pillar
3. One or two specific things to try differently next time (if it underperformed) or to replicate (if it won)

Write in a warm, direct tone — like a friend who knows marketing. No corporate speak. No "it's important to note." Be specific about numbers. Keep it under 250 words.

Return just the analysis as plain text with paragraph breaks. No markdown, no headers, no bullet points.`,
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

    return res.status(200).json({ analysis: text });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
