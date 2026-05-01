(function () {
  const period = FinanceStorage.periodBounds();
  const listState = {
    start: period.start,
    end: period.end,
    account: "all",
    category: "all",
    type: "all",
    search: ""
  };

  function entryTone(data, entry) {
    const type = FinanceStorage.entryFlowType(data, entry);
    return {
      expense: "red",
      income: "green",
      transfer: "blue",
      other: "neutral"
    }[type] || "neutral";
  }

  function signedEntryAmount(data, entry) {
    const type = FinanceStorage.entryFlowType(data, entry);
    const amount = FinanceStorage.entryAmount(entry);
    if (type === "income") return amount;
    if (type === "expense") return -amount;
    return entry.type === "opening" ? amount : -amount;
  }

  function filteredEntries(data) {
    const query = listState.search.trim().toLowerCase();
    return FinanceStorage.entriesInRange(data, listState.start, listState.end)
      .filter((entry) => listState.account === "all" || entry.debitAccountId === listState.account || entry.creditAccountId === listState.account)
      .filter((entry) => listState.category === "all" || entry.categoryId === listState.category)
      .filter((entry) => listState.type === "all" || entry.type === listState.type || FinanceStorage.entryCategoryType(data, entry) === listState.type)
      .filter((entry) => {
        if (!query) return true;
        const category = FinanceStorage.getCategory(data, entry.categoryId);
        const debit = FinanceStorage.getAccount(data, entry.debitAccountId);
        const credit = FinanceStorage.getAccount(data, entry.creditAccountId);
        return [entry.description, entry.note, category?.name, debit?.name, credit?.name, entry.type].join(" ").toLowerCase().includes(query);
      });
  }

  function balanceAfterEntry(data, entry) {
    const bank = data.accounts.find((account) => account.id === "acc-bank");
    const involved = [entry.debitAccountId, entry.creditAccountId]
      .map((id) => FinanceStorage.getAccount(data, id))
      .filter(Boolean);
    const account = involved.find((item) => bank && item.id === bank.id) || involved.find((item) => item.type === "asset") || involved[0];
    if (!account) return 0;
    const sorted = FinanceStorage.sortEntries(data.entries || [], "asc");
    const index = sorted.findIndex((item) => item.id === entry.id);
    const slice = index >= 0 ? sorted.slice(0, index + 1) : sorted;
    return FinanceStorage.accountBalance(data, account.id, slice);
  }

  function stats(entries) {
    const debit = entries.reduce((sum, entry) => sum + FinanceStorage.normalizeAmount(entry.debitAmount), 0);
    const credit = entries.reduce((sum, entry) => sum + FinanceStorage.normalizeAmount(entry.creditAmount), 0);
    const diff = debit - credit;
    return [
      { label: "Liczba operacji", value: String(entries.length), sub: "Wszystkie", icon: "history", color: "#4d9bff", valueClass: "money-blue" },
      { label: "Suma Winien", value: App.formatMoney(debit), sub: "Debet", icon: "arrowDown", color: "#40c969", valueClass: "money-positive" },
      { label: "Suma Ma", value: App.formatMoney(credit), sub: "Kredyt", icon: "arrowUp", color: "#ff9f2f", valueClass: "money-orange" },
      { label: "Saldo bilansowania", value: App.formatMoney(diff), sub: Math.abs(diff) < 0.005 ? "Zbilansowane" : "Do sprawdzenia", icon: "scale", color: "#c278ff", valueClass: Math.abs(diff) < 0.005 ? "money-purple" : "money-negative" }
    ].map(App.statCard).join("");
  }

  function renderEntries() {
    const data = FinanceStorage.getData();
    const entries = FinanceStorage.sortEntries(filteredEntries(data), "desc");
    const accountSelect = `<select data-filter-account><option value="all">Wszystkie konta</option>${App.accountOptions(data, listState.account)}</select>`;
    const categorySelect = `<select data-filter-category><option value="all">Wszystkie kategorie</option>${App.categoryOptions(data, listState.category)}</select>`;
    const typeSelect = `
      <select data-filter-type>
        <option value="all" ${listState.type === "all" ? "selected" : ""}>Wszystkie typy</option>
        <option value="income" ${listState.type === "income" ? "selected" : ""}>Przychody</option>
        <option value="expense" ${listState.type === "expense" ? "selected" : ""}>Wydatki</option>
        <option value="transfer" ${listState.type === "transfer" ? "selected" : ""}>Transfery</option>
        <option value="debt-payment" ${listState.type === "debt-payment" ? "selected" : ""}>Spłaty długów</option>
      </select>`;

    const rows = entries.map((entry) => {
      const category = FinanceStorage.getCategory(data, entry.categoryId) || {};
      const debit = FinanceStorage.getAccount(data, entry.debitAccountId) || {};
      const credit = FinanceStorage.getAccount(data, entry.creditAccountId) || {};
      const signed = signedEntryAmount(data, entry);
      const after = balanceAfterEntry(data, entry);
      return `
        <tr>
          <td>${App.formatDate(entry.date)}</td>
          <td>
            <div class="entry-title">
              ${App.iconBox(category.icon || debit.icon, category.color || debit.color)}
              <div><strong>${App.escapeHtml(entry.description)}</strong><span>${App.escapeHtml(debit.name || "-")} → ${App.escapeHtml(credit.name || "-")}</span></div>
            </div>
          </td>
          <td>${App.badge(category.name || "Brak", entryTone(data, entry))}</td>
          <td>${App.escapeHtml(debit.name || "-")}</td>
          <td>${App.escapeHtml(credit.name || "-")}</td>
          <td><span class="${App.amountClass(signed)}">${App.signedMoney(signed, { forceSign: true })}</span></td>
          <td><span class="${App.amountClass(after)}">${App.formatMoney(after)}</span></td>
          <td class="actions">
            <button class="icon-btn ghost" type="button" data-view-entry="${entry.id}" title="Podgląd">${App.icon("eye")}</button>
            <button class="icon-btn ghost" type="button" data-edit-entry="${entry.id}" title="Edytuj">${App.icon("edit")}</button>
            <button class="icon-btn ghost" type="button" data-delete-entry="${entry.id}" title="Usuń">${App.icon("more")}</button>
          </td>
        </tr>
      `;
    }).join("");

    App.content().innerHTML = `
      ${App.pageHeader("Operacje", "Lista wszystkich operacji w systemie Winien / Ma.", `<a class="btn btn-primary" href="add-entry.html">${App.icon("plus")} Dodaj operację</a>`)}
      <div class="stats-grid four">${stats(entries)}</div>
      <section class="panel">
        <div class="filters-grid">
          <label>Zakres od<input type="date" value="${listState.start}" data-filter-start></label>
          <label>Zakres do<input type="date" value="${listState.end}" data-filter-end></label>
          <label>Konto ${accountSelect}</label>
          <label>Kategoria ${categorySelect}</label>
          <label>Typ operacji ${typeSelect}</label>
          <label class="search-field in-grid">${App.icon("search")}<input type="search" placeholder="Szukaj w operacjach..." value="${App.escapeHtml(listState.search)}" data-search></label>
          <button class="btn" type="button" data-apply-filters>${App.icon("filter")} Filtry</button>
        </div>
      </section>
      <section class="panel">
        <div class="table-wrap wide">
          <table>
            <thead><tr><th>Data ↕</th><th>Opis</th><th>Kategoria</th><th>Winien (debet)</th><th>Ma (kredyt)</th><th>Kwota</th><th>Saldo po operacji</th><th>Akcje</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="8">${App.emptyState("Brak operacji dla wybranych filtrów.")}</td></tr>`}</tbody>
          </table>
        </div>
        <div class="table-footer">Wyświetlane 1-${entries.length} z ${data.entries.length} operacji</div>
      </section>
    `;
  }

  function viewEntry(id) {
    const data = FinanceStorage.getData();
    const entry = data.entries.find((item) => item.id === id);
    if (!entry) return;
    const category = FinanceStorage.getCategory(data, entry.categoryId);
    const debit = FinanceStorage.getAccount(data, entry.debitAccountId);
    const credit = FinanceStorage.getAccount(data, entry.creditAccountId);
    App.openModal({
      title: entry.description,
      body: `
        <dl class="details-list">
          <div><dt>Data</dt><dd>${App.formatDate(entry.date)}</dd></div>
          <div><dt>Kategoria</dt><dd>${App.escapeHtml(category?.name || "-")}</dd></div>
          <div><dt>Winien</dt><dd>${App.escapeHtml(debit?.name || "-")} · ${App.formatMoney(entry.debitAmount)}</dd></div>
          <div><dt>Ma</dt><dd>${App.escapeHtml(credit?.name || "-")} · ${App.formatMoney(entry.creditAmount)}</dd></div>
          <div><dt>Typ</dt><dd>${App.escapeHtml(entry.type || "-")}</dd></div>
          <div><dt>Notatka</dt><dd>${App.escapeHtml(entry.note || "Brak notatki.")}</dd></div>
        </dl>
      `,
      footer: `<button class="btn btn-primary" type="button" data-close-modal>Zamknij</button>`
    });
  }

  function bindEntries() {
    App.content().addEventListener("click", (event) => {
      const view = event.target.closest("[data-view-entry]");
      const edit = event.target.closest("[data-edit-entry]");
      const del = event.target.closest("[data-delete-entry]");
      const apply = event.target.closest("[data-apply-filters]");
      if (view) viewEntry(view.dataset.viewEntry);
      if (edit) window.location.href = `add-entry.html?edit=${encodeURIComponent(edit.dataset.editEntry)}`;
      if (del) {
        const settings = FinanceStorage.getData().settings;
        if (!settings.confirmBeforeDelete || confirm("Usunąć operację? Salda kont zostaną przeliczone.")) {
          FinanceStorage.remove("entries", del.dataset.deleteEntry, false);
          App.showToast("Operacja została usunięta.", "success");
          renderEntries();
        }
      }
      if (apply) renderEntries();
    });
    App.content().addEventListener("change", (event) => {
      if (event.target.matches("[data-filter-start]")) listState.start = event.target.value;
      if (event.target.matches("[data-filter-end]")) listState.end = event.target.value;
      if (event.target.matches("[data-filter-account]")) listState.account = event.target.value;
      if (event.target.matches("[data-filter-category]")) listState.category = event.target.value;
      if (event.target.matches("[data-filter-type]")) listState.type = event.target.value;
      renderEntries();
    });
    App.content().addEventListener("input", (event) => {
      if (event.target.matches("[data-search]")) {
        listState.search = event.target.value;
        renderEntries();
        const input = App.content().querySelector("[data-search]");
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    });
  }

  function templateCards() {
    const templates = [
      ["expense", "cart", "#b86cff", "Zakup (wydatek)", "Wydatek z konta"],
      ["income", "cash", "#5bd66f", "Przychód", "Przychód na konto"],
      ["transfer", "swap", "#72a9ff", "Przelew między kontami", "Transfer środków"],
      ["card-payment", "card", "#ff5d52", "Spłata karty kredytowej", "Spłata zadłużenia"],
      ["cash-withdrawal", "cash", "#ff8a00", "Wypłata gotówki", "Wypłata z bankomatu"]
    ];
    return templates.map(([key, iconName, color, title, sub]) => `
      <button class="template-card" type="button" data-template="${key}" style="--tone:${color}">
        ${App.icon(iconName)}
        <span><strong>${title}</strong><small>${sub}</small></span>
      </button>
    `).join("");
  }

  function entryForm(entry) {
    const data = FinanceStorage.getData();
    const item = entry || {
      date: new Date().toISOString().slice(0, 10),
      type: "expense",
      debitAmount: 0,
      creditAmount: 0
    };
    return `
      <form id="entry-form" class="entry-form">
        <section class="panel">
          <h2>Informacje podstawowe</h2>
          <div class="form-grid four">
            <label>Data operacji *<input type="date" name="date" required value="${App.escapeHtml(item.date || "")}"></label>
            <label>Opis operacji *<input name="description" required placeholder="np. Zakupy spożywcze" value="${App.escapeHtml(item.description || "")}"></label>
            <label>Kategoria<select name="categoryId" required><option value="">Wybierz kategorię</option>${App.categoryOptions(data, item.categoryId)}</select></label>
            <label>Typ operacji<select name="type">
              ${["expense", "income", "transfer", "debt-payment", "opening", "other"].map((type) => `<option value="${type}" ${item.type === type ? "selected" : ""}>${type}</option>`).join("")}
            </select></label>
            <label class="span-4">Notatka (opcjonalnie)<textarea name="note" rows="2" placeholder="Dodaj dodatkową notatkę...">${App.escapeHtml(item.note || "")}</textarea></label>
          </div>
        </section>
        <div class="double-entry-grid">
          <section class="panel side-panel debit-panel">
            <h2><span>Winien (debet)</span><small>Co dostajemy?</small></h2>
            <label>Konto Winien *<span class="field-with-button"><select name="debitAccountId" required><option value="">Wybierz konto</option>${App.accountOptions(data, item.debitAccountId)}</select><a class="btn" href="accounts.html">${App.icon("plus")} Nowe konto</a></span></label>
            <label>Kwota Winien *<span class="money-input"><input name="debitAmount" inputmode="decimal" required value="${App.escapeHtml(String(item.debitAmount ?? "").replace(".", ","))}" placeholder="0,00"><b>zł</b></span></label>
          </section>
          <div class="swap-badge">${App.icon("swap")}</div>
          <section class="panel side-panel credit-panel">
            <h2><span>Ma (kredyt)</span><small>Skąd pochodzi?</small></h2>
            <label>Konto Ma *<span class="field-with-button"><select name="creditAccountId" required><option value="">Wybierz konto</option>${App.accountOptions(data, item.creditAccountId)}</select><a class="btn" href="accounts.html">${App.icon("plus")} Nowe konto</a></span></label>
            <label>Kwota Ma *<span class="money-input"><input name="creditAmount" inputmode="decimal" required value="${App.escapeHtml(String(item.creditAmount ?? "").replace(".", ","))}" placeholder="0,00"><b>zł</b></span></label>
          </section>
        </div>
        <section class="panel balance-check" data-balance-check>
          <div><span>Suma Winien</span><strong class="money-positive" data-debit-total>0,00 zł</strong></div>
          <div class="equals">=</div>
          <div><span>Suma Ma</span><strong class="money-orange" data-credit-total>0,00 zł</strong></div>
          <div><span>Różnica</span><strong class="money-purple" data-diff-total>0,00 zł</strong></div>
          <p data-balance-message>${App.icon("info")} Operacja jest zbilansowana. Suma Winien jest równa sumie Ma.</p>
        </section>
        <section class="panel">
          <h2>Szybkie szablony</h2>
          <div class="templates-grid">${templateCards()}</div>
        </section>
        <section class="hint-panel">${App.icon("info")} <strong>Wskazówka:</strong> Możesz użyć szablonów powyżej lub wypełnić formularz ręcznie.</section>
      </form>
    `;
  }

  function setTemplate(key) {
    const templates = {
      expense: { description: "Zakupy spożywcze", categoryId: "cat-food", type: "expense", debitAccountId: "acc-food", creditAccountId: "acc-bank" },
      income: { description: "Wynagrodzenie", categoryId: "cat-salary", type: "income", debitAccountId: "acc-bank", creditAccountId: "acc-income" },
      transfer: { description: "Przelew na oszczędności", categoryId: "cat-transfer", type: "transfer", debitAccountId: "acc-savings", creditAccountId: "acc-bank" },
      "card-payment": { description: "Spłata karty kredytowej", categoryId: "cat-credit-payment", type: "debt-payment", debitAccountId: "acc-credit-card", creditAccountId: "acc-bank" },
      "cash-withdrawal": { description: "Wypłata gotówki", categoryId: "cat-cash-withdrawal", type: "transfer", debitAccountId: "acc-cash", creditAccountId: "acc-bank" }
    };
    const selected = templates[key];
    if (!selected) return;
    Object.entries(selected).forEach(([field, value]) => App.setFieldValue(`[name="${field}"]`, value));
    App.showToast("Szablon został zastosowany.");
    updateBalanceState();
  }

  function updateBalanceState() {
    const form = document.getElementById("entry-form");
    if (!form) return;
    const debit = FinanceStorage.normalizeAmount(form.debitAmount.value);
    const credit = FinanceStorage.normalizeAmount(form.creditAmount.value);
    const diff = debit - credit;
    const ok = Math.abs(diff) < 0.005 && debit > 0 && credit > 0;
    document.querySelector("[data-debit-total]").textContent = App.formatMoney(debit);
    document.querySelector("[data-credit-total]").textContent = App.formatMoney(credit);
    document.querySelector("[data-diff-total]").textContent = App.formatMoney(Math.abs(diff));
    const panel = document.querySelector("[data-balance-check]");
    const msg = document.querySelector("[data-balance-message]");
    panel.classList.toggle("balanced", ok);
    panel.classList.toggle("unbalanced", !ok);
    msg.innerHTML = ok
      ? `${App.icon("info")} Operacja jest zbilansowana. Suma Winien jest równa sumie Ma.`
      : `${App.icon("info")} Operacja wymaga równej sumy po obu stronach zapisu.`;
    const save = document.querySelector("[data-save-entry]");
    if (save) save.disabled = !ok || !form.checkValidity();
  }

  function renderAddEntry() {
    const data = FinanceStorage.getData();
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    const entry = editId ? data.entries.find((item) => item.id === editId) : null;
    App.content().innerHTML = `
      ${App.pageHeader(entry ? "Edytuj operację (Winien / Ma)" : "Dodaj operację (Winien / Ma)", "Każda operacja musi mieć stronę Winien (debet) i stronę Ma (kredyt).", `
        <a class="btn" href="entries.html">${App.icon("chevronLeft")} Anuluj</a>
        <button class="btn btn-primary" type="submit" form="entry-form" data-save-entry>${App.icon("save")} Zapisz operację</button>
      `)}
      ${entryForm(entry)}
    `;
    updateBalanceState();
  }

  function bindAddEntry() {
    App.content().addEventListener("input", (event) => {
      if (event.target.closest("#entry-form")) updateBalanceState();
    });
    App.content().addEventListener("change", (event) => {
      if (event.target.closest("#entry-form")) updateBalanceState();
    });
    App.content().addEventListener("click", (event) => {
      const template = event.target.closest("[data-template]");
      if (template) setTemplate(template.dataset.template);
    });
    App.content().addEventListener("submit", (event) => {
      if (!event.target.matches("#entry-form")) return;
      event.preventDefault();
      const data = FinanceStorage.getData();
      const params = new URLSearchParams(window.location.search);
      const editId = params.get("edit");
      const existing = editId ? data.entries.find((item) => item.id === editId) : null;
      const values = App.formData(event.target);
      const debitAmount = FinanceStorage.normalizeAmount(values.debitAmount);
      const creditAmount = FinanceStorage.normalizeAmount(values.creditAmount);
      const entry = {
        ...existing,
        ...values,
        id: existing?.id,
        debitAmount,
        creditAmount,
        amount: debitAmount,
        updatedAt: FinanceStorage.nowIso()
      };
      if (!FinanceStorage.isBalanced(entry) || debitAmount <= 0) {
        App.showToast("Operacja nie jest zbilansowana.", "error");
        return;
      }
      FinanceStorage.upsert("entries", entry);
      App.showToast(existing ? "Operacja została zaktualizowana." : "Operacja została zapisana.", "success");
      setTimeout(() => { window.location.href = "entries.html"; }, 350);
    });
  }

  window.EntriesPage = {
    init() {
      renderEntries();
      bindEntries();
    },
    signedEntryAmount
  };

  window.AddEntryPage = {
    init() {
      renderAddEntry();
      bindAddEntry();
    }
  };
})();
