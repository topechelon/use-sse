var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.tsx
var src_exports = {};
__export(src_exports, {
  createBrowserContext: () => createBrowserContext,
  createServerContext: () => createServerContext,
  createTestingContext: () => createTestingContext,
  useSSE: () => useSSE
});
module.exports = __toCommonJS(src_exports);

// src/hook.tsx
var import_react = __toESM(require("react"));
var Context = import_react.default.createContext(null);
function useSSE(...args) {
  const hook = import_react.default.useContext(Context);
  if (!hook) {
    throw "useSSE: context not provided";
  }
  return hook(...args);
}
function createProvider(hook) {
  return ({ children }) => /* @__PURE__ */ import_react.default.createElement(Context.Provider, {
    value: hook
  }, children);
}

// src/browser.ts
var import_react2 = __toESM(require("react"));
function createBrowserContext(variableName = "_initialDataContext") {
  var _a;
  const resolvedData = (_a = window[variableName]) != null ? _a : {};
  let counter = 0;
  return createProvider((effect, dependencies, id) => {
    var _a2, _b;
    const promiseId = id != null ? id : counter++;
    const [data, setData] = import_react2.default.useState((_a2 = resolvedData[promiseId]) == null ? void 0 : _a2.data);
    const [error, setError] = import_react2.default.useState((_b = resolvedData[promiseId]) == null ? void 0 : _b.error);
    import_react2.default.useEffect(() => {
      if (resolvedData[promiseId]) {
        if (typeof promiseId !== "string") {
          if (!resolvedData[promiseId].count || --resolvedData[promiseId].count <= 0) {
            delete resolvedData[promiseId];
          }
        }
      } else {
        triggerEffect();
      }
    }, dependencies);
    async function triggerEffect() {
      try {
        setData(await effect());
      } catch (error2) {
        setError(error2);
      }
    }
    return [data, error];
  });
}

// src/server.ts
function createServerContext() {
  const resolvedData = {};
  const promises = /* @__PURE__ */ new Map();
  let counter = 0;
  const ServerDataContext = createProvider((effect, dependencies, id) => {
    const promiseId = id != null ? id : (counter++).toString();
    const resolved = resolvedData[promiseId];
    if (promises.get(promiseId)) {
      ++resolved.count;
    } else {
      async function triggerEffect() {
        try {
          return resolvedData[promiseId].data = await effect();
        } catch (error) {
          resolvedData[promiseId].error = error;
          return null;
        }
      }
      resolvedData[promiseId] = { count: 1 };
      promises.set(promiseId, triggerEffect());
    }
    return [resolved == null ? void 0 : resolved.data, resolved == null ? void 0 : resolved.error];
  });
  async function resolveData() {
    counter = 0;
    await Promise.all(Array.from(promises.values()));
    return {
      data: resolvedData,
      toHtml(variableName = "_initialDataContext") {
        return `<script>window.${variableName} = ${JSON.stringify(resolvedData)};<\/script>`;
      }
    };
  }
  return { ServerDataContext, resolveData };
}

// src/testing.ts
var import_react3 = __toESM(require("react"));
function createTestingContext() {
  const promises = /* @__PURE__ */ new Set();
  const ServerDataContext = createProvider((effect, dependencies, id) => {
    const [data, setData] = import_react3.default.useState();
    const [error, setError] = import_react3.default.useState();
    import_react3.default.useEffect(() => {
      const promise = triggerEffect().finally(() => promises.delete(promise));
      promises.add(promise);
    }, dependencies);
    async function triggerEffect() {
      try {
        setData(await effect());
      } catch (error2) {
        setError(error2);
      }
    }
    return [data, error];
  });
  async function resolveData() {
    await Promise.all(Array.from(promises));
  }
  return { ServerDataContext, resolveData };
}
