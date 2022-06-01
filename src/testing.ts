import React from 'react';
import { createProvider } from './hook';

export function createTestingContext() {
  const promises = new Set<Promise<void>>();

  const ServerDataContext = createProvider<any>((effect, dependencies, id) => {
    const [data, setData] = React.useState();
    const [error, setError] = React.useState();

    React.useEffect(() => {
      const promise = triggerEffect().finally(() => promises.delete(promise));
      promises.add(promise);
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

  async function resolveData() {
    await Promise.all(Array.from(promises));
  }

  return { ServerDataContext, resolveData };
}
