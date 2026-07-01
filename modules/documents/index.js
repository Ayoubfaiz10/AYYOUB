var A = (window.App = window.App || {});

A.state.allDocs = [];
A.state.docViewMode = 'grid';
A.state.currentDocViewerId = null;

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
  const docs = (await A.cachedInvoke('db:getAllDocuments')) || [];
  const doc = docs.find(d => d && d.id === docId);
  if (!doc) {
    A.showToast(_t('docNotFound'), 'error');
    return;
  }
  if (A.addRecentItem) A.addRecentItem('document', doc.id, doc.filename, (doc.case_number || '') + ' · ' + (doc.doc_type || ''), 'documents');
  A.state.currentDocViewerId = docId;

  document.getElementById('docViewerTitle').textContent = doc.filename;
  document.getElementById('docViewerType').textContent = doc.doc_type;
  document.getElementById('docVCase').textContent = doc.case_number || '—';
  document.getElementById('docVClient').textContent = doc.client_name || '—';
  document.getElementById('docVDate').textContent = doc.upload_date ? A.formatDate(doc.upload_date) : '—';
  document.getElementById('docVSize').textContent = doc.file_size || '—';
  document.getElementById('docVPreview').textContent = doc.filename;
  A.safeSet(
    document.getElementById('docVTags'),
    esc =>
      (doc.tags || '')
        .split(',')
        .filter(Boolean)
        .map(t => `<span class="doc-viewer-tag">${esc(t.trim())}</span>`)
        .join('') || `<span style="font-size:12px;color:var(--muted-foreground);">${_t('noTagsLabel')}</span>`
  );
  A.safeSetStatic(
    document.getElementById('docVVersions'),
    `<div class="doc-version-item current"><span class="doc-version-label">${_t('currentVersionLabel')}</span><span class="doc-version-date">${doc.upload_date ? A.formatDate(doc.upload_date) : ''}</span></div>`
  );
  document.getElementById('docVNotes').value = doc.notes || '';

  document.getElementById('docViewerOpen').onclick = async () => {
    try {
      await A.state.ipc.invoke('db:openDocument', docId);
    } catch (e) {
      A.logError('openDoc', e);
      A.showToast(_t('failedOpenFile'), 'error');
    }
  };
  document.getElementById('docViewerDownload').onclick = async () => {
    try {
      const r = await A.state.ipc.invoke('db:downloadDocument', docId);
      if (r && r.error) A.showToast(r.error, 'error');
      else A.showToast(_t('docDownloaded'), 'success');
    } catch (e) {
      A.logError('downloadDoc', e);
      A.showToast(_t('failedLoadFile'), 'error');
    }
  };
  document.getElementById('docViewerAnalyze').onclick = () => {
    A.analyzeDoc(docId);
  };
  document.getElementById('docViewerDelete').onclick = async () => {
    if (!(await A.showConfirm(_t('docDeleteConfirm'), _t('delete'), 'danger'))) return;
    try {
      await A.mutate('db:deleteDocument', docId);
      document.getElementById('docViewerOverlay').style.display = 'none';
      A.loadDocuments();
      A.showToast(_t('docDeleted'), 'success');
    } catch (e) {
      A.logError('deleteDocument', e);
      A.showToast(_t('docDeleteFailed'), 'error');
    }
  };
  document.getElementById('docVSaveNotes').onclick = async () => {
    const notes = document.getElementById('docVNotes').value;
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

  document.getElementById('docViewerOverlay').style.display = 'flex';
};

A.initDocuments = function () {
  document.querySelectorAll('#section-documents .view-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('#section-documents .view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#section-documents .case-view-panel').forEach(p => p.classList.remove('active'));
      const map = { grid: 'docGridPanel', table: 'docTablePanel', folder: 'docFolderPanel' };
      document.getElementById(map[btn.dataset.view]).classList.add('active');
    })
  );

  document.getElementById('docFilterType').addEventListener('change', () => {
    A.renderDocGrid();
    A.renderDocTable();
  });
  document.getElementById('searchDocs').addEventListener('input', () => {
    A.renderDocGrid();
    A.renderDocTable();
  });

  document.getElementById('uploadDocGlobalBtn').addEventListener('click', () => {
    A.showModal(
      _t('uploadDocTitle'),
      `
      <div class="input-group"><label class="input-label">${_t('caseSelectLabel')}</label><select id="uploadDocCase" class="input"><option value="">${_t('selectCasePlaceholder')}</option></select></div>
      <div class="input-group"><label class="input-label">${_t('docTypeLabel')}</label><select id="uploadDocType" class="input"><option value="Contract">${_t('docTypeContract')}</option><option value="Jugement">${_t('docTypeJudgment')}</option><option value="Mémoire">${_t('docTypeResponse')}</option><option value="Preuve">${_t('docTypeEvidence')}</option><option value="Rapport">${_t('docTypeReport')}</option><option value="Facture">${_t('docTypeExpense')}</option><option value="Autre">${_t('docTypeOther')}</option></select></div>
      <div class="input-group"><label class="input-label">${_t('tagsLabel')}</label><input type="text" id="uploadDocTags" class="input" placeholder="${_t('docTagsPlaceholder')}"></div>
      <button id="uploadSelectFileBtn" class="btn btn-primary" style="width:100%;margin-top:var(--spacing-2);padding:12px;"><i class="ri-upload-cloud-2-line"></i> ${_t('selectFileBtn')}</button>
      <p style="font-size:11px;color:var(--muted-foreground);text-align:center;margin-top:var(--spacing-1-5);">${_t('uploadFileLimit')}</p>
    `,
      async () => {
        /* handled by upload button */
      },
      _t('cancel')
    );
    (async () => {
      const cases = await A.cachedInvoke('db:getAllCases');
      const sel = document.getElementById('uploadDocCase');
      if (sel)
        A.safeSet(
          sel,
          esc =>
            `<option value="">${_t('selectCasePlaceholder')}</option>` +
            cases.map(c => `<option value="${c.id}">${esc(c.case_number)} - ${esc(c.title)}</option>`).join('')
        );
    })();
    setTimeout(() => {
      const btn = document.getElementById('uploadSelectFileBtn');
      if (btn)
        btn.addEventListener('click', async () => {
          const caseId = parseInt(document.getElementById('uploadDocCase')?.value);
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
    }, 200);
  });
};

window.openDocViewer = A.openDocViewer;
