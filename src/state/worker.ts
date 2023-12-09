import { parse as parseCSV } from 'csv-parse/browser/esm';
import { Database, SqlJsStatic } from 'sql.js';
import { read as readXLS, utils as XLSUtils } from 'xlsx';

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
        if (file.type === 'text/csv') {
          reader.onload = () => {
            parseCSV(reader.result as string, { delimiter, trim: true }, (err, data) => {
              if (err) {
                reject(new Error(`load: ${err.message}`));
                return;
              }
              resolve(data);
            });
          };
          reader.readAsText(file);
        } else {
          reader.onload = () => {
            const workbook = readXLS(reader.result, {
              type: 'binary'
            });
            resolve(XLSUtils.sheet_to_json<any[][]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }).map((row) => [...row]));
          };
          reader.readAsBinaryString(file);
        }
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
        db.exec(create);
        values.forEach((row) => db!.exec(insert, row));
        setView(`SELECT\n${columns.map((c: string) => JSON.stringify(c)).join(',\n')}\nFROM data`);
        postMessage({
          id,
          results: [query, view],
        });
      });
    }
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
