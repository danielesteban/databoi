<script lang="ts">
  import { onMount } from 'svelte';
  import { Writable } from 'svelte/store';

  export let source: Writable<string>;

  let wrapper: HTMLDivElement;
  let editor: any;
  const resizeEditor = () => editor.layout();
  onMount(() => {
    let debounce: number;
    let isFromEditor = true;
    let isFromSubscription = false;
    // @ts-ignore
    editor = monaco.editor.create(wrapper, {
      minimap: { enabled: false },
      tabSize: 2,
      lineNumbers: 'off',
      theme: 'vs-dark',
    });
    // @ts-ignore
    editor.setModel(monaco.editor.createModel($source, 'sql'));
    const subscriptions = [
      source.subscribe((value) => {
        if (!isFromEditor) {
          isFromSubscription = true;
          editor.setValue(value);
          isFromSubscription = false;
        }
      }),
    ];
    isFromEditor = false;
    editor.onDidChangeModelContent(() => {
      if (isFromSubscription) {
        return;
      }
      if (debounce) clearTimeout(debounce);
      // @ts-ignore
      debounce = setTimeout(() => {
        isFromEditor = true;
        source.set(editor.getValue());
        isFromEditor = false;
      }, 500);
    });
    editor.focus();
    window.addEventListener('resize', resizeEditor, false);
    return () => {
      editor.dispose();
      clearTimeout(debounce);
      window.removeEventListener('resize', resizeEditor);
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  });
</script>

<div class="wrapper" bind:this={wrapper} />

<style>
  .wrapper {
    min-width: 0;
    min-height: 0;
  }
</style>
