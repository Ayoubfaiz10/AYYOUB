var A = (window.App = window.App || {});

A.loadArchive = async function () {
  if (!A.state.ipc) return;
  try {
    A.showSkeleton('archiveBody', 5, 'tableRow');
    const archived = await A.cachedInvoke('db:getArchivedCases');
    const q = document.getElementById('searchArchive').value.toLowerCase();
    let list = archived;
    if (q) list = list.filter(c => (c.case_number || '').toLowerCase().includes(q) || (c.title || '').toLowerCase().includes(q));
    A.safeSet(document.getElementById('archiveBody'), esc =>
      list.length
        ? list
            .map(
              c => `<tr>
          <td><strong>${esc(c.case_number)}</strong></td>
          <td>${esc(c.title)}</td>
          <td>${esc(c.client_name || '-')}</td>
          <td>${esc(c.created_date || '-')}</td>
          <td><button class="btn-icon case-archive-btn" data-id="${c.id}"><i class="ri-history-line"></i></button></td>
        </tr>`
            )
            .join('')
        : '<tr><td colspan="5" style="text-align:center;color:var(--muted-foreground);padding:24px;">' + _t('noArchivedCases') + '</td></tr>'
    );
    document
      .getElementById('archiveBody')
      .querySelectorAll('.case-archive-btn')
      .forEach(b =>
        b.addEventListener('click', async () => {
          const result = await A.mutate('db:unarchiveCase', parseInt(b.dataset.id, 10));
          if (result && result.error) {
            A.showToast(_t('archiveToggleFailed'), 'error');
          } else {
            A.showToast(_t('caseRestored'), 'success');
            A.loadArchive();
          }
        })
      );
  } catch (e) {
    A.logError('loadArchive', e);
    A.showError('archiveBody', _t('failedLoadArchive'), () => A.loadArchive());
  }
};

A.initArchive = function () {
  document.getElementById('searchArchive')?.addEventListener('input', () => A.loadArchive());
};
