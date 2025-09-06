<script>
  // No JS needed for basic Tailwind and shadcn/ui test
</script>

<!-- Tailwind CSS test -->
<div class="p-8 space-y-6">
  <h1 class="text-4xl font-bold text-blue-600">Tailwind CSS Test</h1>
  <p class="text-lg text-gray-700">
    If you see this styled text, Tailwind CSS is working!
  </p>

  <!-- Button examples -->
  <div class="space-x-4">
    <button
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >Primary Button</button
    >
    <button
      class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
      >Secondary Button</button
    >
    <button
      class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >Success Button</button
    >
    <button
      class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >Danger Button</button
    >
    <button
      class="px-4 py-2 border border-gray-400 text-gray-700 rounded hover:bg-gray-100 transition"
      >Outline Button</button
    >
    <button
      class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
      >shadcn/ui style button (example)</button
    >
  </div>

  <div class="mt-6">
    <label for="test-input" class="block mb-2 text-sm font-medium text-gray-900"
      >Input Example</label
    >
    <input
      id="test-input"
      type="text"
      class="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Type here..."
    />
  </div>
</div>
