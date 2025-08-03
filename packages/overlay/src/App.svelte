<script>
  import { onMount } from 'svelte';

  let message = 'Radiate joy'; // local state reflecting persisted config
  let ws;

  onMount(() => {
    const token = import.meta.env.VITE_OVERLAY_TOKEN;
    // Establish websocket connection with token-based auth.
    ws = new WebSocket(`ws://localhost:8080?token=${token}`);
    ws.onmessage = ev => {
      const data = JSON.parse(ev.data);
      if (data.type === 'config' || data.type === 'config:init') {
        // Server always sends {message} within payload
        message = data.payload.message || message;
      }
    };
  });

  function broadcast() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'config:update', payload: { message } }));
    }
  }
</script>

<style>
  :global(body) {
    margin: 0;
    background: linear-gradient(135deg, #FFD54F 0%, #9575CD 100%);
    font-family: system-ui, sans-serif;
  }
  .panel {
    padding: 2rem;
    color: #fff;
  }
  input {
    margin-top: 0.5rem;
  }
</style>

<div class="panel">
  <h1>Solar Overlay Configurator</h1>
  <label>
    Message:
    <input bind:value={message} on:input={broadcast} />
  </label>
  <p>{message}</p>
</div>
