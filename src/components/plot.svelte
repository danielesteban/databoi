<script context="module" lang="ts">
  import * as plotly from 'plotly.js';

  const config: Partial<plotly.Config> = {
    displaylogo: false,
    mapboxAccessToken: (
      // @ts-ignore
      __MAPBOX_TOKEN__
    ),
    modeBarButtonsToRemove: ['lasso2d', 'resetScale2d', 'select2d', 'toImage'],
    responsive: true,
  };
  const layout: (map: Partial<plotly.Mapbox>, title?: string) => Partial<plotly.Layout> = (map, title) => ({
    font: { family: "'Roboto Condensed', monospace", color: '#eeeeee' },
    mapbox: {
      ...map,
      style: 'dark',
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

	export let center: plotly.MapboxCenter | undefined = undefined;
	export let data: any[];
	export let title: string | undefined = undefined;

  let map: Partial<plotly.Mapbox> = { center, zoom: 4 };
  let lastData: any[] = data;
  let lastTitle: string | undefined = title;
	let plot: HTMLElement;

  onMount(() => {
    plotly
      .newPlot(plot, data, layout(map, title), config)
      .then((p) => p.on('plotly_relayout', (e: any) => {
        ['mapbox.bearing', 'mapbox.center', 'mapbox.pitch', 'mapbox.zoom'].forEach((key) => {
          if (e[key]) {
            (map as any)[key.split('.')[1]] = e[key];
          }
        });
      }));
    return () => plotly.purge(plot);
  });

  const update = (data: any[], title?: string) => {
    if (
      !plot
      || (data === lastData && title === lastTitle)
    ) {
      return;
    }
    lastData = data;
    lastTitle = title;
    plotly.react(plot, data, layout(map, title), config);
  };

  $: update(data, title);
</script>

<div class="plot">
  <slot />
  <div bind:this={plot} />
</div>

<style>
  .plot {
    border: 1px solid #000;
  }
  .plot > div {
    height: 450px; 
  }
</style>
