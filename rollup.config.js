import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import html from '@rollup/plugin-html';
import livereload from 'rollup-plugin-livereload';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import serve from 'rollup-plugin-serve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { compilerOptions: { paths: aliases } } = JSON.parse(fs.readFileSync(path.join(__dirname, 'tsconfig.json')));
const production = !process.env.ROLLUP_WATCH;
const outputPath = path.resolve(__dirname, 'dist');

const getHash = (file) => (
  createHash('sha256').update(fs.readFileSync(path.join(__dirname, file))).digest('hex').slice(0, 8)
);

const Font = (() => {
  const input = 'assets/roboto-condensed-v27-latin-regular.woff2';
  return {
    input,
    output: `roboto-condensed-${getHash(input)}.woff2`,
  };
})();

const Plotly = (() => {
  const input = 'node_modules/plotly.js-cartesian-dist-min/plotly-cartesian.min.js';
  return {
    input,
    output: `plotly-${getHash(input)}.js`,
  };
})();

const SQL = (() => {
  const module = 'node_modules/sql.js/dist/sql-wasm.js';
  const wasm = 'node_modules/sql.js/dist/sql-wasm.wasm';
  return {
    module: {
      input: module,
      output: `sql-${getHash(module)}.js`,
    },
    wasm: {
      input: wasm,
      output: `sql-${getHash(wasm)}.wasm`,
    },
  };
})();

export default {
  input: path.join(__dirname, 'src', 'main.ts'),
  output: {
    dir: outputPath,
    entryFileNames: `[name]${production ? '-[hash]' : ''}.js`,
    format: 'iife',
    globals: {
      ['plotly.js']: 'Plotly',
    },
    sourcemap: !production,
  },
  external: ['plotly.js'],
  plugins: [
    alias({
      entries: [
        ...Object.keys(aliases).map((alias) => {
          const find = path.dirname(alias);
          return { find, replacement: path.join(__dirname, 'src', find) };
        }),
      ],
    }),
    commonjs(),
    copy({
      targets: [
        { src: 'assets/favicon.svg', dest: 'dist' },
        { src: 'assets/manifest.json', dest: 'dist' },
        { src: Font.input, rename: Font.output, dest: 'dist' },
        { src: Plotly.input, rename: Plotly.output, dest: 'dist' },
        { src: SQL.module.input, rename: SQL.module.output, dest: 'dist' },
        { src: SQL.wasm.input, rename: SQL.wasm.output, dest: 'dist' },
        { src: 'node_modules/monaco-editor/min/vs', dest: 'dist' },
      ],
      copyOnce: true,
    }),
    replace({
      preventAssignment: false,
      __FONT_PATH__: JSON.stringify('/' + Font.output),
      __SQL_MODULE_PATH__: JSON.stringify('/' + SQL.module.output),
      __SQL_WASM_PATH__: JSON.stringify('/' + SQL.wasm.output),
    }),
    nodeResolve({ browser: true, extensions: ['.js', '.ts'] }),
    svelte({ preprocess: sveltePreprocess({ sourceMap: !production }) }),
    typescript({ sourceMap: !production, inlineSources: !production }),
    postcss({ extract: true, minimize: production }),
    webWorkerLoader(),
    html({
      template: ({ files }) => (
        fs.readFileSync(path.join(__dirname, 'src', 'index.html'), 'utf8')
          .replace(
            '<link rel="stylesheet">',
            (files.css || [])
              .map(({ fileName }) => `<link rel="stylesheet" href="/${fileName}">`)
              .join('')
          )
          .replace(
            '<script></script>',
            `<script src="/${Plotly.output}"></script>`
            + `<script src="/vs/loader.js"></script>`
            + (files.js || [])
              .map(({ fileName }) => `<script defer src="/${fileName}"></script>`)
              .join('')
          )
          .replace(/(  |\n)/g, '')
      ),
    }),
    ...(production ? [
      terser({ format: { comments: false } }),
    ] : [
      serve({
        contentBase: outputPath,
        port: 8080,
      }),
      livereload({
        watch: outputPath,
      }),
    ]),
  ],
  watch: { clearScreen: false },
};
