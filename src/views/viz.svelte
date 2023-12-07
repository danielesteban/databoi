<script lang="ts">
  import Correlation from 'components/plots/correlation.svelte';
  import Histogram from 'components/plots/histogram.svelte';
</script>

<div class="viz">
  <Correlation />
  <Histogram />
</div>

<style>
  .viz {
    display: grid;
    grid-auto-rows: max-content;
    padding: 1rem;
    gap: 0.5rem;
    overflow-y: scroll;
  }
</style>
