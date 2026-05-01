(function () {
  const KEY = "mojeFinanse.data.v1";
  const DB_NAME = "MojeFinanseDB";
  const DB_VERSION = 1;
  const STORE_NAME = "appState";
  const DATA_ID = "current";
  const MONEY_EPSILON = 0.005;
  const debitNormalTypes = ["asset", "expense"];
  const creditNormalTypes = ["liability", "income", "transfer", "equity"];

  let dataCache = null;
  let dbPromise = null;
  let writeQueue = Promise.resolve();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeAmount(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (!value) return 0;
    return Number(String(value).replace(/\s/g, "").replace(",", ".")) || 0;
  }

  function defaultData() {
    return {
      version: 1,
      accounts: [],
      categories: [],
      entries: [],
      debts: [],
      settings: clone(window.FinanceSampleData.settings || {}),
      backups: [],
      meta: { createdAt: nowIso(), updatedAt: nowIso(), storage: "indexedDB" }
    };
  }

  function sampleData() {
    const data = clone(window.FinanceSampleData);
    data.meta = { createdAt: nowIso(), updatedAt: nowIso(), storage: "indexedDB" };
    return data;
  }

  function normalizeBackup(backup) {
    return {
      id: backup.id || uid("backup"),
      fileName: backup.fileName || `backup_${Date.now()}.json`,
      createdAt: backup.createdAt || nowIso(),
      size: normalizeAmount(backup.size),
      range: backup.range || "Wszystkie dane",
      data: backup.data || null
    };
  }

  function mergeData(input) {
    const defaults = defaultData();
    const parsed = input && typeof input === "object" ? input : {};
    return {
      ...defaults,
      ...parsed,
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : defaults.accounts,
      categories: Array.isArray(parsed.categories) ? parsed.categories : defaults.categories,
      entries: Array.isArray(parsed.entries) ? parsed.entries : defaults.entries,
      debts: Array.isArray(parsed.debts) ? parsed.debts : defaults.debts,
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      backups: Array.isArray(parsed.backups) ? parsed.backups.slice(0, 12).map(normalizeBackup) : [],
      meta: {
        ...(defaults.meta || {}),
        ...(parsed.meta || {}),
        storage: "indexedDB",
        updatedAt: parsed.meta?.updatedAt || nowIso()
      }
    };
  }

  function openDB() {
    if (!("indexedDB" in window)) {
      return Promise.reject(new Error("IndexedDB nie jest dostępne w tej przeglądarce."));
    }
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Nie udało się otworzyć IndexedDB."));
      request.onblocked = () => console.warn("Aktualizacja IndexedDB jest zablokowana przez inną otwartą kartę aplikacji.");
    });
    return dbPromise;
  }

  async function idbGet() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(DATA_ID);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error || new Error("Nie udało się odczytać danych z IndexedDB."));
    });
  }

  async function idbPut(data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ id: DATA_ID, data: clone(data), updatedAt: nowIso() });
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error || new Error("Nie udało się zapisać danych w IndexedDB."));
    });
  }

  async function idbDelete() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(DATA_ID);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Nie udało się usunąć danych z IndexedDB."));
    });
  }

  function withTimeout(promise, ms, message) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
  }

  function readLegacyData() {
    const sources = [
      () => localStorage.getItem(KEY),
      () => sessionStorage.getItem(KEY)
    ];
    for (const read of sources) {
      try {
        const raw = read();
        if (raw) return JSON.parse(raw);
      } catch (error) {
        console.warn("Nie udało się odczytać starego zapisu localStorage/sessionStorage.", error);
      }
    }
    return null;
  }

  function clearLegacyData() {
    try { localStorage.removeItem(KEY); } catch (error) {}
    try { sessionStorage.removeItem(KEY); } catch (error) {}
  }

  function queuePersist(data) {
    const snapshot = clone(data);
    writeQueue = writeQueue
      .catch(() => {})
      .then(() => idbPut(snapshot))
      .catch((error) => console.warn("Nie udało się zapisać danych w IndexedDB. Zmiany pozostają w pamięci do odświeżenia strony.", error));
    return writeQueue;
  }

  async function init() {
    if (dataCache) return dataCache;
    try {
      const stored = await withTimeout(idbGet(), 1600, "Przekroczono czas odczytu IndexedDB.");
      dataCache = mergeData(stored || readLegacyData() || sampleData());
      withTimeout(idbPut(dataCache), 1600, "Przekroczono czas zapisu IndexedDB.")
        .catch((error) => console.warn("Nie udało się zsynchronizować danych z IndexedDB.", error));
      clearLegacyData();
      return dataCache;
    } catch (error) {
      console.warn("IndexedDB jest niedostępne. Aplikacja działa tymczasowo w pamięci.", error);
      dataCache = mergeData(readLegacyData() || sampleData());
      return dataCache;
    }
  }

  function ensureData() {
    if (!dataCache) {
      dataCache = mergeData(readLegacyData() || sampleData());
      queuePersist(dataCache);
    }
    return dataCache;
  }

  function getData() {
    return ensureData();
  }

  function saveData(data) {
    const next = mergeData({ ...data, meta: { ...(data.meta || {}), updatedAt: nowIso(), storage: "indexedDB" } });
    dataCache = next;
    queuePersist(next);
    return next;
  }

  function reset() {
    dataCache = defaultData();
    clearLegacyData();
    queuePersist(dataCache);
    return dataCache;
  }

  function getAccount(data, id) {
    return (data.accounts || []).find((account) => account.id === id) || null;
  }

  function getCategory(data, id) {
    return (data.categories || []).find((category) => category.id === id) || null;
  }

  function isDebitNormal(type) {
    return debitNormalTypes.includes(type);
  }

  function signedAmountForAccount(account, entry) {
    const amount = normalizeAmount(entry.amount || entry.debitAmount || entry.creditAmount);
    const debitNormal = isDebitNormal(account.type);
    if (entry.debitAccountId === account.id) return debitNormal ? amount : -amount;
    if (entry.creditAccountId === account.id) return debitNormal ? -amount : amount;
    return 0;
  }

  function accountBalance(data, accountId, entriesOverride) {
    const account = getAccount(data, accountId);
    if (!account) return 0;
    const entries = entriesOverride || data.entries || [];
    return entries.reduce((sum, entry) => sum + signedAmountForAccount(account, entry), 0);
  }

  function accountBalances(data, entriesOverride) {
    const entries = entriesOverride || data.entries || [];
    return (data.accounts || []).reduce((map, account) => {
      map[account.id] = accountBalance(data, account.id, entries);
      return map;
    }, {});
  }

  function accountTypeLabel(type) {
    return {
      asset: "Aktywa",
      liability: "Pasywa",
      income: "Przychody",
      expense: "Koszty",
      transfer: "Transfery",
      equity: "Kapitał"
    }[type] || "Inne";
  }

  function categoryTypeLabel(type) {
    return {
      expense: "Wydatek",
      income: "Przychód",
      transfer: "Transfer",
      other: "Inne"
    }[type] || "Inne";
  }

  function debtTypeLabel(type) {
    return {
      loan: "Kredyt",
      "credit-card": "Karta kredytowa",
      "private-loan": "Pożyczka",
      "lent-out": "Pożyczone innym",
      obligation: "Zobowiązanie"
    }[type] || "Zobowiązanie";
  }

  function isBalanced(entry) {
    return Math.abs(normalizeAmount(entry.debitAmount) - normalizeAmount(entry.creditAmount)) < MONEY_EPSILON;
  }

  function sortEntries(entries, direction) {
    const multiplier = direction === "asc" ? 1 : -1;
    return [...entries].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare * multiplier;
      return String(a.createdAt || "").localeCompare(String(b.createdAt || "")) * multiplier;
    });
  }

  function upsert(collection, item) {
    const data = getData();
    const list = data[collection] || [];
    const timestamp = nowIso();
    const nextItem = {
      ...item,
      id: item.id || uid(collection.slice(0, -1) || "item"),
      createdAt: item.createdAt || timestamp,
      updatedAt: timestamp
    };
    const index = list.findIndex((existing) => existing.id === nextItem.id);
    if (index >= 0) list[index] = { ...list[index], ...nextItem };
    else list.push(nextItem);
    data[collection] = list;
    return saveData(data);
  }

  function remove(collection, id, archiveInstead) {
    const data = getData();
    const list = data[collection] || [];
    if (archiveInstead) {
      data[collection] = list.map((item) => item.id === id ? { ...item, archived: true, updatedAt: nowIso() } : item);
    } else {
      data[collection] = list.filter((item) => item.id !== id);
    }
    return saveData(data);
  }

  function periodBounds(monthValue) {
    const date = monthValue ? new Date(`${monthValue}-01T00:00:00`) : new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
      year,
      month,
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      monthValue: `${year}-${String(month + 1).padStart(2, "0")}`
    };
  }

  function entriesInRange(data, start, end) {
    return (data.entries || []).filter((entry) => {
      if (start && entry.date < start) return false;
      if (end && entry.date > end) return false;
      return true;
    });
  }

  function entryCategoryType(data, entry) {
    const category = getCategory(data, entry.categoryId);
    if (category) return category.type;
    return entry.type || "other";
  }

  function entryFlowType(data, entry) {
    const explicit = String(entry.type || "").toLowerCase();
    if (explicit === "income" || explicit === "expense") return explicit;

    const category = getCategory(data, entry.categoryId);
    if (category && (category.type === "income" || category.type === "expense")) return category.type;

    const debit = getAccount(data, entry.debitAccountId);
    const credit = getAccount(data, entry.creditAccountId);
    if (debit?.type === "expense") return "expense";
    if (credit?.type === "income") return "income";

    return category?.type || explicit || "other";
  }

  function entryAmount(entry) {
    return normalizeAmount(entry.amount || entry.debitAmount || entry.creditAmount);
  }

  function amountByCategoryType(data, type, start, end) {
    return entriesInRange(data, start, end)
      .filter((entry) => entryFlowType(data, entry) === type)
      .reduce((sum, entry) => sum + entryAmount(entry), 0);
  }

  function categoryTotals(data, type, start, end) {
    const totals = {};
    entriesInRange(data, start, end).forEach((entry) => {
      const category = getCategory(data, entry.categoryId);
      if (!category || entryFlowType(data, entry) !== type) return;
      totals[category.id] = (totals[category.id] || 0) + entryAmount(entry);
    });
    return Object.entries(totals)
      .map(([categoryId, amount]) => ({ category: getCategory(data, categoryId), amount }))
      .filter((item) => item.category)
      .sort((a, b) => b.amount - a.amount);
  }

  function summary(data, monthValue) {
    const balances = accountBalances(data);
    const activeAccounts = (data.accounts || []).filter((account) => !account.archived);
    const assets = activeAccounts
      .filter((account) => account.type === "asset")
      .reduce((sum, account) => sum + (balances[account.id] || 0), 0);
    const liabilities = activeAccounts
      .filter((account) => account.type === "liability")
      .reduce((sum, account) => sum + (balances[account.id] || 0), 0);
    const period = periodBounds(monthValue);
    const income = amountByCategoryType(data, "income", period.start, period.end);
    const expenses = amountByCategoryType(data, "expense", period.start, period.end);
    return {
      assets,
      liabilities,
      netWorth: assets - liabilities,
      income,
      expenses,
      result: income - expenses,
      savings: Math.max(0, income - expenses),
      period,
      balances
    };
  }

  function replaceData(imported) {
    if (!imported || !Array.isArray(imported.accounts) || !Array.isArray(imported.entries)) {
      throw new Error("Plik nie zawiera poprawnych danych aplikacji.");
    }
    const next = mergeData({ ...defaultData(), ...imported });
    return saveData(next);
  }

  function createBackup(rangeLabel, payload) {
    const data = getData();
    const snapshot = payload || {
      version: data.version,
      accounts: data.accounts,
      categories: data.categories,
      entries: data.entries,
      debts: data.debts,
      settings: data.settings
    };
    const created = new Date();
    const fileName = `moje_finanse_${created.toISOString().slice(0, 16).replace("T", "_").replace(":", "-")}.json`;
    const backup = {
      id: uid("backup"),
      fileName,
      createdAt: created.toISOString(),
      size: new Blob([JSON.stringify(snapshot)]).size,
      range: rangeLabel || "Wszystkie dane",
      data: snapshot
    };
    data.backups = [backup, ...(data.backups || [])].slice(0, 12);
    saveData(data);
    return backup;
  }

  function exportPayload(scope, options) {
    const data = getData();
    if (scope === "date-range" && options?.start && options?.end) {
      return {
        version: data.version,
        exportedAt: nowIso(),
        range: { start: options.start, end: options.end },
        accounts: data.accounts,
        categories: data.categories,
        entries: entriesInRange(data, options.start, options.end),
        debts: data.debts,
        settings: data.settings
      };
    }
    if (scope === "selected") {
      return {
        version: data.version,
        exportedAt: nowIso(),
        accounts: data.accounts,
        categories: data.categories,
        debts: data.debts,
        settings: data.settings
      };
    }
    return {
      version: data.version,
      exportedAt: nowIso(),
      accounts: data.accounts,
      categories: data.categories,
      entries: data.entries,
      debts: data.debts,
      settings: data.settings
    };
  }

  function whenIdle() {
    return writeQueue.catch(() => {});
  }

  window.FinanceStorage = {
    KEY,
    DB_NAME,
    STORE_NAME,
    clone,
    uid,
    nowIso,
    normalizeAmount,
    init,
    ensureData,
    getData,
    saveData,
    reset,
    getAccount,
    getCategory,
    accountBalance,
    accountBalances,
    accountTypeLabel,
    categoryTypeLabel,
    debtTypeLabel,
    isBalanced,
    isDebitNormal,
    signedAmountForAccount,
    sortEntries,
    upsert,
    remove,
    periodBounds,
    entriesInRange,
    entryCategoryType,
    entryFlowType,
    entryAmount,
    amountByCategoryType,
    categoryTotals,
    summary,
    replaceData,
    createBackup,
    exportPayload,
    whenIdle,
    creditNormalTypes
  };
})();
