import { useOnline } from '@vueuse/core'
import { useToast } from '#imports'
import type { Note } from '~/types'
import type { Database } from '~/types/database.types'

export function useNotesPrefetch() {
  const isClient = typeof window !== 'undefined'
  const online = useOnline()
  const client = useSupabaseClient<Database>()
  const toast = useToast()

  // Reuse offline cache helpers
  const { getCachedNotes, cacheNote } = useOfflineNotes()

  // Global status so any component (e.g., header) can render an indicator
  const status = useState('notes_prefetch_status', () => ({
    active: false,
    done: 0,
    total: 0,
    error: null as string | null,
  }))

  // Prevent duplicate concurrent runs and re-runs per user session
  const inFlight = useState('notes_prefetch_inflight', () => false)
  const startedUsers = useState<string[]>('notes_prefetch_started_users', () => [])

  const prefetchForUser = async (uid: string, limit = 100) => {
    if (!isClient || !online.value || !uid) return
    if (inFlight.value) return
    if (startedUsers.value.includes(uid)) return

    inFlight.value = true
    status.value = { active: true, done: 0, total: 0, error: null }

    try {
      // Get top N note ids to consider for prefetch
      const { data: list, error } = await client
        .from('notes')
        .select('id, user_id, updated_at')
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      const ids = (list || []).map(n => n.id)

      // Determine which of those already have content cached
      const cached = await getCachedNotes(uid)
      const cachedWithContent = new Set<string>(
        cached
          .filter(n => typeof n.content === 'string' && (n.content as string).length > 0)
          .map(n => n.id!)
      )

      const toFetch = ids.filter(id => !cachedWithContent.has(id))
      status.value.total = toFetch.length

      // Batch fetch full notes to reduce request volume
      const chunkSize = 20
      for (let i = 0; i < toFetch.length; i += chunkSize) {
        const chunk = toFetch.slice(i, i + chunkSize)
        const { data: full, error: fetchErr } = await client
          .from('notes')
          .select('*')
          .in('id', chunk)
          .eq('user_id', uid)
        if (fetchErr) throw fetchErr

        for (const note of full || []) {
          await cacheNote(note as Note)
        }
        status.value.done += (full || []).length

        // Yield to UI thread
        await new Promise(r => setTimeout(r, 0))
      }
    } catch (e: any) {
      status.value.error = e?.message || String(e)
    } finally {
      const hadError = !!status.value.error
      const total = status.value.total
      const done = status.value.done
      status.value.active = false
      inFlight.value = false
      if (!startedUsers.value.includes(uid)) startedUsers.value.push(uid)
      if (hadError) {
        toast.add({
          title: 'Prefetch failed',
          description: status.value.error || 'Unable to cache notes for offline use',
          color: 'error',
          icon: 'i-lucide-alert-triangle',
          duration: 4000,
        })
  }
    }
  }

  return { status, prefetchForUser }
}
