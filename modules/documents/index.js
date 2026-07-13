var A = (window.App = window.App || {});

A.state.allDocs = [];
A.state.docViewMode = 'grid';

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
