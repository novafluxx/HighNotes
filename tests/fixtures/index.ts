// Export all test fixtures and utilities
export * from './users'
export * from './notes'
export * from './database-states'

// Re-export commonly used items for convenience
export { testUsers, testSessions, createTestUser, createTestSession } from './users'
export { testNotes, createTestNote, sampleNoteContent, searchScenarios } from './notes'
export { databaseStates, createDatabaseState, seedDatabaseWithState } from './database-states'

// Default export with all fixtures organized
import usersDefault from './users'
import notesDefault from './notes'
import databaseStatesDefault from './database-states'

export default {
  users: usersDefault,
  notes: notesDefault,
  databaseStates: databaseStatesDefault
}