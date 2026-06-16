const providerSelect = document.getElementById('provider');
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('model');
const pronounSelect = document.getElementById('pronoun');
const thinkingCheckbox = document.getElementById('thinking');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');
const providerInfo = document.getElementById('providerInfo');

const providerDetails = {
  openrouter: {
    name: 'OpenRouter',
    url: 'https://openrouter.ai',
    prefix: 'sk-or-',
    description: 'Access Claude, GPT, and 100+ other models',
    models: {
      'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet (Best quality)',
      'openai/gpt-4o': 'GPT-4o (Excellent quality)',
      'openai/gpt-4o-mini': 'GPT-4o Mini (Fast & cheap)',
      'anthropic/claude-3.5-haiku': 'Claude 3.5 Haiku (Very fast mini)',
      'meta-llama/llama-3.1-70b': 'Llama 3.1 70b (Fast & smart)',
      'meta-llama/llama-3.1-8b': 'Llama 3.1 8b (Ultra-fast mini)',
      'mistralai/mistral-large': 'Mistral Large (Capable)',
      'mistralai/mistral-7b-instruct': 'Mistral 7b (Fast mini)',
      'meta-llama/llama-2-70b': 'Llama 2 70b (Good quality)'
    }
  },
  openai: {
    name: 'OpenAI',
    url: 'https://platform.openai.com/api-keys',
    prefix: 'sk-',
    description: 'GPT-4, GPT-4o, and other OpenAI models',
    models: {
      'gpt-5.1-mini': 'GPT-5.1 Mini (Latest mini) ⭐⭐',
      'gpt-4o': 'GPT-4o (Best quality)',
      'gpt-4-turbo': 'GPT-4 Turbo (Powerful)',
      'gpt-4o-mini': 'GPT-4o Mini (Fast & cheap)',
      'gpt-4': 'GPT-4 (Previous gen)',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo (Ultra-fast)'
    }
  }
};

// Load saved provider, API key, model, pronoun, and thinking preference on page load
document.addEventListener('DOMContentLoaded', async () => {
  const { provider, apiKey, model, pronoun, thinking } = await chrome.storage.sync.get(['provider', 'apiKey', 'model', 'pronoun', 'thinking']);
  if (provider) {
    providerSelect.value = provider;
  }
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }
  updateProviderInfo();
  populateModels();
  if (model) {
    modelSelect.value = model;
  }
  if (pronoun) {
    pronounSelect.value = pronoun;
  } else {
    pronounSelect.value = 'I';
  }
  if (thinking) {
    thinkingCheckbox.checked = thinking;
  }
});

// Update info and models when provider changes
providerSelect.addEventListener('change', () => {
  updateProviderInfo();
  populateModels();
});

function updateProviderInfo() {
  const provider = providerSelect.value;
  const details = providerDetails[provider];
  providerInfo.innerHTML = `Get an API key at <a href="${details.url}" target="_blank">${details.name}</a>. ${details.description}`;
}

function populateModels() {
  const provider = providerSelect.value;
  const models = providerDetails[provider].models;
  modelSelect.innerHTML = '';

  Object.entries(models).forEach(([modelId, modelName]) => {
    const option = document.createElement('option');
    option.value = modelId;
    option.textContent = modelName;
    modelSelect.appendChild(option);
  });
}

// Save API key and model
saveBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const provider = providerSelect.value;
  const model = modelSelect.value;
  const details = providerDetails[provider];

  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }

  if (!apiKey.startsWith(details.prefix)) {
    showStatus(`Invalid API key format. Should start with ${details.prefix}`, 'error');
    return;
  }

  if (!model) {
    showStatus('Please select a model', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const pronoun = pronounSelect.value;
    const thinking = thinkingCheckbox.checked;
    await chrome.storage.sync.set({ apiKey, provider, model, pronoun, thinking });
    showStatus('✅ Settings saved successfully!', 'success');
    setTimeout(() => {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Settings';
    }, 2000);
  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Settings';
  }
});

// Clear API key
clearBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to delete the API key?')) {
    await chrome.storage.sync.remove('apiKey');
    apiKeyInput.value = '';
    showStatus('API key cleared', 'success');
  }
});

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = 'status ' + type;
  statusEl.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}
