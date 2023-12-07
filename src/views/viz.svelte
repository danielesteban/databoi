<script lang="ts">
  import Correlation from 'views/plots/correlation.svelte';
  import Histogram from 'views/plots/histogram.svelte';
  import Regression from 'views/plots/regression.svelte';

  enum Tab {
    correlation,
    histogram,
    regression,
  }

  let tab = Tab.histogram;
  const setTab = (t: Tab) => () => {
    tab = t;
  };
</script>

<div class="viz">
  <div class="menu">
    <button on:click={setTab(Tab.histogram)} class:active={tab === Tab.histogram}>Histogram</button>
    <button on:click={setTab(Tab.correlation)}  class:active={tab === Tab.correlation}>Correlation</button>
    <button on:click={setTab(Tab.regression)}  class:active={tab === Tab.regression}>Regression</button>
  </div>
  <div class="plots">
    {#if tab === Tab.correlation}
      <Correlation />
    {/if}
    {#if tab === Tab.histogram}
      <Histogram />
    {/if}
    {#if tab === Tab.regression}
      <Regression />
    {/if}
  </div>
</div>

<style>
  .viz {
    min-height: 0;
    display: grid;
    grid-template-rows: auto 1fr;
  }
  .menu {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.5);
    position: relative;
    z-index: 1;
    height: 1.5rem;
  }
  .menu > button {
    border: 0;
    border-radius: 0;
    background: transparent;
    position: relative;
    padding: 0.25rem 1rem;
  }
  .menu > button.active::before {
    content: "";
    display: block;
    position: absolute;
    width: 80%;
    height: 0.125rem;
    left: 50%;
    bottom: 0;
    transform: translate(-50%, -50%);
    border-radius: 0.25rem;
    background: #393;
  }
  .plots {
    display: grid;
    grid-auto-rows: max-content;
    padding: 1rem;
    gap: 0.5rem;
    overflow-y: auto;
  }
</style>
