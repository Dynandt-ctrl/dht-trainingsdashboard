// Vervangt de Claude-specifieke window.storage API door localStorage,
// zodat het dashboard buiten Claude (bijv. op Vercel) blijft werken.
// Let op: data staat hiermee lokaal in de browser van het apparaat,
// niet gesynchroniseerd tussen apparaten.

const PREFIX = "dht-dashboard::";

function readAll() {
  try {
    const raw = localStorage.getItem(PREFIX + "store");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeAll(store) {
  localStorage.setItem(PREFIX + "store", JSON.stringify(store));
}

window.storage = {
  async get(key) {
    const store = readAll();
    if (!(key in store)) return null;
    return { key, value: store[key], shared: false };
  },
  async set(key, value) {
    const store = readAll();
    store[key] = value;
    writeAll(store);
    return { key, value, shared: false };
  },
  async delete(key) {
    const store = readAll();
    const existed = key in store;
    delete store[key];
    writeAll(store);
    return { key, deleted: existed, shared: false };
  },
  async list(prefix) {
    const store = readAll();
    const keys = Object.keys(store).filter((k) => !prefix || k.startsWith(prefix));
    return { keys, prefix, shared: false };
  },
};
