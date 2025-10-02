<template>
  <div>
    <!-- Offline Ready Notification -->
    <div
      v-if="offlineReady"
      class="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border z-50 max-w-sm"
    >
      <div class="flex items-center gap-3">
        <Icon name="lucide:check-circle" class="w-6 h-6 text-green-500 flex-shrink-0" />
        <div class="flex-1">
          <p class="font-medium">App ready to work offline</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">You can now use High Notes without an internet connection</p>
        </div>
        <UButton size="sm" variant="ghost" @click="close">
          <Icon name="lucide:x" />
        </UButton>
      </div>
    </div>

    <!-- New Content Available Notification -->
    <div
      v-if="needRefresh"
      class="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border z-50 max-w-sm"
    >
      <div class="flex items-center gap-3">
        <Icon name="lucide:download" class="w-6 h-6 text-blue-500 flex-shrink-0" />
        <div class="flex-1">
          <p class="font-medium">New content available</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">Click reload to update to the latest version</p>
        </div>
      </div>
      <div class="flex gap-2 mt-3">
        <UButton size="sm" @click="updateServiceWorker?.()">
          Reload
        </UButton>
        <UButton size="sm" variant="ghost" @click="close">
          Later
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue'

// Client-side only refs
const offlineReady = ref(false)
const needRefresh = ref(false)
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined

const close = () => {
  offlineReady.value = false
  needRefresh.value = false
}

// Only register service worker on client-side
onMounted(() => {
  if (typeof window === 'undefined') return
  
  const { offlineReady: _offlineReady, needRefresh: _needRefresh, updateServiceWorker: _updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.info('Service Worker registered successfully')
      
      if (!registration) return
      
      // Set up periodic updates with proper checks and cleanup
      const updateInterval = setInterval(async () => {
        // Skip update check if service worker is already installing
        if (registration.installing) return
        
        // Skip update check if device is offline
        if ('connection' in navigator && !navigator.onLine) return
        
        // Verify service worker file hasn't changed before updating
        try {
          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: {
              'cache': 'no-store',
              'cache-control': 'no-cache',
            },
          })
          
          if (resp?.status === 200) {
            await registration.update()
          }
        } catch (error) {
          console.error('Service worker update check failed:', error)
        }
      }, 60 * 60 * 1000) // Check every hour
      
      // Clean up interval when component unmounts
      onUnmounted(() => {
        clearInterval(updateInterval)
      })
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error)
    },
  })
  
  // Sync refs with the composable's reactive values
  watchEffect(() => {
    offlineReady.value = _offlineReady.value
    needRefresh.value = _needRefresh.value
  })
  
  updateServiceWorker = _updateServiceWorker
})
</script>
