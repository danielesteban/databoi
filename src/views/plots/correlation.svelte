<script lang="ts">
  import ColorScale from 'color-scales';
  import { Correlation, View } from 'state/data';

  const colors = new ColorScale(-1, 1, ["#FF6666", "#66FF66", "#6666FF"], 0.4);
  const background = (value: number) => colors.getColor(value).toHexString();

  $: !$Correlation.computed && !$Correlation.computing && Correlation.compute();
</script>

{#if $Correlation.computed}
  <div class="plot">
    {#each $Correlation.values as row, i}
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
{/if}

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
