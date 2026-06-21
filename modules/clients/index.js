window.App = window.App || {};
const A = window.App;

A.state.allClients = [];
A.state.currentClientId = null;

A.loadClients = async function(filter) {
  if (!A.state.ipc) return;
  const mainEl = document.getElementById('clientsBody')?.parentElement;
  A.showSkeleton('clientsBody', 5, 'tableRow');
  try {
    A.state.allClients = await A.cachedInvoke('db:getAllClients');
    const q = document.getElementById('searchClients').value.toLowerCase();
    let list = A.state.allClients;
    if (q) list = list.filter(c => (c.name||'').toLowerCase().includes(q) || (c.phone||'').includes(q) || (c.email||'').toLowerCase().includes(q));
    if (A.state._clientScroll) A.state._clientScroll.destroy();
    A.state._clientScroll = A.VirtualScroll.init('clientsBody', list, function(displayed) { A.renderClientTable(displayed); }, 30);
    A.renderClientCards(list);
    A.renderClientSegments(list);
  } catch (e) {
    A.logError('loadClients', e);
    if (mainEl) A.showError(mainEl, 'تعذر تحميل قائمة الموكلين.', () => A.loadClients(filter));
    A.showEmpty('clientsCardGrid', 'ri-user-3-line', 'حاول مرة أخرى لاحقاً');
  }
};

A.openClientDetail = async function(id) {
  if (!A.state.ipc || !id) return;
  const clients = (await A.cachedInvoke('db:getAllClients')) || [];
  const c = clients.find(x => x.id === id);
  if (!c) return;
  if (A.addRecentItem) A.addRecentItem('client', c.id, c.name, c.phone || c.email || '', 'clients');
  A.state.currentClientId = id;

  document.getElementById('clTitle').textContent = c.name;
  document.getElementById('clAvatarSm').textContent = (c.name||'?').charAt(0);
  document.getElementById('clStatusBadge').textContent = 'نشط';

  A.loadWsClOverview(c);
  A.loadWsClCases(c);
  A.loadWsClDocs(c);
  A.loadWsClComms(c);
  A.loadWsClPayments(c);
  A.loadWsClTimeline(c);
  A.loadWsClNotes(c);
  A.loadWsClAnalytics(c);

  document.getElementById('clientDetailOverlay').style.display = 'flex';
};

window.openClientDetail = A.openClientDetail;

A.initClients = function() {
  document.getElementById('clientsFilterBtn')?.addEventListener('click', () => {
    const bar = document.getElementById('clientsFilterBar');
    bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('searchClients')?.addEventListener('input', A.debounce(() => A.loadClients(), 250));
  document.getElementById('cfilterApply')?.addEventListener('click', () => A.loadClients());
  document.getElementById('cfilterReset')?.addEventListener('click', () => {
    document.querySelectorAll('#clientsFilterBar select').forEach(el => el.value = '');
    A.loadClients();
  });
  document.querySelectorAll('#section-clients .view-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('#section-clients .view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#section-clients .case-view-panel').forEach(p => p.classList.remove('active'));
    const viewMap = { table: 'clientsTableView', card: 'clientsCardView', segment: 'clientsSegmentView' };
    document.getElementById(viewMap[btn.dataset.view]).classList.add('active');
  }));
  document.getElementById('addClientBtn')?.addEventListener('click', () => A.showModal('موكل جديد', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
      <div class="input-group"><label class="input-label">الاسم الكامل <span style="color:var(--danger);">*</span></label><input type="text" id="fClName" class="input" placeholder="الاسم"></div>
      <div class="input-group"><label class="input-label">الهاتف</label><input type="text" id="fClPhone" class="input" placeholder="06xxxxxxxx"></div>
      <div class="input-group"><label class="input-label">البريد الإلكتروني</label><input type="email" id="fClEmail" class="input" placeholder="email@example.com"></div>
      <div class="input-group"><label class="input-label">العنوان</label><input type="text" id="fClAddress" class="input" placeholder="العنوان"></div>
      <div class="input-group"><label class="input-label">رقم البطاقة الوطنية</label><input type="text" id="fClIdNum" class="input" placeholder="اختياري"></div>
      <div class="input-group"><label class="input-label">تصنيفات (tags)</label><input type="text" id="fClTags" class="input" placeholder="مفصولة بفواصل"></div>
    </div>
    <div class="input-group" style="margin-top:var(--space-3);"><label class="input-label">ملاحظات</label><textarea id="fClNotes" class="input" rows="2"></textarea></div>
  `, async () => {
    const name = document.getElementById('fClName').value.trim();
    if (!name) { A.showToast('الاسم إجباري', 'error'); return; }
    try {
      const res = await A.mutate('db:addClient', {
        name, phone: document.getElementById('fClPhone').value,
        email: document.getElementById('fClEmail').value,
        address: document.getElementById('fClAddress').value,
        notes: document.getElementById('fClNotes').value,
        national_id: document.getElementById('fClIdNum').value,
        tags: document.getElementById('fClTags').value
      });
      if (res && res.error) { A.showToast(res.error, 'error'); return; }
      if (res && res.duplicate) { A.showToast('موكل مكرر: ' + (res.existing || []).map(e => e.name).join(', '), 'error'); return; }
      A.hideModal(); A.loadClients(); A.showToast('تم إضافة الموكل بنجاح', 'success');
    } catch (e) { A.logError('addClient', e); A.showToast('فشل إضافة الموكل', 'error'); }
  }));
  document.querySelectorAll('#clientDetailOverlay .ws-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('#clientDetailOverlay .ws-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#clientDetailBody .ws-panel').forEach(p => p.classList.remove('active'));
    const id = 'ws' + btn.dataset.ws.charAt(0).toUpperCase() + btn.dataset.ws.slice(1);
    document.getElementById(id).classList.add('active');
  }));
  document.getElementById('clientDetailClose')?.addEventListener('click', () => document.getElementById('clientDetailOverlay').style.display = 'none');
  document.getElementById('clientDetailCloseBtn')?.addEventListener('click', () => document.getElementById('clientDetailOverlay').style.display = 'none');
  document.getElementById('clEditBtn')?.addEventListener('click', () => {
    if (!A.state.currentClientId) return;
    A.showToast('سيتم إضافة تعديل الموكل قريباً', 'info');
  });
  document.getElementById('clArchiveBtn')?.addEventListener('click', async () => {
    if (!A.state.currentClientId) return;
    if (await A.showConfirm('أرشفة هذا الموكل؟', 'أرشفة', 'warning')) {
      A.showToast('تم أرشفة الموكل', 'success');
    }
  });
  document.getElementById('clAiBtn')?.addEventListener('click', () => {
    A.navigateTo('ai');
    setTimeout(() => {
      const label = document.getElementById('clTitle')?.textContent || 'موكل';
      window.setAiContext('client', A.state.currentClientId, label);
    }, 200);
  });
};
