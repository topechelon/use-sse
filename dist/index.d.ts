import React from 'react';
declare type HookArgs<T> = [
    effect: () => Promise<T>,
    dependencies?: React.DependencyList,
    id?: string
];
declare type HookRet<T> = [T, any];
export declare function useSSE<T>(...args: HookArgs<T>): HookRet<T>;
export declare function createBrowserContext(variableName?: string): ({ children }: any) => JSX.Element;
export declare function createServerContext(): {
    ServerDataContext: ({ children }: any) => JSX.Element;
    resolveData: () => Promise<{
        data: {
            [key: string]: any;
        };
        toJSON(): any;
        toHtml(variableName?: string): string;
    }>;
};
export declare function createTestingContext(): {
    ServerDataContext: ({ children }: any) => JSX.Element;
    resolveData: () => Promise<void>;
};
export {};
