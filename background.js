function sanitizeError(error) {
  if (!error) return 'An error occurred. Please try again.';

  const msg = (error && error.message) ? String(error.message) : String(error);
  console.error('API Error:', msg);

  if (msg.includes('API key') || msg.includes('not configured')) return 'API key not configured. Go to settings and add your API key.';
  if (msg.includes('401') || msg.includes('Unauthorized')) return 'Invalid API key. Check your settings.';
  if (msg.includes('403') || msg.includes('Forbidden')) return 'API access denied. Check your API key permissions.';
  if (msg.includes('429') || msg.includes('rate')) return 'Rate limited. Wait a moment and try again.';
  if (msg.includes('500') || msg.includes('server')) return 'API server error. Try again in a moment.';
  if (msg.includes('Failed to fetch') || msg.includes('network')) return 'Network error. Check your connection.';
  if (msg.includes('invalid model') || msg.includes('model not found') || msg.includes('unknown model')) return 'Invalid model selected. Check your settings.';
  if (msg.includes('max_completion_tokens') || msg.includes('max_tokens')) return 'Model parameter error. Try a different model.';

  return `Error: ${msg.substring(0, 100)}`;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateComment') {
    generateCommentWithClaude(request.post, request.platform, request.mode, request.length, request.emoji, request.cockyBoost, request.techBoost, request.recipientName, request.thinking, request.customCTA, request.temperature)
      .then(comment => {
        sendResponse({ comment });
      })
      .catch(error => {
        sendResponse({ error: sanitizeError(error) });
      });
    return true;
  } else if (request.action === 'analyzePost') {
    analyzePost(request.post)
      .then(analysis => {
        sendResponse({ analysis });
      })
      .catch(error => {
        sendResponse({ error: sanitizeError(error) });
      });
    return true;
  }
});

async function generateCommentWithClaude(post, platform, mode = 'insight', length = 'medium', emoji = true, cockyBoost = false, techBoost = false, recipientName = '', thinking = false, customCTA = '', temperature = 0.5) {
  const local = await chrome.storage.local.get(['apiKey']);
  const sync = await chrome.storage.sync.get(['provider', 'model', 'pronoun']);
  const apiKey = local.apiKey;
  const provider = sync.provider || 'openrouter';
  const model = sync.model;
  const pronoun = sync.pronoun || 'I';

  console.log('Generate config:', { provider, model, hasApiKey: !!apiKey, pronoun });

  if (!apiKey) {
    throw new Error('API key not configured. Please go to settings and add your API key.');
  }

  if (!model) {
    throw new Error('No model selected. Please go to settings and choose a model.');
  }

  let systemPrompt = '';
  const pronounPhrase = pronoun === 'we' ? 'our team/company' : 'yourself';
  const workPhrase = pronoun === 'we' ? 'work with teams' : 'work with people';
  const noEmoji = !emoji ? ' Do NOT use any emojis.' : '';

  if (mode === 'insight') {
    systemPrompt = `You distill complex ideas into sharp, specific takes. You see the angle most people miss and say it clearly. No hedging, no filler — just a focused perspective that actually adds something new. Write like someone who's thought deeply about this topic and earned the right to have an opinion. Use contractions. Sound human.${noEmoji}`;
  } else if (mode === 'debate') {
    systemPrompt = `You're intellectually honest and enjoy good-faith disagreement. You hold contrarian views confidently without being combative. You acknowledge what's valid, then offer your real take. You're not trying to win — you're trying to move the conversation forward. Be direct and bold. Use contractions.${noEmoji}`;
  } else if (mode === 'sell') {
    systemPrompt = `You're a trusted advisor who leads with genuine value. You're confident in what you offer and know how to make it feel relevant without forcing it. You put their needs first — you're the person people actually want to call. Use contractions. Warm but professional.${noEmoji}`;
  } else if (mode === 'inbox') {
    systemPrompt = `You're warm, direct, and take people seriously. When someone reaches out, you make them feel like their message actually mattered. You respond to what they specifically said, not a generic version of it. Use contractions. Efficient but human.${noEmoji}`;
  } else if (mode === 'hype') {
    systemPrompt = `You genuinely get excited by other people's wins and ideas. Your enthusiasm is real and specific — you notice the actual thing that's impressive, not just the fact that someone posted. You make people feel truly seen, not just liked. Use contractions. No filler phrases.${noEmoji}`;
  } else if (mode === 'curious') {
    systemPrompt = `You're genuinely curious and ask the questions that open everything up. You make people feel interesting by showing you actually paid attention. One sharp, specific question beats three generic ones. Use contractions. Sound like someone who actually wants to know.${noEmoji}`;
  } else {
    systemPrompt = `You are a knowledgeable person sharing insights. Write naturally and authentically. Use contractions. Sound like a real person, not an algorithm.${noEmoji}`;
  }

  let platformInstruction = '';
  if (platform === 'facebook') {
    platformInstruction = `FACEBOOK: People scroll fast and react emotionally. Write short and punchy - like you're texting a buddy. Make them feel something. Be genuine, maybe throw in an emoji if it feels natural. Keep it to 2-3 sentences. Don't overthink it. Sound like you actually care about what they posted.`;
  } else if (platform === 'linkedin') {
    platformInstruction = `LINKEDIN: People here think deeper and invest time. Write something thoughtful that adds real value. Share what you've learned or your genuine take. 3-5 sentences. Sound like you know your stuff without being preachy. Build real connection, not just engagement.`;
  } else if (platform === 'x') {
    platformInstruction = `X (TWITTER): Fast-paced, witty, and direct. People appreciate clever takes and hot opinions. Write concise, sharp comments - 1-2 sentences max. Be bold, authentic, and conversational. Use humor if it fits. Sound like you're in the conversation, not lecturing. Keep energy high.`;
  } else if (platform === 'reddit') {
    platformInstruction = `REDDIT: Redditors crave authenticity, substance, and humor. Go deeper than surface level — don't be afraid of 3-5+ sentences. They value people who admit what they don't know and share real experience. Mix wit and sarcasm naturally, but only if it fits. Absolutely NO corporate-speak, buzzwords, or trying too hard to sell. Be irreverent but respectful. Use "Edit: " if adding clarification. Sound like someone who actually spends time in the community and gets the vibe. Humor and personality are gold here.`;
  }

  let modeInstruction = '';
  if (mode === 'insight') {
    modeInstruction = `INSIGHT MODE: Don't restate what they said — go one level deeper. Find the most interesting implication, overlooked angle, or specific nuance in this post. Share a concrete observation or experience that adds something the original post didn't. Make the reader think "I hadn't considered that." Lead with the insight, not with praise for their post.`;
  } else if (mode === 'debate') {
    modeInstruction = `DEBATE MODE: Find the assumption, gap, or claim in their post that deserves a challenge. Start by acknowledging what's valid ("Fair point on X, but..."), then push back specifically and confidently. Name exactly what you'd challenge and why. Be direct — phrases like "I'd push back on one thing" or "The part I'd question is..." work well. End strong with your position. This is about sparking real discussion, not being contrarian for its own sake.`;
  } else if (mode === 'sell') {
    const softCTA = pronoun === 'we'
      ? `"Happy to share how we approach this" or "DM us if you want to explore it" or "We've tackled this — let me know if useful"`
      : `"Happy to share how I approach this" or "DM me if you want to explore it" or "I've tackled this — let me know if useful"`;
    modeInstruction = `SELL MODE: Lead with genuine value — acknowledge their situation with a specific, useful insight. Then naturally bridge to how ${pronoun === 'we' ? 'your team helps' : 'you help'} with exactly this kind of challenge. One soft invitation at the end, like ${softCTA}. Never sound like a pitch — sound like the trusted person worth calling.`;
  } else if (mode === 'inbox') {
    const nameGreeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
    modeInstruction = `INBOX MODE: This is a reply to someone who messaged you first. Start with "${nameGreeting}" Read what they said carefully and respond to the actual content — not a generic version of it. Acknowledge what they specifically asked or shared. Offer one concrete next step to keep things moving. Warm but efficient — like someone who respects their time.`;
  } else if (mode === 'hype') {
    modeInstruction = `HYPE MODE: Find the specific thing in this post that's actually impressive, insightful, or worth celebrating — then react to that exact thing. Reference it directly to prove you actually read it. Make them feel like this post was worth sharing. No filler phrases like "so inspiring," "love this," "absolutely," or "this is so good." React to the real thing with real energy. End with a strong statement — no questions.`;
  } else if (mode === 'curious') {
    modeInstruction = `CURIOUS MODE: Find the most interesting unanswered question hiding in their post — the one that shows you actually read it carefully. Not "would love to hear more" — something specific that makes them want to write a paragraph back. Build up to it naturally with a brief reaction, then land on that one focused question. One sharp question beats three generic ones.`;
  } else {
    modeInstruction = `INFORMATIVE MODE: Share a useful perspective or honest take. Help them think deeper or see something they might have missed. Keep it real.`;
  }

  let boostInstructions = '';
  if (cockyBoost) {
    boostInstructions += `COCKY BOOST: Add confidence and swagger. Be bold and opinionated. Use phrases like "100%", "no question", "that's facts", "trust me". Show conviction. `;
  }
  if (techBoost) {
    boostInstructions += `TECH BOOST: Sound like a seasoned technical expert. Demonstrate deep understanding through specific examples and reasoning, not just buzzwords. Reference architecture patterns, performance considerations, trade-offs, and implementation details. Use precise terminology naturally (scalability, throughput, latency, orchestration, observability) but only in context. Show you've actually worked with these systems. Mention real constraints, gotchas, or lessons learned. Sound authoritative but approachable — expert enough to know what matters.`;
  }

  let lengthInstruction = '';
  if (length === 'short') {
    lengthInstruction = 'Keep it VERY SHORT - 1-2 sentences max, punchy.';
  } else if (length === 'long') {
    lengthInstruction = 'Go longer - 4-6 sentences, more detailed and thoughtful.';
  } else {
    lengthInstruction = 'Keep it medium length - 2-3 sentences, balanced.';
  }

  let ctaInstruction = '';
  if (customCTA) {
    ctaInstruction = `\n\nCUSTOM CTA: Weave this into the comment so it feels like a natural next step — not a sentence slapped at the end: "${customCTA}". If it's an action ("DM me", "Book a call"), make it feel like the obvious next move given what you just said. If it's content-focused ("Follow for more", "Link in bio"), fold it into your closing thought. It should feel earned, not tacked on.`;
  }

  const prompt = `Generate a comment based on the post below.

${platformInstruction}

${modeInstruction}

${boostInstructions}

${lengthInstruction}${ctaInstruction}

Post: ${post}

Write only the comment, nothing else.`;

  if (provider === 'openai') {
    return callOpenAI(apiKey, prompt, systemPrompt, model, thinking, temperature);
  } else {
    return callOpenRouter(apiKey, prompt, systemPrompt, model, thinking, temperature);
  }
}

async function callOpenAI(apiKey, prompt, systemPrompt, model, thinking = false, temperature = 0.5) {
  try {
    console.log('Calling OpenAI with model:', model);

    const body = {
      model: model || 'gpt-4o-mini',
      max_completion_tokens: 300,
      temperature: temperature,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    if (thinking) {
      body.thinking = {
        type: 'enabled',
        budget_tokens: 5000
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI error response:', errorData);
      throw new Error(errorData.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response format from OpenAI');
    }
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('OpenAI: ' + (error.message || 'Unknown error'));
  }
}

async function analyzePost(post) {
  const local = await chrome.storage.local.get(['apiKey']);
  const sync = await chrome.storage.sync.get(['provider', 'model']);
  const apiKey = local.apiKey;
  const provider = sync.provider || 'openrouter';
  const model = sync.model;

  if (!apiKey) {
    throw new Error('API key not configured. Please go to settings and add your API key.');
  }

  const systemPrompt = `You are an expert content analyst. Analyze social media posts and provide concise, actionable insights. Return ONLY the formatted text analysis, nothing else.`;

  const prompt = `Analyze this social media post and provide insights:

Topic: [main theme]
Sentiment: [positive/neutral/negative]
Content Type: [question/story/announcement/discussion/etc]
Best For: [Facebook/LinkedIn/Both]
Key Points: [1-2 main ideas]
Response Approach: [how to best respond]
Engagement Potential: [high/medium/low + reason]

Post: "${post}"

Provide the analysis in plain text format with each item on a new line.`;

  try {
    let analysis;
    if (provider === 'openai') {
      analysis = await callOpenAI(apiKey, prompt, systemPrompt, model, false);
    } else {
      analysis = await callOpenRouter(apiKey, prompt, systemPrompt, model, false);
    }
    return analysis.trim();
  } catch (error) {
    throw new Error('Analysis failed: ' + error.message);
  }
}

async function callOpenRouter(apiKey, prompt, systemPrompt, model, thinking = false, temperature = 0.5) {
  try {
    console.log('Calling OpenRouter with model:', model);

    const body = {
      model: model || 'openai/gpt-4o-mini',
      max_completion_tokens: 300,
      temperature: temperature,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    if (thinking) {
      body.thinking = {
        type: 'enabled',
        budget_tokens: 5000
      };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': chrome.runtime.getURL('/'),
        'X-Title': 'EngageNow'
      },
      body: JSON.stringify(body)
    });

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter error response:', errorData);
      throw new Error(errorData.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response format from OpenRouter');
    }
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw new Error('OpenRouter: ' + (error.message || 'Unknown error'));
  }
}
