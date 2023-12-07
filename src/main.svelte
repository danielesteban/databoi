<script lang="ts">
  import Split, { SplitMode } from 'components/split.svelte';
  import Data from 'views/data.svelte';
  import Loader from 'views/loader.svelte';
  import Viz from 'views/viz.svelte';
</script>

<Loader>
  <Split mode={SplitMode.horizontal}>
    <Viz slot="A" />
    <Data slot="B" />
  </Split>
</Loader>

<style>
  @font-face {
    font-family: 'Roboto Condensed';
    font-style: normal;
    font-weight: 400;
    src: url(__FONT_PATH__) format('woff2');
  }
  :global(:root) {
    font-size: 16px;
    width: 100vw;
    height: 100%;
  }
  :global(body) {
    margin: 0;
    background: linear-gradient(to top, #000, #111, #222);
    color: #eee;
    cursor: default;
    user-select: none;
    overflow: hidden;
    font-family: 'Roboto Condensed', monospace;
    font-style: normal;
    font-weight: 400;
    font-size: 0.75rem;
    line-height: 0.75rem;
    width: 100vw;
    height: 100%;
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-text-size-adjust: none;
  }
  :global(a) {
    color: inherit;
    cursor: pointer;
    text-decoration: none;
    outline: none;
  }
  :global(canvas) {
    vertical-align: middle;
  }
  :global(button) {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #111;
    color: #eee;
    padding: 0.5rem 1rem;
    border: 1px solid #000;
    border-radius: 0.25rem;
    font-family: inherit;
    font-weight: inherit;
    cursor: pointer;
    outline: none;
  }
  :global(button:active) {
    transform: translate(0, 1px);
  }
  :global(button:disabled) {
    cursor: default;
    opacity: 0.3;
    transform: none;
  }
  :global(h1, h2, h3, h4, h5) {
    margin: 0;
    font-family: inherit;
    font-weight: inherit;
  }
  :global(input[type="email"], input[type="text"], input[type="password"], select, textarea) {
    box-sizing: border-box;
    background-color: #111;
    padding: 0.5rem 1rem;
    border: 1px solid #000;
    border-radius: 0.25rem;
    color: inherit;
    font-family: inherit;
    font-weight: inherit;
    outline: none;
  }
  :global(input[type="checkbox"]) {
    accent-color: #111;
    cursor: pointer;
  }
  :global(
    input[type="email"]::placeholder,
    input[type="text"]::placeholder,
    input[type="password"]::placeholder
  ) {
    color: #aaa;
  }
  :global(
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus
  ) {
    -webkit-text-fill-color: #eee;
    transition: background-color 5000s ease-in-out 0s;
  }
  :global(::-webkit-scrollbar) {
    background-color: rgba(0, 0, 0, 0);
  }
  :global(::-webkit-scrollbar:hover) {
    background-color: rgba(0, 0, 0, 0);
  }
  :global(::-webkit-scrollbar:vertical) {
    width: 1rem;
  }
  :global(::-webkit-scrollbar-thumb:vertical) {
    background: #555;
  }
  :global(::-webkit-scrollbar-thumb:vertical:active) {
    background: #666;
  }
</style>
