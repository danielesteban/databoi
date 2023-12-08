<script context="module" lang="ts">
  import * as plotly from 'plotly.js';

  const config: Partial<plotly.Config> = {
    displaylogo: false,
    mapboxAccessToken: 'pk.eyJ1IjoiZGFuaWdhdHVuZXMiLCJhIjoiY2xwd21jd2J2MGcxcDJrbzk0bHAwMjlyOCJ9.yoSPGPhmUo9Z9fqOxOWqiQ',
    modeBarButtonsToRemove: ['lasso2d', 'resetScale2d', 'select2d', 'toImage'],
    responsive: true,
  };
  const layout: (center?: { lat: number; lon: number }, title?: string) => Partial<plotly.Layout> = (center, title) => ({
    font: { family: "'Roboto Condensed', monospace", color: '#eeeeee' },
    mapbox: {
      center,
      style: 'dark',
      zoom: 4,
    },
    margin: title ? { t: 64, r: 48, b: 48, l: 48 } : { t: 0, r: 0, b: 0, l: 0 },
    modebar: { orientation: 'v' },
    paper_bgcolor: '#222222',
    plot_bgcolor: '#222222',
    showlegend: false,
    title,
  });
</script>

<script lang="ts">
  import { onMount } from 'svelte';

	export let center: { lat: number; lon: number } | undefined = undefined;
	export let data: any[];
	export let title: string | undefined = undefined;

  let lastData: any[] = data;
  let lastCenter: { lat: number; lon: number } | undefined = center;
  let lastTitle: string | undefined = title;
	let plot: HTMLElement;

  onMount(() => {
    plotly.newPlot(plot, data, layout(center, title), config);
    return () => plotly.purge(plot);
  });

  const update = (data: any[], center?: { lat: number; lon: number }, title?: string) => {
    if (
      !plot
      || (data === lastData && center === lastCenter && title === lastTitle)
    ) {
      return;
    }
    lastData = data;
    lastCenter = center;
    lastTitle = title;
    plotly.purge(plot);
    plotly.newPlot(plot, data, layout(center, title), config);
  };

  $: update(data, center, title);
</script>

<div class="plot" bind:this={plot} />

<style>
  .plot {
    border: 1px solid #000;
    border-radius: 0.5rem;
    overflow: hidden;
  }
</style>
