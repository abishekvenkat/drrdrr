(function () {
  const DB_NAME = "drrdrr-db";
  const STORE_NAME = "notifications";
  const VERSION = 1;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, {
            keyPath: "id"
          });
          store.createIndex("by-createdAt", "createdAt");
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveNotification(entry) {
    const database = await openDatabase();

    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => resolve(entry);
      request.onerror = () => reject(request.error);
    });
  }

  async function listNotifications() {
    const database = await openDatabase();

    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const rows = Array.isArray(request.result) ? request.result : [];
        rows.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
        resolve(rows);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async function clearNotifications() {
    const database = await openDatabase();

    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  self.DrrdrrDB = {
    clearNotifications,
    listNotifications,
    saveNotification
  };
})();
