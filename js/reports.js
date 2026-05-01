(function () {
  const reportState = { month: FinanceStorage.periodBounds().monthValue };

  function monthLabel(monthValue) {
    const [year, month] = monthValue.split("-").map(Number);
    return new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  }

  function categoryItems(data, type, start, end) {
    const totals = FinanceStorage.categoryTotals(data, type, start, end);
    const sum = totals.reduce((acc, item) => acc + item.amount, 0);
    return totals.map((item) => ({
      ...item,
      percent: sum ? (item.amount / sum) * 100 : 0,
      color: item.category.color || "#6aa8ff",
      icon: item.category.icon || "tag"
    }));
  }

  function legend(items) {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return `
      <div class="chart-list">
        ${items.map((item) => `
          <div>
            <span><i style="background:${item.color}"></i>${App.escapeHtml(item.category.name)}</span>
            <strong>${App.formatMoney(item.amount)} <em>(${total ? item.percent.toFixed(1).replace(".", ",") : "0"}%)</em></strong>
          </div>
        `).join("")}
      </div>
    `;
  }

  function dailySeries(data, type, period) {
    const daysInMonth = Number(period.end.slice(8, 10));
    const checkpoints = [1, 5, 10, 15, 20, 25, daysInMonth].filter((day, index, arr) => arr.indexOf(day) === index);
    return {
      labels: checkpoints.map((day) => `${String(day).padStart(2, "0")}.${String(period.month + 1).padStart(2, "0")}`),
      values: checkpoints.map((day) => {
        const end = `${period.year}-${String(period.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return FinanceStorage.amountByCategoryType(data, type, period.start, end);
      })
    };
  }

  function monthlySeries(data, type, year) {
    return Array.from({ length: 12 }, (_, index) => {
      const monthValue = `${year}-${String(index + 1).padStart(2, "0")}`;
      const period = FinanceStorage.periodBounds(monthValue);
      return FinanceStorage.amountByCategoryType(data, type, period.start, period.end);
    });
  }

  function dashboardAccounts(data, summary) {
    const accounts = (data.accounts || [])
      .filter((account) => !account.archived)
      .map((account) => ({ account, balance: summary.balances[account.id] || 0 }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance) || a.account.name.localeCompare(b.account.name, "pl"))
      .slice(0, 6);

    if (!accounts.length) return App.emptyState("Brak kont do pokazania.");

    return accounts.map(({ account, balance }) => {
      const visibleBalance = account.type === "liability" && balance > 0 ? -balance : balance;
      return `
        <a class="account-row" href="accounts.html">
          <span>${App.iconBox(account.icon, account.color)}${App.escapeHtml(account.name)}</span>
          <strong class="${visibleBalance < 0 ? "money-negative" : visibleBalance > 0 ? "money-positive" : "money-neutral"}">${App.formatMoney(visibleBalance)}</strong>
          ${App.icon("chevronRight")}
        </a>
      `;
    }).join("");
  }

  function recentEntries(data) {
    return FinanceStorage.sortEntries(data.entries || [], "desc").filter((entry) => entry.type !== "opening").slice(0, 5).map((entry) => {
      const category = FinanceStorage.getCategory(data, entry.categoryId) || {};
      const debit = FinanceStorage.getAccount(data, entry.debitAccountId) || {};
      const credit = FinanceStorage.getAccount(data, entry.creditAccountId) || {};
      const signed = window.EntriesPage ? window.EntriesPage.signedEntryAmount(data, entry) : entry.amount;
      const arrow = signed >= 0 ? "arrowUp" : "arrowDown";
      return `
        <div class="operation-row">
          <span>${App.formatDate(entry.date)}</span>
          <strong>${App.escapeHtml(entry.description)}</strong>
          <div class="chips">${App.badge(category.name || "-", category.type === "income" ? "green" : category.type === "expense" ? "red" : "blue")}${App.badge(credit.name || debit.name || "-", "blue")}</div>
          <b class="${App.amountClass(signed)}">${App.signedMoney(signed, { forceSign: true })}</b>
          ${App.icon(arrow)}
        </div>
      `;
    }).join("");
  }

  function renderDashboard() {
    const data = FinanceStorage.getData();
    const summary = FinanceStorage.summary(data);
    const expenseItems = categoryItems(data, "expense", summary.period.start, summary.period.end);
    const incomeDaily = dailySeries(data, "income", summary.period);
    const expenseDaily = dailySeries(data, "expense", summary.period);
    App.content().innerHTML = `
      ${App.pageHeader("Witaj!", "Oto podsumowanie Twoich finansów.")}
      <div class="stats-grid five">
        ${App.statCard({ label: "Łączne aktywa", value: App.formatMoney(summary.assets), icon: "cash", color: "#5bd66f", valueClass: "money-positive" })}
        ${App.statCard({ label: "Łączne pasywa", value: `-${App.formatMoney(summary.liabilities)}`, icon: "card", color: "#ff5d52", valueClass: "money-negative" })}
        ${App.statCard({ label: "Majątek netto", value: App.formatMoney(summary.netWorth), icon: "chart", color: "#72a9ff", valueClass: "money-blue" })}
        ${App.statCard({ label: "Przychody (mies.)", value: App.formatMoney(summary.income), icon: "arrowUp", color: "#40c969", valueClass: "money-positive" })}
        ${App.statCard({ label: "Wydatki (mies.)", value: `-${App.formatMoney(summary.expenses)}`, icon: "arrowDown", color: "#ff8a00", valueClass: "money-orange" })}
      </div>
      <div class="dashboard-grid">
        <section class="panel">
          <div class="panel-title"><h2>Salda kont</h2><a href="accounts.html">Zobacz wszystkie</a></div>
          <div class="account-list">${dashboardAccounts(data, summary)}</div>
        </section>
        <section class="panel">
          <div class="panel-title"><h2>Ostatnie operacje</h2><a href="entries.html">Zobacz wszystkie</a></div>
          <div class="operation-list">${recentEntries(data) || App.emptyState("Brak ostatnich operacji.")}</div>
        </section>
      </div>
      <div class="charts-grid">
        <section class="panel chart-panel">
          <h2>Wydatki w tym miesiącu <span>(wg kategorii)</span></h2>
          <div class="donut-layout">
            ${App.donut(expenseItems.map((item) => ({ amount: item.amount, color: item.color })), App.formatMoney(summary.expenses), "łącznie")}
            ${legend(expenseItems)}
          </div>
        </section>
        <section class="panel chart-panel">
          <div class="panel-title"><h2>Przychody vs Wydatki</h2><span>Bieżący miesiąc</span></div>
          ${App.lineChart([
            { name: "Przychody", color: "#5bd66f", values: incomeDaily.values },
            { name: "Wydatki", color: "#ff6b22", values: expenseDaily.values }
          ], incomeDaily.labels)}
        </section>
      </div>
      <section class="hint-panel">${App.icon("info")} <strong>Jak to działa?</strong> Każda operacja ma stronę Winien (debet) i stronę Ma (kredyt). Dzięki temu zawsze wiesz skąd pochodzą pieniądze i dokąd trafiają.</section>
    `;
  }

  function reportLists(expenses, incomes) {
    const expenseTotal = expenses.reduce((sum, item) => sum + item.amount, 0);
    const incomeTotal = incomes.reduce((sum, item) => sum + item.amount, 0);
    const expenseRows = expenses.map((item) => `
      <div class="analysis-row">
        <span>${App.icon(item.icon, "mini")} ${App.escapeHtml(item.category.name)}</span>
        ${App.progressBar(item.percent, item.color)}
        <strong>${App.formatMoney(item.amount)}</strong>
        <em>${expenseTotal ? item.percent.toFixed(1).replace(".", ",") : "0"}%</em>
      </div>
    `).join("");
    const incomeRows = incomes.map((item) => `
      <div class="analysis-row">
        <span>${App.icon(item.icon, "mini")} ${App.escapeHtml(item.category.name)}</span>
        ${App.progressBar(item.percent, item.color)}
        <strong>${App.formatMoney(item.amount)}</strong>
        <em>${incomeTotal ? item.percent.toFixed(1).replace(".", ",") : "0"}%</em>
      </div>
    `).join("");
    return { expenseRows, incomeRows };
  }

  function renderReports() {
    const data = FinanceStorage.getData();
    const summary = FinanceStorage.summary(data, reportState.month);
    const expenses = categoryItems(data, "expense", summary.period.start, summary.period.end);
    const incomes = categoryItems(data, "income", summary.period.start, summary.period.end);
    const lists = reportLists(expenses, incomes);
    const months = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
    App.content().innerHTML = `
      ${App.pageHeader("Raporty", "Analizuj swoje finanse i śledź wydatki, przychody oraz bilans.", `
        <label class="period-control">Okres <input type="month" value="${reportState.month}" data-report-month></label>
        <button class="btn" type="button" data-export-report>${App.icon("download")} Eksportuj raport</button>
      `)}
      <div class="stats-grid four">
        ${App.statCard({ label: "Przychody", value: App.formatMoney(summary.income), sub: "+12,5% vs marzec", icon: "arrowUp", color: "#40c969", valueClass: "money-positive" })}
        ${App.statCard({ label: "Wydatki", value: `-${App.formatMoney(summary.expenses)}`, sub: "-8,3% vs marzec", icon: "arrowDown", color: "#ff6b22", valueClass: "money-negative" })}
        ${App.statCard({ label: "Wynik (przychody - wydatki)", value: App.formatMoney(summary.result), sub: "+28,7% vs marzec", icon: "chart", color: "#72a9ff", valueClass: "money-blue" })}
        ${App.statCard({ label: "Oszczędności", value: App.formatMoney(summary.savings), sub: `${summary.income ? ((summary.savings / summary.income) * 100).toFixed(1).replace(".", ",") : "0"}% z przychodów`, icon: "wallet", color: "#c278ff", valueClass: "money-purple" })}
      </div>
      <div class="charts-grid">
        <section class="panel chart-panel">
          <div class="panel-title"><h2>Wydatki wg kategorii</h2><select class="compact-select"><option>Wg kwoty</option></select></div>
          <div class="donut-layout">${App.donut(expenses.map((item) => ({ amount: item.amount, color: item.color })), App.formatMoney(summary.expenses), "łącznie")}${legend(expenses)}</div>
        </section>
        <section class="panel chart-panel">
          <div class="panel-title"><h2>Przychody vs Wydatki</h2><select class="compact-select"><option>Miesięcznie</option></select></div>
          ${App.lineChart([
            { name: "Przychody", color: "#5bd66f", values: monthlySeries(data, "income", summary.period.year) },
            { name: "Wydatki", color: "#ff6b22", values: monthlySeries(data, "expense", summary.period.year) }
          ], months)}
        </section>
      </div>
      <div class="reports-grid">
        <section class="panel">
          <h2>Wydatki wg kategorii (lista)</h2>
          <div class="analysis-list">${lists.expenseRows || App.emptyState("Brak wydatków w tym okresie.")}</div>
          <a class="panel-link" href="categories.html">Zobacz wszystkie kategorie</a>
        </section>
        <section class="panel">
          <h2>Przychody wg źródła</h2>
          <div class="analysis-list">${lists.incomeRows || App.emptyState("Brak przychodów w tym okresie.")}</div>
          <a class="panel-link" href="categories.html">Zobacz wszystkie źródła</a>
        </section>
        <section class="panel summary-panel">
          <h2>Podsumowanie okresu</h2>
          <div><span>Przychody</span><strong class="money-positive">${App.formatMoney(summary.income)}</strong></div>
          <div><span>Wydatki</span><strong class="money-negative">-${App.formatMoney(summary.expenses)}</strong></div>
          <div><span>Wynik</span><strong class="money-blue">${App.formatMoney(summary.result)}</strong></div>
          <div><span>Oszczędności</span><strong class="money-purple">${App.formatMoney(summary.savings)}</strong></div>
          <div><span>Stopa oszczędności</span><strong class="money-purple">${summary.income ? ((summary.savings / summary.income) * 100).toFixed(1).replace(".", ",") : "0"}%</strong></div>
          <a class="panel-link" href="entries.html">Zobacz pełne podsumowanie</a>
        </section>
      </div>
      <section class="hint-panel">${App.icon("info")} <strong>Wskazówka:</strong> Używaj filtrów okresu i kategorii, aby dokładnie analizować swoje finanse.</section>
    `;
  }

  function bindReports() {
    App.content().addEventListener("change", (event) => {
      if (event.target.matches("[data-report-month]")) {
        reportState.month = event.target.value;
        renderReports();
      }
    });
    App.content().addEventListener("click", (event) => {
      if (!event.target.closest("[data-export-report]")) return;
      const data = FinanceStorage.getData();
      const summary = FinanceStorage.summary(data, reportState.month);
      const payload = {
        generatedAt: new Date().toISOString(),
        period: monthLabel(reportState.month),
        summary,
        expenses: categoryItems(data, "expense", summary.period.start, summary.period.end),
        incomes: categoryItems(data, "income", summary.period.start, summary.period.end)
      };
      App.downloadJSON(`raport_${reportState.month}.json`, payload);
      App.showToast("Raport został wyeksportowany.", "success");
    });
  }

  window.DashboardPage = { init: renderDashboard };
  window.ReportsPage = {
    init() {
      renderReports();
      bindReports();
    }
  };
})();
