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
  <a class="source" href="https://github.com/danielesteban/databoi" target="_blank">
    <svg width="80" height="80" viewBox="0 0 250 250">
      <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
      <path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path>
      <path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path>
    </svg>
  </a>
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
  .source {
    position: fixed;
    top: 0;
    right: 0;
  }
  .source > svg {
    fill: #000;
    color: #fff;
    pointer-events: none;
  }
  .source:hover > svg .octo-arm {
    animation: octocat-wave .56s ease-in-out;
  }
  @keyframes octocat-wave {
    0%,to {
      transform: rotate(0)
    }
    20%,60% {
      transform: rotate(-25deg)
    }
    40%,80% {
      transform: rotate(10deg)
    }
  }
</style>
