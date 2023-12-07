import { parse as parseCSV } from 'csv-parse/browser/esm';
import { read as readXLS, utils as XLSUtils } from 'xlsx';

let db = null;

function onModuleReady(SQL) {
  const { data } = this;
  switch (data && data.action) {
    case 'load': {
      const { id, file, delimiter, dropNull } = data;
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => (
          reject(new Error('load: Error reading file'))
        );
        if (file.type === 'text/csv') {
          reader.onload = () => {
            parseCSV(reader.result, { cast: true, delimiter, trim: true }, (err, data) => {
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
            resolve(XLSUtils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }).map((row) => [...row]));
          };
          reader.readAsBinaryString(file);
        }
      })
      .then((data) => {
        const columns = data[0].map((name, i) => (name || `unnamed_${i < 10 ? '0' : ''}${i}`));
        const values = data.slice(1).filter((record) => (
          !dropNull || !record.some((r) => (r === '' || r === undefined || r === null))
        ), []);
        const types = (values[0] || []).map((v, i) => `${JSON.stringify(columns[i])} ${typeof v === 'number' ? 'real' : 'text'}`).join(',');
        const val = Array.from({ length: columns.length }, () => '?').join(',');

        if (db !== null) db.close();
        db = new SQL.Database();
        db.exec(`CREATE TABLE data(${types});`);
        values.forEach((row) => db.exec(`INSERT INTO data VALUES (${val});`, row));
        postMessage({
          id,
          results: [columns],
        });
      });
    }
    case 'exec':
      if (!db) {
        throw new Error('exec: DB is not loaded');
      }
      if (!data.sql) {
        throw new Error('exec: Missing query string');
      }
      return postMessage({
        id: data.id,
        results: db.exec(data.sql, data.params)
      });
    default:
      throw new Error('Invalid action: ' + (data && data.action));
  }
}

function onError(err) {
  return postMessage({
    id: this.data.id,
    error: err.message
  });
}

if (typeof importScripts === 'function') {
  self.importScripts(self.location.origin + __SQL_MODULE_PATH__);
  const sqlModuleReady = initSqlJs({
    locateFile: () => self.location.origin + __SQL_WASM_PATH__,
  });
  self.onmessage = (event) => (
    sqlModuleReady
      .then(onModuleReady.bind(event))
      .catch(onError.bind(event))
  );
}
