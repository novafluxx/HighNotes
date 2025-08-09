<template>
  <div v-if="showInstallPrompt" class="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
    <div class="flex items-center gap-3">
      <Icon name="lucide:download" class="w-6 h-6" />
      <div>
        <p class="font-medium">Install High Notes</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Add to your home screen for quick access</p>
      </div>
      <div class="flex gap-2">
        <UButton size="sm" @click="install">Install</UButton>
        <UButton size="sm" variant="ghost" @click="dismiss">Later</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const showInstallPrompt = ref(false)
let deferredPrompt: any = null

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    showInstallPrompt.value = true
  })
})

const install = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      showInstallPrompt.value = false
    }
    deferredPrompt = null
  }
}

const dismiss = () => {
  showInstallPrompt.value = false
  deferredPrompt = null
}
</script>