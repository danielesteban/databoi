import { writable } from 'svelte/store';
// @ts-ignore
import SQLWorker from 'web-worker:./worker.js';

const query = writable<string>('');
const view = writable<{ columns: string[]; values: any[]; }>({ columns: [], values: [] });

const db = {
  msgId: 1,
  listeners: new Map<number, { resolve: (results: any[]) => void, reject: (err: string) => void }>(),
  worker: new SQLWorker() as Worker,
  onmessage({ data: { id, error, results } }: { data: { id: number, error?: string, results?: any[] } }) {
    const { listeners } = this;
    const listener = listeners.get(id);
    if (listener) {
      listeners.delete(id);
      if (results) {
        listener.resolve(results);
      } else {
        listener.reject(error || 'sql error');
      }
    }
  },
  load(file: File, delimiter = ',', dropNull = true) {
    const { listeners, worker } = this;
    return new Promise<any[]>((resolve, reject) => {
      const id = this.msgId++;
      listeners.set(id, { resolve, reject });
      worker.postMessage({ id, action: 'load', file, delimiter, dropNull });
    });
  },
  exec(sql: string, params?: Record<string, any>) {
    const { listeners, worker } = this;
    return new Promise<any[]>((resolve, reject) => {
      const id = this.msgId++;
      listeners.set(id, { resolve, reject });
      worker.postMessage({ id, action: 'exec', sql, params });
    });
  }
};
db.worker.onmessage = db.onmessage.bind(db);

let current: { aborted: boolean } = { aborted: false };
query.subscribe(($query) => {
  if (!$query) {
    return;
  }
  current.aborted = true;
  const controller = { aborted: false };
  current = controller;
  db
    .exec($query)
    .then((res) => {
      if (controller.aborted || !res) {
        return;
      }
      view.set(res[0] || { columns: [], values: [] });
    })
    .catch((e) => console.error(e));
});

export const load = async (file: File, delimiter = ',', dropNull = true) => {
  query.set('');
  const [columns] = await db.load(file, delimiter, dropNull);
  query.set(`SELECT\n${columns.map((c: string) => JSON.stringify(c)).join(',\n')}\nFROM data`);
  await new Promise<void>((resolve) => {
    // @dani @incomplete
    // although it works, this is dumb.
    let first = true;
    const unsubscribe = view.subscribe(() => {
      if (first) {
        first = false;
        return;
      }
      unsubscribe();
      resolve();
    });
  });
};

export const Query = query;

export const View = {
  subscribe: view.subscribe,
};
