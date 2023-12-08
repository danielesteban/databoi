<script lang="ts">
  import { derived } from 'svelte/store';
  import Plot from 'components/plot.svelte';
  import { View } from 'state/data';

  const map = derived([View], ([$View]) => {
    const lat = $View.columns.findIndex((c) => ['latitude', 'lat'].includes(c.toLowerCase()));
    const lon = $View.columns.findIndex((c) => ['longitude', 'lon'].includes(c.toLowerCase()));
    if (lat === -1 || lon === -1) {
      return [];
    }
    return [{ lat: $View.values.map((v) => v[lat]), lon: $View.values.map((v) => v[lon]), type: 'scattermapbox' }];
  });
</script>

<div class="map">
  {#if $map.length}
    <Plot data={$map} />
  {/if}
</div>

<style>
  .map {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
