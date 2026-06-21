window.App = window.App || {};
const A = window.App;

A.state.aiMode = 'chat';
A.state.aiConfigured = false;
A.state.aiContext = null;
A.state.isAISending = false;

A.initAI = function() {
  const saveKeyBtn = document.getElementById('aiSaveKey');
  const sendBtn = document.getElementById('aiSendBtn');
  const aiInput = document.getElementById('aiInput');
  const aiSetup = document.getElementById('aiSetup');
  const aiChat = document.getElementById('aiChat');
  const apiKeyEl = document.getElementById('aiApiKey');
  if (!saveKeyBtn || !aiInput || !aiSetup || !aiChat || !apiKeyEl) return;

  if (A.state.ipc) {
    A.state.ipc.invoke('ai:getConfig').then(config => {
      if (config.apiKey && !config.apiKey.startsWith('AIza')) {
        apiKeyEl.value = config.apiKey;
        A.state.aiConfigured = true;
        aiSetup.style.display = 'none';
        aiChat.style.display = 'flex';
      } else if (config.apiKey) {
        apiKeyEl.value = '';
        apiKeyEl.placeholder = 'المفتاح القديم غير صالح — ضع مفتاح Groq (gsk_...)';
      }
    });
  }

  saveKeyBtn.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    const key = apiKeyEl.value.trim();
    if (!key) { A.showToast('الرجاء إدخال مفتاح API', 'error'); return; }
    if (key.startsWith('AIza')) { A.showToast('هذا مفتاح Google Gemini. استعمل مفتاح Groq بدله.', 'error'); return; }
    if (key.startsWith('sk-or-')) { A.showToast('هذا مفتاح OpenRouter. استعمل مفتاح Groq بدله.', 'error'); return; }
    await A.mutate('ai:saveConfig', { apiKey: key });
    A.state.aiConfigured = true;
    aiSetup.style.display = 'none';
    aiChat.style.display = 'flex';
  });

  document.getElementById('aiChangeKeyBtn')?.addEventListener('click', () => {
    aiSetup.style.display = 'block';
    aiChat.style.display = 'none';
    apiKeyEl.value = '';
    apiKeyEl.focus();
  });

  document.querySelectorAll('.ai-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ai-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      A.state.aiMode = btn.dataset.mode;
      const modeHints = {
        chat: 'اطرح سؤالك القانوني...',
        summarize: 'الصق النص القانوني للتلخيص...',
        draft: 'صف الوثيقة التي تريد صياغتها...',
        analyze: 'الصق النص للتحليل القانوني...',
        strategy: 'صف الموقف القانوني للتحليل الاستراتيجي...',
        risk: 'صف الموقف لتحديد المخاطر...',
        hearing_prep: 'اختر قضية أو جلسة للتحضير...'
      };
      if (aiInput) aiInput.placeholder = modeHints[btn.dataset.mode] || 'اكتب سؤالك...';
    });
  });

  sendBtn.addEventListener('click', () => A.sendAiMessage());
  aiInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); A.sendAiMessage(); }
  });

  if (A.state.ipc) {
    const floatBtn = document.createElement('button');
    floatBtn.className = 'ai-float-btn';
    A.safeSetStatic(floatBtn, '<i class="ri-robot-3-line"></i>');
    floatBtn.title = 'المساعد الذكي (Ctrl+K)';
    floatBtn.addEventListener('click', () => { A.navigateTo('ai'); });
    document.getElementById('app')?.appendChild(floatBtn);
  }
};

A.setAiContext = function(type, id, label) {
  A.state.aiContext = { type, id, label };
  const bar = document.getElementById('aiContextBar');
  const labelEl = document.getElementById('aiContextLabel');
  if (bar && labelEl) {
    bar.style.display = 'flex';
    labelEl.textContent = `السياق: ${label}`;
  }
  A.navigateTo('ai');
  const modeLabels = { case: '🧠 حلل هذه القضية', client: '👤 حلل هذا الموكل', document: '📄 حلل هذه الوثيقة', hearing: '🎯 جهز لهذه الجلسة' };
  const input = document.getElementById('aiInput');
  if (input) input.placeholder = modeLabels[type] || 'اسأل المساعد الذكي...';
};

A.clearAiContext = function() {
  A.state.aiContext = null;
  const bar = document.getElementById('aiContextBar');
  if (bar) bar.style.display = 'none';
};

A.sendAiMessage = async function() {
  if (!A.state.ipc || !A.state.aiConfigured || A.state.isAISending) {
    if (A.state.isAISending) A.showToast('جاري معالجة رسالة أخرى...', 'info');
    return;
  }
  const input = document.getElementById('aiInput');
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;
  A.state.isAISending = true;
  input.disabled = true;
  try {
    A.addAiMessage('user', msg);
    input.value = '';
    A.addAiMessage('assistant', '...');
    let res;
    if (A.state.aiContext) {
      res = await A.state.ipc.invoke('ai:askContextual', { mode: A.state.aiMode, message: msg, contextType: A.state.aiContext.type, contextId: A.state.aiContext.id });
    } else {
      res = await A.state.ipc.invoke('ai:ask', { mode: A.state.aiMode, message: msg });
    }
    const msgs = document.getElementById('aiMessages');
    if (msgs) {
      if (msgs.lastChild && msgs.lastChild.querySelector('.ai-msg-bubble')?.textContent === '...') {
        msgs.removeChild(msgs.lastChild);
      }
    }
    A.addAiMessage('assistant', res.friendlyError || res.text || 'عذراً، لم أتمكن من معالجة طلبك.');
  } catch (error) {
    A.logError('sendAiMessage', error);
    const msgs = document.getElementById('aiMessages');
    if (msgs) {
      if (msgs.lastChild && msgs.lastChild.querySelector('.ai-msg-bubble')?.textContent === '...') {
        msgs.removeChild(msgs.lastChild);
      }
    }
    A.addAiMessage('assistant', 'حدث خطأ في الاتصال بالمساعد الذكي. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
  } finally {
    A.state.isAISending = false;
    input.disabled = false;
    input.focus();
  }
};

A.addAiMessage = function(role, text) {
  const container = document.getElementById('aiMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg-${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'ai-msg-bubble';
  bubble.textContent = text;
  A.safeSetStatic(div, `<div class="ai-msg-avatar">${role === 'user' ? '👤' : '🤖'}</div>`);
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
};

A.loadSmartInsights = async function() {
  const el = document.getElementById('dashAiInsight');
  if (!el || !A.state.ipc) return;
  try {
    const data = await A.state.ipc.invoke('ai:getSmartInsights');
    if (data) {
      A.safeSet(el, esc => `<div style="margin-bottom:var(--space-2);font-size:var(--font-size-xs);color:var(--gray-500);line-height:1.6;">${esc(data.summary)}</div>
        ${data.insights.map(i => `<div style="display:flex;align-items:center;gap:var(--space-2);padding:6px 0;border-bottom:1px solid var(--gray-50);font-size:var(--font-size-xs);color:var(--gray-600);"><i class="ri-information-line" style="color:var(--gold);font-size:14px;"></i>${esc(i)}</div>`).join('')}`);
    }
  } catch (e) { A.logError('loadSmartInsights', e); el.textContent = '—'; }
};

A.loadAI = async function() {
  if (!A.state.ipc) return;
  if (A.state.aiConfigured) return;
  const setup = document.getElementById('aiSetup');
  if (setup && setup.style.display !== 'none') {
    A.showSkeleton('aiMessages', 3, 'aiMsg');
  }
  try {
    await A.cachedInvoke('ai:getConfig');
  } catch (e) {
    A.logError('loadAI', e);
  }
};

window.setAiContext = A.setAiContext;
window.clearAiContext = A.clearAiContext;
window.loadSmartInsights = A.loadSmartInsights;
