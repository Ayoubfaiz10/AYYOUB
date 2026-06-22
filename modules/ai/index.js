var A = window.App = window.App || {};

A.state.aiMode = 'chat';
A.state.aiConfigured = false;
A.state.aiContext = null;
A.state.isAISending = false;
A.state.aiProvider = 'groq';
A.state.aiModel = '';

const AI_PROVIDER_META = {
  groq: { label: 'مفتاح API (Groq)', placeholder: 'gsk_...', hint: 'احصل على مفتاح مجاني من <a href="https://console.groq.com/keys" target="_blank" style="color:var(--info);">Groq Console</a>', logoBg: '#1a1a2e', logoText: 'G' },
  openai: { label: 'مفتاح API (OpenAI)', placeholder: 'sk-...', hint: 'احصل على مفتاح من <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--info);">OpenAI Dashboard</a>', logoBg: '#10a37f', logoText: 'O' },
  anthropic: { label: 'مفتاح API (Anthropic)', placeholder: 'sk-ant-...', hint: 'احصل على مفتاح من <a href="https://console.anthropic.com/" target="_blank" style="color:var(--info);">Anthropic Console</a>', logoBg: '#d97757', logoText: 'C' },
  gemini: { label: 'مفتاح API (Gemini)', placeholder: 'AIza...', hint: 'احصل على مفتاح مجاني من <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--info);">Google AI Studio</a>', logoBg: '#4285f4', logoText: 'G+' }
};

const AI_MODELS = {
  groq: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-5-sonnet-20241022'],
  gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']
};

function populateModels(provider, selectedModel) {
  const sel = document.getElementById('aiModelSelect');
  if (!sel) return;
  const models = AI_MODELS[provider] || AI_MODELS.groq;
  sel.innerHTML = models.map(m => `<option value="${m}" ${m === selectedModel ? 'selected' : ''}>${m}</option>`).join('');
}

window.selectAiProvider = function(provider) {
  A.state.aiProvider = provider;
  document.querySelectorAll('.ai-provider-btn').forEach(b => b.classList.toggle('active', b.dataset.provider === provider));
  const el = document.getElementById('aiApiKey');
  const label = document.getElementById('aiKeyLabel');
  const hint = document.getElementById('aiSetupHint');
  const meta = AI_PROVIDER_META[provider] || AI_PROVIDER_META.groq;
  if (label) label.textContent = meta.label;
  if (el) el.placeholder = meta.placeholder;
  if (hint) hint.innerHTML = meta.hint;
  populateModels(provider, '');
};

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
      const provider = config.provider || 'groq';
      const model = config.model || '';
      A.state.aiProvider = provider;
      A.state.aiModel = model;
      if (config.apiKey) {
        apiKeyEl.value = config.apiKey;
        A.state.aiConfigured = true;
        aiSetup.style.display = 'none';
        aiChat.style.display = 'flex';
        selectAiProvider(provider);
        if (model) populateModels(provider, model);
      } else {
        selectAiProvider(provider);
        populateModels(provider, '');
      }
    });
  }

  saveKeyBtn.addEventListener('click', async () => {
    if (!A.state.ipc) return;
    const key = apiKeyEl.value.trim();
    const model = document.getElementById('aiModelSelect')?.value || '';
    if (!key) { A.showToast('الرجاء إدخال مفتاح API', 'error'); return; }
    A.state.aiModel = model;
    await A.mutate('ai:saveConfig', { apiKey: key, provider: A.state.aiProvider, model: model });
    A.state.aiConfigured = true;
    aiSetup.style.display = 'none';
    aiChat.style.display = 'flex';
  });

  document.getElementById('aiChangeKeyBtn')?.addEventListener('click', () => {
    aiSetup.style.display = 'block';
    aiChat.style.display = 'none';
    apiKeyEl.value = '';
    apiKeyEl.focus();
    selectAiProvider(A.state.aiProvider);
    populateModels(A.state.aiProvider, A.state.aiModel);
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
  if (!navigator.onLine) { A.showToast('يرجى التحقق من الاتصال بالإنترنت', 'warning'); return; }
  const input = document.getElementById('aiInput');
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;
  A.state.isAISending = true;
  input.disabled = true;
  A.showLoading('aiMessages');
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
    A.hideLoading('aiMessages');
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
  if (!navigator.onLine) { el.textContent = '—'; return; }
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

A.analyzeDoc = async function(docId) {
  if (!A.state.ipc) return;
  A.showModal('تحليل الوثيقة بالذكاء الاصطناعي', '<div id="docAnalysisContent" style="text-align:center;padding:40px;"><i class="ri-loader-4-line ri-spin" style="font-size:32px;color:var(--gold);"></i><p style="margin-top:12px;color:var(--gray-400);">جاري تحليل الوثيقة...</p></div>', null, 'إغلاق');
  try {
    const result = await A.state.ipc.invoke('ai:analyzeDocument', { docId });
    const content = document.getElementById('docAnalysisContent');
    if (!content) return;
    if (result.error) {
      content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--danger);"><i class="ri-alert-line" style="font-size:32px;"></i><p>${A.escapeHtml(result.error)}</p></div>`;
      return;
    }
    const cachedLabel = result.cached ? '<span style="font-size:11px;color:var(--gray-400);">(من الذاكرة المخبأة)</span>' : '';
    const html = result.analysis
      .replace(/=== الخلاصة ===/g, '<h4 style="color:var(--navy);margin:16px 0 8px;font-size:14px;"><i class="ri-quote-text" style="color:var(--gold);"></i> الخلاصة</h4>')
      .replace(/=== النقاط الرئيسية ===/g, '<h4 style="color:var(--navy);margin:16px 0 8px;font-size:14px;"><i class="ri-list-check" style="color:var(--gold);"></i> النقاط الرئيسية</h4>')
      .replace(/=== التوصية القانونية ===/g, '<h4 style="color:var(--navy);margin:16px 0 8px;font-size:14px;"><i class="ri-lightbulb-flash-line" style="color:var(--gold);"></i> التوصية القانونية</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    content.innerHTML = `<div style="text-align:start;font-size:13px;line-height:1.8;color:var(--gray-600);max-height:400px;overflow-y:auto;">${html}</div><div style="text-align:left;margin-top:8px;">${cachedLabel}</div>`;
  } catch (e) {
    A.logError('analyzeDoc', e);
    const content = document.getElementById('docAnalysisContent');
    if (content) content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--danger);"><i class="ri-error-warning-line" style="font-size:32px;"></i><p>حدث خطأ أثناء تحليل الوثيقة</p></div>`;
  }
};

window.setAiContext = A.setAiContext;
window.clearAiContext = A.clearAiContext;
window.loadSmartInsights = A.loadSmartInsights;
window.analyzeDoc = A.analyzeDoc;
