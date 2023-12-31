import Regression from 'regression';
import { Database, SqlJsStatic } from 'sql.js';
import { read as parse, utils as XLSUtils } from 'xlsx';

let db: Database | null = null;
let query = '';
let view: { columns: string[]; values: any[][]; } = { columns: [], values: [] };

const setView = (sql: string) => {
  if (!db) {
    throw new Error('DB is not loaded');
  }
  if (!sql) {
    throw new Error('Missing query string');
  }
  const res = db.exec(sql);
  query = sql;
  view = (res && res[0]) || { columns: [], values: [] };
};

const correlation = () => {
  if (!db) {
    throw new Error('DB is not loaded');
  }
  const len = view.values.length;
  const cache = new Map();
  return view.columns.map((_, xi) => (
    view.columns.map((_, yi) => {
      if (xi === yi) {
        return 1;
      }
      const key = `${Math.min(xi, yi)}:${Math.max(xi, yi)}`;
      const cached = cache.get(key);
      if (cached) {
        return cached;
      }
      let sumX = 0,
          sumY = 0,
          sumXY = 0,
          sumX2 = 0,
          sumY2 = 0;
      for (let i = 0; i < len; i++) {
        const xv = view.values[i][xi];
        const yv = view.values[i][yi];
        sumX += xv;
        sumY += yv;
        sumXY += xv * yv;
        sumX2 += xv * xv;
        sumY2 += yv * yv;
      };
      const result = (
        (len * sumXY - sumX * sumY)
        / Math.sqrt((len * sumX2 - sumX * sumX) * (len * sumY2 - sumY * sumY))
      ) || 0;
      cache.set(key, result);
      return result;
    })
  ));
};

const regression = (x: string, y: string, type: 'exponential' | 'linear' | 'logarithmic' | 'power') => {
  if (!db) {
    throw new Error('DB is not loaded');
  }
  const xi = view.columns.findIndex((c) => c === x);
  const yi = view.columns.findIndex((c) => c === y);
  if (xi === -1 || yi === -1) {
    return [[], 0];
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const values = view.values.map((v) => {
    const x = v[xi];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    const y = v[yi];
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    return [x, y];
  }).sort((a, b) => a[0] - b[0]);
  const s = (maxY - minY) / (maxX - minX);
  const { points, r2 } = Regression[type](values.map(([x, y]) => [minY + (x - minX) * s, y]));
  return [
    values.map(([x, _y], i) => [x, points[i][1]]),
    r2,
  ];
};

const isFloat = (v: any) => (
  (v - parseFloat(v) + 1) >= 0
);

const isNull = (v: any) => (
  v === undefined || v === null || v === ''
);

function onModuleReady(SQL: SqlJsStatic) {
  // @ts-ignore
  const { data } = this;
  switch (data && data.action) {
    case 'load': {
      const { id, file, delimiter, dropNull } = data as { id: number; file: File; delimiter: string; dropNull: boolean; };
      return new Promise<any[][]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => (
          reject(new Error('load: Error reading file'))
        );
        reader.onload = () => {
          const workbook = parse(reader.result, {
            type: 'binary',
            FS: delimiter,
          });
          resolve(XLSUtils.sheet_to_json<any[][]>(workbook.Sheets[workbook.SheetNames[0]], { defval: null, header: 1 }));
        };
        reader.readAsBinaryString(file);
      })
      .then((data) => {
        const columns = data[0].map((name: string, i: number) => (name || `unnamed_${i < 10 ? '0' : ''}${i}`));
        let values = data.slice(1);
        if (dropNull) {
          values = values.filter((record) => !record.some(isNull));
        }
        const types = Array.from({ length: columns.length }, () => '');
        for (let i = 0, l = values.length; i < l; i++) {
          const v = values[i];
          if (
            types.every((type, j) => {
              if (type) {
                return true;
              }
              if (dropNull || !isNull(v[j])) {
                types[j] = isFloat(v[j]) ? 'real' : 'text';
                return true;
              }
              return false;
            })
          ) {
            break;
          }
        }
        const create = `CREATE TABLE data(${columns.map((c, i) => `${JSON.stringify(c)} ${types[i] || 'text'}`).join(',')});`;
        const insert = `INSERT INTO data VALUES (${Array.from({ length: columns.length }, () => '?').join(',')});`;

        if (db !== null) db.close();
        db = new SQL.Database();
        db.run(create);
        values.forEach((row) => db!.run(insert, row));
        setView(`SELECT\n${columns.map((c: string) => JSON.stringify(c)).join(',\n')}\nFROM data`);
        postMessage({
          id,
          results: [query, view],
        });
      });
    }
    case 'dump':
      if (!db) {
        throw new Error('DB is not loaded');
      }
      return postMessage({
        id: data.id,
        results: [XLSUtils.sheet_to_csv(XLSUtils.json_to_sheet(view.values.map((v) => v.reduce((r, v, i) => {
          r[view.columns[i]] = v;
          return r;
        }, {})), { header: view.columns }))],
      });
    case 'query':
      setView(data.sql);
      return postMessage({
        id: data.id,
        results: [view],
      });
    case 'correlation':
      return postMessage({
        id: data.id,
        results: [correlation()],
      });
    case 'regression':
      return postMessage({
        id: data.id,
        results: regression(data.x, data.y, data.type),
      });
    default:
      throw new Error('Invalid action: ' + (data && data.action));
  }
}

function onError(err: Error) {
  return postMessage({
    // @ts-ignore
    id: this.data.id,
    error: err.message
  });
}

if (typeof importScripts === 'function') {
  self.importScripts(
    self.location.origin
    // @ts-ignore
    + __SQL_MODULE_PATH__
  );
  // @ts-ignore
  const sqlModuleReady = initSqlJs({
    locateFile: () => (
      self.location.origin
      // @ts-ignore
      + __SQL_WASM_PATH__
    ),
  });
  self.onmessage = (event) => (
    sqlModuleReady
      .then(onModuleReady.bind(event))
      .catch(onError.bind(event))
  );
}
