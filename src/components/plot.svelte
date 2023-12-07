<script context="module" lang="ts">
  import * as plotly from 'plotly.js';

  const config: Partial<plotly.Config> = {
    displaylogo: false,
    modeBarButtonsToRemove: ['resetScale2d', 'toImage'],
    responsive: true,
  };
  const layout: Partial<plotly.Layout> = {
    font: { family: "'Roboto Condensed', monospace", color: '#eeeeee' },
    margin: { t: 64, r: 48, b: 48, l: 48 },
    modebar: { orientation: 'v' },
    paper_bgcolor: '#222222',
    plot_bgcolor: '#222222',
  };
</script>

<script lang="ts">
  import { onMount } from 'svelte';

	export let title: string;
	export let data: any[];

  let lastData: any[];
  let lastTitle: string;
	let plot: HTMLDivElement;

  onMount(() => {
    lastData = data;
    lastTitle = title;
    plotly.newPlot(plot, data, { ...layout, title }, config);
    return () => plotly.purge(plot);
  });

  const update = (data: any[], title: string) => {
    if (
      !plot
      || (data === lastData && title === lastTitle)
    ) {
      return;
    }
    lastData = data;
    lastTitle = title;
    plotly.purge(plot);
    plotly.newPlot(plot, data, { ...layout, title }, config);
  };

  $: update(data, title);
</script>

<div class="plot" bind:this={plot} />

<style>
  .plot {
    border: 1px solid #000;
    border-radius: 0.5rem;
    overflow: hidden;
  }
</style>
