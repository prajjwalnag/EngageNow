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
const toneBtns = document.querySelectorAll('.pill-btn');

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
let selectedMode = 'insight';
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
let currentStatsFilter = 'today';
let platformChart = null;
let trendChart = null;
let distributionChart = null;

// Load preferences - use sync for UI prefs, local for sensitive data
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['darkMode', 'emojiToggle', 'thinking', 'temperature', 'platform', 'mode', 'length', 'cockyBoost', 'techBoost', 'customCTA'], (data) => {
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
    if (data.platform) {
      selectedPlatform = data.platform;
      document.querySelectorAll('[data-platform]').forEach(b => {
        b.classList.toggle('active', b.dataset.platform === selectedPlatform);
      });
    }
    if (data.mode) {
      selectedMode = data.mode;
      document.querySelectorAll('[data-mode]').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === selectedMode);
      });
      nameContainer.style.setProperty('display', selectedMode === 'inbox' ? 'block' : 'none', 'important');
    }
    if (data.length) {
      selectedLength = data.length;
      document.querySelectorAll('[data-length]').forEach(b => {
        b.classList.toggle('active', b.dataset.length === selectedLength);
      });
    }
    if (data.cockyBoost) {
      cockyBoost = data.cockyBoost;
      document.getElementById('cockyBoost').classList.add('active');
    }
    if (data.techBoost) {
      techBoost = data.techBoost;
      document.getElementById('techBoost').classList.add('active');
    }
    if (data.customCTA) {
      customCTAEl.value = data.customCTA;
      syncCTAPresets();
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
  chrome.storage.sync.set({ customCTA: customCTAEl.value });
  syncCTAPresets();
});

// CTA preset chips
document.querySelectorAll('.cta-preset').forEach(chip => {
  chip.addEventListener('click', () => {
    const cta = chip.dataset.cta;
    if (customCTAEl.value === cta) {
      customCTAEl.value = '';
    } else {
      customCTAEl.value = cta;
    }
    chrome.storage.sync.set({ customCTA: customCTAEl.value });
    syncCTAPresets();
  });
});

function syncCTAPresets() {
  const current = customCTAEl.value;
  document.querySelectorAll('.cta-preset').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.cta === current);
  });
}

// Platform selection
toneBtns.forEach(btn => {
  if (btn.dataset.platform) {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-platform]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPlatform = btn.dataset.platform;
      chrome.storage.sync.set({ platform: selectedPlatform });
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
      chrome.storage.sync.set({ mode: selectedMode });

      nameContainer.style.display = selectedMode === 'inbox' ? 'block' : 'none';
      nameContainer.style.setProperty('display', selectedMode === 'inbox' ? 'block' : 'none', 'important');
    });
  }
});

// Boost selection
document.getElementById('cockyBoost').addEventListener('click', (e) => {
  cockyBoost = !cockyBoost;
  e.target.classList.toggle('active');
  chrome.storage.sync.set({ cockyBoost });
});

document.getElementById('techBoost').addEventListener('click', (e) => {
  techBoost = !techBoost;
  e.target.classList.toggle('active');
  chrome.storage.sync.set({ techBoost });
});

// Length selection
toneBtns.forEach(btn => {
  if (btn.dataset.length) {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-length]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedLength = btn.dataset.length;
      chrome.storage.sync.set({ length: selectedLength });
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

    console.log('Generate response:', response);

    if (!response) {
      showError('No response from background. Reload the extension and try again.');
      return;
    }

    if (response.error) {
      showError(response.error);
    } else if (response.comment) {
      generatedComment = response.comment;
      lastPost = postText;
      lastPlatform = selectedPlatform;
      lastMode = selectedMode;
      lastLength = selectedLength;
      resultEl.textContent = generatedComment;
      charCountEl.textContent = `${generatedComment.length} characters`;
      resultContainer.style.display = 'block';
      regenerateBtn.style.display = 'inline-block';
    } else {
      showError('Unexpected response. Please try again.');
      console.error('Unexpected response format:', response);
    }
  } catch (error) {
    console.error('Generation error:', error);
    showError('Error: ' + (error.message || 'Unknown error. Check console for details.'));
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

// Regenerate buttons
regenerateBtn.addEventListener('click', generateComment);
document.getElementById('regenBtnAlt').addEventListener('click', generateComment);

// Copy comment
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(generatedComment);
  addToHistory(generatedComment);
  trackCommentStat(selectedPlatform);
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
  const isVisible = historyContainer.style.display === 'block';
  historyContainer.style.display = isVisible ? 'none' : 'block';
  historyBtn.classList.toggle('active', !isVisible);
  if (!isVisible) loadHistory();
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

// Stats tracking
function trackCommentStat(platform) {
  const today = new Date().toISOString().split('T')[0];
  chrome.storage.local.get(['commentStats'], (data) => {
    let stats = data.commentStats || [];
    const existingIndex = stats.findIndex(s => s.date === today && s.platform === platform);

    if (existingIndex >= 0) {
      stats[existingIndex].count += 1;
    } else {
      stats.push({
        date: today,
        platform: platform,
        count: 1
      });
    }

    chrome.storage.local.set({ commentStats: stats });
  });
}

// Load and filter stats
function getFilteredStats(filter) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['commentStats'], (data) => {
      let stats = data.commentStats || [];
      const today = new Date();
      let filtered = [];

      stats.forEach(stat => {
        const statDate = new Date(stat.date);
        const daysAgo = Math.floor((today - statDate) / (1000 * 60 * 60 * 24));

        if (filter === 'today' && daysAgo === 0) {
          filtered.push(stat);
        } else if (filter === 'week' && daysAgo < 7) {
          filtered.push(stat);
        } else if (filter === 'month' && daysAgo < 30) {
          filtered.push(stat);
        } else if (filter === 'all') {
          filtered.push(stat);
        }
      });

      resolve(filtered);
    });
  });
}

const statsLink = document.getElementById('statsLink');
const statsContainer = document.getElementById('statsContainer');
const closeStatsBtn = document.getElementById('closeStatsBtn');
const clearStatsBtn = document.getElementById('clearStatsBtn');
const statsBtns = document.querySelectorAll('.stats-filter-btn');

statsLink.addEventListener('click', () => {
  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded');
    alert('Charts library is loading. Please try again in a moment.');
    return;
  }
  document.getElementById('manualDate').value = new Date().toISOString().split('T')[0];
  statsContainer.style.display = 'block';
  renderStats('today');
});

closeStatsBtn.addEventListener('click', () => {
  statsContainer.style.display = 'none';
  destroyCharts();
});

statsContainer.addEventListener('click', (e) => {
  if (e.target === statsContainer) {
    statsContainer.style.display = 'none';
    destroyCharts();
  }
});

statsBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    if (filter) {
      statsBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderStats(filter);
    }
  });
});

clearStatsBtn.addEventListener('click', () => {
  if (confirm('Clear all statistics? This cannot be undone.')) {
    chrome.storage.local.set({ commentStats: [] });
    statsContainer.style.display = 'none';
    destroyCharts();
  }
});

// Manual stat logging
let manualPlatform = 'facebook';

document.querySelectorAll('[data-manual-platform]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-manual-platform]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    manualPlatform = btn.dataset.manualPlatform;
  });
});

document.getElementById('manualLogBtn').addEventListener('click', () => {
  const date = document.getElementById('manualDate').value;
  const count = Math.max(1, parseInt(document.getElementById('manualCount').value) || 1);

  if (!date) return;

  chrome.storage.local.get(['commentStats'], (data) => {
    const stats = data.commentStats || [];
    const existingIndex = stats.findIndex(s => s.date === date && s.platform === manualPlatform);

    if (existingIndex >= 0) {
      stats[existingIndex].count += count;
    } else {
      stats.push({ date, platform: manualPlatform, count });
    }

    chrome.storage.local.set({ commentStats: stats }, () => {
      const activeFilter = document.querySelector('.stats-filter-btn.active[data-filter]')?.dataset.filter || 'today';
      renderStats(activeFilter);

      const feedback = document.getElementById('manualLogFeedback');
      feedback.style.display = 'block';
      setTimeout(() => { feedback.style.display = 'none'; }, 2000);

      document.getElementById('manualCount').value = 1;
    });
  });
});

function destroyCharts() {
  if (platformChart) platformChart.destroy();
  if (trendChart) trendChart.destroy();
  if (distributionChart) distributionChart.destroy();
}

async function renderStats(filter) {
  const stats = await getFilteredStats(filter);

  console.log('Stats data:', stats, 'Filter:', filter);

  if (!stats || stats.length === 0) {
    document.getElementById('statsTotal').textContent = 'Total: 0 comments';
    document.getElementById('statsBreakdown').textContent = 'No data yet. Start posting comments!';
    destroyCharts();
    return;
  }

  const platforms = ['facebook', 'linkedin', 'x', 'reddit'];
  const platformCounts = {};
  let total = 0;

  platforms.forEach(p => { platformCounts[p] = 0; });
  stats.forEach(s => {
    platformCounts[s.platform] = (platformCounts[s.platform] || 0) + s.count;
    total += s.count;
  });

  document.getElementById('statsTotal').textContent = `Total: ${total} comments`;

  const breakdown = Object.entries(platformCounts)
    .filter(([_, count]) => count > 0)
    .map(([platform, count]) => `${platform}: ${count}`)
    .join(' • ');
  document.getElementById('statsBreakdown').textContent = breakdown || 'No data';

  destroyCharts();
  renderPlatformChart(platformCounts);
  renderTrendChart(stats, filter);
  renderDistributionChart(platformCounts);
}

function renderPlatformChart(platformCounts) {
  try {
    const canvas = document.getElementById('platformChart');
    if (!canvas) {
      console.error('Platform chart canvas not found');
      return;
    }
    const ctx = canvas.getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');
    const colors = {
      facebook: '#1877F2',
      linkedin: '#0A66C2',
      x: isDark ? '#FFFFFF' : '#000000',
      reddit: '#FF4500'
    };
    const textColor = isDark ? '#cbd5e1' : '#374151';
    const gridColor = isDark ? '#404854' : '#e5e7eb';

    platformChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(platformCounts).map(p => p.charAt(0).toUpperCase() + p.slice(1)),
        datasets: [{
          label: 'Comments Posted',
          data: Object.values(platformCounts),
          backgroundColor: Object.keys(platformCounts).map(p => colors[p]),
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: isDark ? '#1a1f2e' : 'rgba(0,0,0,0.8)', titleColor: isDark ? '#e0e0e0' : '#fff', bodyColor: isDark ? '#e0e0e0' : '#fff' }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } },
          x: { ticks: { color: textColor }, grid: { color: gridColor } }
        }
      }
    });
  } catch (error) {
    console.error('Error rendering platform chart:', error);
  }
}

function renderTrendChart(stats, filter) {
  const dateMap = {};
  stats.forEach(s => {
    dateMap[s.date] = (dateMap[s.date] || 0) + s.count;
  });

  const sortedDates = Object.keys(dateMap).sort();
  const ctx = document.getElementById('trendChart').getContext('2d');
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#cbd5e1' : '#374151';
  const gridColor = isDark ? '#404854' : '#e5e7eb';

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        label: 'Daily Comments',
        data: sortedDates.map(d => dateMap[d]),
        borderColor: '#3b82f6',
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: isDark ? '#1a1f2e' : 'rgba(0,0,0,0.8)', titleColor: isDark ? '#e0e0e0' : '#fff', bodyColor: isDark ? '#e0e0e0' : '#fff' }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor } },
        x: { ticks: { color: textColor }, grid: { color: gridColor } }
      }
    }
  });
}

function renderDistributionChart(platformCounts) {
  const ctx = document.getElementById('distributionChart').getContext('2d');
  const isDark = document.body.classList.contains('dark-mode');
  const colors = {
    facebook: '#1877F2',
    linkedin: '#0A66C2',
    x: isDark ? '#FFFFFF' : '#000000',
    reddit: '#FF4500'
  };
  const textColor = isDark ? '#cbd5e1' : '#374151';
  const borderColor = isDark ? '#1a1f2e' : '#fff';

  const labels = Object.keys(platformCounts).filter(p => platformCounts[p] > 0);
  const data = labels.map(p => platformCounts[p]);
  const bgColors = labels.map(p => colors[p]);

  distributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      datasets: [{
        data: data,
        backgroundColor: bgColors,
        borderColor: borderColor,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor } },
        tooltip: { backgroundColor: isDark ? '#1a1f2e' : 'rgba(0,0,0,0.8)', titleColor: isDark ? '#e0e0e0' : '#fff', bodyColor: isDark ? '#e0e0e0' : '#fff' }
      }
    }
  });
}
