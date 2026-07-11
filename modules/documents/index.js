var A = (window.App = window.App || {});

A.state.allDocs = [];
A.state.docViewMode = 'grid';
A.state.currentDocViewerId = null;
A.state._docViewerToken = 0;

A.loadDocuments = async function () {
  if (!A.state.ipc) return;
  try {
    A.showSkeleton('documentsGrid', 6, 'docCard');
    A.state.allDocs = (await A.cachedInvoke('db:getAllDocuments')) || [];
    A.renderDocGrid();
    A.renderDocTable();
    A.renderDocFolders();
  } catch (error) {
    A.logError('loadDocuments', error);
    A.showError('documentsGrid', _t('failedLoadDocuments'), () => A.loadDocuments());
  }
};

A.openDocViewer = async function (docId) {
  if (!A.state.ipc || !docId) return;
  const _token = ++A.state._docViewerToken;
  const docs = (await A.cachedInvoke('db:getAllDocuments')) || [];
  if (_token !== A.state._docViewerToken) return;
  const doc = docs.find(d => d && d.id === docId);
  if (!doc) {
    A.showToast(_t('docNotFound'), 'error');
    return;
  }
  if (A.addRecentItem) A.addRecentItem('document', doc.id, doc.filename, (doc.case_number || '') + ' · ' + (doc.doc_type || ''), 'documents');
  A.state.currentDocViewerId = docId;

  const dvTitle = document.getElementById('docViewerTitle');
  if (dvTitle) dvTitle.textContent = doc.filename;
  const dvType = document.getElementById('docViewerType');
  if (dvType) dvType.textContent = doc.doc_type;
  const dvCase = document.getElementById('docVCase');
  if (dvCase) dvCase.textContent = doc.case_number || '—';
  const dvClient = document.getElementById('docVClient');
  if (dvClient) dvClient.textContent = doc.client_name || '—';
  const dvDate = document.getElementById('docVDate');
  if (dvDate) dvDate.textContent = doc.upload_date ? A.formatDate(doc.upload_date) : '—';
  const dvSize = document.getElementById('docVSize');
  if (dvSize) dvSize.textContent = doc.file_size || '—';
  const dvPreview = document.getElementById('docVPreview');
  if (dvPreview) dvPreview.textContent = doc.filename;
  const dvTags = document.getElementById('docVTags');
  if (dvTags)
    A.safeSet(
      dvTags,
      esc =>
        (doc.tags || '')
          .split(',')
          .filter(Boolean)
          .map(t => `<span class="doc-viewer-tag">${esc(t.trim())}</span>`)
          .join('') || `<span style="font-size:12px;color:var(--muted-foreground);">${_t('noTagsLabel')}</span>`
    );
  const dvVersions = document.getElementById('docVVersions');
  if (dvVersions)
    A.safeSetStatic(
      dvVersions,
      `<div class="doc-version-item current"><span class="doc-version-label">${_t('currentVersionLabel')}</span><span class="doc-version-date">${doc.upload_date ? A.formatDate(doc.upload_date) : ''}</span></div>`
    );
  const dvNotes = document.getElementById('docVNotes');
  if (dvNotes) dvNotes.value = doc.notes || '';

  const dvOpen = document.getElementById('docViewerOpen');
  if (dvOpen)
    dvOpen.onclick = async () => {
      try {
        await A.state.ipc.invoke('db:openDocument', docId);
      } catch (e) {
        A.logError('openDoc', e);
        A.showToast(_t('failedOpenFile'), 'error');
      }
    };
  const dvDownload = document.getElementById('docViewerDownload');
  if (dvDownload)
    dvDownload.onclick = async () => {
      try {
        const r = await A.state.ipc.invoke('db:downloadDocument', docId);
        if (r && r.error) A.showToast(r.error, 'error');
        else A.showToast(_t('docDownloaded'), 'success');
      } catch (e) {
        A.logError('downloadDoc', e);
        A.showToast(_t('failedLoadFile'), 'error');
      }
    };
  const dvAnalyze = document.getElementById('docViewerAnalyze');
  if (dvAnalyze)
    dvAnalyze.onclick = () => {
      if (A.analyzeDoc) A.analyzeDoc(docId);
    };
  const dvDelete = document.getElementById('docViewerDelete');
  if (dvDelete)
    dvDelete.onclick = async () => {
      if (!(await A.showConfirm(_t('docDeleteConfirm'), _t('delete'), 'danger'))) return;
      try {
        await A.mutate('db:deleteDocument', docId);
        const overlay = document.getElementById('docViewerOverlay');
        if (overlay) overlay.style.display = 'none';
        A.loadDocuments();
        A.showToast(_t('docDeleted'), 'success');
      } catch (e) {
        A.logError('deleteDocument', e);
        A.showToast(_t('docDeleteFailed'), 'error');
      }
    };
  const dvSaveNotes = document.getElementById('docVSaveNotes');
  if (dvSaveNotes)
    dvSaveNotes.onclick = async () => {
      const notesEl = document.getElementById('docVNotes');
      const notes = notesEl ? notesEl.value : '';
      try {
        await A.mutate('db:updateDocNotes', { id: docId, notes });
        A.showToast(_t('notesSaved'), 'success');
        if (A.AutoSave) A.AutoSave.clear('doc_notes_' + docId);
      } catch (e) {
        A.logError('saveDocNotes', e);
        A.showToast(_t('failedSaveNotes'), 'error');
      }
    };
  const docVNotesEl = document.getElementById('docVNotes');
  if (docVNotesEl && A.AutoSave) {
    docVNotesEl.addEventListener('input', () => {
      if (A.AutoSave) A.AutoSave.markDirty('doc_notes_' + docId);
    });
    A.AutoSave.register('doc_notes_' + docId, {
      getValue: () => document.getElementById('docVNotes')?.value || '',
      setValue: v => {
        const el = document.getElementById('docVNotes');
        if (el) el.value = v;
      },
      indicator: 'docVNotes',
      debounce: 2000
    });
  }

  const overlay = document.getElementById('docViewerOverlay');
  if (overlay) overlay.style.display = 'flex';
};

A.initDocuments = function () {
  document.querySelectorAll('#section-documents .view-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('#section-documents .view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#section-documents .case-view-panel').forEach(p => p.classList.remove('active'));
      const map = { grid: 'docGridPanel', table: 'docTablePanel', folder: 'docFolderPanel' };
      document.getElementById(map[btn.dataset.view])?.classList.add('active');
    })
  );

  document.getElementById('docFilterType')?.addEventListener('change', () => {
    A.renderDocGrid();
    A.renderDocTable();
  });
  document.getElementById('searchDocs')?.addEventListener('input', A.debounce(() => {
    A.renderDocGrid();
    A.renderDocTable();
  }, 250));

  document.getElementById('uploadDocGlobalBtn')?.addEventListener('click', async () => {
    A.showModal(
      _t('uploadDocTitle'),
      `
      <div class="input-group"><label class="input-label">${_t('caseSelectLabel')}</label><select id="uploadDocCase" class="input"><option value="">${_t('selectCasePlaceholder')}</option></select></div>
      <div class="input-group"><label class="input-label">${_t('docTypeLabel')}</label><select id="uploadDocType" class="input"><option value="Contract">${_t('docTypeContract')}</option><option value="Jugement">${_t('docTypeJudgment')}</option><option value="Mémoire">${_t('docTypeResponse')}</option><option value="Preuve">${_t('docTypeEvidence')}</option><option value="Rapport">${_t('docTypeReport')}</option><option value="Facture">${_t('docTypeExpense')}</option><option value="Autre">${_t('docTypeOther')}</option></select></div>
      <div class="input-group"><label class="input-label">${_t('tagsLabel')}</label><input type="text" id="uploadDocTags" class="input" placeholder="${_t('docTagsPlaceholder')}"></div>
      <button id="uploadSelectFileBtn" class="btn btn-primary" style="width:100%;margin-top:var(--spacing-2);padding:12px;"><i class="ri-upload-cloud-2-line"></i> ${_t('selectFileBtn')}</button>
      <p style="font-size:11px;color:var(--muted-foreground);text-align:center;margin-top:var(--spacing-1-5);">${_t('uploadFileLimit')}</p>
    `,
      async () => {},
      _t('cancel')
    );
    const cases = await A.cachedInvoke('db:getAllCases');
    const sel = document.getElementById('uploadDocCase');
    if (sel)
      A.safeSet(
        sel,
        esc =>
          `<option value="">${_t('selectCasePlaceholder')}</option>` +
          cases.map(c => `<option value="${c.id}">${esc(c.case_number)} - ${esc(c.title)}</option>`).join('')
      );
    const btn = document.getElementById('uploadSelectFileBtn');
    if (btn)
      btn.addEventListener('click', async () => {
        const caseId = parseInt(document.getElementById('uploadDocCase')?.value, 10);
        if (!caseId) {
          A.showToast(_t('selectCaseFirst'), 'error');
          return;
        }
        const docType = document.getElementById('uploadDocType')?.value || 'Autre';
        const tags = document.getElementById('uploadDocTags')?.value || '';
        btn.disabled = true;
        btn.textContent = _t('uploadingLabel');
        A.showToast(_t('uploadingToast'), 'info');
        try {
          const result = await A.mutate('db:selectAndUpload', { caseId, docType, tags });
          if (result && result.length) {
            A.hideModal();
            A.loadDocuments();
            A.showToast(_t('uploadSuccess').replace('{n}', result.length), 'success');
          }
        } catch (e) {
          A.logError('docUpload', e);
          A.showToast(_t('uploadError'), 'error');
        }
        btn.disabled = false;
        btn.textContent = _t('selectFileBtn');
      });
  });
};

window.openDocViewer = A.openDocViewer;
