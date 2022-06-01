// src/hook.tsx
import React from "react";
var Context = React.createContext(null);
function useSSE(...args) {
  const hook = React.useContext(Context);
  if (!hook) {
    throw "useSSE: context not provided";
  }
  return hook(...args);
}
function createProvider(hook) {
  return ({ children }) => /* @__PURE__ */ React.createElement(Context.Provider, {
    value: hook
  }, children);
}

// src/browser.ts
import React2 from "react";
function createBrowserContext(variableName = "_initialDataContext") {
  var _a;
  const resolvedData = (_a = window[variableName]) != null ? _a : {};
  let counter = 0;
  return createProvider((effect, dependencies, id) => {
    var _a2, _b;
    const promiseId = id != null ? id : counter++;
    const [data, setData] = React2.useState((_a2 = resolvedData[promiseId]) == null ? void 0 : _a2.data);
    const [error, setError] = React2.useState((_b = resolvedData[promiseId]) == null ? void 0 : _b.error);
    React2.useEffect(() => {
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
import React3 from "react";
function createTestingContext() {
  const promises = /* @__PURE__ */ new Set();
  const ServerDataContext = createProvider((effect, dependencies, id) => {
    const [data, setData] = React3.useState();
    const [error, setError] = React3.useState();
    React3.useEffect(() => {
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
export {
  createBrowserContext,
  createServerContext,
  createTestingContext,
  useSSE
};
