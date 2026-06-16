# Comment Generator Chrome Extension

Generate engaging comments with custom tone (casual or formal) powered by Claude AI.

## Setup Instructions

### 1. Choose Your API Provider

**Option A: OpenRouter** (recommended - supports Claude, GPT, and 100+ models)
- Go to [openrouter.ai](https://openrouter.ai)
- Sign up or log in
- Create an API key (starts with `sk-or-`)

**Option B: OpenAI** (GPT-4, GPT-4o, etc.)
- Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Sign up or log in
- Create an API key (starts with `sk-`)

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select this folder (the one containing `manifest.json`)
5. The extension should appear in your extensions list

### 3. Configure Your Settings

1. Click the extension icon in Chrome's toolbar
2. Click the **⚙️ Add API Key** link
3. **Select provider**: OpenRouter or OpenAI
4. **Paste your API key**
5. **Choose your model**:
   - **OpenRouter**: Claude 3.5 Sonnet, GPT-4o, Haiku, Llama, Mistral, etc.
   - **OpenAI**: GPT-4o, GPT-4 Turbo, GPT-4o Mini, GPT-4, etc.
6. **Choose pronoun preference**:
   - **I** - Solo creator/freelancer
   - **We** - Team/agency
7. **Enable Extended Thinking (optional)**:
   - Check the box to enable extended thinking
   - AI will think through the response before generating
   - Produces better quality but takes slightly longer
8. Click **Save Settings**

## How to Use

1. **Open the extension popup** by clicking its icon
2. **Paste your post** in the text area
3. **Analyze the post (optional)** - Click the 🔍 button to get insights about:
   - Topic and main themes
   - Sentiment (positive/neutral/negative)
   - Content type (question, story, announcement, etc.)
   - Best platform to respond on
   - Response approach
   - Engagement potential
4. **Select platform**:
   - 👍 **Facebook** - Impulsive, emotional, short & punchy (triggers quick reactions)
   - 💼 **LinkedIn** - Long-form, professional, value-driven (builds relationships)

5. **Select base mode**:
   - ℹ️ **Informative** - Share insights & value without sales pitch
   - 💰 **Sell** - Include CTA to work with us (natural, not pushy)
   - 📨 **Inbox** - Respond to inbound messages warmly & professionally
     - *For Inbox:* Enter recipient's name → AI generates: "Hi [Name], I see you're looking for [X]. [Your response]"
   - 👍 **Agree** - Validate and agree with the person (ends with a statement, no question)
     - Perfect for showing genuine support and making them feel understood
   - ❓ **Engage** - Ask thoughtful questions to continue the conversation
     - Reference specific points, show genuine curiosity, end with a question

6. **Add custom CTA (optional)**:
   - Enter your own call-to-action (e.g., "DM for details", "Reply with your thoughts", "Follow for more insights")
   - AI will naturally incorporate it into your comment

7. **Add boosts (optional)**:
   - 😎 **Cocky** - Add confidence & swagger
   - 🤖 **Tech** - Add advanced technical terminology

8. **Select length**:
   - ⚡ **Short** - 1-2 sentences, super punchy
   - 📝 **Medium** - 2-3 sentences (default), balanced
   - 📖 **Long** - 4-6 sentences, more detailed

9. **Customize**:
   - 😊 **Emoji Toggle** - Click to enable/disable emojis
   - 🌙 **Dark Mode** - Click for dark theme
   - 📜 **History** - Click to see recent comments (last 24 hours)

10. **Click Generate Comment**
11. **Regenerate** - Click 🔄 to generate another version
12. **Check length** - See character count before copying
13. **Use History** - Click 📜 to view and copy previous comments
14. **Copy the result** using the copy button

## History Feature

- Saves comments **only when you copy them**
- Keeps comments for **24 hours**
- View copied comments with timestamps (just now, 5m ago, 2h ago, etc.)
- One-click copy from history
- Automatically cleans up old comments (older than 24 hours)
- Click **Clear** to delete all history

## Features

- ✨ AI-powered comment generation (Claude, GPT, Mistral, Llama, etc.)
- 🔍 **Post analysis** - Get insights about topic, sentiment, content type, and best response approach
- 🎯 Platform-specific optimization (Facebook & LinkedIn)
- 💼 Base mode selection (Informative, Sell, Inbox, Agree, or Engage)
- ⚡ Optional boosts (Cocky + Tech combinations)
- 📏 Length control (Short, Medium, Long)
- 🎯 **Custom CTA** - Add your own call-to-action naturally
- 😊 Emoji toggle on/off
- 🌙 Dark mode for night browsing
- 🔄 Regenerate to get another version
- 📜 **Comment history (24 hours)** - View, copy, and reuse recent comments
- 📏 Character counter before copying
- 🤖 Model selection (choose from 10+ models)
- 🧠 **Extended thinking support** - Enable AI to think through responses for higher quality
- 🔒 API key stored securely in Chrome's local storage
- 📋 One-click copy to clipboard
- 🧠 Human-like, authentic tone
- ⚡ Fast comment generation

## Files

- `manifest.json` - Extension configuration
- `popup.html/js` - Main extension popup UI
- `options.html/js` - Settings page for API key
- `background.js` - Service worker handling API calls

## Troubleshooting

**"API key not configured"**
- Go to settings and add your API key

**"Failed to generate comment"**
- Check your API key is correct and matches the provider
- Verify you have API credits (check your provider's dashboard)
- Check your internet connection

**"Invalid API key format"**
- OpenRouter keys start with `sk-or-`
- OpenAI keys start with `sk-`
- Make sure you copied the full key

**Extension not appearing**
- Make sure Developer mode is enabled in Chrome
- Try reloading the extension from chrome://extensions/
