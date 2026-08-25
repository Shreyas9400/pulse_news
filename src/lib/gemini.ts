import { NewsArticle, DailyBriefing } from './types';

/**
 * Generate a smart AI executive daily briefing from top news items
 */
export async function generateDailyBriefing(articles: NewsArticle[]): Promise<DailyBriefing> {
  const topArticles = articles.slice(0, 8);
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // If Gemini API Key is configured in environment, we can fetch real Gemini briefing
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey && topArticles.length > 0) {
    try {
      const prompt = `You are an elite executive intelligence editor. Generate a concise, engaging morning executive briefing based on these top news headlines:
${topArticles.map((a, i) => `${i + 1}. [${a.source} - ${a.category}] ${a.title}: ${a.description}`).join('\n')}

Format your response as strict JSON:
{
  "overview": "A 2-3 sentence overarching executive summary connecting the major market, tech, and global narratives today.",
  "marketMood": "Bullish / Cautious Optimism / Volatile / Neutral with 1 short explanatory sentence",
  "keyBulletPoints": [
    "Punchy high-impact bullet 1",
    "Punchy high-impact bullet 2",
    "Punchy high-impact bullet 3",
    "Punchy high-impact bullet 4"
  ]
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            date: dateStr,
            greeting,
            overview: parsed.overview || 'Markets and technology sectors lead headlines today.',
            marketMood: parsed.marketMood || 'Market sentiments show steady momentum.',
            topStories: topArticles.slice(0, 5),
            keyBulletPoints: parsed.keyBulletPoints || topArticles.slice(0, 4).map(a => a.title),
            generatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn('[GeminiBriefing] Fallback to smart local synthesizer:', e);
    }
  }

  // Fast Intelligent Local Synthesizer (Zero API Keys required!)
  const topTitles = topArticles.slice(0, 4).map(a => a.title);
  const positiveCount = topArticles.filter(a => a.sentiment === 'positive').length;
  const negativeCount = topArticles.filter(a => a.sentiment === 'negative').length;

  let mood = 'Balanced & Cautious';
  if (positiveCount > negativeCount + 1) mood = 'Bullish Optimism — Tech & markets rally';
  else if (negativeCount > positiveCount) mood = 'Risk-Off & Defensive — Geopolitical & market caution';

  return {
    date: dateStr,
    greeting,
    overview: `Today's briefing captures active developments across global markets, frontier AI, and business. High-impact updates from ${[...new Set(topArticles.map(a => a.source))].slice(0, 3).join(', ')} highlight ongoing momentum.`,
    marketMood: mood,
    topStories: topArticles.slice(0, 5),
    keyBulletPoints: [
      `${topArticles[0]?.title || 'Markets open with focused investor interest.'}`,
      `${topArticles[1]?.title || 'Technology and computing sectors report key advancements.'}`,
      `${topArticles[2]?.title || 'Global macroeconomic indicators remain closely watched.'}`,
      `${topArticles[3]?.title || 'Scientific and enterprise research milestones announced today.'}`,
    ],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate 3 bullet executive summary for an individual article
 */
export function summarizeArticleLocally(title: string, description: string): string[] {
  const sentences = description.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 15);
  
  if (sentences.length >= 3) {
    return sentences.slice(0, 3);
  }
  
  return [
    `Key Focus: ${title}`,
    description || 'Full coverage and updates available via primary publisher.',
    'Impact: Relevant for tracking current sector trends and market movements.',
  ];
}
