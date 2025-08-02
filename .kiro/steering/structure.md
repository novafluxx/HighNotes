---
inclusion: always
---

# Project Structure & Development Patterns

## File Organization Rules
- **New pages**: Create in `app/pages/` using kebab-case (e.g., `user-profile.vue`)
- **New components**: Create in `app/components/` using PascalCase (e.g., `NoteEditor.vue`)
- **New composables**: Create in `app/composables/` with `use` prefix (e.g., `useNoteEditor.ts`)
- **Types**: Add to `types/database.types.ts` (Supabase) or `types.ts` (global)

## Code Architecture Patterns

### Component Structure
```vue
<template>
  <!-- Use Nuxt UI components when possible -->
  <UCard>
    <template #header>
      <h2>{{ title }}</h2>
    </template>
    <!-- Content -->
  </UCard>
</template>

<script setup lang="ts">
// 1. Imports (composables auto-imported)
// 2. Props/emits definitions
// 3. Reactive state
// 4. Computed properties
// 5. Methods/functions
// 6. Lifecycle hooks
</script>
```

### Composable Pattern
```typescript
// app/composables/useFeature.ts
export const useFeature = () => {
  const state = ref()
  const loading = ref(false)
  
  const fetchData = async () => {
    loading.value = true
    // Implementation
    loading.value = false
  }
  
  return {
    state: readonly(state),
    loading: readonly(loading),
    fetchData
  }
}
```

## Import Conventions
- **Auto-imported**: Composables, components, Nuxt utilities
- **Manual imports**: External libraries, specific utilities
- **Database types**: `import type { Database } from '~/types/database.types'`
- **App directory**: Use `~/` prefix for all imports

## Authentication Patterns
- **Protected pages**: Use `definePageMeta({ middleware: 'auth' })`
- **Public pages**: No middleware required
- **Auth state**: Access via `useAuth()` composable
- **User data**: Always scope queries to authenticated user ID

## Database Integration
- **Type safety**: Use generated Supabase types for all queries
- **Real-time**: Implement via Supabase subscriptions in composables
- **Error handling**: Always handle Supabase errors gracefully
- **User isolation**: Filter all queries by `user_id` field

## UI/UX Standards
- **Components**: Prefer Nuxt UI components over custom implementations
- **Icons**: Use `UIcon` with Heroicons or Lucide icon sets
- **Forms**: Use `UForm` with validation schemas
- **Loading states**: Show loading indicators for async operations
- **Error states**: Display user-friendly error messages

## File Naming Rules
- **Pages**: `kebab-case.vue` (matches URL structure)
- **Components**: `PascalCase.vue` (e.g., `UserProfile.vue`)
- **Composables**: `camelCase.ts` with `use` prefix
- **Types**: `PascalCase` for interfaces, `camelCase` for type aliases
- **Constants**: `SCREAMING_SNAKE_CASE`

## Development Workflow
1. **New features**: Start with composable for business logic
2. **UI components**: Build with Nuxt UI components first
3. **Type safety**: Define types before implementation
4. **Testing**: Test composables and critical user flows
5. **PWA**: Ensure offline functionality for core features