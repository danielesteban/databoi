import { parse as parseCSV } from 'csv-parse/browser/esm';
import { read as readXLS, utils as XLSUtils } from 'xlsx';

let db = null;

function isNull(v) {
  return (v === '' || v === null || v === undefined);
}

function isFloat(v) {
  return (v - parseFloat(v) + 1) >= 0;
}

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
            parseCSV(reader.result, { delimiter, trim: true }, (err, data) => {
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
        values.forEach((row) => db.exec(insert, row));
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
