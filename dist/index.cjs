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
var src_exports = {};
__export(src_exports, {
  createBrowserContext: () => createBrowserContext,
  createServerContext: () => createServerContext,
  createTestingContext: () => createTestingContext,
  useSSE: () => useSSE
});
module.exports = __toCommonJS(src_exports);
var import_react = __toESM(require("react"));
const pageVariableName = "_initialDataContext";
const Context = import_react.default.createContext(null);
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
function createBrowserContext(variableName = pageVariableName) {
  const pageVariable = window && window[variableName];
  const pageData = pageVariable || {};
  let current = 0;
  const hook = (effect, dependencies, id) => {
    var _a, _b;
    const callId = id != null ? id : current++;
    const [data, setData] = import_react.default.useState((_a = pageData[callId]) == null ? void 0 : _a.data);
    const [error, setError] = import_react.default.useState((_b = pageData[callId]) == null ? void 0 : _b.error);
    import_react.default.useEffect(() => {
      if (pageData[callId]) {
        if (typeof callId !== "string") {
          if (!pageData[callId].count || --pageData[callId].count <= 0) {
            delete pageData[callId];
          }
        }
      } else {
        effect().then((res) => setData(res)).catch((error2) => setError(error2));
      }
    }, dependencies);
    return [data, error];
  };
  return createProvider(hook);
}
function createServerContext() {
  const pageData = {};
  const requests = /* @__PURE__ */ new Map();
  let current = 0;
  const hook = (effect, dependencies, id) => {
    const callId = id != null ? id : (current++).toString();
    const activeRequest = requests.get(callId);
    const hookData = pageData[callId];
    if (activeRequest) {
      ++hookData.count;
    } else {
      const promise = new Promise((resolve) => {
        return effect().then((data) => {
          pageData[callId].data = data;
          resolve(data);
        }).catch((error) => {
          pageData[callId].error = error;
          resolve(null);
        });
      });
      pageData[callId] = { count: 1 };
      requests.set(callId, promise);
    }
    return [hookData == null ? void 0 : hookData.data, hookData == null ? void 0 : hookData.error];
  };
  const resolveData = async () => {
    current = 0;
    await Promise.all(Array.from(requests.values()));
    return {
      data: pageData,
      toJSON() {
        return this.data;
      },
      toHtml(variableName = pageVariableName) {
        return `<script>window.${variableName} = ${JSON.stringify(pageData)};<\/script>`;
      }
    };
  };
  return {
    ServerDataContext: createProvider(hook),
    resolveData
  };
}
function createTestingContext() {
  const active = /* @__PURE__ */ new Set();
  const hook = (effect, dependencies, id) => {
    const [data, setData] = import_react.default.useState();
    const [error, setError] = import_react.default.useState();
    import_react.default.useEffect(() => {
      const promise = effect().then((res) => setData(res)).catch((error2) => setError(error2)).finally(() => active.delete(promise));
      active.add(promise);
    }, dependencies);
    return [data, error];
  };
  const resolveData = async () => {
    await Promise.all(Array.from(active));
  };
  return {
    ServerDataContext: createProvider(hook),
    resolveData
  };
}
