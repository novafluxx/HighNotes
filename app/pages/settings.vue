<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Account Settings
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your account preferences and data
          </p>
        </div>

        <!-- Account Information -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Account Information
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ user?.email || 'Not available' }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Created
              </label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ formatDate(user?.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="px-6 py-4">
          <h2 class="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <Icon name="lucide:alert-triangle" class="h-5 w-5 text-red-400" />
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                  Delete Account
                </h3>
                <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>
                    Once you delete your account, there is no going back. This will permanently delete your account and all your notes.
                  </p>
                </div>
                <div class="mt-4">
                  <button
                    @click="showDeleteConfirmation = true"
                    :disabled="isDeleting"
                    class="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span v-if="isDeleting">Deleting...</span>
                    <span v-else>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmation" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex items-center">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
              <Icon name="lucide:alert-triangle" class="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div class="mt-4 text-center">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Delete Account
            </h3>
            <div class="mt-4">
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                This action cannot be undone. This will permanently delete your account and all your notes.
              </p>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Please type <span class="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">DELETE</span> to confirm:
              </p>
              <input
                v-model="confirmationText"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="Type confirmation phrase"
              />
            </div>
          </div>
          <div class="flex items-center justify-between mt-6">
            <button
              @click="cancelDeletion"
              class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              @click="confirmDeletion"
              :disabled="!isConfirmationValid || isDeleting"
              class="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isDeleting">Deleting...</span>
              <span v-else>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div v-if="notification" class="fixed top-4 right-4 max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <Icon v-if="notification.type === 'success'" name="lucide:check-circle" class="h-6 w-6 text-green-400" />
            <Icon v-else-if="notification.type === 'error'" name="lucide:x-circle" class="h-6 w-6 text-red-400" />
            <Icon v-else name="lucide:info" class="h-6 w-6 text-blue-400" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ notification.message }}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button @click="notification = null" class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
              <Icon name="lucide:x" class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Middleware
definePageMeta({
  middleware: 'auth'
})

// Composables
const user = useSupabaseUser()
const { deleteAccount } = useAccountDeletion()

// Reactive state
const showDeleteConfirmation = ref(false)
const confirmationText = ref('')
const isDeleting = ref(false)
const notification = ref<{ type: 'success' | 'error' | 'info', message: string } | null>(null)

// Computed
const isConfirmationValid = computed(() => confirmationText.value === 'DELETE')

// Methods
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'Not available'
  return new Date(dateString).toLocaleDateString()
}

const cancelDeletion = () => {
  showDeleteConfirmation.value = false
  confirmationText.value = ''
}

const confirmDeletion = async () => {
  if (!isConfirmationValid.value || isDeleting.value) return

  isDeleting.value = true
  
  try {
    const result = await deleteAccount(confirmationText.value)
    
    if (result.success) {
      showNotification('success', 'Account deleted successfully. You will be logged out.')
      // The deleteAccount function should handle logout
    } else {
      showNotification('error', result.error || 'Failed to delete account')
    }
  } catch (error) {
    console.error('Account deletion error:', error)
    showNotification('error', 'An unexpected error occurred')
  } finally {
    isDeleting.value = false
    showDeleteConfirmation.value = false
    confirmationText.value = ''
  }
}

const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
  notification.value = { type, message }
  setTimeout(() => {
    notification.value = null
  }, 5000)
}
</script>
