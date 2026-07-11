var A = (window.App = window.App || {});
let _archiveCache = [];

A.loadArchive = async function () {
  if (!A.state.ipc) return;
  try {
    const bodyEl = document.getElementById('archiveBody');
    if (!bodyEl) return;
    A.showSkeleton('archiveBody', 5, 'tableRow');
    if (!_archiveCache.length) {
      _archiveCache = await A.cachedInvoke('db:getArchivedCases');
    }
    const q = document.getElementById('searchArchive').value.toLowerCase();
    let list = _archiveCache;
    if (q) list = _archiveCache.filter(c => (c.case_number || '').toLowerCase().includes(q) || (c.title || '').toLowerCase().includes(q));
    A.safeSet(bodyEl, esc =>
      list.length
        ? list
            .map(
              c => `<tr>
          <td><strong>${esc(c.case_number)}</strong></td>
          <td>${esc(c.title)}</td>
          <td>${esc(c.client_name || '-')}</td>
          <td>${esc(c.archived_date || c.created_date || '-')}</td>
          <td><button class="btn-icon case-archive-btn" data-id="${c.id}"><i class="ri-history-line"></i></button></td>
        </tr>`
            )
            .join('')
        : '<tr><td colspan="5" class="archive-empty">' + _t('noArchivedCases') + '</td></tr>'
    );
    bodyEl.querySelectorAll('.case-archive-btn').forEach(b =>
      b.addEventListener('click', async () => {
        const id = parseInt(b.dataset.id, 10);
        if (!id) return;
        b.disabled = true;
        b.innerHTML = '<i class="ri-loader-4-line ri-spin"></i>';
        try {
          const result = await A.mutate('db:unarchiveCase', id);
          if (result && result.error) {
            A.showToast(_t('archiveToggleFailed'), 'error');
            b.disabled = false;
            b.innerHTML = '<i class="ri-history-line"></i>';
          } else {
            A.showToast(_t('caseRestored'), 'success');
            _archiveCache = [];
            A.loadArchive();
          }
        } catch (e) {
          A.logError('unarchive', e);
          b.disabled = false;
          b.innerHTML = '<i class="ri-history-line"></i>';
        }
      })
    );
  } catch (e) {
    A.logError('loadArchive', e);
    A.showError('archiveBody', _t('failedLoadArchive'), () => A.loadArchive());
  }
};

A.initArchive = function () {
  document.getElementById('searchArchive')?.addEventListener('input', A.debounce(() => A.loadArchive(), 250));
};
