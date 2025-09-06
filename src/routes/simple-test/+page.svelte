<script>
	let count = 0;
	
	function increment() {
		count += 1;
	}
</script>

<h1>Simple Test</h1>
<p>Count: {count}</p>
<button on:click={increment}>Increment</button>
