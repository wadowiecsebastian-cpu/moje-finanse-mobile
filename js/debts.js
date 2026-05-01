(function () {
  const state = { filter: "all", search: "", status: "active" };

  function debtTone(type) {
    return {
      loan: "purple",
      "credit-card": "red",
      "private-loan": "orange",
      "lent-out": "blue",
      obligation: "orange"
    }[type] || "neutral";
  }

  function filteredDebts(data) {
    const query = state.search.trim().toLowerCase();
    return (data.debts || [])
      .filter((debt) => state.filter === "all" || debt.type === state.filter)
      .filter((debt) => state.status === "all" || debt.status === state.status)
      .filter((debt) => !query || [debt.name, debt.type, debt.creditorDebtor, debt.status].join(" ").toLowerCase().includes(query));
  }

  function debtStats(data) {
    const active = (data.debts || []).filter((debt) => debt.status !== "paid");
    const total = active.reduce((sum, debt) => sum + FinanceStorage.normalizeAmount(debt.remainingAmount), 0);
    const period = FinanceStorage.periodBounds();
    const dueThisMonth = active
      .filter((debt) => debt.nextPaymentDate && debt.nextPaymentDate >= period.start && debt.nextPaymentDate <= period.end)
      .reduce((sum, debt) => sum + FinanceStorage.normalizeAmount(debt.minimumPayment), 0);
    const averageInterest = active.length
      ? active.reduce((sum, debt) => sum + FinanceStorage.normalizeAmount(debt.interestRate), 0) / active.length
      : 0;
    return [
      { label: "Łączne zobowiązania", value: `-${App.formatMoney(total)}`, sub: "Do spłaty", icon: "wallet", color: "#ff5d52", valueClass: "money-negative" },
      { label: "Do spłaty w tym miesiącu", value: `-${App.formatMoney(dueThisMonth)}`, sub: `${active.filter((debt) => debt.nextPaymentDate && debt.nextPaymentDate >= period.start && debt.nextPaymentDate <= period.end).length} płatności`, icon: "history", color: "#ff9f2f", valueClass: "money-orange" },
      { label: "Średnie oprocentowanie", value: `${averageInterest.toFixed(1).replace(".", ",")}%`, sub: "Ważone", icon: "percent", color: "#c278ff", valueClass: "money-purple" },
      { label: "Liczba zobowiązań", value: String(active.length), sub: "Aktywne długi", icon: "entries", color: "#4d9bff", valueClass: "money-blue" }
    ].map(App.statCard).join("");
  }

  function renderDebts() {
    const data = FinanceStorage.getData();
    const debts = filteredDebts(data);
    const tabs = [
      ["all", "Wszystkie"],
      ["loan", "Kredyty"],
      ["credit-card", "Karty kredytowe"],
      ["private-loan", "Pożyczki"],
      ["lent-out", "Pożyczone innym"],
      ["obligation", "Zobowiązania"]
    ].map(([key, label]) => `<button class="tab ${state.filter === key ? "active" : ""}" type="button" data-filter="${key}">${label}</button>`).join("");

    const rows = debts.map((debt) => `
      <tr>
        <td>
          <div class="entity-cell">${App.iconBox(debt.type === "credit-card" ? "card" : debt.type === "loan" ? "bank" : "hand", debt.type === "credit-card" ? "#ff5d52" : debt.type === "loan" ? "#c278ff" : "#ff9f2f")}
            <div><strong>${App.escapeHtml(debt.name)}</strong><span>${App.escapeHtml(debt.type === "credit-card" ? "**** **** **** 1234" : debt.creditorDebtor || "")}</span></div>
          </div>
        </td>
        <td>${App.badge(FinanceStorage.debtTypeLabel(debt.type), debtTone(debt.type))}</td>
        <td>${App.escapeHtml(debt.creditorDebtor || "-")}</td>
        <td><span class="money-negative">-${App.formatMoney(debt.remainingAmount)}</span></td>
        <td>${Number(debt.interestRate || 0).toFixed(2).replace(".", ",")}%</td>
        <td>${debt.nextPaymentDate ? `${App.formatDate(debt.nextPaymentDate)}<br><strong class="money-negative">${App.formatMoney(debt.minimumPayment)}</strong>` : "Brak terminu<br><span class='muted'>-</span>"}</td>
        <td>${App.badge(debt.status === "paid" ? "Spłacone" : "Aktywne", debt.status === "paid" ? "green" : "green")}</td>
        <td class="actions">
          <button class="icon-btn ghost" type="button" data-view="${debt.id}" title="Podgląd">${App.icon("eye")}</button>
          <button class="icon-btn ghost" type="button" data-edit="${debt.id}" title="Edytuj">${App.icon("edit")}</button>
          <button class="icon-btn ghost" type="button" data-pay="${debt.id}" title="Spłać">${App.icon("cash")}</button>
          <button class="icon-btn ghost" type="button" data-delete="${debt.id}" title="Usuń">${App.icon("more")}</button>
        </td>
      </tr>
    `).join("");

    App.content().innerHTML = `
      ${App.pageHeader("Długi i zobowiązania", "Zarządzaj swoimi długami, kredytami i zobowiązaniami finansowymi.", `<button class="btn btn-primary" type="button" data-add-debt>${App.icon("plus")} Dodaj dług / zobowiązanie</button>`)}
      <div class="stats-grid four">${debtStats(data)}</div>
      <section class="panel">
        <div class="panel-toolbar">
          <div class="tabs">${tabs}</div>
          <div class="toolbar-group">
            <label class="search-field">${App.icon("search")}<input type="search" placeholder="Szukaj zobowiązania..." value="${App.escapeHtml(state.search)}" data-search></label>
            <select class="compact-select" data-status>
              <option value="active" ${state.status === "active" ? "selected" : ""}>Aktywne</option>
              <option value="paid" ${state.status === "paid" ? "selected" : ""}>Spłacone</option>
              <option value="all" ${state.status === "all" ? "selected" : ""}>Wszystkie</option>
            </select>
          </div>
        </div>
        <div class="table-wrap wide">
          <table>
            <thead><tr><th>Nazwa zobowiązania ↕</th><th>Typ ↕</th><th>Wierzyciel / Dłużnik</th><th>Saldo pozostałe ↕</th><th>Oprocentowanie ↕</th><th>Najbliższa płatność ↕</th><th>Status</th><th>Akcje</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="8">${App.emptyState("Brak zobowiązań dla wybranych filtrów.")}</td></tr>`}</tbody>
          </table>
        </div>
        <div class="table-footer">Wyświetlane 1-${debts.length} z ${data.debts.length} zobowiązań</div>
      </section>
      <div class="debts-bottom-grid">
        <section class="panel">
          <h2>Harmonogram spłat <span>(najbliższe 3 miesiące)</span></h2>
          <div class="schedule-list">${schedule(data)}</div>
          <a class="panel-link" href="#top">Zobacz pełny harmonogram</a>
        </section>
        <section class="panel">
          <h2>Podsumowanie zobowiązań</h2>
          <div class="debt-summary">${debtDonut(data)}</div>
          <a class="panel-link" href="reports.html">Zobacz szczegółowy raport ${App.icon("chevronRight")}</a>
        </section>
      </div>
    `;
  }

  function schedule(data) {
    const today = new Date();
    const max = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    const items = (data.debts || [])
      .filter((debt) => debt.status !== "paid" && debt.nextPaymentDate)
      .filter((debt) => new Date(`${debt.nextPaymentDate}T12:00:00`) <= max)
      .sort((a, b) => a.nextPaymentDate.localeCompare(b.nextPaymentDate))
      .slice(0, 5);
    return items.map((debt) => {
      const date = new Date(`${debt.nextPaymentDate}T12:00:00`);
      const diffDays = Math.max(0, Math.ceil((date - today) / 86400000));
      return `
        <div class="schedule-row">
          <time><strong>${String(date.getDate()).padStart(2, "0")}</strong><span>${date.toLocaleDateString("pl-PL", { month: "short" }).replace(".", "")}</span></time>
          <div><strong>${App.escapeHtml(debt.name)}</strong><span>Rata miesięczna</span></div>
          <b class="money-negative">${App.formatMoney(debt.minimumPayment)}<small>za ${diffDays} dni</small></b>
        </div>
      `;
    }).join("") || App.emptyState("Brak zaplanowanych płatności.");
  }

  function debtDonut(data) {
    const debts = (data.debts || []).filter((debt) => debt.status !== "paid" && Number(debt.remainingAmount) > 0);
    const colors = ["#ff5d52", "#8d50c7", "#ff9f2f", "#438df5", "#48c774"];
    const total = debts.reduce((sum, debt) => sum + Number(debt.remainingAmount || 0), 0);
    const items = debts.map((debt, index) => ({ amount: debt.remainingAmount, color: colors[index % colors.length] }));
    return `
      ${App.donut(items, `-${App.formatMoney(total)}`, "Łącznie")}
      <div class="chart-list grow">
        ${debts.map((debt, index) => `
          <div><span><i style="background:${colors[index % colors.length]}"></i>${App.escapeHtml(debt.name)}</span><strong class="money-negative">-${App.formatMoney(debt.remainingAmount)} <em>${total ? ((debt.remainingAmount / total) * 100).toFixed(1).replace(".", ",") : "0"}%</em></strong></div>
        `).join("")}
        <div class="total-line"><span>Razem</span><strong class="money-negative">-${App.formatMoney(total)} <em>100%</em></strong></div>
      </div>
    `;
  }

  function debtForm(debt) {
    const data = FinanceStorage.getData();
    const item = debt || {};
    return `
      <form id="debt-form" class="form-grid">
        <input type="hidden" name="id" value="${App.escapeHtml(item.id || "")}">
        <label>Nazwa<input name="name" required value="${App.escapeHtml(item.name || "")}" placeholder="np. Karta kredytowa"></label>
        <label>Typ<select name="type">
          <option value="loan" ${item.type === "loan" ? "selected" : ""}>Kredyt</option>
          <option value="credit-card" ${item.type === "credit-card" ? "selected" : ""}>Karta kredytowa</option>
          <option value="private-loan" ${item.type === "private-loan" ? "selected" : ""}>Pożyczka</option>
          <option value="lent-out" ${item.type === "lent-out" ? "selected" : ""}>Pożyczone innym</option>
          <option value="obligation" ${item.type === "obligation" ? "selected" : ""}>Zobowiązanie</option>
        </select></label>
        <label>Wierzyciel / Dłużnik<input name="creditorDebtor" value="${App.escapeHtml(item.creditorDebtor || "")}" placeholder="np. Bank ABC"></label>
        <label>Kwota początkowa<input name="initialAmount" inputmode="decimal" value="${App.escapeHtml(item.initialAmount || "")}"></label>
        <label>Saldo pozostałe<input name="remainingAmount" inputmode="decimal" value="${App.escapeHtml(item.remainingAmount || "")}"></label>
        <label>Oprocentowanie (%)<input name="interestRate" inputmode="decimal" value="${App.escapeHtml(item.interestRate || 0)}"></label>
        <label>Najbliższa płatność<input type="date" name="nextPaymentDate" value="${App.escapeHtml(item.nextPaymentDate || "")}"></label>
        <label>Minimalna płatność<input name="minimumPayment" inputmode="decimal" value="${App.escapeHtml(item.minimumPayment || "")}"></label>
        <label>Status<select name="status"><option value="active" ${item.status !== "paid" ? "selected" : ""}>Aktywne</option><option value="paid" ${item.status === "paid" ? "selected" : ""}>Spłacone</option></select></label>
        <label>Powiązane konto<select name="linkedAccountId"><option value="">Brak - utwórz przy spłacie</option>${App.accountOptions(data, item.linkedAccountId, ["liability", "asset"])}</select></label>
      </form>
    `;
  }

  function openDebtModal(id) {
    const data = FinanceStorage.getData();
    const debt = id ? data.debts.find((item) => item.id === id) : null;
    App.openModal({
      title: debt ? "Edytuj zobowiązanie" : "Dodaj dług / zobowiązanie",
      body: debtForm(debt),
      footer: `<button class="btn" type="button" data-close-modal>Anuluj</button><button class="btn btn-primary" type="submit" form="debt-form">${App.icon("save")} Zapisz</button>`,
      onOpen(root) {
        root.querySelector("#debt-form").addEventListener("submit", (event) => {
          event.preventDefault();
          const values = App.formData(event.currentTarget);
          FinanceStorage.upsert("debts", {
            ...debt,
            ...values,
            initialAmount: FinanceStorage.normalizeAmount(values.initialAmount),
            remainingAmount: FinanceStorage.normalizeAmount(values.remainingAmount),
            interestRate: FinanceStorage.normalizeAmount(values.interestRate),
            minimumPayment: FinanceStorage.normalizeAmount(values.minimumPayment)
          });
          App.closeModal();
          App.showToast(debt ? "Zobowiązanie zaktualizowane." : "Dodano zobowiązanie.", "success");
          renderDebts();
        });
      }
    });
  }

  function openPayModal(id) {
    const data = FinanceStorage.getData();
    const debt = data.debts.find((item) => item.id === id);
    if (!debt) return;
    App.openModal({
      title: `Spłata: ${debt.name}`,
      body: `
        <form id="pay-debt-form" class="form-grid">
          <label>Data spłaty<input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}"></label>
          <label>Kwota<input name="amount" inputmode="decimal" value="${App.escapeHtml(debt.minimumPayment || debt.remainingAmount || "")}"></label>
          <label>Konto płatności<select name="creditAccountId">${App.accountOptions(data, "acc-bank", ["asset"])}</select></label>
          <label>Opis<input name="description" value="Spłata: ${App.escapeHtml(debt.name)}"></label>
        </form>
        <p class="muted">Zapis spłaty utworzy operację: Winien konto zobowiązania, Ma konto płatności.</p>
      `,
      footer: `<button class="btn" type="button" data-close-modal>Anuluj</button><button class="btn btn-success" type="submit" form="pay-debt-form">${App.icon("cash")} Zapisz spłatę</button>`,
      onOpen(root) {
        root.querySelector("#pay-debt-form").addEventListener("submit", (event) => {
          event.preventDefault();
          payDebt(id, App.formData(event.currentTarget));
          App.closeModal();
          renderDebts();
        });
      }
    });
  }

  function payDebt(id, values) {
    const data = FinanceStorage.getData();
    const debt = data.debts.find((item) => item.id === id);
    if (!debt) return;
    const amount = Math.min(FinanceStorage.normalizeAmount(values.amount), FinanceStorage.normalizeAmount(debt.remainingAmount));
    if (amount <= 0) {
      App.showToast("Podaj kwotę spłaty.", "error");
      return;
    }
    let linkedAccountId = debt.linkedAccountId;
    if (!linkedAccountId) {
      const receivable = debt.type === "lent-out";
      linkedAccountId = FinanceStorage.uid("acc-debt");
      data.accounts.push({
        id: linkedAccountId,
        name: debt.name,
        type: receivable ? "asset" : "liability",
        group: receivable ? "Pożyczone innym" : "Zobowiązania",
        description: `Konto utworzone automatycznie dla: ${debt.name}`,
        icon: debt.type === "credit-card" ? "card" : "wallet",
        color: receivable ? "#438df5" : "#ff5d52",
        archived: false,
        createdAt: FinanceStorage.nowIso()
      });
      const openingAmount = FinanceStorage.normalizeAmount(debt.remainingAmount);
      data.entries.push({
        id: FinanceStorage.uid("entry"),
        date: values.date,
        description: `Saldo otwarcia zobowiązania: ${debt.name}`,
        categoryId: "cat-opening",
        debitAccountId: receivable ? linkedAccountId : "acc-equity",
        creditAccountId: receivable ? "acc-equity" : linkedAccountId,
        debitAmount: openingAmount,
        creditAmount: openingAmount,
        amount: openingAmount,
        note: "Automatyczne powiązanie długu z kontem księgowym.",
        type: "opening",
        createdAt: FinanceStorage.nowIso(),
        updatedAt: FinanceStorage.nowIso()
      });
      debt.linkedAccountId = linkedAccountId;
    }
    const linkedAccount = data.accounts.find((account) => account.id === linkedAccountId);
    const receivablePayment = linkedAccount?.type === "asset";
    data.entries.push({
      id: FinanceStorage.uid("entry"),
      date: values.date,
      description: values.description || `Spłata: ${debt.name}`,
      categoryId: "cat-debt-payment",
      debitAccountId: receivablePayment ? values.creditAccountId : linkedAccountId,
      creditAccountId: receivablePayment ? linkedAccountId : values.creditAccountId,
      debitAmount: amount,
      creditAmount: amount,
      amount,
      note: `Spłata zobowiązania: ${debt.name}`,
      type: "debt-payment",
      createdAt: FinanceStorage.nowIso(),
      updatedAt: FinanceStorage.nowIso()
    });
    debt.remainingAmount = Math.max(0, FinanceStorage.normalizeAmount(debt.remainingAmount) - amount);
    debt.status = debt.remainingAmount <= 0.005 ? "paid" : "active";
    FinanceStorage.saveData(data);
    App.showToast("Spłata została zapisana jako operacja Winien/Ma.", "success");
  }

  function viewDebt(id) {
    const data = FinanceStorage.getData();
    const debt = data.debts.find((item) => item.id === id);
    if (!debt) return;
    App.openModal({
      title: debt.name,
      body: `
        <dl class="details-list">
          <div><dt>Typ</dt><dd>${FinanceStorage.debtTypeLabel(debt.type)}</dd></div>
          <div><dt>Wierzyciel / Dłużnik</dt><dd>${App.escapeHtml(debt.creditorDebtor || "-")}</dd></div>
          <div><dt>Pozostało</dt><dd class="money-negative">-${App.formatMoney(debt.remainingAmount)}</dd></div>
          <div><dt>Oprocentowanie</dt><dd>${Number(debt.interestRate || 0).toFixed(2).replace(".", ",")}%</dd></div>
          <div><dt>Najbliższa płatność</dt><dd>${App.formatDate(debt.nextPaymentDate)}</dd></div>
          <div><dt>Status</dt><dd>${debt.status === "paid" ? "Spłacone" : "Aktywne"}</dd></div>
        </dl>
      `,
      footer: `<button class="btn btn-primary" type="button" data-close-modal>Zamknij</button>`
    });
  }

  function bind() {
    App.content().addEventListener("click", (event) => {
      const add = event.target.closest("[data-add-debt]");
      const filter = event.target.closest("[data-filter]");
      const view = event.target.closest("[data-view]");
      const edit = event.target.closest("[data-edit]");
      const pay = event.target.closest("[data-pay]");
      const del = event.target.closest("[data-delete]");
      if (add) openDebtModal();
      if (filter) {
        state.filter = filter.dataset.filter;
        renderDebts();
      }
      if (view) viewDebt(view.dataset.view);
      if (edit) openDebtModal(edit.dataset.edit);
      if (pay) openPayModal(pay.dataset.pay);
      if (del) {
        if (confirm("Usunąć zobowiązanie z rejestru długów? Operacje księgowe pozostaną bez zmian.")) {
          FinanceStorage.remove("debts", del.dataset.delete, false);
          App.showToast("Zobowiązanie usunięte.", "success");
          renderDebts();
        }
      }
    });
    App.content().addEventListener("input", (event) => {
      if (event.target.matches("[data-search]")) {
        state.search = event.target.value;
        renderDebts();
        const input = App.content().querySelector("[data-search]");
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    });
    App.content().addEventListener("change", (event) => {
      if (event.target.matches("[data-status]")) {
        state.status = event.target.value;
        renderDebts();
      }
    });
  }

  window.DebtsPage = {
    init() {
      renderDebts();
      bind();
    }
  };
})();
