chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateComment') {
    generateCommentWithClaude(request.post, request.platform, request.mode, request.length, request.emoji, request.cockyBoost, request.techBoost, request.recipientName, request.thinking, request.customCTA, request.temperature)
      .then(comment => {
        sendResponse({ comment });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true; // Will respond asynchronously
  } else if (request.action === 'analyzePost') {
    analyzePost(request.post)
      .then(analysis => {
        sendResponse({ analysis });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

async function generateCommentWithClaude(post, platform, mode = 'normal', length = 'medium', emoji = true, cockyBoost = false, techBoost = false, recipientName = '', thinking = false, customCTA = '', temperature = 0.5) {
  // Get API key, provider, model, and pronoun from storage
  const { apiKey, provider = 'openrouter', model, pronoun = 'I' } = await chrome.storage.sync.get(['apiKey', 'provider', 'model', 'pronoun']);

  if (!apiKey) {
    throw new Error('API key not configured. Please go to settings and add your API key.');
  }

  let systemPrompt = '';
  const pronounPhrase = pronoun === 'we' ? 'our team/company' : 'your own';
  const workPhrase = pronoun === 'we' ? 'work with teams' : 'work with people';

  if (mode === 'sell') {
    systemPrompt = `You're a friendly professional who builds genuine relationships. You're knowledgeable about what ${pronounPhrase} offers, confident in value, and truly interested in helping people. Write like a trusted colleague - warm but professional. Use contractions. Be conversational and human. Share genuine enthusiasm about helping. Sound like someone people want to ${workPhrase}.${!emoji ? ' Do NOT use any emojis.' : ''}`;
  } else if (mode === 'inbox') {
    systemPrompt = `You're warm, genuine, and appreciative when someone reaches out. You take time to understand what they need and acknowledge it. Be personable and human - like you're texting a friend but keeping it professional. Use contractions. Show real interest. Make people feel valued and heard. Sound like someone who genuinely cares.${!emoji ? ' Do NOT use any emojis.' : ''}`;
  } else if (mode === 'engagement-agree') {
    systemPrompt = `You're genuinely interested in what people share and validate their ideas. You make them feel heard and understood. Write like someone who truly values their perspective. Use contractions. Show real appreciation for what they said. Make strong statements of agreement and connection. Sound like someone people trust because you get them.${!emoji ? ' Do NOT use any emojis.' : ''}`;
  } else if (mode === 'engagement-ask') {
    systemPrompt = `You're genuinely interested in what people share and know how to make them feel heard. You engage deeply with ideas and ask thoughtful questions. Write like someone who's truly invested in the conversation. Use contractions. Show genuine curiosity. Build connection through authentic engagement. Sound like someone people love talking with because you actually care about understanding their perspective.${!emoji ? ' Do NOT use any emojis.' : ''}`;
  } else {
    systemPrompt = `You are a knowledgeable person sharing insights. Write like you're talking to a friend - natural, authentic, conversational. Avoid corporate jargon, AI-speak, or anything that sounds like it came from a robot. Use contractions. Be genuine. Use real human language - the way you'd actually comment if you were scrolling on your phone. Skip the flowery language and get to the point. Sound like a person, not an algorithm.${!emoji ? ' Do NOT use any emojis.' : ''}`;
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
  if (mode === 'sell') {
    const sellPhrase = pronoun === 'we'
      ? `"Happy to help if you want to chat" or "We've done similar work - let me know if you want to connect" or "Always down to collaborate"`
      : `"Happy to help if you want to chat" or "I've done similar work - let me know if you want to connect" or "Always down to help"`;
    modeInstruction = `SELL MODE: Mention how ${pronoun === 'we' ? 'you could work together' : 'you could help them'}, but make it feel natural - like you're genuinely offering to help, not pitching. End with something like ${sellPhrase}. Feel organic, not salesy.`;
  } else if (mode === 'inbox') {
    const nameGreeting = recipientName ? `Hi ${recipientName},` : 'Hi,';
    modeInstruction = `INBOX MODE: This is a response to someone who reached out to you first. Start with "${nameGreeting}" Extract from their message what they're looking for or interested in, and acknowledge it. Example format: "${nameGreeting} I see you're looking for [what they want]. [Your offer to help]". Be warm, appreciative, and professional. Make them feel heard. Show genuine interest. End with a clear next step or question to keep the conversation going.`;
  } else if (mode === 'engagement-agree') {
    modeInstruction = `AGREE MODE: Validate and agree with what they shared. Comment on something specific they said to show you really got it. Make them feel understood and appreciated. End with a strong statement of agreement or connection - NO QUESTIONS. This is about making them feel heard and seen.`;
  } else if (mode === 'engagement-ask') {
    modeInstruction = `ENGAGE MODE: Show genuine interest in what they shared. Ask a thoughtful question that shows you really understood their post. Comment on something specific they said - not generic praise. Make them feel like you're genuinely engaged with their ideas. Build connection through real curiosity about their perspective or experience. End with a question to continue the conversation.`;
  } else {
    modeInstruction = `INFORMATIVE MODE: Just share something useful or your honest perspective. No hidden agenda. Help them think deeper or see something they missed. Keep it real.`;
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
    ctaInstruction = `\n\nCUSTOM CTA: End with this call-to-action naturally: "${customCTA}"`;
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
    const body = {
      model: model || 'gpt-4o-mini',
      max_tokens: 300,
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate comment');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    throw new Error('OpenAI API error: ' + (error.message || 'Unknown error'));
  }
}

async function analyzePost(post) {
  const { apiKey, provider = 'openrouter', model } = await chrome.storage.sync.get(['apiKey', 'provider', 'model']);

  if (!apiKey) {
    throw new Error('API key not configured. Please go to settings and add your API key.');
  }

  const systemPrompt = `You are an expert content analyst. Analyze social media posts and provide concise, actionable insights. Return ONLY the formatted HTML analysis, nothing else.`;

  const prompt = `Analyze this social media post and provide insights in this exact HTML format:

<strong>Topic:</strong> [main theme]<br>
<strong>Sentiment:</strong> [positive/neutral/negative]<br>
<strong>Content Type:</strong> [question/story/announcement/discussion/etc]<br>
<strong>Best For:</strong> [Facebook/LinkedIn/Both]<br>
<strong>Key Points:</strong> [1-2 main ideas]<br>
<strong>Response Approach:</strong> [how to best respond]<br>
<strong>Engagement Potential:</strong> [high/medium/low + reason]

Post: "${post}"

Return only the formatted analysis with no extra text.`;

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
    const body = {
      model: model || 'openai/gpt-4o-mini',
      max_tokens: 300,
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
        'X-Title': 'Comment Generator'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate comment');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    throw new Error('OpenRouter API error: ' + (error.message || 'Unknown error'));
  }
}
