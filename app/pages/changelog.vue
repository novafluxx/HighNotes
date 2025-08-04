<template>
  <div class="flex justify-center py-8 px-4">
    <UCard class="w-full max-w-2xl text-center">
      <template #header>
        <h1 class="text-2xl font-bold">Changelog</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Here you can find the latest updates and changes to High Notes.</p>
      </template>

      <ul class="space-y-4 text-left inline-block">
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
