<script context="module" lang="ts">
  import { writable } from 'svelte/store';

  enum RegressionType {
    exponential = 'exponential',
    linear = 'linear',
    logarithmic = 'logarithmic',
    power = 'power',
  }

  const x = writable('');
  const y = writable('');
  const type = writable(RegressionType.linear);
</script>

<script lang="ts">
  import { derived } from 'svelte/store';
  import Plot from 'components/plot.svelte';
  import { Regression, View } from 'state/data';

  $: !$View.columns.some((c) => c === $x) && $View.columns[1] && x.set($View.columns[1]);
  $: !$View.columns.some((c) => c === $y) && $View.columns[0] && y.set($View.columns[0]);
  $: !$Regression.computed && !$Regression.computing && Regression.compute($x, $y, $type);

  const plot = derived([Regression, View, x, y], ([$Regression, $View, $x, $y]) => {
    const xi = $View.columns.findIndex((c) => c === $x);
    const yi = $View.columns.findIndex((c) => c === $y);
    if (xi === -1 || yi === -1) {
      return { data: [] };
    }
    const { rx, ry } = $Regression.values
      .map((y, i) => [$View.values[i][xi], y])
      .sort((a, b) => a[0] - b[0])
      .reduce<{ rx: any[]; ry: any[]; }>((points, [x, y]) => {
        points.rx.push(x);
        points.ry.push(y);
        return points;
      }, { rx: [], ry: [] });
    return {
      title: `Y: ${$y} - X: ${$x}${$Regression.computed ? ` (r²: ${$Regression.r2})` : ''}`,
      data: [
        { name: '', x: $View.values.map((v) => v[xi]), y: $View.values.map((v) => v[yi]), mode: 'markers' },
        { name: '', x: rx, y: ry, mode: 'lines' },
      ],
    };
  });

  const recompute = () => Regression.compute($x, $y, $type);
</script>

<Plot title={$plot.title} data={$plot.data}>
  <div class="config">
    <div class="field">
      <label for="regressionType">Type</label>
      <select id="regressionType" bind:value={$type} on:change={recompute}>
        <option value={RegressionType.linear}>linear</option>
        <option value={RegressionType.exponential}>exponential</option>
        <option value={RegressionType.logarithmic}>logarithmic</option>
        <option value={RegressionType.power}>power</option>
      </select>
    </div>
    <div class="field">
      <label for="yIndex">Y</label>
      <select id="yIndex" bind:value={$y} on:change={recompute}>
        {#each $View.columns as column}
          <option value={column}>{column}</option>
        {/each}
      </select>
    </div>
    <div class="field">
      <label for="xIndex">X</label>
      <select id="xIndex" bind:value={$x} on:change={recompute}>
        {#each $View.columns as column}
          <option value={column}>{column}</option>
        {/each}
      </select>
    </div>
  </div>
</Plot>

<style>
  .config {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    background: #111;
    padding: 0.25rem 0.75rem;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
</style>
