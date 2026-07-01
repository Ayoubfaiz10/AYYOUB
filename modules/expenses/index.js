var A = (window.App = window.App || {});

A.loadExpenses = async function () {
  if (!A.state.ipc) return;
  try {
    A.showSkeleton('expPaymentsBody', 5, 'tableRow');
    const cases = (await A.cachedInvoke('db:getAllCases')) || [];
    let totalHonoraires = 0,
      totalPaid = 0,
      totalExpenses = 0;
    let allPaiements = [];
    for (const c of cases) {
      totalHonoraires += parseFloat(c.total_fees || 0);
      totalExpenses += parseFloat(c.expenses || 0);
      const paiements = (await A.cachedInvoke('db:getPaiements', c.id)) || [];
      paiements.forEach(p => {
        p.case_number = c.case_number;
        allPaiements.push(p);
      });
      totalPaid += paiements.reduce((s, p) => s + parseFloat(p.montant || 0), 0);
    }
    document.getElementById('expTotalHonoraires').textContent = totalHonoraires.toFixed(2);
    document.getElementById('expTotalPaid').textContent = totalPaid.toFixed(2);
    document.getElementById('expTotalRemaining').textContent = (totalHonoraires - totalPaid).toFixed(2);
    document.getElementById('expTotalExpenses').textContent = totalExpenses.toFixed(2);
    allPaiements.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    A.safeSet(document.getElementById('expPaymentsBody'), esc =>
      allPaiements.slice(0, 20).length
        ? allPaiements
            .slice(0, 20)
            .map(
              p =>
                `<tr><td>${esc(A.formatDate(p.date))}</td><td>${esc(p.case_number || '-')}</td><td><strong>${parseFloat(p.montant).toFixed(2)}</strong></td><td>${esc(p.mode_paiement)}</td><td>${esc(p.remarque || '-')}</td></tr>`
            )
            .join('')
        : '<tr><td colspan="5" style="text-align:center;color:var(--muted-foreground);padding:24px;">' + _t('noPayments') + '</td></tr>'
    );
  } catch (e) {
    A.logError('loadExpenses', e);
    A.showError('expPaymentsBody', _t('failedLoadExpenses'), () => A.loadExpenses());
  }
};

A.initExpenses = function () {};
