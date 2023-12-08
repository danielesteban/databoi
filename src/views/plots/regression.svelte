<script lang="ts">
  import Regression from 'regression';
  import { writable, derived } from 'svelte/store';
  import Plot from 'components/plot.svelte';
  import { View } from 'state/data';

  enum RegressionType {
    exponential = 'exponential',
    linear = 'linear',
    logarithmic = 'logarithmic',
    power = 'power',
  }

  const type = writable(RegressionType.linear);
  const yi = writable(0);
  const xi = writable(1);

  const regression = derived([View, xi, yi, type], ([$View, $xi, $yi, $type]) => {
    const xn = $View.columns[$xi];
    const yn = $View.columns[$yi];
    if (!xn || !yn) {
      return { title: '', data: [] };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const { x, y } = $View.values.reduce<{ x: any[]; y: any[]; }>((xy, v) => {
      {
        const x = v[$xi];
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        xy.x.push(x);
      }
      {
        const y = v[$yi];
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        xy.y.push(y);
      }
      return xy;
    }, { x: [], y: [] });
    const s = (maxY - minY) / (maxX - minX);
    const { points, r2 } = Regression[$type](x.map((v, i) => [minY + (v - minX) * s, y[i]]));
    const { rx, ry } = points.map(([_, y], i) => [x[i], y]).sort((a, b) => a[0] - b[0]).reduce<{ rx: any[]; ry: any[]; }>((points, [x, y]) => {
      points.rx.push(x);
      points.ry.push(y);
      return points;
    }, { rx: [], ry: [] });
    return {
      title: `Y: ${yn} - X: ${xn} (r²: ${r2})`,
      data: [
        { name: '', x, y, mode: 'markers' },
        { name: '', x: rx, y: ry, mode: 'lines' },
      ],
    };
  });
</script>

<div class="regression">
  <div class="config">
    <div class="field">
      <label for="regressionType">Type</label>
      <select id="regressionType" bind:value={$type}>
        <option value={RegressionType.linear}>linear</option>
        <option value={RegressionType.exponential}>exponential</option>
        <option value={RegressionType.logarithmic}>logarithmic</option>
        <option value={RegressionType.power}>power</option>
      </select>
    </div>
    <div class="field">
    <label for="yIndex">y</label>
    <select id="yIndex" bind:value={$yi}>
      {#each $View.columns as column, index}
        <option value={index}>{column}</option>
      {/each}
    </select>
    </div>
    <div class="field">
      <label for="xIndex">x</label>
      <select id="xIndex" bind:value={$xi}>
        {#each $View.columns as column, index}
          <option value={index}>{column}</option>
        {/each}
      </select>
    </div>
  </div>
  <Plot title={$regression.title} data={$regression.data} />
</div>

<style>
  .regression {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .config {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
