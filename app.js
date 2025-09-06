// ==== API Key Handling ====
const apiKeyBtn = document.getElementById('apiKeyBtn');
const apiKeyDialog = document.getElementById('apiKeyDialog');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const cancelApiKeyBtn = document.getElementById('cancelApiKeyBtn');

let GEMINI_API_KEY = localStorage.getItem('gemini_api_key') || '';

apiKeyBtn.addEventListener('click', () => {
  apiKeyInput.value = GEMINI_API_KEY;
  apiKeyDialog.showModal();
});

saveApiKeyBtn.addEventListener('click', () => {
  GEMINI_API_KEY = apiKeyInput.value.trim();
  localStorage.setItem('gemini_api_key', GEMINI_API_KEY);
  apiKeyDialog.close();
});

cancelApiKeyBtn.addEventListener('click', () => {
  apiKeyDialog.close();
});

// ==== DOM Elements ====
const generateBtn = document.getElementById('generateBtn');
const loading = document.getElementById('loading');
const imageOutput = document.getElementById('imageOutput');
const generatedImage = document.getElementById('generatedImage');
const outfitId = document.getElementById('outfitId');
const downloadLink = document.getElementById('downloadLink');
const errorEl = document.getElementById('error');
const errorMessage = document.getElementById('errorMessage');

// ==== Generate Outfit ====
generateBtn.addEventListener('click', async () => {
  if (!GEMINI_API_KEY) {
    alert('Please set your Gemini API Key first!');
    return;
  }

  const prompt = document.getElementById('promptInput').value.trim();
  if (!prompt) {
    alert('Please enter an outfit prompt.');
    return;
  }

  loading.classList.remove('hidden');
  imageOutput.classList.add('hidden');
  errorEl.classList.add('hidden');

  try {
    const width = parseInt(document.getElementById('imgW').value, 10) || 1024;
    const height = parseInt(document.getElementById('imgH').value, 10) || 1024;

    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: `${width}x${height}`
      })
    });

    const data = await resp.json();

    if (data?.data?.[0]?.url) {
      generatedImage.src = data.data[0].url;
      outfitId.textContent = Date.now();
      downloadLink.href = data.data[0].url;

      imageOutput.classList.remove('hidden');
    } else {
      throw new Error(JSON.stringify(data));
    }

  } catch (err) {
    console.error(err);
    errorMessage.textContent = err.message || JSON.stringify(err);
    errorEl.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
});
