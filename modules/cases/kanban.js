var A = (window.App = window.App || {});

A.initKanbanDragDrop = function () {
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', () => {
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });
};
