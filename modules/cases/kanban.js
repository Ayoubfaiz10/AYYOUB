var A = (window.App = window.App || {});

A.initKanbanDragDrop = function () {
  const board = document.querySelector('#casesKanbanView .kanban-board-full');
  if (!board || board.dataset._kanbanDrag) return;
  board.dataset._kanbanDrag = '1';
  board.addEventListener('dragstart', e => {
    const card = e.target.closest('.kanban-card');
    if (card) card.classList.add('dragging');
  });
  board.addEventListener('dragend', e => {
    const card = e.target.closest('.kanban-card');
    if (card) card.classList.remove('dragging');
  });
};
