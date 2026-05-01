(function () {
  const state = { filter: "all", search: "" };

  function typeTone(type) {
    return {
      expense: "red",
      income: "green",
      transfer: "blue",
      other: "neutral"
    }[type] || "neutral";
  }

  function stats(data) {
    const active = data.categories.filter((category) => !category.archived);
    const count = (type) => active.filter((category) => category.type === type).length;
    return [
      { label: "Wszystkie", value: String(active.length), sub: "Wszystkie kategorie", icon: "tag", color: "#40c969", valueClass: "money-blue" },
      { label: "Wydatki", value: String(count("expense")), sub: "Kategorie wydatków", icon: "arrowDown", color: "#ff8a00", valueClass: "money-orange" },
      { label: "Przychody", value: String(count("income")), sub: "Kategorie przychodów", icon: "arrowUp", color: "#40c969", valueClass: "money-positive" },
      { label: "Transfery", value: String(count("transfer")), sub: "Kategorie transferów", icon: "swap", color: "#c278ff", valueClass: "money-purple" },
      { label: "Inne", value: String(count("other")), sub: "Pozostałe kategorie", icon: "settings", color: "#aeb7bf", valueClass: "money-neutral" }
    ].map(App.statCard).join("");
  }

  function filteredCategories(data) {
    const query = state.search.trim().toLowerCase();
    return data.categories
      .filter((category) => !category.archived)
      .filter((category) => state.filter === "all" || category.type === state.filter)
      .filter((category) => !query || [category.name, category.group, category.description, category.type].join(" ").toLowerCase().includes(query));
  }

  function render() {
    const data = FinanceStorage.getData();
    const categories = filteredCategories(data);
    const tabs = [
      ["all", "Wszystkie"],
      ["expense", "Wydatki"],
      ["income", "Przychody"],
      ["transfer", "Transfery"],
      ["other", "Inne"]
    ].map(([key, label]) => `<button class="tab ${state.filter === key ? "active" : ""}" type="button" data-filter="${key}">${label}</button>`).join("");

    const rows = categories.map((category) => `
      <tr>
        <td>
          <div class="entity-cell">${App.iconBox(category.icon, category.color)}
            <div><strong>${App.escapeHtml(category.name)}</strong><span>${App.escapeHtml(category.description || "")}</span></div>
          </div>
        </td>
        <td>${App.badge(FinanceStorage.categoryTypeLabel(category.type), typeTone(category.type))}</td>
        <td>${App.escapeHtml(category.group || "-")}</td>
        <td>${App.escapeHtml(category.description || "-")}</td>
        <td class="actions">
          <button class="icon-btn ghost" type="button" data-edit="${category.id}" title="Edytuj">${App.icon("edit")}</button>
          <button class="icon-btn ghost" type="button" data-delete="${category.id}" title="Archiwizuj">${App.icon("more")}</button>
        </td>
      </tr>
    `).join("");

    App.content().innerHTML = `
      ${App.pageHeader("Kategorie", "Zarządzaj kategoriami przychodów, wydatków, kosztów i transferów.", `<button class="btn btn-primary" type="button" data-add-category>${App.icon("plus")} Dodaj kategorię</button>`)}
      <div class="stats-grid five">${stats(data)}</div>
      <section class="panel">
        <div class="panel-toolbar">
          <div class="tabs">${tabs}</div>
          <div class="toolbar-group">
            <label class="search-field">${App.icon("search")}<input type="search" placeholder="Szukaj kategorii..." value="${App.escapeHtml(state.search)}" data-search></label>
            <select class="compact-select" data-type-select>
              <option value="all" ${state.filter === "all" ? "selected" : ""}>Wszystkie typy</option>
              <option value="expense" ${state.filter === "expense" ? "selected" : ""}>Wydatki</option>
              <option value="income" ${state.filter === "income" ? "selected" : ""}>Przychody</option>
              <option value="transfer" ${state.filter === "transfer" ? "selected" : ""}>Transfery</option>
              <option value="other" ${state.filter === "other" ? "selected" : ""}>Inne</option>
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nazwa kategorii ↕</th><th>Typ ↕</th><th>Grupa ↕</th><th>Opis</th><th>Akcje</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="5">${App.emptyState("Brak kategorii dla wybranych filtrów.")}</td></tr>`}</tbody>
          </table>
        </div>
        <div class="table-footer">Wyświetlane 1-${categories.length} z ${data.categories.filter((category) => !category.archived).length} kategorii</div>
      </section>
    `;
  }

  function categoryForm(category) {
    const item = category || {};
    return `
      <form id="category-form" class="form-grid">
        <input type="hidden" name="id" value="${App.escapeHtml(item.id || "")}">
        <label>Nazwa kategorii<input name="name" required value="${App.escapeHtml(item.name || "")}" placeholder="np. Jedzenie"></label>
        <label>Typ<select name="type" required>
          ${["expense", "income", "transfer", "other"].map((type) => `<option value="${type}" ${item.type === type ? "selected" : ""}>${FinanceStorage.categoryTypeLabel(type)}</option>`).join("")}
        </select></label>
        <label>Grupa<input name="group" value="${App.escapeHtml(item.group || "")}" placeholder="np. Podstawowe"></label>
        <label>Ikona<select name="icon">
          ${["cart", "car", "bulb", "gamepad", "briefcase", "gift", "bank", "card", "cash", "tag", "settings", "home"].map((name) => `<option value="${name}" ${item.icon === name ? "selected" : ""}>${name}</option>`).join("")}
        </select></label>
        <label>Kolor<input type="color" name="color" value="${App.escapeHtml(item.color || "#6aa8ff")}"></label>
        <label class="span-2">Opis<textarea name="description" rows="3" placeholder="Krótki opis kategorii">${App.escapeHtml(item.description || "")}</textarea></label>
      </form>
    `;
  }

  function openCategoryModal(id) {
    const data = FinanceStorage.getData();
    const category = id ? data.categories.find((item) => item.id === id) : null;
    App.openModal({
      title: category ? "Edytuj kategorię" : "Dodaj kategorię",
      body: categoryForm(category),
      footer: `<button class="btn" type="button" data-close-modal>Anuluj</button><button class="btn btn-primary" type="submit" form="category-form">${App.icon("save")} Zapisz</button>`,
      onOpen(root) {
        root.querySelector("#category-form").addEventListener("submit", (event) => {
          event.preventDefault();
          FinanceStorage.upsert("categories", { ...category, ...App.formData(event.currentTarget), archived: false });
          App.closeModal();
          App.showToast(category ? "Kategoria została zaktualizowana." : "Dodano kategorię.", "success");
          render();
        });
      }
    });
  }

  function bind() {
    App.content().addEventListener("click", (event) => {
      const add = event.target.closest("[data-add-category]");
      const filter = event.target.closest("[data-filter]");
      const edit = event.target.closest("[data-edit]");
      const del = event.target.closest("[data-delete]");
      if (add) openCategoryModal();
      if (filter) {
        state.filter = filter.dataset.filter;
        render();
      }
      if (edit) openCategoryModal(edit.dataset.edit);
      if (del) {
        const settings = FinanceStorage.getData().settings;
        if (!settings.confirmBeforeDelete || confirm("Zarchiwizować kategorię? Istniejące operacje zachowają tę kategorię w historii.")) {
          FinanceStorage.remove("categories", del.dataset.delete, true);
          App.showToast("Kategoria przeniesiona do archiwum.", "success");
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
    App.content().addEventListener("change", (event) => {
      if (event.target.matches("[data-type-select]")) {
        state.filter = event.target.value;
        render();
      }
    });
  }

  window.CategoriesPage = {
    init() {
      render();
      bind();
    },
    typeTone
  };
})();
