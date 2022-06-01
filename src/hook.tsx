import React from 'react';

type HookArgs<T> = [
  effect: () => Promise<T>,
  dependencies?: React.DependencyList,
  id?: string,
];

type HookRet<T> = [T, any];

export type Hook<T = any> = (...args: HookArgs<T>) => HookRet<T>;

const Context = React.createContext(null);

export function useSSE<T>(...args: HookArgs<T>): HookRet<T> {
  const hook = React.useContext(Context);

  if (!hook) {
    throw 'useSSE: context not provided';
  }

  return hook(...args);
}

export function createProvider<T>(hook: Hook<T>) {
  return ({ children }: React.PropsWithChildren<T>) => (
    <Context.Provider value={hook}>
      {children}
    </Context.Provider>
  );
}
