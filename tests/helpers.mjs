import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, "..");

export class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

/** Execute the real TypeScript business logic with isolated browser/server boundaries. */
export function createLoader({ storage = new MemoryStorage(), mocks = {}, globals = {} } = {}) {
  const cache = new Map();
  const events = [];
  const context = vm.createContext({
    AbortSignal,
    console: { ...console, error() {} },
    localStorage: storage,
    window: { dispatchEvent: event => events.push(event), matchMedia: () => ({ matches: false }) },
    document: { documentElement: { classList: { add() {}, remove() {} } } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    ...globals,
  });
  function load(file) {
    const path = resolve(root, file);
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} };
    cache.set(path, module);
    const code = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      fileName: path,
    }).outputText;
    const localRequire = specifier => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      return specifier.startsWith(".") ? load(resolve(dirname(path), `${specifier}.ts`)) : require(specifier);
    };
    vm.runInContext(`(function(require,module,exports){${code}\n})`, context, { filename: path })(localRequire, module, module.exports);
    return module.exports;
  }
  return { load, storage, events };
}

export function createStore(options = {}) {
  let indexedEntries = [];
  const calls = [];
  const actionNames = [...readFileSync(resolve(root, "src/lib/actions.ts"), "utf8").matchAll(/export async function (\w+)/g)].map(match => match[1]);
  const actions = Object.fromEntries(actionNames.map(name => [name, async (...args) => {
    calls.push({ name, args });
    if (name === "getDbSettings" || name === "getDbPlanProgress") return null;
    return name.startsWith("get") ? [] : true;
  }]));
  const db = {
    migrateFromLocalStorage: async () => {},
    loadRopeEntries: async () => indexedEntries,
    saveRopeEntries: async entries => { indexedEntries = entries; },
    deleteRopeEntries: async () => { indexedEntries = []; },
  };
  const loader = createLoader({ ...options, mocks: { "./actions": actions, "./db": db, ...options.mocks } });
  return { ...loader, store: loader.load("src/lib/store.ts"), actions, calls, get indexedEntries() { return indexedEntries; } };
}

export function entry(overrides = {}) {
  return {
    id: "entry-1", userId: "reader", createdAt: "2026-10-21T14:00:00.000Z",
    revelationVerse: "1 John 4:19", revelationText: "We love because he first loved us.",
    observation: "Love comes first.", prayer: "Help me love.", execution: "Call a friend.",
    executionStatus: null, executionReflection: "", ...overrides,
  };
}
