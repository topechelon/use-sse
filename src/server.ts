import { createProvider } from './hook';

export function createServerContext() {
  const resolvedData: { [key: string]: any } = {};
  const promises = new Map<string, Promise<any>>();
  let counter = 0;

  const ServerDataContext = createProvider((effect, dependencies, id) => {
    const promiseId = id ?? (counter++).toString();
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

    return [resolved?.data, resolved?.error];
  });

  async function resolveData() {
    counter = 0;

    await Promise.all(Array.from(promises.values()));

    return {
      data: resolvedData,
      toHtml(variableName = '_initialDataContext') {
        return `<script>window.${variableName} = ${JSON.stringify(resolvedData)};</script>`;
      },
    };
  }

  return { ServerDataContext, resolveData };
}
