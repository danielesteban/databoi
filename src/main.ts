import Main from './main.svelte';

// @ts-ignore
window.require(['vs/editor/editor.main'], () => (
  new Main({
    target: document.body,
  })
));
