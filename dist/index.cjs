var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};
__markAsModule(exports);
__export(exports, {
  createBrowserContext: () => createBrowserContext,
  createServerContext: () => createServerContext,
  createTestingContext: () => createTestingContext,
  useSSE: () => useSSE
});
var import_react = __toModule(require("react"));
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
  return ({children}) => /* @__PURE__ */ import_react.default.createElement(Context.Provider, {
    value: hook
  }, children);
}
function createBrowserContext(variableName = pageVariableName) {
  const pageVariable = window && window[variableName];
  const pageData = pageVariable || {};
  let current = 0;
  const hook = (effect, dependencies, id) => {
    const callId = id ?? current++;
    const [data, setData] = import_react.default.useState(pageData[callId]?.data);
    const [error, setError] = import_react.default.useState(pageData[callId]?.error);
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
  const requests = new Map();
  let current = 0;
  const hook = (effect, dependencies, id) => {
    const callId = id ?? (current++).toString();
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
      pageData[callId] = {count: 1};
      requests.set(callId, promise);
    }
    return [hookData?.data, hookData?.error];
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
        return `<script>window.${variableName} = ${JSON.stringify(pageData)};</script>`;
      }
    };
  };
  return {
    ServerDataContext: createProvider(hook),
    resolveData
  };
}
function createTestingContext() {
  const active = new Set();
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
