window.App = window.App || {};
const A = window.App;

A.initKanbanDragDrop = function() {
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', () => { card.classList.add('dragging'); });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); });
  });
  document.querySelectorAll('.kanban-col-body').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.parentElement.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => { col.parentElement.classList.remove('drag-over'); });
    col.addEventListener('drop', async (e) => {
      e.preventDefault(); col.parentElement.classList.remove('drag-over');
      const dragging = document.querySelector('.dragging');
      if (!dragging) return;
      const id = parseInt(dragging.dataset?.id);
      if (!id) return;
      const newStatus = col.parentElement.dataset.status;
      try {
        if (newStatus === 'archived') await A.mutate('db:archiveCase', id);
        else if (newStatus) await A.mutate('db:updateCaseStatus', { id, status: newStatus });
        A.showToast('تم تغيير حالة القضية', 'success');
      } catch (e) { A.logError('kanbanDrop', e); A.showToast('فشل تغيير الحالة', 'error'); }
      A.loadCases();
    });
  });
};
