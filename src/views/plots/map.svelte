<script lang="ts">
  import { derived } from 'svelte/store';
  import Plot from 'components/plot.svelte';
  import { View } from 'state/data';

  const map = derived([View], ([$View]) => {
    const lat = $View.columns.findIndex((c) => ['latitude', 'lat'].includes(c.toLowerCase()));
    const lon = $View.columns.findIndex((c) => ['longitude', 'lon'].includes(c.toLowerCase()));
    if (lat === -1 || lon === -1) {
      return { data: [] };
    }
    const bounds = $View.values.reduce<{ latMin: number; latMax: number; lonMin: number; lonMax: number; }>((bounds, v) => {
      bounds.latMin = Math.min(bounds.latMin, v[lat]);
      bounds.latMax = Math.max(bounds.latMax, v[lat]);
      bounds.lonMin = Math.min(bounds.lonMin, v[lon]);
      bounds.lonMax = Math.max(bounds.lonMax, v[lon]);
      return bounds;
    }, { latMin: Infinity, latMax: -Infinity, lonMin: Infinity, lonMax: -Infinity });
    return {
      center: { lat: (bounds.latMin + bounds.latMax) * 0.5, lon: (bounds.lonMin + bounds.lonMax) * 0.5 },
      data: [{ lat: $View.values.map((v) => v[lat]), lon: $View.values.map((v) => v[lon]), type: 'scattermapbox' }],
    };
  });
</script>

<div class="map">
  {#if $map.data.length}
    <Plot center={$map.center} data={$map.data} />
  {/if}
</div>

<style>
  .map {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
