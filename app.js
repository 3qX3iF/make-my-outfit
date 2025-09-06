// =========================
// Elements
// =========================
const els = {
  apiKeyInput: document.getElementById('apiKey'),
  saveApiKeyBtn: document.getElementById('saveApiKey'),
  clearApiKeyBtn: document.getElementById('clearApiKey'),
  apiKeyDialog: document.getElementById('apiKeyDialog'),
  style: document.getElementById('style'),
  colors: document.getElementById('colors'),
  garmentType: document.getElementById('garmentType'),
  height: document.getElementById('height'),
  heightUnit: document.getElementById('heightUnit'),
  chest: document.getElementById('chest'),
  waist: document.getElementById('waist'),
  hips: document.getElementById('hips'),
  generateBtn: document.getElementById('generateBtn'),
  reviseBtn: document.getElementById('reviseBtn'),
  imageContainer: document.getElementById('imageContainer'),
  outfitHistory: document.getElementById('outfitHistory'),
  loading: document.getElementById('loading'),
  error: document.getElementById('error')
};

// =========================
// API Key Management
// =========================
function getApiKey() {
  return localStorage.getItem('geminiApiKey');
}

function ensureApiKey() {
  const key = getApiKey();
  if (!key) {
    els.apiKeyDialog.showModal();
    return null;
  }
  return key;
}

els.saveApiKeyBtn.addEventListener('click', () => {
  const key = els.apiKeyInput.value.trim();
  if (key) {
    localStorage.setItem('geminiApiKey', key);
    els.apiKeyDialog.close();
  }
});

els.clearApiKeyBtn.addEventListener('click', () => {
  localStorage.removeItem('geminiApiKey');
  els.apiKeyInput.value = '';
});

// =========================
// Helpers
// =========================
function cmToInches(cm) {
  return (cm / 2.54).toFixed(1);
}

function generateOutfitId() {
  return 'outfit-' + Math.random().toString(36).substr(2, 9);
}

function showLoading(show) {
  els.loading.classList.toggle('hidden', !show);
}

function showError(msg) {
  els.error.textContent = msg;
  els.error.classList.remove('hidden');
}

function hideError() {
  els.error.classList.add('hidden');
}

// =========================
// Prompt Builder
// =========================
function buildPrompt() {
  let heightVal = parseFloat(els.height.value);
  if (els.heightUnit.value === 'cm') {
    heightVal = cmToInches(heightVal);
  }

  return `
Generate an outfit design with the following attributes:
- Style: ${els.style.value}
- Colors: ${els.colors.value}
- Garment type: ${els.garmentType.value}
- Measurements (inches):
   Height: ${heightVal}"
   Chest: ${els.chest.value}"
   Waist: ${els.waist.value}"
   Hips: ${els.hips.value}"
Output: photorealistic outfit design.
`;
}

// =========================
// Image Generation (Gemini API)
// =========================
async function generateImage(prompt) {
  const apiKey = ensureApiKey();
  if (!apiKey) return null;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error("Gemini API error: " + response.status);
  }

  const data = await response.json();
  // Extract base64 image from response (assuming Gemini returns it in inline_data)
  const base64Image = data?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;

  if (!base64Image) {
    throw new Error("No image returned from Gemini");
  }

  return base64Image;
}

// =========================
// UI Updates
// =========================
function displayImage(base64Image, outfitId) {
  const img = document.createElement('img');
  img.src = "data:image/png;base64," + base64Image;
  img.alt = "Generated Outfit";

  const downloadBtn = document.createElement('a');
  downloadBtn.href = img.src;
  downloadBtn.download = outfitId + ".png";
  downloadBtn.textContent = "Download";
  downloadBtn.className = "px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700";

  els.imageContainer.innerHTML = '';
  els.imageContainer.appendChild(img);
  els.imageContainer.appendChild(downloadBtn);
}

function addToHistory(outfitId, prompt, base64Image) {
  const history = JSON.parse(localStorage.getItem('outfitHistory') || '[]');
  history.push({ outfitId, prompt, base64Image, timestamp: Date.now() });
  localStorage.setItem('outfitHistory', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('outfitHistory') || '[]');
  els.outfitHistory.innerHTML = '';

  history.slice().reverse().forEach(entry => {
    const div = document.createElement('div');
    div.className = 'border p-2 mb-2 rounded bg-gray-800';

    const img = document.createElement('img');
    img.src = "data:image/png;base64," + entry.base64Image;
    img.className = 'w-20 h-20 object-cover';

    const btn = document.createElement('button');
    btn.textContent = 'View';
    btn.className = 'ml-2 text-sm px-2 py-1 bg-gray-700 rounded hover:bg-gray-600';
    btn.addEventListener('click', () => {
      displayImage(entry.base64Image, entry.outfitId);
    });

    div.appendChild(img);
    div.appendChild(btn);
    els.outfitHistory.appendChild(div);
  });
}

// =========================
// Event Handlers
// =========================
els.generateBtn.addEventListener('click', async () => {
  hideError();
  showLoading(true);
  try {
    const prompt = buildPrompt();
    const base64Image = await generateImage(prompt);
    const outfitId = generateOutfitId();
    displayImage(base64Image, outfitId);
    addToHistory(outfitId, prompt, base64Image);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
});

// (Optional) Revise Button – could reuse last prompt with variation
els.reviseBtn.addEventListener('click', async () => {
  hideError();
  showLoading(true);
  try {
    const prompt = buildPrompt() + "\nPlease make a variation of this design.";
    const base64Image = await generateImage(prompt);
    const outfitId = generateOutfitId();
    displayImage(base64Image, outfitId);
    addToHistory(outfitId, prompt, base64Image);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
});

// =========================
// Service Worker
// =========================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .catch(err => console.error("SW registration failed:", err));
}

// =========================
// Init
// =========================
renderHistory();
