<script context="module" lang="ts">
  import { writable } from 'svelte/store';

  const colorscale = [
    [0, 'rgb(150,0,90)'],
    [0.125, 'rgb(0, 0, 200)'],
    [0.25,'rgb(0, 25, 255)'],
    [0.375,'rgb(0, 152, 255)'],
    [0.5,'rgb(44, 255, 150)'],
    [0.625,'rgb(151, 255, 0)'],
    [0.75,'rgb(255, 234, 0)'],
    [0.875,'rgb(255, 111, 0)'],
    [1,'rgb(255, 0, 0)'],
  ];

  const color = writable('');
</script>

<script lang="ts">
  import { derived } from 'svelte/store';
  import Plot from 'components/plot.svelte';
  import { View } from 'state/data';

  $: !$View.columns.some((c) => c === $color) && $View.columns[0] && color.set($View.columns[0]);

  const map = derived([View, color], ([$View, $color]) => {
    const lat = $View.columns.findIndex((c) => ['latitude', 'lat'].includes(c.toLowerCase()));
    const lon = $View.columns.findIndex((c) => ['longitude', 'lon'].includes(c.toLowerCase()));
    const col = $View.columns.findIndex((c) => c === $color);
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
      data: [{
        lat: $View.values.map((v) => v[lat]),
        lon: $View.values.map((v) => v[lon]),
        type: 'scattermapbox',
        ...(col !== -1 ? {
          hovertemplate: '%{text}<extra></extra>',
          marker: {
            color: $View.values.map((v) => v[col]),
            colorscale,
            opacity: 0.5,
          },
          text: $View.values.map((v) => v[col]),
        } : {}),
      }],
    };
  });
</script>

{#if $map.data.length}
  <Plot center={$map.center} data={$map.data}>
    <div class="config">
      <select bind:value={$color}>
        {#each $View.columns as column}
          <option value={column}>{column}</option>
        {/each}
      </select>
    </div>
  </Plot>
{/if}

<style>
  .config {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: #111;
    padding: 0.25rem 0.25rem;
  }
</style>
