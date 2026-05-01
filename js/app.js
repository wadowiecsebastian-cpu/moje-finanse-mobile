(function () {
  const iconPaths = {
    scale: '<path d="M12 3v18"/><path d="M6 6h12"/><path d="M6 6 3 14h6L6 6Z"/><path d="M18 6l-3 8h6l-3-8Z"/><path d="M8 21h8"/>',
    dashboard: '<path d="M4 13h5v7H4z"/><path d="M15 4h5v16h-5z"/><path d="M4 4h5v5H4z"/><path d="M15 13h5v7h-5z"/>',
    wallet: '<path d="M4 7h16v12H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h13"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h.01M11 15h2"/>',
    entries: '<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 10h16"/><path d="M9 15h6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    history: '<path d="M4 4v6h6"/><path d="M20 12a8 8 0 1 1-2.34-5.66L4 10"/><path d="M12 8v5l3 2"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h17"/><rect x="7" y="11" width="3" height="5"/><rect x="12" y="7" width="3" height="9"/><rect x="17" y="3" width="3" height="13"/>',
    tag: '<path d="M20 10 12 2H4v8l8 8 8-8Z"/><path d="M7.5 7.5h.01"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 5 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.43 3.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 5a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z"/>',
    upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/>',
    download: '<path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
    more: '<path d="M12 5h.01M12 12h.01M12 19h.01"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    bank: '<path d="m3 10 9-6 9 6"/><path d="M5 10h14"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8"/><path d="M4 18h16M3 21h18"/>',
    piggy: '<path d="M6 11c.8-2.6 3-4 6-4h4a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-1l-1 2h-3l-1-2H8l-1 2H4l1-3a6 6 0 0 1 1-5Z"/><path d="M2 10h3"/><path d="M15 9h.01"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9h.01M18 15h.01"/>',
    car: '<path d="M5 17h14l-1-5H6l-1 5Z"/><path d="M7 17v2M17 17v2"/><path d="M7 12l2-5h6l2 5"/>',
    cart: '<path d="M4 5h2l2 10h10l2-7H7"/><circle cx="10" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4Z"/>',
    gamepad: '<path d="M7 10h10a5 5 0 0 1 4 8l-1 1a2 2 0 0 1-3-.5L16 16H8l-1 2.5a2 2 0 0 1-3 .5l-1-1a5 5 0 0 1 4-8Z"/><path d="M8 13v3M6.5 14.5h3M16 14h.01M18.5 14h.01"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    hand: '<path d="M8 12h5a2 2 0 0 1 0 4h-3"/><path d="M4 16l3-6a3 3 0 0 1 5.5.4"/><path d="m12 16 3 2 5-5"/><path d="M2 18l5 3 6-3"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2"/><path d="M3 12h18"/>',
    gift: '<path d="M20 12v9H4v-9"/><path d="M2 7h20v5H2z"/><path d="M12 7v14"/><path d="M12 7H8.5A2.5 2.5 0 1 1 11 4.5L12 7Z"/><path d="M12 7h3.5A2.5 2.5 0 1 0 13 4.5L12 7Z"/>',
    spark: '<path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2Z"/>',
    coins: '<circle cx="8" cy="8" r="5"/><path d="M13 8v8a5 5 0 1 0 5-5h-1"/><path d="M8 5v6M5 8h6"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
    filter: '<path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    swap: '<path d="M7 7h11l-3-3"/><path d="M17 17H6l3 3"/><path d="m15 4 3 3-3 3"/><path d="m9 14-3 3 3 3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18h1a2 2 0 0 0 1-3.7 1.2 1.2 0 0 1 .6-2.3H16a5 5 0 0 0 0-10h-4Z"/><path d="M7.5 10.5h.01M10 7.5h.01M14 7.5h.01M6.5 14h.01"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>'
  };

  const navItems = [
    { page: "dashboard", href: "index.html", label: "Dashboard", icon: "dashboard" },
    { page: "accounts", href: "accounts.html", label: "Konta", icon: "card" },
    { page: "entries", href: "entries.html", label: "Operacje", icon: "entries" },
    { page: "add-entry", href: "add-entry.html", label: "Dodaj operację", icon: "plus" },
    { page: "history", href: "entries.html", label: "Historia", icon: "history" },
    { page: "reports", href: "reports.html", label: "Raporty", icon: "chart" },
    { page: "categories", href: "categories.html", label: "Kategorie", icon: "dashboard" },
    { page: "debts", href: "debts.html", label: "Długi", icon: "user" },
    { page: "settings", href: "settings.html", label: "Ustawienia", icon: "settings" },
    { page: "import-export", href: "import-export.html", label: "Eksport / Import", icon: "upload" }
  ];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function icon(name, className) {
    const paths = iconPaths[name] || iconPaths.info;
    return `<svg class="icon ${className || ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
  }

  function formatMoney(value, options) {
    const amount = Number(value) || 0;
    const settings = FinanceStorage.getData().settings || {};
    const currency = options?.currency || settings.currency || "PLN";
    const formatter = new Intl.NumberFormat("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${formatter.format(amount)} ${currency === "PLN" ? "zł" : currency}`;
  }

  function formatDate(value, long) {
    if (!value) return "-";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("pl-PL", long
      ? { day: "numeric", month: "long", year: "numeric" }
      : { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  }

  function todayLong() {
    return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  }

  function amountClass(value, inverse) {
    const amount = Number(value) || 0;
    if (amount === 0) return "money-neutral";
    const positive = inverse ? amount < 0 : amount > 0;
    return positive ? "money-positive" : "money-negative";
  }

  function signedMoney(value, options) {
    const amount = Number(value) || 0;
    const sign = options?.forceSign && amount > 0 ? "+" : "";
    return `${sign}${formatMoney(amount)}`;
  }

  function badge(label, tone) {
    return `<span class="badge badge-${tone || "neutral"}">${escapeHtml(label)}</span>`;
  }

  function iconBox(iconName, color, extraClass) {
    return `<span class="icon-box ${extraClass || ""}" style="--tone:${color || "#6aa8ff"}">${icon(iconName || "info")}</span>`;
  }

  function statCard(card) {
    const cls = card.tone ? ` tone-${card.tone}` : "";
    const valueClass = card.valueClass || "";
    return `
      <article class="stat-card${cls}">
        ${iconBox(card.icon || "info", card.color, "stat-icon")}
        <div>
          <p>${escapeHtml(card.label)}</p>
          <strong class="${valueClass}">${card.value}</strong>
          ${card.sub ? `<small>${card.sub}</small>` : ""}
        </div>
      </article>
    `;
  }

  function pageHeader(title, subtitle, actionHtml) {
    return `
      <div class="page-header">
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(subtitle || "")}</p>
        </div>
        ${actionHtml ? `<div class="page-actions">${actionHtml}</div>` : ""}
      </div>
    `;
  }

  function renderShell(page) {
    const app = document.getElementById("app");
    const nav = navItems.map((item) => {
      const active = item.page === page || (item.page === "entries" && page === "history");
      return `
        <a class="nav-link ${active ? "active" : ""}" href="${item.href}">
          ${icon(item.icon)}
          <span>${escapeHtml(item.label)}</span>
        </a>
      `;
    }).join("");
    const mobileItems = [
      { page: "dashboard", href: "index.html", label: "Start", icon: "dashboard" },
      { page: "entries", href: "entries.html", label: "Operacje", icon: "entries" },
      { page: "add-entry", href: "add-entry.html", label: "Dodaj", icon: "plus" },
      { page: "reports", href: "reports.html", label: "Raporty", icon: "chart" }
    ];
    const mobileNav = mobileItems.map((item) => {
      const active = item.page === page || (item.page === "entries" && page === "history");
      return `
        <a class="mobile-nav-item ${active ? "active" : ""}" href="${item.href}">
          ${icon(item.icon)}
          <span>${escapeHtml(item.label)}</span>
        </a>
      `;
    }).join("");

    app.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar" id="sidebar">
          <div class="brand">
            ${icon("scale", "brand-icon")}
            <div>
              <strong>Moje Finanse</strong>
              <span>Winien / Ma</span>
            </div>
          </div>
          <nav class="sidebar-nav">${nav}</nav>
          <div class="balance-rule">
            ${icon("scale")}
            <div>
              <strong>Zasada bilansowania</strong>
              <p>Suma zapisów Winien musi być równa sumie zapisów Ma</p>
            </div>
          </div>
        </aside>
        <main class="main">
          <header class="topbar">
            <button class="icon-btn ghost mobile-menu" type="button" data-sidebar-toggle aria-label="Menu" aria-controls="sidebar" aria-expanded="false">${icon("menu")}</button>
            <div class="topbar-spacer"></div>
            <button class="icon-btn ghost" type="button" data-theme-toggle aria-label="Motyw">${icon("moon")}</button>
            <div class="topbar-date">${icon("calendar")}<span>${todayLong()}</span></div>
          </header>
          <section id="page-content" class="content page-${page}"></section>
        </main>
      </div>
      <button class="sidebar-backdrop" type="button" data-sidebar-close aria-label="Zamknij menu"></button>
      <nav class="mobile-bottom-nav" aria-label="Nawigacja mobilna">
        ${mobileNav}
        <button class="mobile-nav-item" type="button" data-sidebar-toggle aria-label="Pelne menu" aria-controls="sidebar" aria-expanded="false">
          ${icon("menu")}
          <span>Menu</span>
        </button>
      </nav>
      <div id="modal-root"></div>
      <div id="toast-root" class="toast-root"></div>
    `;

    const sidebarButtons = document.querySelectorAll("[data-sidebar-toggle]");
    const setSidebar = (open) => {
      document.body.classList.toggle("sidebar-open", open);
      sidebarButtons.forEach((button) => button.setAttribute("aria-expanded", String(open)));
    };

    sidebarButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setSidebar(!document.body.classList.contains("sidebar-open"));
      });
    });
    document.querySelector("[data-sidebar-close]").addEventListener("click", () => setSidebar(false));
    document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
      link.addEventListener("click", () => setSidebar(false));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setSidebar(false);
    });
    document.querySelector("[data-theme-toggle]").addEventListener("click", () => {
      showToast("Aplikacja używa ciemnego motywu z ustawień.");
    });
  }

  function content() {
    return document.getElementById("page-content");
  }

  function showToast(message, tone) {
    const root = document.getElementById("toast-root");
    if (!root) return;
    const item = document.createElement("div");
    item.className = `toast ${tone || "info"}`;
    item.textContent = message;
    root.appendChild(item);
    setTimeout(() => item.classList.add("show"), 10);
    setTimeout(() => {
      item.classList.remove("show");
      setTimeout(() => item.remove(), 250);
    }, 2800);
  }

  function closeModal() {
    const root = document.getElementById("modal-root");
    if (root) root.innerHTML = "";
    document.body.classList.remove("modal-open");
  }

  function openModal(options) {
    const root = document.getElementById("modal-root");
    root.innerHTML = `
      <div class="modal-backdrop" data-close-modal>
        <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <header class="modal-header">
            <h2 id="modal-title">${escapeHtml(options.title || "")}</h2>
            <button class="icon-btn ghost" type="button" data-close-modal aria-label="Zamknij">${icon("close")}</button>
          </header>
          <div class="modal-body">${options.body || ""}</div>
          ${options.footer ? `<footer class="modal-footer">${options.footer}</footer>` : ""}
        </section>
      </div>
    `;
    document.body.classList.add("modal-open");
    root.querySelectorAll("[data-close-modal]").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (event.target === element || element.matches("button")) closeModal();
      });
    });
    if (typeof options.onOpen === "function") options.onOpen(root);
  }

  function formData(form) {
    const data = new FormData(form);
    return Object.fromEntries(data.entries());
  }

  function downloadJSON(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function accountOptions(data, selected, filterTypes) {
    return (data.accounts || [])
      .filter((account) => !account.archived)
      .filter((account) => !filterTypes || filterTypes.includes(account.type))
      .map((account) => `<option value="${account.id}" ${account.id === selected ? "selected" : ""}>${escapeHtml(account.name)} (${FinanceStorage.accountTypeLabel(account.type)})</option>`)
      .join("");
  }

  function categoryOptions(data, selected, filterTypes) {
    return (data.categories || [])
      .filter((category) => !category.archived)
      .filter((category) => !filterTypes || filterTypes.includes(category.type))
      .map((category) => `<option value="${category.id}" ${category.id === selected ? "selected" : ""}>${escapeHtml(category.name)} (${FinanceStorage.categoryTypeLabel(category.type)})</option>`)
      .join("");
  }

  function emptyState(message) {
    return `<div class="empty-state">${icon("info")}<span>${escapeHtml(message)}</span></div>`;
  }

  function progressBar(value, color) {
    const width = Math.max(0, Math.min(100, Number(value) || 0));
    return `<span class="progress"><span style="width:${width}%;--bar:${color || "#6aa8ff"}"></span></span>`;
  }

  function donut(items, centerText, subText) {
    const total = items.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
    if (!total) {
      return `<div class="donut empty"><div><strong>0,00 zł</strong><span>łącznie</span></div></div>`;
    }
    let cursor = 0;
    const stops = items.map((item) => {
      const start = cursor;
      const end = cursor + (item.amount / total) * 100;
      cursor = end;
      return `${item.color || "#6aa8ff"} ${start}% ${end}%`;
    }).join(", ");
    return `
      <div class="donut" style="background: conic-gradient(${stops});">
        <div><strong>${centerText || formatMoney(total)}</strong><span>${subText || "łącznie"}</span></div>
      </div>
    `;
  }

  function lineChart(series, labels) {
    const width = 640;
    const height = 240;
    const pad = { left: 52, right: 18, top: 18, bottom: 36 };
    const allValues = series.flatMap((item) => item.values);
    const max = Math.max(100, ...allValues) * 1.12;
    const xStep = (width - pad.left - pad.right) / Math.max(1, (labels.length - 1));
    const y = (value) => height - pad.bottom - ((value / max) * (height - pad.top - pad.bottom));
    const x = (index) => pad.left + index * xStep;
    const grids = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const yy = height - pad.bottom - ratio * (height - pad.top - pad.bottom);
      return `<line x1="${pad.left}" y1="${yy}" x2="${width - pad.right}" y2="${yy}" class="chart-grid"/><text x="8" y="${yy + 4}" class="chart-label">${Math.round(max * ratio)} zł</text>`;
    }).join("");
    const labelNodes = labels.map((label, index) => `<text x="${x(index)}" y="${height - 10}" class="chart-label bottom">${escapeHtml(label)}</text>`).join("");
    const paths = series.map((item) => {
      const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
      const circles = item.values.map((value, index) => `<circle cx="${x(index)}" cy="${y(value)}" r="3.2" fill="${item.color}"/>`).join("");
      return `<polyline points="${points}" fill="none" stroke="${item.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${circles}`;
    }).join("");
    const legend = series.map((item, index) => `<span><i style="background:${item.color}"></i>${escapeHtml(item.name)}</span>`).join("");
    return `
      <div class="line-chart">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Wykres liniowy">${grids}${paths}${labelNodes}</svg>
        <div class="chart-legend">${legend}</div>
      </div>
    `;
  }

  function setFieldValue(selector, value) {
    const field = document.querySelector(selector);
    if (field) field.value = value ?? "";
  }

  function enhanceResponsiveTables(root) {
    const scope = root || document;
    scope.querySelectorAll("table").forEach((table) => {
      const headers = Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent.replace(/\u2195/g, "").trim());
      table.querySelectorAll("tbody tr").forEach((row) => {
        Array.from(row.children).forEach((cell, index) => {
          if (cell.hasAttribute("colspan")) return;
          const label = headers[index] || "";
          if (label) cell.dataset.label = label;
        });
      });
    });
  }

  function watchResponsiveTables() {
    const pageContent = content();
    if (!pageContent) return;
    const observer = new MutationObserver(() => enhanceResponsiveTables(pageContent));
    observer.observe(pageContent, { childList: true, subtree: true });
    enhanceResponsiveTables(pageContent);
  }

  async function init() {
    try {
      await FinanceStorage.init();
    } catch (error) {
      console.error("Nie udało się zainicjować bazy IndexedDB.", error);
      FinanceStorage.ensureData();
    }
    const page = document.body.dataset.page || "dashboard";
    renderShell(page);
    const pageMap = {
      dashboard: "DashboardPage",
      accounts: "AccountsPage",
      entries: "EntriesPage",
      "add-entry": "AddEntryPage",
      reports: "ReportsPage",
      categories: "CategoriesPage",
      debts: "DebtsPage",
      settings: "SettingsPage",
      "import-export": "ImportExportPage"
    };
    const mountPage = () => {
      const controller = window[pageMap[page]];
      if (controller && typeof controller.init === "function") controller.init();
      watchResponsiveTables();
      enhanceResponsiveTables(content());
    };

    if (window[pageMap[page]]) {
      mountPage();
    } else {
      setTimeout(mountPage, 0);
    }
  }

  window.App = {
    escapeHtml,
    icon,
    formatMoney,
    formatDate,
    todayLong,
    amountClass,
    signedMoney,
    badge,
    iconBox,
    statCard,
    pageHeader,
    content,
    showToast,
    closeModal,
    openModal,
    formData,
    downloadJSON,
    accountOptions,
    categoryOptions,
    emptyState,
    progressBar,
    donut,
    lineChart,
    setFieldValue,
    enhanceResponsiveTables
  };

  let initStarted = false;
  function startInit() {
    if (initStarted) return;
    initStarted = true;
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startInit, { once: true });
    window.addEventListener("load", startInit, { once: true });
    setTimeout(startInit, 0);
  } else {
    startInit();
  }
})();
