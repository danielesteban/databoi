<script lang="ts">
  import { derived } from 'svelte/store';
  import Plot from 'components/plot.svelte';
  import { View } from 'state/data';

  const histograms = derived([View], ([$View]) => (
    $View.columns.map((title, i) => ({
      title,
      data: [{ x: $View.values.map((v) => v[i]), type: 'histogram' }],
    }))
  ));
</script>

<div class="grid">
  {#each $histograms as histogram}
    <Plot title={histogram.title} data={histogram.data} />
  {/each}
</div>

<style>
  .grid {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  }
</style>
