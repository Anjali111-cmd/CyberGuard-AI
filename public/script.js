const $ = id => document.getElementById(id);
const form = $('complaintForm');
const desc = $('complaint');
const msg = $('formMessage');
let selectedEvidence = [];
let recognition = null;
let isListening = false;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

desc.addEventListener('input', () => {
  $('charCount').textContent = `${desc.value.length} / 2000`;
});

// Screenshot selection + preview. These files are previewed in the browser;
// the current backend saves complaint text, not image files.
$('evidence').addEventListener('change', event => {
  const files = [...event.target.files].filter(file => file.type.startsWith('image/'));
  if (files.length > 3) {
    $('voiceStatus').textContent = 'Please select no more than 3 screenshots.';
  }
  selectedEvidence = files.slice(0, 3);
  renderEvidencePreview();
});

function renderEvidencePreview() {
  const preview = $('preview');
  preview.replaceChildren();

  selectedEvidence.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'evidence-item';

    const image = document.createElement('img');
    image.alt = `Evidence screenshot ${index + 1}`;
    image.src = URL.createObjectURL(file);

    const name = document.createElement('small');
    name.textContent = file.name;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-evidence';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      selectedEvidence.splice(index, 1);
      const transfer = new DataTransfer();
      selectedEvidence.forEach(f => transfer.items.add(f));
      $('evidence').files = transfer.files;
      renderEvidencePreview();
    });

    item.append(image, name, remove);
    preview.append(item);
  });
}

// Voice assistant: speech-to-text fills the complaint box.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    $('voiceBtn').textContent = '⏹ Stop speaking';
    $('voiceStatus').textContent = 'Listening… speak clearly.';
  };

  recognition.onresult = event => {
    let finalText = '';
    let interimText = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const phrase = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += phrase + ' ';
      else interimText += phrase;
    }

    if (finalText) {
      desc.value = (desc.value.trim() ? desc.value.trim() + ' ' : '') + finalText.trim();
      desc.dispatchEvent(new Event('input'));
    }
    $('voiceStatus').textContent = interimText ? `Hearing: ${interimText}` : 'Voice captured. Continue or stop when finished.';
  };

  recognition.onerror = event => {
    $('voiceStatus').textContent = `Voice input issue: ${event.error}. You can type your complaint instead.`;
  };

  recognition.onend = () => {
    isListening = false;
    $('voiceBtn').textContent = '🎙️ Speak complaint';
  };

  $('voiceBtn').addEventListener('click', () => {
    if (isListening) recognition.stop();
    else {
      try { recognition.start(); }
      catch { $('voiceStatus').textContent = 'Voice input is already starting. Please wait.'; }
    }
  });
} else {
  $('voiceBtn').disabled = true;
  $('voiceStatus').textContent = 'Speech recognition is not supported in this browser. Try Chrome, or type your complaint.';
}

$('readBtn').addEventListener('click', () => {
  if (!('speechSynthesis' in window)) {
    $('voiceStatus').textContent = 'Read-aloud is not supported in this browser.';
    return;
  }
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(
    'Welcome to CyberGuard AI. Describe what happened in the complaint box. You can use the microphone button to speak. You can select up to three evidence screenshots for preview. Please do not enter passwords, one-time passwords, or bank PINs.'
  );
  speech.lang = 'en-IN';
  window.speechSynthesis.speak(speech);
});

function classify(text) {
  text = text.toLowerCase();
  if (/upi|bank|payment|money|transaction|debit|credit card|atm|transfer/.test(text))
    return { category: 'UPI / Financial Fraud', priority: 'High' };
  if (/phishing|fake link|suspicious link|otp|fake website/.test(text))
    return { category: 'Phishing', priority: 'High' };
  if (/hack|hacked|password stolen|unauthorized access|account compromised/.test(text))
    return { category: 'Account Hacking', priority: 'High' };
  if (/instagram|facebook|social media|whatsapp|telegram|fake profile|impersonation/.test(text))
    return { category: 'Social Media Fraud', priority: 'Medium' };
  return { category: 'Other', priority: 'Low' };
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  msg.textContent = 'Submitting complaint…';

  try {
    const response = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc.value.trim(), ...classify(desc.value) })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Submission failed.');

    msg.textContent = `Complaint registered. Save your ID: ${data.complaintId}. Note: screenshots are preview-only in this version.`;
    $('trackId').value = data.complaintId;
    form.reset();
    selectedEvidence = [];
    $('charCount').textContent = '0 / 2000';
    $('preview').replaceChildren();
    if (recognition && isListening) recognition.stop();
  } catch (error) {
    msg.textContent = error.message;
  }
});

$('trackForm').addEventListener('submit', async event => {
  event.preventDefault();
  const box = $('trackResult');
  box.classList.remove('hidden');
  box.textContent = 'Searching…';

  try {
    const id = $('trackId').value.trim().toUpperCase();
    const response = await fetch('/api/complaints/' + encodeURIComponent(id));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Complaint not found.');

    box.innerHTML = `
      <div class="result-row"><b>Complaint ID</b><span>${esc(data.complaintId)}</span></div>
      <div class="result-row"><b>Category</b><span>${esc(data.category)}</span></div>
      <div class="result-row"><b>Priority</b><span>${esc(data.priority)}</span></div>
      <div class="result-row"><b>Status</b><span class="pill">${esc(data.status)}</span></div>
      <div class="result-row"><b>Submitted</b><span>${esc(new Date(data.createdAt).toLocaleString())}</span></div>`;
  } catch (error) {
    box.textContent = error.message;
  }
});
