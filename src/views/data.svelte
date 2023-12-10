<script lang="ts">
  // @ts-ignore
  import VirtualList from '@sveltejs/svelte-virtual-list';
  import Download from 'components/download.svelte';
  import Editor from 'components/editor.svelte';
  import Split, { SplitMode } from 'components/split.svelte';
  import { Query, QueryError, View } from 'state/data';
</script>

<div class="data">
  <Split mode={SplitMode.vertical}>
    <div slot="A" class="rows">
      <div class="columns">
        {#each $View.columns as column}
          <div class="column">
            <div>{column}</div>
          </div>
        {/each}
      </div>
      <div class="records">
        <VirtualList items={$View.values} itemHeight={18} let:item>
          <div class="row">
            {#each item as value}
              <div class="value">
                <div>{value}</div>
              </div>
            {/each}
          </div>
        </VirtualList>
      </div>
    </div>
    <div slot="B" class="query">
      <Editor source={Query} />
    </div>
  </Split>
  <div class="info">
    <div class="error">
      {$QueryError}
    </div>
    <div class="status">
      <Download />
      {$View.values.length} Results
    </div>
  </div>
</div>

<style>
  .data {
    min-height: 0;
    display: grid;
    grid-template-rows: 1fr auto;
  }
  .query {
    min-height: 0;
    display: grid;
  }
  .rows {
    min-height: 0;
    display: grid;
    grid-template-rows: auto 1fr;
  }
  .info {
    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.5);
    position: relative;
    z-index: 2;
    border-top: 1px solid #000;
    background: #222;
    padding: 0 1.25rem;
    color: #aaa;
    display: flex;
    justify-content: space-between;
  }
  .error {
    display: flex;
    align-items: center;
    color: #933;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .columns, .row {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    height: 1.125rem;
    white-space: nowrap;
    user-select: text;
    cursor: text;
  }
  .columns {
    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.5);
    position: relative;
    z-index: 1;
    height: 1.5rem;
    padding-right: 1rem;
  }
  .column {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #222;
  }
  .records {
    min-height: 0;
  }
  .value {
    display: flex;
    align-items: center;
    border: 1px solid #222;
    padding: 0 0.25rem;
  }
  .column > div, .value > div {
    text-overflow: ellipsis;
    overflow: hidden;
  }
</style>
