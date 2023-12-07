<script lang="ts">
  import { load } from 'state/data';

  const accept = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  let loaded = false;
  let loading = false;
  let delimiter = ',';
  let dropNull = true;

  const loadFile = async (file: File) => {
    loaded = false;
    loading = true;
    try {
      await load(file!, delimiter, dropNull);
      loaded = true;
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  };

  const prevent = (e: DragEvent | MouseEvent) => (
    e.preventDefault()
  );

  const browse = () => {
    const loader = document.createElement('input');
    loader.type = 'file';
    loader.accept = accept.join(',');
    loader.onchange = () => {
      loadFile(loader.files![0]);
    };
    loader.click();
  };

  const drop = (e: DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    const [drop] = e.dataTransfer.files;
    if (!drop || !accept.includes(drop.type)) {
      return;
    }
    loadFile(drop);
  };
</script>

<svelte:document on:contextmenu={prevent} on:dragenter={prevent} on:dragover={prevent} on:drop={drop} />

{#if loaded}
  <slot />
{:else}
  <div class="loader">
    <div class="wrapper">
      <div class="zone">
        <div class="drop">
          Drop a File (*.csv, *.xls, *.xlsx)
        </div>
        <div class="alt">or</div>
        <button class="link" on:click={browse}>
          Browse your device
        </button>
      </div>
      <div class="fields">
        <div class="heading">Parsing options</div>
        <div class="group">
          <div class="field">
            <label for="delimiter">Delimiter (*.csv)</label>
            <input id="delimiter" type="text" bind:value={delimiter} />
          </div>
          <div class="field">
            <label for="dropNull">Drop null records</label>
            <input id="dropNull" type="checkbox" bind:checked={dropNull} />
          </div>
        </div>
      </div>
      <div class="info">
        <a href="https://dani.gatunes.com" rel="noopener noreferrer" target="_blank">dani@gatunes</a> © 2023
      </div>
    </div>
  </div>
  {#if loading}
    <div class="loading">
      <div>Loading data...</div>
    </div>
  {/if}
{/if}

<style>
  .loader {
    width: 100vw;
    height: 100%;
    display: grid;
    align-items: center;
    justify-content: center;
  }
  .wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    border-radius: 0.5rem;
    border: 4px dashed #222;
  }
  .drop {
    font-size: 1.375rem;
    line-height: 1.5rem;
  }
  .alt {
    color: #aaa;
  }
  .link {
    background: transparent;
    border: 0;
    padding: 0;
    text-decoration: underline;
  }
  .fields {
    border-radius: 0.5rem;
    background: #222;
    border: 1px solid #000;
  }
  .heading {
    background: #111;
    padding: 0.5rem;
  }
  .group {
    display: flex;
    gap: 1rem;
    padding: 0.5rem 1rem;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .field > label {
    width: 3rem;
    line-height: 1rem;
    color: #ddd;
  }
  .field > input[type="text"] {
    width: 2.5rem;
  }
  .info {
    text-align: center;
    margin: 1rem 0;
    color: #aaa;
    font-size: 0.6875rem;
  }
  .info > a {
    text-decoration: underline;
  }
  .loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(0.5rem);
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
