# Account Deletion Feature Documentation

## Overview
The account deletion feature allows users to permanently delete their account and all associated data from the High Notes application. This feature implements secure deletion with offline support and proper data cleanup.

## Implementation

### Components
- **Settings Page** (`app/pages/settings.vue`): User interface for account management
- **Account Deletion Composable** (`app/composables/useAccountDeletion.ts`): Core deletion logic
- **Supabase Edge Function** (`supabase/functions/delete-account/index.ts`): Server-side deletion processing

### Features
1. **Secure Confirmation**: Requires typing "DELETE_MY_ACCOUNT" to confirm
2. **Offline Support**: Queues deletion operations when offline
3. **Complete Data Removal**: Deletes all user notes and account data
4. **Realtime Cleanup**: Unsubscribes from realtime channels
5. **Local Data Cleanup**: Clears IndexedDB cache and queue
6. **Error Handling**: Graceful handling of network and server errors

### Security Measures
- Requires authenticated user
- Validates confirmation phrase
- Uses Supabase admin client for secure deletion
- Proper CORS handling in edge function

### Offline Behavior
When offline, the deletion request is queued and processed when connectivity is restored. The user receives appropriate feedback about the queued operation.

### Testing
- Contract tests verify API behavior
- Integration tests cover user scenarios
- Unit tests validate composable functionality
- Manual testing via settings page

## Usage

1. User navigates to Settings page (via user menu)
2. Clicks "Delete Account" in the Danger Zone
3. Types "DELETE_MY_ACCOUNT" in confirmation dialog
4. Confirms deletion
5. Account and all data are permanently deleted
6. User is logged out and redirected to login page

## Technical Notes

- Edge function uses Supabase admin client for user deletion
- Cascade deletion removes all user notes
- Local cleanup prevents data leakage
- Queue processing handles offline scenarios
- Realtime unsubscription prevents memory leaks
