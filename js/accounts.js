(function () {
  const state = { filter: "all", search: "" };

  function typeTone(type) {
    return {
      asset: "green",
      liability: "red",
      income: "blue",
      expense: "orange",
      transfer: "teal",
      equity: "teal"
    }[type] || "neutral";
  }

  function accountStats(data, summary) {
    const active = data.accounts.filter((account) => !account.archived);
    return [
      { label: "Łączne aktywa", value: App.formatMoney(summary.assets), sub: `${active.filter((a) => a.type === "asset").length} kont`, icon: "cash", color: "#5bd66f", valueClass: "money-positive" },
      { label: "Łączne pasywa", value: `-${App.formatMoney(summary.liabilities)}`, sub: `${active.filter((a) => a.type === "liability").length} konta`, icon: "card", color: "#ff5d52", valueClass: "money-negative" },
      { label: "Majątek netto", value: App.formatMoney(summary.netWorth), sub: "Aktywa minus pasywa", icon: "chart", color: "#72a9ff", valueClass: "money-blue" },
      { label: "Liczba kont", value: String(active.length), sub: "Razem kont", icon: "coins", color: "#ff8a00", valueClass: "money-orange" }
    ].map(App.statCard).join("");
  }

  function filteredAccounts(data) {
    const query = state.search.trim().toLowerCase();
    return data.accounts
      .filter((account) => !account.archived)
      .filter((account) => state.filter === "all" || account.type === state.filter || (state.filter === "transfer" && account.type === "equity"))
      .filter((account) => !query || [account.name, account.group, account.description, account.type].join(" ").toLowerCase().includes(query));
  }

  function render() {
    const data = FinanceStorage.getData();
    const summary = FinanceStorage.summary(data);
    const balances = FinanceStorage.accountBalances(data);
    const accounts = filteredAccounts(data);
    const tabs = [
      ["all", "Wszystkie"],
      ["asset", "Aktywa"],
      ["liability", "Pasywa"],
      ["income", "Przychody"],
      ["expense", "Koszty"],
      ["transfer", "Transfery"]
    ].map(([key, label]) => `<button class="tab ${state.filter === key ? "active" : ""}" type="button" data-filter="${key}">${label}</button>`).join("");

    const rows = accounts.map((account) => {
      const balance = balances[account.id] || 0;
      const showBalance = ["asset", "liability", "income", "expense", "transfer", "equity"].includes(account.type);
      const balanceHtml = showBalance
        ? `<span class="${account.type === "liability" ? "money-negative" : (balance >= 0 ? "money-positive" : "money-negative")}">${account.type === "liability" && balance > 0 ? "-" : ""}${App.formatMoney(Math.abs(balance))}</span>`
        : "-";
      return `
        <tr>
          <td>
            <div class="entity-cell">${App.iconBox(account.icon, account.color)}
              <div><strong>${App.escapeHtml(account.name)}</strong><span>${App.escapeHtml(account.description || "")}</span></div>
            </div>
          </td>
          <td>${App.badge(FinanceStorage.accountTypeLabel(account.type), typeTone(account.type))}</td>
          <td>${balanceHtml}</td>
          <td>${App.escapeHtml(account.group || "-")}</td>
          <td class="actions">
            <button class="icon-btn ghost" type="button" data-view="${account.id}" title="Podgląd">${App.icon("eye")}</button>
            <button class="icon-btn ghost" type="button" data-edit="${account.id}" title="Edytuj">${App.icon("edit")}</button>
            <button class="icon-btn ghost" type="button" data-delete="${account.id}" title="Archiwizuj">${App.icon("more")}</button>
          </td>
        </tr>
      `;
    }).join("");

    App.content().innerHTML = `
      ${App.pageHeader("Konta", "Zarządzaj swoimi kontami i monitoruj ich salda.", `<button class="btn btn-primary" type="button" data-add-account>${App.icon("plus")} Dodaj konto</button>`)}
      <div class="stats-grid four">${accountStats(data, summary)}</div>
      <section class="panel">
        <div class="panel-toolbar">
          <div class="tabs">${tabs}</div>
          <label class="search-field">${App.icon("search")}<input type="search" placeholder="Szukaj konta..." value="${App.escapeHtml(state.search)}" data-search></label>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nazwa konta ↕</th><th>Typ konta ↕</th><th>Saldo ↕</th><th>Grupa ↕</th><th>Akcje</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="5">${App.emptyState("Brak kont spełniających wybrane filtry.")}</td></tr>`}</tbody>
          </table>
        </div>
        <div class="table-footer">Wyświetlane 1-${accounts.length} z ${data.accounts.filter((account) => !account.archived).length} kont</div>
      </section>
    `;
  }

  function accountForm(account) {
    const item = account || {};
    return `
      <form id="account-form" class="form-grid">
        <input type="hidden" name="id" value="${App.escapeHtml(item.id || "")}">
        <label>Nazwa konta<input name="name" required value="${App.escapeHtml(item.name || "")}" placeholder="np. Konto bankowe"></label>
        <label>Typ konta<select name="type" required>
          ${["asset", "liability", "income", "expense", "transfer"].map((type) => `<option value="${type}" ${item.type === type ? "selected" : ""}>${FinanceStorage.accountTypeLabel(type)}</option>`).join("")}
        </select></label>
        <label>Grupa<input name="group" value="${App.escapeHtml(item.group || "")}" placeholder="np. Aktywa bieżące"></label>
        <label>Ikona<select name="icon">
          ${["cash", "bank", "piggy", "card", "hand", "cart", "car", "bulb", "gamepad", "briefcase", "scale", "wallet"].map((name) => `<option value="${name}" ${item.icon === name ? "selected" : ""}>${name}</option>`).join("")}
        </select></label>
        <label>Kolor<input type="color" name="color" value="${App.escapeHtml(item.color || "#6aa8ff")}"></label>
        <label class="span-2">Opis<textarea name="description" rows="3" placeholder="Krótki opis konta">${App.escapeHtml(item.description || "")}</textarea></label>
      </form>
    `;
  }

  function openAccountModal(id) {
    const data = FinanceStorage.getData();
    const account = id ? data.accounts.find((item) => item.id === id) : null;
    App.openModal({
      title: account ? "Edytuj konto" : "Dodaj konto",
      body: accountForm(account),
      footer: `<button class="btn" type="button" data-close-modal>Anuluj</button><button class="btn btn-primary" type="submit" form="account-form">${App.icon("save")} Zapisz</button>`,
      onOpen(root) {
        root.querySelector("#account-form").addEventListener("submit", (event) => {
          event.preventDefault();
          const values = App.formData(event.currentTarget);
          FinanceStorage.upsert("accounts", {
            ...account,
            ...values,
            archived: false
          });
          App.closeModal();
          App.showToast(account ? "Konto zostało zaktualizowane." : "Dodano nowe konto.", "success");
          render();
        });
      }
    });
  }

  function openPreview(id) {
    const data = FinanceStorage.getData();
    const account = data.accounts.find((item) => item.id === id);
    if (!account) return;
    const balance = FinanceStorage.accountBalance(data, id);
    App.openModal({
      title: account.name,
      body: `
        <div class="preview-card">
          ${App.iconBox(account.icon, account.color)}
          <div>
            <p>${App.badge(FinanceStorage.accountTypeLabel(account.type), typeTone(account.type))}</p>
            <h3>${account.type === "liability" && balance > 0 ? "-" : ""}${App.formatMoney(Math.abs(balance))}</h3>
            <span>${App.escapeHtml(account.group || "")}</span>
          </div>
        </div>
        <p class="muted">${App.escapeHtml(account.description || "Brak opisu.")}</p>
      `,
      footer: `<button class="btn btn-primary" type="button" data-close-modal>Zamknij</button>`
    });
  }

  function bind() {
    App.content().addEventListener("click", (event) => {
      const add = event.target.closest("[data-add-account]");
      const filter = event.target.closest("[data-filter]");
      const view = event.target.closest("[data-view]");
      const edit = event.target.closest("[data-edit]");
      const del = event.target.closest("[data-delete]");
      if (add) openAccountModal();
      if (filter) {
        state.filter = filter.dataset.filter;
        render();
      }
      if (view) openPreview(view.dataset.view);
      if (edit) openAccountModal(edit.dataset.edit);
      if (del) {
        const settings = FinanceStorage.getData().settings;
        if (!settings.confirmBeforeDelete || confirm("Zarchiwizować konto? Operacje pozostaną w historii.")) {
          FinanceStorage.remove("accounts", del.dataset.delete, true);
          App.showToast("Konto przeniesiono do archiwum.", "success");
          render();
        }
      }
    });
    App.content().addEventListener("input", (event) => {
      if (event.target.matches("[data-search]")) {
        state.search = event.target.value;
        render();
        const input = App.content().querySelector("[data-search]");
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    });
  }

  window.AccountsPage = {
    init() {
      render();
      bind();
    },
    typeTone
  };
})();
