import React from 'react';
import { createProvider } from './hook';

export function createBrowserContext(variableName = '_initialDataContext') {
  const resolvedData = (window as any)[variableName] ?? {};
  let counter = 0;

  return createProvider((effect, dependencies, id) => {
    const promiseId = id ?? counter++;
    const [data, setData] = React.useState(resolvedData[promiseId]?.data);
    const [error, setError] = React.useState(resolvedData[promiseId]?.error);

    React.useEffect(() => {
      if (resolvedData[promiseId]) {
        if (typeof promiseId !== 'string') {
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
      } catch (error) {
        setError(error);
      }
    }
    
    return [data, error];
  });
}
