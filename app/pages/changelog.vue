<template>
  <div class="flex justify-center h-full overflow-auto ios-scroll py-8 px-4">
    <UCard class="w-full max-w-2xl text-center">
      <template #header>
        <h1 class="text-2xl font-bold">Changelog</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Here you can find the latest updates and changes to High Notes.</p>
      </template>

      <ul class="space-y-4 text-left inline-block">
        <li>
          <strong class="font-semibold">August 9, 2025</strong>
          <ul class="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600 dark:text-gray-300">
            <li><strong>Offline-first notes</strong>: Added IndexedDB cache and offline queue. Create, edit, and delete work offline and sync automatically on reconnect.</li>
            <li><strong>Robust sync</strong>: Preserves operation order, maps local IDs to server IDs to avoid duplicate creates, skips premature updates, and retries. Fixed <code>DataCloneError</code> by serializing objects before IDB writes.</li>
            <li><strong>State consistency</strong>: Keeps selected note and editor content in sync during queue processing and after server updates. Realtime events continue to update the list.</li>
            <li><strong>Background prefetch</strong>: Prefetches up to 100 recent notes and their full content after list load (batched, skips already cached) to improve offline availability.</li>
            <li><strong>UI indicators</strong>: Header shows a minimal prefetch progress indicator. Added completion toast on success and error toast on failure. Existing offline toasts remain.</li>
            <li><strong>Cleanup & UX</strong>: Replaced all Heroicons with Lucide. Centered form fields on signup and reset pages. Improved list caching and offline hydration of selected notes.</li>
          </ul>
        </li>
        <li>
          <strong class="font-semibold">August 4, 2025</strong>
          <ul class="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600 dark:text-gray-300">
            <li>Added a global header bar and a hamburger menu on the notes page for easier navigation.</li>
            <li>Added this Changelog!</li>
          </ul>
        </li>
        <li>
          <strong class="font-semibold">August 3, 2025</strong>
          <ul class="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600 dark:text-gray-300">
            <li>Improved the text editor with a character counter and adjusted formatting options for a better user experience.</li>
            <li>Introduced a rich text editor with character limits.</li>
          </ul>
        </li>
      </ul>
    </UCard>
  </div>
</template>

<script setup lang="ts">
</script>
