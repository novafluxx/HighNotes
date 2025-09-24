<template>
  <div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
    <div class="flex justify-center h-full min-h-0 max-h-full overflow-auto ios-scroll py-8 px-4">
      <div class="w-full max-w-2xl space-y-4">
      <UCard>
        <template #header>
          <h1 class="text-2xl font-bold text-center">Changelog</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">Here you can find the latest updates and changes to High Notes.</p>
        </template>
      </UCard>

      <UCard>
        <template #header>
          <strong class="font-semibold">September 24, 2025</strong>
        </template>
        <ul class="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600 dark:text-gray-300">
          <li><strong>Nuxt UI 4 Upgrade</strong>: Upgraded to Nuxt UI 4 for enhanced UI components, better performance, and improved user experience.</li>
          <li><strong>Performance Improvements</strong>: Optimized note prefetching for faster loading, especially on mobile devices.</li>
          <li><strong>Note Editor Enhancements</strong>: Improved the note editor layout with better button placement and adjusted content height for easier editing.</li>
          <li><strong>Smooth Navigation</strong>: Added global page transitions for a more fluid and modern browsing experience.</li>
          <li><strong>Visual Updates</strong>: Enhanced the overall look with gradient backgrounds and refined focus styles across the app.</li>
          <li><strong>Mobile Experience</strong>: Fixed note creation and selection to properly close the sidebar on mobile devices.</li>
          <li><strong>Account Management</strong>: Strengthened the account deletion process with improved handling of offline operations.</li>
          <li><strong>Maintenance</strong>: Updated dependencies and package manager for better stability and security.</li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <strong class="font-semibold">September 12, 2025</strong>
        </template>
        <ul class="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600 dark:text-gray-300">
          <li><strong>Character counting & limits</strong>: Updated character counting logic.</li>
          <li><strong>UI & style enhancements</strong>: Added gradient backgrounds, improved focus styles, and introduced new animations across multiple pages for a more modern look.</li>
          <li><strong>Landing page & header</strong>: Enhanced the landing page and app header with updated styles and animations.</li>
        </ul>
      </UCard>
      <UCard>
        <template #header>
          <strong class="font-semibold">September 10, 2025</strong>
        </template>
        <ul class="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600 dark:text-gray-300">
          <li><strong>Account deletion</strong>: Added the ability to permanently delete your account and all associated notes, with full offline queue support and secure Supabase integration.</li>
          <li><strong>Offline queue improvements</strong>: Ensured account deletion and related operations are handled robustly when offline, with proper queue processing and error handling.</li>
          <li><strong>UX & feedback</strong>: Improved confirmation dialogs and error toasts for destructive actions. Updated documentation and help text for account management.</li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <strong class="font-semibold">August 9, 2025</strong>
        </template>
        <ul class="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600 dark:text-gray-300">
          <li><strong>Offline-first notes</strong>: Added IndexedDB cache and offline queue. Create, edit, and delete work offline and sync automatically on reconnect.</li>
          <li><strong>Robust sync</strong>: Preserves operation order, maps local IDs to server IDs to avoid duplicate creates, skips premature updates, and retries. Fixed <code>DataCloneError</code> by serializing objects before IDB writes.</li>
          <li><strong>State consistency</strong>: Keeps selected note and editor content in sync during queue processing and after server updates. Realtime events continue to update the list.</li>
          <li><strong>Background prefetch</strong>: Prefetches up to 100 recent notes and their full content after list load (batched, skips already cached) to improve offline availability.</li>
          <li><strong>UI indicators</strong>: Header shows a minimal prefetch progress indicator. Added completion toast on success and error toast on failure. Existing offline toasts remain.</li>
          <li><strong>Cleanup & UX</strong>: Replaced all Heroicons with Lucide. Centered form fields on signup and reset pages. Improved list caching and offline hydration of selected notes.</li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <strong class="font-semibold">August 4, 2025</strong>
        </template>
        <ul class="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600 dark:text-gray-300">
          <li>Added a global header bar and a hamburger menu on the notes page for easier navigation.</li>
          <li>Added this Changelog!</li>
        </ul>
      </UCard>

      <UCard>
        <template #header>
          <strong class="font-semibold">August 3, 2025</strong>
        </template>
        <ul class="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600 dark:text-gray-300">
          <li>Improved the text editor with a character counter and adjusted formatting options for a better user experience.</li>
          <li>Introduced a rich text editor with character limits.</li>
        </ul>
      </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
