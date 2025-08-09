import { openDB, type IDBPDatabase } from 'idb'
import type { Note } from '~/types'

interface QueueItem {
  id: string
  user_id: string
  type: 'create' | 'update' | 'delete'
  note?: Note
  note_id?: string // for delete
  timestamp: number
}

interface DBSchema {
  notes: Note
  queue: QueueItem
}

let dbPromise: Promise<IDBPDatabase<DBSchema>> | null = null

function getDB() {
  if (typeof window === 'undefined') throw new Error('IDB only available in browser')
  if (!dbPromise) {
    dbPromise = openDB<DBSchema>('high-notes', 1, {
      upgrade(db: IDBPDatabase<DBSchema>) {
        if (!db.objectStoreNames.contains('notes')) {
          const notes = db.createObjectStore('notes', { keyPath: 'id' })
          notes.createIndex('by_user', 'user_id', { unique: false })
        }
        if (!db.objectStoreNames.contains('queue')) {
          const queue = db.createObjectStore('queue', { keyPath: 'id' })
          queue.createIndex('by_user', 'user_id', { unique: false })
          queue.createIndex('by_time', 'timestamp', { unique: false })
        }
      }
    })
  }
  return dbPromise!
}

export function useOfflineNotes() {
  const isClient = typeof window !== 'undefined'

  const getCachedNotes = async (userId: string): Promise<Note[]> => {
    if (!isClient) return []
    const db = await getDB()
    const index = db.transaction('notes').store.index('by_user')
    const result: Note[] = []
    let cursor = await index.openCursor(IDBKeyRange.only(userId))
    while (cursor) {
      result.push(cursor.value)
      cursor = await cursor.continue()
    }
    // Sort by updated_at desc to match server behavior
    return result.sort((a, b) => (b.updated_at.localeCompare(a.updated_at)))
  }

  const cacheNotesBulk = async (notes: Note[]) => {
    if (!isClient || !notes?.length) return
    const db = await getDB()
    const tx = db.transaction('notes', 'readwrite')
    for (const n of notes) {
      const plain = JSON.parse(JSON.stringify(n)) as Note
      await tx.store.put(plain)
    }
    await tx.done
  }

  const cacheNote = async (note: Note) => {
    if (!isClient) return
    const db = await getDB()
    const plain = JSON.parse(JSON.stringify(note)) as Note
    await db.put('notes', plain)
  }

  const getCachedNoteById = async (id: string): Promise<Note | undefined> => {
    if (!isClient) return undefined
    const db = await getDB()
    return db.get('notes', id)
  }

  const removeCachedNote = async (id: string) => {
    if (!isClient) return
    const db = await getDB()
    await db.delete('notes', id)
  }

  const enqueue = async (item: QueueItem) => {
    if (!isClient) return
    const db = await getDB()
    const plain = JSON.parse(JSON.stringify(item)) as QueueItem
    await db.put('queue', plain)
  }

  const readQueueFIFO = async (userId: string): Promise<QueueItem[]> => {
    if (!isClient) return []
    const db = await getDB()
    const byTime = db.transaction('queue').store.index('by_time')
    const items: QueueItem[] = []
    let cursor = await byTime.openCursor()
    while (cursor) {
      if (cursor.value.user_id === userId) items.push(cursor.value)
      cursor = await cursor.continue()
    }
    return items
  }

  const clearQueueItems = async (ids: string[]) => {
    if (!isClient || !ids.length) return
    const db = await getDB()
    const tx = db.transaction('queue', 'readwrite')
    for (const id of ids) await tx.store.delete(id)
    await tx.done
  }

  const replaceLocalId = async (oldId: string, newId: string) => {
    if (!isClient) return
    const db = await getDB()
    const note = await db.get('notes', oldId)
    if (note) {
      // Remove old and insert with new id
      await db.delete('notes', oldId)
      note.id = newId
      await db.put('notes', note)
    }
    // Update any queued items that reference the local id
    const items = await readQueueFIFO(note?.user_id || '')
    const tx = db.transaction('queue', 'readwrite')
    for (const item of items) {
      if (item.note && item.note.id === oldId) {
        item.note.id = newId
        await tx.store.put(item)
      }
      if (item.note_id === oldId) {
        item.note_id = newId
        await tx.store.put(item)
      }
    }
    await tx.done
  }

  return {
    getCachedNotes,
    getCachedNoteById,
    cacheNotesBulk,
    cacheNote,
    removeCachedNote,
    enqueue,
    readQueueFIFO,
    clearQueueItems,
    replaceLocalId,
  }
}
