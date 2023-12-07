<script lang="ts">
  import ColorScale from 'color-scales';
  import { derived } from 'svelte/store';
  import { View } from 'state/data';

  const colors = new ColorScale(-1, 1, ["#FF6666", "#66FF66", "#6666FF"], 0.4);
  const background = (value: number) => colors.getColor(value).toHexString();

  const correlation = derived([View], ([$View]) => {
    const len = $View.values.length;
    const cache = new Map();
    return $View.columns.map((_, xi) => (
      $View.columns.map((_, yi) => {
        if (xi === yi) {
          return 1;
        }
        const key = `${Math.min(xi, yi)}:${Math.max(xi, yi)}`;
        const cached = cache.get(key);
        if (cached) {
          return cached;
        }
        let sumX = 0,
            sumY = 0,
            sumXY = 0,
            sumX2 = 0,
            sumY2 = 0;
        for (let i = 0; i < len; i++) {
          const xv = $View.values[i][xi];
          const yv = $View.values[i][yi];
          sumX += xv;
          sumY += yv;
          sumXY += xv * yv;
          sumX2 += xv * xv;
          sumY2 += yv * yv;
        };
        const result = (
          (len * sumXY - sumX * sumY)
          / Math.sqrt((len * sumX2 - sumX * sumX) * (len * sumY2 - sumY * sumY))
        ) || 0;
        cache.set(key, result);
        return result;
      })
    ));
  });
</script>

<div class="plot">
  {#each $correlation as row, i}
    <div class="row">
      <div class="column">
        <div>{$View.columns[i]}</div>
      </div>
      {#each row as value}
        <div class="value" style="background: {background(value)};">
          {Math.round(value * 1000) / 1000}
        </div>
      {/each}
    </div>
  {/each}
  <div class="row">
    <div class="column"></div>
    {#each $View.columns as column}
      <div class="column">
        <div>{column}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .plot {
    border: 1px solid #000;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  .row {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
  }
  .column {
    background: #222;
  }
  .column > div {
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .column, .value {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3rem;
    white-space: nowrap;
  }
</style>
