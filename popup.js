const postTextEl = document.getElementById('postText');
const generateBtn = document.getElementById('generateBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const resultContainer = document.getElementById('resultContainer');
const resultEl = document.getElementById('result');
const copyBtn = document.getElementById('copyBtn');
const charCountEl = document.getElementById('charCount');
const errorContainer = document.getElementById('errorContainer');
const errorEl = document.getElementById('error');
const settingsLink = document.getElementById('settingsLink');
const darkModeBtn = document.getElementById('darkModeBtn');
const emojiToggleBtn = document.getElementById('emojiToggleBtn');
const historyBtn = document.getElementById('historyBtn');
const historyContainer = document.getElementById('historyContainer');
const historyList = document.getElementById('historyList');
const emptyHistory = document.getElementById('emptyHistory');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const nameContainer = document.getElementById('nameContainer');
const recipientNameEl = document.getElementById('recipientName');
const customCTAEl = document.getElementById('customCTA');
const analysisContainer = document.getElementById('analysisContainer');
const analysisContent = document.getElementById('analysisContent');
const closeAnalysisBtn = document.getElementById('closeAnalysisBtn');
const toneBtns = document.querySelectorAll('.tone-btn');

function sanitizeHTML(html) {
  const div = document.createElement('div');
  const allowedTags = ['strong', 'br', 'em'];
  const text = html.replace(/<[^>]*>/g, (match) => {
    if (allowedTags.some(tag => match.includes(tag))) return match;
    return '';
  });
  div.textContent = text;
  return div.innerHTML;
}

let selectedPlatform = 'facebook';
let selectedMode = 'normal';
let selectedLength = 'medium';
let selectedEmoji = true;
let cockyBoost = false;
let techBoost = false;
let selectedThinking = false;
let selectedTemperature = 0.5;
let generatedComment = '';
let lastPost = '';
let lastPlatform = '';
let lastMode = '';
let lastLength = '';

// Load preferences - use sync for UI prefs, local for sensitive data
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['darkMode', 'emojiToggle', 'thinking', 'temperature'], (data) => {
    if (data.darkMode) {
      document.body.classList.add('dark-mode');
    }
    if (data.emojiToggle !== undefined) {
      selectedEmoji = data.emojiToggle;
    }
    if (data.thinking !== undefined) {
      selectedThinking = data.thinking;
    }
    if (data.temperature !== undefined) {
      selectedTemperature = data.temperature;
      document.getElementById('temperatureSlider').value = selectedTemperature * 100;
      updateTemperatureLabel();
    }
    updateDarkModeBtn();
    updateEmojiBtn();
  });
});

// Input length limits for security
postTextEl.addEventListener('input', () => {
  const MAX_POST_LENGTH = 10000;
  if (postTextEl.value.length > MAX_POST_LENGTH) {
    postTextEl.value = postTextEl.value.substring(0, MAX_POST_LENGTH);
  }
});

customCTAEl.addEventListener('input', () => {
  const MAX_CTA_LENGTH = 500;
  if (customCTAEl.value.length > MAX_CTA_LENGTH) {
    customCTAEl.value = customCTAEl.value.substring(0, MAX_CTA_LENGTH);
  }
});

// Platform selection
toneBtns.forEach(btn => {
  if (btn.dataset.platform) {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-platform]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPlatform = btn.dataset.platform;
    });
  }
});

// Mode selection
toneBtns.forEach(btn => {
  if (btn.dataset.mode) {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.dataset.mode;

      // Show name field only for inbox mode
      nameContainer.style.display = selectedMode === 'inbox' ? 'block' : 'none';
    });
  }
});

// Boost selection
document.getElementById('cockyBoost').addEventListener('click', (e) => {
  cockyBoost = !cockyBoost;
  e.target.classList.toggle('active');
});

document.getElementById('techBoost').addEventListener('click', (e) => {
  techBoost = !techBoost;
  e.target.classList.toggle('active');
});

// Length selection
toneBtns.forEach(btn => {
  if (btn.dataset.length) {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-length]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedLength = btn.dataset.length;
    });
  }
});

// Temperature/Randomness slider
document.getElementById('temperatureSlider').addEventListener('input', (e) => {
  selectedTemperature = parseInt(e.target.value) / 100;
  chrome.storage.sync.set({ temperature: selectedTemperature });
  updateTemperatureLabel();
});

function updateTemperatureLabel() {
  const slider = document.getElementById('temperatureSlider');
  const value = parseInt(slider.value);
  const label = document.getElementById('temperatureValue');

  if (value < 20) {
    label.textContent = 'Strict';
  } else if (value < 40) {
    label.textContent = 'Conservative';
  } else if (value < 60) {
    label.textContent = 'Balanced';
  } else if (value < 80) {
    label.textContent = 'Creative';
  } else {
    label.textContent = 'Wild';
  }
}

// Dark mode toggle
darkModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  chrome.storage.sync.set({ darkMode: isDark });
  updateDarkModeBtn();
});

// Emoji toggle
emojiToggleBtn.addEventListener('click', () => {
  selectedEmoji = !selectedEmoji;
  chrome.storage.sync.set({ emojiToggle: selectedEmoji });
  updateEmojiBtn();
});

function updateEmojiBtn() {
  if (selectedEmoji) {
    emojiToggleBtn.classList.add('active');
    emojiToggleBtn.textContent = '😊';
  } else {
    emojiToggleBtn.classList.remove('active');
    emojiToggleBtn.textContent = '🚫';
  }
}

// Update dark mode button on load
function updateDarkModeBtn() {
  const isDark = document.body.classList.contains('dark-mode');
  if (isDark) {
    darkModeBtn.classList.add('active');
  } else {
    darkModeBtn.classList.remove('active');
  }
}

// Generate comment
async function generateComment() {
  const postText = postTextEl.value.trim();

  if (!postText) {
    showError('Please paste a post first');
    return;
  }

  generateBtn.disabled = true;
  regenerateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  errorContainer.style.display = 'none';
  resultContainer.style.display = 'none';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generateComment',
      post: postText,
      platform: selectedPlatform,
      mode: selectedMode,
      length: selectedLength,
      emoji: selectedEmoji,
      cockyBoost,
      techBoost,
      recipientName: recipientNameEl.value,
      thinking: selectedThinking,
      customCTA: customCTAEl.value.trim(),
      temperature: selectedTemperature
    });

    if (response.error) {
      showError(response.error);
    } else {
      generatedComment = response.comment;
      lastPost = postText;
      lastPlatform = selectedPlatform;
      lastMode = selectedMode;
      lastLength = selectedLength;
      resultEl.textContent = generatedComment;
      charCountEl.textContent = `${generatedComment.length} characters`;
      resultContainer.style.display = 'block';
      regenerateBtn.style.display = 'inline-block';
    }
  } catch (error) {
    showError('Error generating comment: ' + error.message);
  } finally {
    generateBtn.disabled = false;
    regenerateBtn.disabled = false;
    generateBtn.textContent = 'Generate';
  }
}

generateBtn.addEventListener('click', generateComment);

// Analyze button
analyzeBtn.addEventListener('click', analyzePost);

// Close analysis
closeAnalysisBtn.addEventListener('click', () => {
  analysisContainer.style.display = 'none';
});

// Regenerate button
regenerateBtn.addEventListener('click', generateComment);

// Copy comment
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(generatedComment);
  addToHistory(generatedComment);
  const originalText = copyBtn.textContent;
  copyBtn.textContent = '✅ Copied!';
  setTimeout(() => {
    copyBtn.textContent = originalText;
  }, 2000);
});

// Settings link
settingsLink.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// History toggle
historyBtn.addEventListener('click', () => {
  historyContainer.style.display = historyContainer.style.display === 'none' ? 'block' : 'none';
  if (historyContainer.style.display === 'block') {
    loadHistory();
  }
});

// Clear history
clearHistoryBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (confirm('Clear all comment history?')) {
    chrome.storage.local.set({ commentHistory: [] });
    historyList.innerHTML = '';
    emptyHistory.style.display = 'block';
  }
});

// Load and display history
function loadHistory() {
  chrome.storage.local.get(['commentHistory'], (data) => {
    const history = data.commentHistory || [];
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const recentHistory = history.filter(item => now - item.timestamp < twentyFourHours);

    if (recentHistory.length !== history.length) {
      chrome.storage.local.set({ commentHistory: recentHistory });
    }

    historyList.innerHTML = '';

    if (recentHistory.length === 0) {
      emptyHistory.style.display = 'block';
      return;
    }

    emptyHistory.style.display = 'none';

    recentHistory.reverse().forEach((item) => {
      const timeAgo = getTimeAgo(item.timestamp);
      const div = document.createElement('div');
      div.className = 'history-item';

      const textSpan = document.createElement('span');
      textSpan.className = 'history-item-text';
      textSpan.textContent = item.text.substring(0, 40) + '...';
      textSpan.title = item.text;

      const timeSpan = document.createElement('span');
      timeSpan.className = 'history-item-time';
      timeSpan.textContent = timeAgo;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'history-item-copy';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.text);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 1500);
      });

      div.appendChild(textSpan);
      div.appendChild(timeSpan);
      div.appendChild(copyBtn);
      historyList.appendChild(div);
    });
  });
}

function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return 'yesterday';
}

function addToHistory(comment) {
  chrome.storage.local.get(['commentHistory'], (data) => {
    const history = data.commentHistory || [];
    const MAX_HISTORY_LENGTH = 100;
    if (history.length >= MAX_HISTORY_LENGTH) {
      history.shift();
    }
    history.push({
      text: comment,
      timestamp: Date.now()
    });
    chrome.storage.local.set({ commentHistory: history });
  });
}

function showError(message) {
  errorEl.textContent = message;
  errorContainer.style.display = 'block';
}

// Analyze post
async function analyzePost() {
  const postText = postTextEl.value.trim();

  if (!postText) {
    showError('Please paste a post first');
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing...';
  errorContainer.style.display = 'none';

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'analyzePost',
      post: postText
    });

    if (!response) {
      showError('No response from background. Please check your API key in settings.');
      return;
    }

    if (response.error) {
      showError(response.error);
    } else if (response.analysis) {
      analysisContent.innerHTML = sanitizeHTML(response.analysis);
      analysisContainer.style.display = 'block';
    } else {
      showError('Invalid response from analysis');
    }
  } catch (error) {
    showError('Error analyzing post: ' + error.message);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = '🔍';
  }
}
