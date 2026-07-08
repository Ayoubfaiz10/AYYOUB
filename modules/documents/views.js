var A = (window.App = window.App || {});

A.filterDocs = function () {
  let list = A.state.allDocs;
  const type = document.getElementById('docFilterType')?.value || 'all';
  if (type !== 'all') list = list.filter(d => d.doc_type === type);
  const q = document.getElementById('searchDocs').value.toLowerCase();
  if (q)
    list = list.filter(
      d =>
        (d.filename || '').toLowerCase().includes(q) ||
        (d.doc_type || '').toLowerCase().includes(q) ||
        (d.case_number || '').toLowerCase().includes(q) ||
        (d.tags || '').toLowerCase().includes(q)
    );
  return list;
};

A._renderDocCards = function (displayed, container) {
  A.safeSet(container, esc =>
    displayed.length
      ? displayed
          .map(
            d => `<div class="doc-card-v6" data-click="doc:open:${d.id}">
      <i class="ri-file-4-line doc-card-icon" style="color:${d.doc_type === 'Contract' ? 'var(--success)' : d.doc_type === 'Jugement' ? 'var(--foreground)' : d.doc_type === 'Preuve' ? 'var(--info)' : 'var(--gold)'};"></i>
      <div class="doc-card-title">${esc(d.filename)}</div>
      <div class="doc-card-meta">${esc(d.case_number || '')} · ${d.upload_date ? esc(A.formatDate(d.upload_date)) : ''}</div>
      <div class="doc-card-tags">${(d.tags || '')
        .split(',')
        .filter(Boolean)
        .slice(0, 3)
        .map(t => `<span class="doc-card-tag">${esc(t.trim())}</span>`)
        .join('')}</div>
      <div class="doc-card-footer">
        <span class="badge badge-gold" style="font-size:9px;">${esc(d.doc_type)}</span>
        <div class="doc-card-actions">
          <button data-click="doc:openFile:${d.id}" data-click-stop="true" title="${_t('openBtnTooltip')}"><i class="ri-external-link-line"></i></button>
          <button data-click="doc:open:${d.id}" data-click-stop="true" title="${_t('detailsBtnTooltip')}"><i class="ri-eye-line"></i></button>
          <button data-click="doc:analyze:${d.id}" data-click-stop="true" title="${_t('aiAnalysisBtnTooltip')}" style="color:var(--gold);"><i class="ri-robot-3-line"></i></button>
        </div>
      </div>
    </div>`
          )
          .join('')
      : `<div style="text-align:center;padding:60px 20px;grid-column:1/-1;"><i class="ri-file-4-line" style="font-size:var(--icon-xl);color:var(--border);display:block;margin-bottom:12px;"></i><p style="color:var(--muted-foreground);">${_t('noDocsLabel')}</p></div>`
  );
};

A.renderDocGrid = function () {
  const list = A.filterDocs();
  if (A.state._docScroll) A.state._docScroll.destroy();
  A.state._docScroll = A.VirtualScroll.init('documentsGrid', list, A._renderDocCards, 30);
};

A.renderDocTable = function () {
  const body = document.getElementById('docTableBody');
  const list = A.filterDocs();
  A.safeSet(body, esc =>
    list.length
      ? list
          .map(
            d => `<tr>
      <td><strong style="cursor:pointer;color:var(--foreground);" data-click="doc:open:${d.id}">${esc(d.filename)}</strong></td>
      <td><span class="badge badge-gold">${esc(d.doc_type)}</span></td>
      <td>${esc(d.case_number || '')}</td>
      <td>${esc(d.client_name || '')}</td>
      <td style="font-size:11px;color:var(--muted-foreground);">${d.upload_date ? esc(A.formatDate(d.upload_date)) : ''}</td>
      <td><span class="badge badge-active">${_t('docFinalBadge')}</span></td>
      <td>${
        (d.tags || '')
          .split(',')
          .filter(Boolean)
          .slice(0, 2)
          .map(t => `<span class="doc-card-tag">${esc(t.trim())}</span>`)
          .join('') || '-'
      }</td>
      <td><button class="btn-icon" data-click="doc:open:${d.id}" title="${_t('detailsBtnTooltip')}"><i class="ri-eye-line"></i></button><button class="btn-icon" data-click="doc:analyze:${d.id}" title="${_t('aiAnalysisBtnTooltip')}" style="color:var(--gold);"><i class="ri-robot-3-line"></i></button></td>
    </tr>`
          )
          .join('')
      : `<tr><td colspan="8" style="text-align:center;padding:32px;color:var(--muted-foreground);">${_t('noDocsLabel')}</td></tr>`
  );
};

A.renderDocFolders = function () {
  const container = document.getElementById('docFolderView');
  const groups = {};
  A.state.allDocs.forEach(d => {
    const key = d.case_number || _t('defaultFolderName');
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });
  A.safeSet(
    container,
    esc =>
      Object.entries(groups)
        .map(
          ([
            name,
            docs
          ]) => `<div class="doc-folder-card" data-click="doc:filter:${esc(name)}">
      <i class="ri-folder-5-line doc-folder-icon"></i>
      <div class="doc-folder-name">${esc(name)}</div>
      <div class="doc-folder-count">${_t('docCountLabel').replace('{n}', docs.length)}</div>
    </div>`
        )
        .join('') || `<div style="text-align:center;padding:40px;color:var(--muted-foreground);grid-column:1/-1;">${_t('noFoldersLabel')}</div>`
  );
};
