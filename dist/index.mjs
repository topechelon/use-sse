import React from "react";
const pageVariableName = "_initialDataContext";
const Context = React.createContext(null);
function useSSE(...args) {
  const hook = React.useContext(Context);
  if (!hook) {
    throw "useSSE: context not provided";
  }
  return hook(...args);
}
function createProvider(hook) {
  return ({children}) => /* @__PURE__ */ React.createElement(Context.Provider, {
    value: hook
  }, children);
}
function createBrowserContext(variableName = pageVariableName) {
  const pageVariable = window && window[variableName];
  const pageData = pageVariable || {};
  let current = 0;
  const hook = (effect, dependencies, id) => {
    const callId = id ?? current++;
    const [data, setData] = React.useState(pageData[callId]?.data);
    const [error, setError] = React.useState(pageData[callId]?.error);
    React.useEffect(() => {
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
    const [data, setData] = React.useState();
    const [error, setError] = React.useState();
    React.useEffect(() => {
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
export {
  createBrowserContext,
  createServerContext,
  createTestingContext,
  useSSE
};
