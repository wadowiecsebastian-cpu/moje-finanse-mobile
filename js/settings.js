(function () {
  function render() {
    const data = FinanceStorage.getData();
    const settings = data.settings;
    App.content().innerHTML = `
      ${App.pageHeader("Ustawienia", "Dostosuj aplikację do swoich potrzeb i zarządzaj swoimi danymi.")}
      <div class="settings-shortcuts">
        ${shortcut("palette", "#4d9bff", "Wygląd", "Motyw, kolory i wygląd aplikacji")}
        ${shortcut("lock", "#40c969", "Bezpieczeństwo", "PIN, blokada aplikacji i prywatność")}
        ${shortcut("settings", "#c278ff", "Preferencje", "Waluta, język, format daty i godziny")}
        ${shortcut("bell", "#ff8a00", "Powiadomienia", "Zarządzaj powiadomieniami")}
      </div>
      <div class="settings-grid">
        <section class="panel">
          <h2>Preferencje ogólne</h2>
          <div class="setting-row"><span>Waluta główna</span><select data-setting="currency"><option value="PLN" ${settings.currency === "PLN" ? "selected" : ""}>PLN (złoty polski)</option><option value="EUR" ${settings.currency === "EUR" ? "selected" : ""}>EUR</option><option value="USD" ${settings.currency === "USD" ? "selected" : ""}>USD</option></select></div>
          <div class="setting-row"><span>Język aplikacji</span><select data-setting="language"><option value="pl" selected>Polski</option><option value="en">English</option></select></div>
          <div class="setting-row"><span>Format daty</span><select data-setting="dateFormat"><option ${settings.dateFormat === "DD.MM.RRRR" ? "selected" : ""}>DD.MM.RRRR</option><option ${settings.dateFormat === "RRRR-MM-DD" ? "selected" : ""}>RRRR-MM-DD</option></select></div>
          <div class="setting-row"><span>Format liczbowy</span><select data-setting="numberFormat"><option value="pl-PL" ${settings.numberFormat === "pl-PL" ? "selected" : ""}>1 234,56 (Polski)</option><option value="en-US" ${settings.numberFormat === "en-US" ? "selected" : ""}>1,234.56 (US)</option></select></div>
          <div class="setting-row"><span>Strefa czasowa</span><select data-setting="timezone"><option value="Europe/Warsaw" selected>(UTC+01:00) Warszawa</option><option value="UTC">UTC</option></select></div>
          ${toggle("showDashboardBalances", "Pokaż saldo kont na Dashboardzie", settings.showDashboardBalances)}
          ${toggle("confirmBeforeDelete", "Potwierdź przed usunięciem operacji", settings.confirmBeforeDelete)}
          ${toggle("roundAmounts", "Zaokrąglaj kwoty do 2 miejsc po przecinku", settings.roundAmounts)}
        </section>
        <section class="panel">
          <h2>Bezpieczeństwo</h2>
          ${toggle("appLock", "Blokada aplikacji", settings.appLock, "Zabezpiecz dostęp do aplikacji kodem PIN lub hasłem.")}
          <div class="setting-row"><span>Metoda blokady</span><select data-setting="lockMethod"><option value="PIN" ${settings.lockMethod === "PIN" ? "selected" : ""}>PIN</option><option value="password" ${settings.lockMethod === "password" ? "selected" : ""}>Hasło</option></select><button class="btn" type="button">Zmień PIN</button></div>
          <div class="setting-row"><span>Automatyczna blokada</span><select data-setting="autoLock"><option value="5" ${settings.autoLock === "5" ? "selected" : ""}>Po 5 minutach nieaktywności</option><option value="15" ${settings.autoLock === "15" ? "selected" : ""}>Po 15 minutach</option><option value="never" ${settings.autoLock === "never" ? "selected" : ""}>Nigdy</option></select></div>
          ${toggle("privacyMode", "Prywatność", settings.privacyMode, "Ukryj kwoty na zrzutach ekranu i w podglądzie aplikacji.")}
          ${toggle("automaticBackup", "Kopia zapasowa", settings.automaticBackup, "Automatyczne tworzenie kopii zapasowej danych.")}
          <div class="setting-row"><span>Częstotliwość backupu</span><select data-setting="backupFrequency"><option value="daily" ${settings.backupFrequency === "daily" ? "selected" : ""}>Codziennie</option><option value="weekly" ${settings.backupFrequency === "weekly" ? "selected" : ""}>Co tydzień</option></select><strong class="money-positive">Ostatni backup ${settings.lastBackup ? App.formatDate(settings.lastBackup.slice(0, 10), true) : "-"}</strong></div>
        </section>
        <section class="panel">
          <h2>Zarządzanie danymi</h2>
          ${dataAction("upload", "#4d9bff", "Eksport danych", "Eksportuj wszystkie swoje dane do pliku JSON.", "Eksportuj", "export")}
          ${dataAction("download", "#40c969", "Import danych", "Zaimportuj dane z pliku JSON.", "Importuj", "import")}
          ${dataAction("trash", "#ff5d52", "Wyczyść dane", "Usuń konta, kategorie, operacje i długi, aby zacząć od pustej księgi.", "Wyczyść", "clear", true)}
          <input class="sr-only" type="file" accept="application/json,.json" data-settings-import>
        </section>
        <section class="panel">
          <h2>Informacje o aplikacji</h2>
          <div class="info-list">
            <div>${App.icon("info")}<span>Wersja aplikacji</span><strong>1.0.0</strong></div>
            <div>${App.icon("shield")}<span>Licencja</span><strong>Osobista / Prywatna</strong></div>
            <div>${App.icon("history")}<span>Strona projektu</span><strong>GitHub</strong></div>
            <div>${App.icon("file")}<span>Polityka prywatności</span><strong>Zobacz</strong></div>
            <div>${App.icon("user")}<span>Pomoc i wsparcie</span><strong>Kontakt</strong></div>
          </div>
        </section>
      </div>
      <section class="hint-panel">${App.icon("info")} <strong>Wskazówka:</strong> Wszystkie zmiany ustawień są zapisywane automatycznie.</section>
    `;
  }

  function shortcut(iconName, color, title, subtitle) {
    return `<article class="shortcut-card">${App.iconBox(iconName, color)}<div><strong>${title}</strong><span>${subtitle}</span></div>${App.icon("chevronRight")}</article>`;
  }

  function toggle(key, title, checked, sub) {
    return `
      <div class="setting-row toggle-row">
        <span><strong>${title}</strong>${sub ? `<small>${sub}</small>` : ""}</span>
        <label class="switch"><input type="checkbox" data-setting="${key}" ${checked ? "checked" : ""}><i></i></label>
      </div>
    `;
  }

  function dataAction(iconName, color, title, subtitle, button, action, danger) {
    return `
      <div class="data-action">
        ${App.iconBox(iconName, color)}
        <div><strong>${title}</strong><span>${subtitle}</span></div>
        <button class="btn ${danger ? "btn-danger-outline" : ""}" type="button" data-data-action="${action}">${button}</button>
      </div>
    `;
  }

  function saveSetting(key, value) {
    const data = FinanceStorage.getData();
    data.settings[key] = value;
    FinanceStorage.saveData(data);
    App.showToast("Ustawienie zapisane.", "success");
  }

  function handleImport(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!confirm("Import zastąpi bieżące dane aplikacji. Kontynuować?")) return;
        FinanceStorage.replaceData(imported);
        App.showToast("Dane zostały zaimportowane.", "success");
        render();
      } catch (error) {
        App.showToast(error.message || "Nie udało się zaimportować danych.", "error");
      }
    };
    reader.readAsText(file);
  }

  function bind() {
    App.content().addEventListener("change", (event) => {
      const field = event.target.closest("[data-setting]");
      if (!field) return;
      const value = field.type === "checkbox" ? field.checked : field.value;
      saveSetting(field.dataset.setting, value);
    });
    App.content().addEventListener("click", (event) => {
      const action = event.target.closest("[data-data-action]");
      if (!action) return;
      const type = action.dataset.dataAction;
      if (type === "export") {
        const payload = FinanceStorage.exportPayload("all");
        FinanceStorage.createBackup("Wszystkie dane", payload);
        App.downloadJSON("moje_finanse_export.json", payload);
        App.showToast("Eksport danych gotowy.", "success");
      }
      if (type === "import") {
        App.content().querySelector("[data-settings-import]").click();
      }
      if (type === "clear" && confirm("Na pewno wyczyścić wszystkie dane finansowe? Konta, kategorie, operacje i długi zostaną usunięte.")) {
        FinanceStorage.reset();
        App.showToast("Dane finansowe zostały wyczyszczone. Możesz zacząć od pustej księgi.", "success");
        render();
      }
    });
    App.content().addEventListener("change", (event) => {
      if (event.target.matches("[data-settings-import]")) handleImport(event.target.files[0]);
    });
  }

  window.SettingsPage = {
    init() {
      render();
      bind();
    }
  };
})();
