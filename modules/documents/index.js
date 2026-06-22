var A = window.App = window.App || {};

A.state.allDocs = [];
A.state.docViewMode = 'grid';
A.state.currentDocViewerId = null;

A.loadDocuments = async function() {
  if (!A.state.ipc) return;
  try {
    A.showSkeleton('documentsGrid', 6, 'docCard');
    const cases = await A.cachedInvoke('db:getAllCases');
    const docPromises = (cases || []).map(c => c && c.id ? A.cachedInvoke('db:getDocuments', c.id) : Promise.resolve([]));
    const docResults = await Promise.allSettled(docPromises);
    A.state.allDocs = [];
    docResults.forEach((result, i) => {
      const c = cases[i];
      if (!c) return;
      const docs = result.status === 'fulfilled' && result.value ? result.value : [];
      docs.forEach(doc => { doc.case_number = c.case_number; doc.client_name = c.client_name; A.state.allDocs.push(doc); });
    });
    A.renderDocGrid();
    A.renderDocTable();
    A.renderDocFolders();
  } catch (error) {
    A.logError('loadDocuments', error);
    A.showError('documentsGrid', 'تعذر تحميل الوثائق.', () => A.loadDocuments());
  }
};

A.openDocViewer = async function(docId) {
  if (!A.state.ipc || !docId) return;
  const cases = (await A.cachedInvoke('db:getAllCases')) || [];
  let doc = null;
  for (const c of cases) {
    if (!c || !c.id) continue;
    try {
      const docs = await A.cachedInvoke('db:getDocuments', c.id);
      if (docs && docs.length) {
        const found = docs.find(d => d && d.id === docId);
        if (found) { doc = { ...found, case_number: c.case_number, client_name: c.client_name }; break; }
      }
    } catch (e) { /* skip */ }
  }
  if (!doc) { A.showToast('لم يتم العثور على الوثيقة', 'error'); return; }
  if (A.addRecentItem) A.addRecentItem('document', doc.id, doc.filename, (doc.case_number||'') + ' · ' + (doc.doc_type||''), 'documents');
  A.state.currentDocViewerId = docId;

  document.getElementById('docViewerTitle').textContent = doc.filename;
  document.getElementById('docViewerType').textContent = doc.doc_type;
  document.getElementById('docVCase').textContent = doc.case_number || '—';
  document.getElementById('docVClient').textContent = doc.client_name || '—';
  document.getElementById('docVDate').textContent = doc.upload_date ? A.formatDate(doc.upload_date) : '—';
  document.getElementById('docVSize').textContent = doc.file_size || '—';
  document.getElementById('docVPreview').textContent = doc.filename;
  A.safeSet(document.getElementById('docVTags'), esc => (doc.tags||'').split(',').filter(Boolean).map(t => `<span class="doc-viewer-tag">${esc(t.trim())}</span>`).join('') || '<span style="font-size:12px;color:var(--gray-400);">لا توجد</span>');
  A.safeSetStatic(document.getElementById('docVVersions'), `<div class="doc-version-item current"><span class="doc-version-label">الإصدار الحالي</span><span class="doc-version-date">${doc.upload_date ? A.formatDate(doc.upload_date) : ''}</span></div>`);
  document.getElementById('docVNotes').value = doc.notes || '';

  document.getElementById('docViewerOpen').onclick = async () => { try { await A.state.ipc.invoke('db:openDocument', docId); } catch (e) { A.logError('openDoc', e); A.showToast('تعذر فتح الملف', 'error'); } };
  document.getElementById('docViewerDownload').onclick = async () => { try { await A.state.ipc.invoke('db:openDocument', docId); } catch (e) { A.logError('downloadDoc', e); A.showToast('تعذر تحميل الملف', 'error'); } };
  document.getElementById('docViewerAnalyze').onclick = () => { A.analyzeDoc(docId); };
  document.getElementById('docVSaveNotes').onclick = async () => {
    const notes = document.getElementById('docVNotes').value;
    try { await A.mutate('db:updateDocNotes', { id: docId, notes }); A.showToast('تم حفظ الملاحظات', 'success'); if (A.AutoSave) A.AutoSave.clear('doc_notes_' + docId); } catch (e) { A.logError('saveDocNotes', e); A.showToast('فشل حفظ الملاحظات', 'error'); }
  };
  const docVNotesEl = document.getElementById('docVNotes');
  if (docVNotesEl && A.AutoSave) {
    docVNotesEl.addEventListener('input', () => { if (A.AutoSave) A.AutoSave.markDirty('doc_notes_' + docId); });
    A.AutoSave.register('doc_notes_' + docId, {
      getValue: () => document.getElementById('docVNotes')?.value || '',
      setValue: (v) => { const el = document.getElementById('docVNotes'); if (el) el.value = v; },
      indicator: 'docVNotes',
      debounce: 2000
    });
  }

  document.getElementById('docViewerOverlay').style.display = 'flex';
};

A.initDocuments = function() {
  document.querySelectorAll('#section-documents .view-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('#section-documents .view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('#section-documents .case-view-panel').forEach(p => p.classList.remove('active'));
    const map = { grid: 'docGridPanel', table: 'docTablePanel', folder: 'docFolderPanel' };
    document.getElementById(map[btn.dataset.view]).classList.add('active');
  }));

  document.getElementById('docFilterType').addEventListener('change', () => { A.renderDocGrid(); A.renderDocTable(); });
  document.getElementById('searchDocs').addEventListener('input', () => { A.renderDocGrid(); A.renderDocTable(); });

  document.getElementById('uploadDocGlobalBtn').addEventListener('click', () => {
    A.showModal('رفع وثيقة', `
      <div class="input-group"><label class="input-label">القضية</label><select id="uploadDocCase" class="input"><option value="">اختر القضية...</option></select></div>
      <div class="input-group"><label class="input-label">النوع</label><select id="uploadDocType" class="input"><option value="Contract">عقد</option><option value="Jugement">حكم</option><option value="Mémoire">مذكرة</option><option value="Preuve">دليل</option><option value="Rapport">تقرير</option><option value="Facture">فاتورة</option><option value="Autre">أخرى</option></select></div>
      <div class="input-group"><label class="input-label">الوسوم (مفصولة بفواصل)</label><input type="text" id="uploadDocTags" class="input" placeholder="عاجل، سري، مهم"></div>
      <button id="uploadSelectFileBtn" class="btn btn-primary" style="width:100%;margin-top:var(--space-3);padding:12px;"><i class="ri-upload-cloud-2-line"></i> اختيار ملف ورفعه</button>
      <p style="font-size:11px;color:var(--gray-400);text-align:center;margin-top:var(--space-2);">PDF, DOC, DOCX, JPG, PNG, TXT — حد أقصى 50 MB</p>
    `, async () => { /* handled by upload button */ }, 'إلغاء');
    (async () => {
      const cases = await A.cachedInvoke('db:getAllCases');
      const sel = document.getElementById('uploadDocCase');
      if (sel) A.safeSet(sel, esc => '<option value="">اختر القضية...</option>' + cases.map(c => `<option value="${c.id}">${esc(c.case_number)} - ${esc(c.title)}</option>`).join(''));
    })();
    setTimeout(() => {
      const btn = document.getElementById('uploadSelectFileBtn');
      if (btn) btn.addEventListener('click', async () => {
        const caseId = parseInt(document.getElementById('uploadDocCase')?.value);
        if (!caseId) { A.showToast('اختر القضية أولاً', 'error'); return; }
        const docType = document.getElementById('uploadDocType')?.value || 'Autre';
        const tags = document.getElementById('uploadDocTags')?.value || '';
        btn.disabled = true; btn.textContent = 'جاري الرفع...';
        A.showToast('جاري رفع الملف...', 'info');
        try {
          const result = await A.mutate('db:selectAndUpload', { caseId, docType, tags });
          if (result && result.length) { A.hideModal(); A.loadDocuments(); A.showToast(`تم رفع ${result.length} ملف بنجاح`, 'success'); }
        } catch (e) { A.logError('docUpload', e); A.showToast('حدث خطأ أثناء الرفع', 'error'); }
        btn.disabled = false; btn.textContent = ' اختيار ملف ورفعه';
      });
    }, 200);
  });
};

window.openDocViewer = A.openDocViewer;
