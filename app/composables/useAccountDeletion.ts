import { ref, readonly } from 'vue'

interface DeleteAccountResult {
  success: boolean
  error?: string
}

export const useAccountDeletion = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const router = useRouter()
  const { clearAllOfflineData, enqueueOperation, readQueueFIFO, clearQueueItems } = useOfflineNotes()

  const isDeleting = ref(false)

  const deleteAccount = async (confirmation: string): Promise<DeleteAccountResult> => {
    if (confirmation !== 'DELETE') {
      return { success: false, error: 'Invalid confirmation phrase' }
    }

    if (!user.value) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if online
    if (!navigator.onLine) {
      // Queue the deletion operation for when we come back online
      await enqueueOperation({
        type: 'delete-account',
        user_id: user.value.id,
        data: { confirmation },
        timestamp: Date.now()
      })
      
      return { 
        success: true, 
        error: 'Account deletion queued. Will process when connection is restored.' 
      }
    }

    isDeleting.value = true

    try {
      // Call the Supabase edge function to delete the account
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation }
      })

      if (error) {
        console.error('Account deletion error:', error)
        return { success: false, error: error.message || 'Failed to delete account' }
      }

      if (data?.success) {
        // Clean up local data
        await cleanupLocalData()
        
        // Sign out the user
        await supabase.auth.signOut()
        
        // Redirect to login page
        await router.push('/login')
        
        return { success: true }
      } else {
        return { success: false, error: data?.error || 'Account deletion failed' }
      }
    } catch (error) {
      console.error('Unexpected error during account deletion:', error)
      return { success: false, error: 'An unexpected error occurred' }
    } finally {
      isDeleting.value = false
    }
  }

  const cleanupLocalData = async () => {
    try {
      // Clear all offline data (notes cache and queue)
      await clearAllOfflineData()
      
      console.log('Local data cleaned up successfully')
    } catch (error) {
      console.error('Error cleaning up local data:', error)
    }
  }

  const processQueuedDeletion = async (item: any): Promise<boolean> => {
    if (!item.data?.confirmation) {
      console.error('Missing confirmation data for queued account deletion')
      return false
    }

    try {
      // Process queued account deletion
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: item.data.confirmation }
      })

      if (data?.success) {
        // Account deletion successful - clean up local data
        await cleanupLocalData()
        console.log('Queued account deletion processed successfully')
        return true
      } else {
        console.error('Failed to process queued account deletion:', error)
        return false
      }
    } catch (error) {
      console.error('Error processing queued account deletion:', error)
      return false
    }
  }

  const processQueuedDeletionsForUser = async (userId: string): Promise<string[]> => {
    const processed: string[] = []

    try {
      const queueItems = await readQueueFIFO(userId)
      const accountDeletionItems = queueItems.filter(item => item.type === 'delete-account')

      for (const item of accountDeletionItems) {
        const success = await processQueuedDeletion(item)
        if (success) {
          processed.push(item.id)
        } else {
          // Stop on first failure to preserve order
          break
        }
      }

      if (processed.length) {
        await clearQueueItems(processed)
      }
    } catch (error) {
      console.error('Error processing queued account deletions:', error)
    }

    return processed
  }

  return {
    deleteAccount,
    isDeleting: readonly(isDeleting),
    cleanupLocalData,
    processQueuedDeletion,
    processQueuedDeletionsForUser
  }
}
