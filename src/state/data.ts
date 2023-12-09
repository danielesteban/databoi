import { writable } from 'svelte/store';
// @ts-ignore
import SQLWorker from 'web-worker:./worker.ts';

const correlation = writable<{ computed: boolean; values: number[][]; }>({ computed: false, values: [] });
const query = writable<string>('');
const queryError = writable<string>('');
const regression = writable<{ computed: boolean; r2: number; values: number[]; }>({ computed: false, r2: 0, values: [] });
const view = writable<{ columns: string[]; values: any[][]; }>({ columns: [], values: [] });

const db = {
  msgId: 1,
  listeners: new Map<number, { resolve: (results: any[]) => void, reject: (err: Error) => void }>(),
  worker: new SQLWorker() as Worker,
  onmessage({ data: { id, error, results } }: { data: { id: number, error?: string, results?: any[] } }) {
    const { listeners } = this;
    const listener = listeners.get(id);
    if (listener) {
      listeners.delete(id);
      if (results) {
        listener.resolve(results);
      } else {
        listener.reject(new Error(error || 'sql error'));
      }
    }
  },
  request(action: string, params?: any) {
    const { listeners, worker } = this;
    return new Promise<any[]>((resolve, reject) => {
      const id = this.msgId++;
      listeners.set(id, { resolve, reject });
      worker.postMessage({ id, action, ...params });
    });
  },
};
db.worker.onmessage = db.onmessage.bind(db);

export const load = async (file: File, delimiter = ',', dropNull = true) => {
  correlationRequest.aborted = true;
  correlation.set({ computed: false, values: [] });
  queryRequest.aborted = true;
  query.set('');
  queryError.set('');
  regressionRequest.aborted = true;
  regression.set({ computed: false, r2: 0, values: [] });
  view.set({ columns: [], values: [] });
  const res = await db.request('load', { file, delimiter, dropNull });
  query.set(res[0]);
  view.set(res[1]);
};

let correlationRequest: { aborted: boolean } = { aborted: false };
export const Correlation = {
  subscribe: correlation.subscribe,
  compute: async () => {
    correlationRequest.aborted = true;
    correlation.update(({ computed }) => ({ computed, values: [] }));
    const controller = { aborted: false };
    correlationRequest = controller;
    const res = await db.request('correlation');
    if (controller.aborted) {
      return;
    }
    correlation.set({ computed: true, values: res[0] });
  },
};

let queryRequest: { aborted: boolean } = { aborted: false };
export const Query = {
  subscribe: query.subscribe,
  set(sql: string) {
    queryRequest.aborted = true;
    query.set(sql);
    if (!sql) {
      return;
    }
    const controller = { aborted: false };
    queryRequest = controller;
    queryError.set('');
    setTimeout(async () => {
      if (controller.aborted) {
        return;
      }
      try {
        const res = await db.request('query', { sql });
        if (controller.aborted) {
          return;
        }
        correlationRequest.aborted = true;
        correlation.set({ computed: false, values: [] });
        regressionRequest.aborted = true;
        regression.set({ computed: false, r2: 0, values: [] });
        view.set(res[0]);
      } catch (e) {
        queryError.set((e as Error).message);
      }
    }, 150);
  },
};

export const QueryError = {
  subscribe: queryError.subscribe,
};

let regressionRequest: { aborted: boolean } = { aborted: false };
export const Regression = {
  subscribe: regression.subscribe,
  compute: async (x: string, y: string, type: 'exponential' | 'linear' | 'logarithmic' | 'power') => {
    regressionRequest.aborted = true;
    regression.update(({ computed }) => ({ computed, r2: 0, values: [] }));
    const controller = { aborted: false };
    regressionRequest = controller;
    const res = await db.request('regression', { x, y, type });
    if (controller.aborted) {
      return;
    }
    regression.set({ computed: true, r2: res[1], values: res[0] });
  },
};

export const View = {
  subscribe: view.subscribe,
};
