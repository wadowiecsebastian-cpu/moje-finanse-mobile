(function () {
  const state = { scope: "all", file: null };

  function bytes(size) {
    const value = Number(size) || 0;
    if (value > 1000000) return `${(value / 1000000).toFixed(2).replace(".", ",")} MB`;
    if (value > 1000) return `${(value / 1000).toFixed(1).replace(".", ",")} KB`;
    return `${value} B`;
  }

  function render() {
    const data = FinanceStorage.getData();
    const active = (collection) => (data[collection] || []).filter((item) => !item.archived).length;
    App.content().innerHTML = `
      ${App.pageHeader("Import / Eksport", "Zarządzaj danymi aplikacji - wykonuj kopie zapasowe lub przywracaj dane.")}
      <div class="stats-grid four">
        ${App.statCard({ label: "Konta", value: String(active("accounts")), sub: "Wszystkich kont", icon: "database", color: "#4d9bff", valueClass: "money-blue" })}
        ${App.statCard({ label: "Operacje", value: String((data.entries || []).length), sub: "Wszystkich operacji", icon: "file", color: "#40c969", valueClass: "money-positive" })}
        ${App.statCard({ label: "Kategorie", value: String(active("categories")), sub: "Wszystkich kategorii", icon: "tag", color: "#c278ff", valueClass: "money-purple" })}
        ${App.statCard({ label: "Długi i zobowiązania", value: String((data.debts || []).filter((debt) => debt.status !== "paid").length), sub: "Aktywnych pozycji", icon: "user", color: "#ff8a00", valueClass: "money-orange" })}
      </div>
      <div class="import-export-grid">
        <section class="panel">
          <h2>Eksportuj dane</h2>
          <p class="muted">Zapisz kopię swoich danych, aby zabezpieczyć je przed utratą.</p>
          <div class="format-card">${App.iconBox("file", "#c278ff")}<div><span>Format pliku</span><strong>JSON (zalecane)</strong><small>Plik zawiera dane aplikacji w wybranym zakresie.</small></div>${App.icon("chevronRight")}</div>
          <div class="radio-list">
            ${scopeOption("all", "database", "#4d9bff", "Wszystkie dane", "Eksportuj pełną kopię wszystkich danych aplikacji.")}
            ${scopeOption("date-range", "calendar", "#40c969", "Zakres dat", "Eksportuj operacje z wybranego zakresu dat.")}
            ${scopeOption("selected", "filter", "#ff8a00", "Tylko wybrane dane", "Eksportuj konta, kategorie, długi i ustawienia bez operacji.")}
          </div>
          <div class="date-range ${state.scope === "date-range" ? "show" : ""}">
            <label>Od<input type="date" data-export-start value="${FinanceStorage.periodBounds().start}"></label>
            <label>Do<input type="date" data-export-end value="${FinanceStorage.periodBounds().end}"></label>
          </div>
          <button class="btn btn-primary full" type="button" data-export>${App.icon("download")} Eksportuj dane</button>
        </section>
        <section class="panel">
          <h2>Importuj dane</h2>
          <p class="muted">Wczytaj wcześniej zapisany plik z danymi aplikacji.</p>
          <div class="drop-zone" data-drop-zone>
            ${App.icon("upload")}
            <strong>${state.file ? App.escapeHtml(state.file.name) : "Przeciągnij i upuść plik tutaj"}</strong>
            <span>lub</span>
            <button class="btn" type="button" data-pick-file>Wybierz plik</button>
            <small>Obsługiwany format: ${App.badge("JSON", "blue")}</small>
            <input class="sr-only" type="file" accept="application/json,.json" data-import-file>
          </div>
          <div class="warning-box">
            ${App.icon("info")}
            <div><strong>Uwaga przed importem</strong><p>Import nadpisze bieżące dane aplikacji. Zawsze wykonaj kopię zapasową przed importem i upewnij się, że plik pochodzi z zaufanego źródła.</p></div>
          </div>
          <button class="btn btn-success full" type="button" data-import>${App.icon("upload")} Importuj dane</button>
        </section>
      </div>
      <section class="panel">
        <h2>Historia kopii zapasowych</h2>
        <p class="muted">Twoje ostatnie eksporty danych.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Nazwa pliku</th><th>Data utworzenia</th><th>Rozmiar</th><th>Zakres</th><th>Akcje</th></tr></thead>
            <tbody>${backupRows(data)}</tbody>
          </table>
        </div>
        <div class="table-footer">Wyświetlane 1-${(data.backups || []).length} z ${(data.backups || []).length} kopii zapasowych</div>
      </section>
    `;
  }

  function scopeOption(key, iconName, color, title, subtitle) {
    return `
      <label class="radio-card">
        ${App.iconBox(iconName, color)}
        <span><strong>${title}</strong><small>${subtitle}</small></span>
        <input type="radio" name="scope" value="${key}" data-scope ${state.scope === key ? "checked" : ""}>
      </label>
    `;
  }

  function backupRows(data) {
    const rows = (data.backups || []).map((backup) => `
      <tr>
        <td>${App.icon("file", "mini")} ${App.escapeHtml(backup.fileName)}</td>
        <td>${App.formatDate((backup.createdAt || "").slice(0, 10), true)}</td>
        <td>${bytes(backup.size)}</td>
        <td>${App.escapeHtml(backup.range || "Wszystkie dane")}</td>
        <td class="actions">
          <button class="icon-btn ghost" type="button" data-download-backup="${backup.id}" title="Pobierz">${App.icon("download")}</button>
          <button class="icon-btn danger" type="button" data-delete-backup="${backup.id}" title="Usuń">${App.icon("trash")}</button>
        </td>
      </tr>
    `).join("");
    return rows || `<tr><td colspan="5">${App.emptyState("Brak kopii zapasowych.")}</td></tr>`;
  }

  function exportData() {
    const start = App.content().querySelector("[data-export-start]")?.value;
    const end = App.content().querySelector("[data-export-end]")?.value;
    const payload = FinanceStorage.exportPayload(state.scope, { start, end });
    const rangeLabel = state.scope === "date-range" ? `Zakres dat: ${start} - ${end}` : state.scope === "selected" ? "Tylko wybrane dane" : "Wszystkie dane";
    const backup = FinanceStorage.createBackup(rangeLabel, payload);
    App.downloadJSON(backup.fileName, payload);
    App.showToast("Kopia danych została wyeksportowana.", "success");
    render();
  }

  function importFile(file) {
    if (!file) {
      App.showToast("Wybierz plik JSON do importu.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (!confirm("Import zastąpi bieżące dane aplikacji. Kontynuować?")) return;
        FinanceStorage.replaceData(payload);
        App.showToast("Dane zostały zaimportowane.", "success");
        state.file = null;
        render();
      } catch (error) {
        App.showToast(error.message || "Nie udało się zaimportować pliku.", "error");
      }
    };
    reader.readAsText(file);
  }

  function downloadBackup(id) {
    const data = FinanceStorage.getData();
    const backup = (data.backups || []).find((item) => item.id === id);
    if (!backup) return;
    App.downloadJSON(backup.fileName, backup.data || FinanceStorage.exportPayload("all"));
  }

  function deleteBackup(id) {
    const data = FinanceStorage.getData();
    data.backups = (data.backups || []).filter((item) => item.id !== id);
    FinanceStorage.saveData(data);
    App.showToast("Kopia zapasowa usunięta.", "success");
    render();
  }

  function bind() {
    App.content().addEventListener("change", (event) => {
      if (event.target.matches("[data-scope]")) {
        state.scope = event.target.value;
        render();
      }
      if (event.target.matches("[data-import-file]")) {
        state.file = event.target.files[0] || null;
        render();
      }
    });
    App.content().addEventListener("click", (event) => {
      if (event.target.closest("[data-export]")) exportData();
      if (event.target.closest("[data-import]")) importFile(state.file);
      if (event.target.closest("[data-pick-file]")) App.content().querySelector("[data-import-file]").click();
      const download = event.target.closest("[data-download-backup]");
      const del = event.target.closest("[data-delete-backup]");
      if (download) downloadBackup(download.dataset.downloadBackup);
      if (del && confirm("Usunąć tę kopię zapasową z historii?")) deleteBackup(del.dataset.deleteBackup);
    });
    App.content().addEventListener("dragover", (event) => {
      if (event.target.closest("[data-drop-zone]")) {
        event.preventDefault();
        event.target.closest("[data-drop-zone]").classList.add("dragging");
      }
    });
    App.content().addEventListener("dragleave", (event) => {
      const zone = event.target.closest("[data-drop-zone]");
      if (zone) zone.classList.remove("dragging");
    });
    App.content().addEventListener("drop", (event) => {
      const zone = event.target.closest("[data-drop-zone]");
      if (!zone) return;
      event.preventDefault();
      zone.classList.remove("dragging");
      state.file = event.dataTransfer.files[0] || null;
      render();
    });
  }

  window.ImportExportPage = {
    init() {
      render();
      bind();
    }
  };
})();
