---
inclusion: always
---

# Project Structure & Development Patterns

## File Organization & Naming
- **Pages**: `app/pages/kebab-case.vue` (matches URL structure)
- **Components**: `app/components/PascalCase.vue` (e.g., `NoteEditor.vue`)
- **Composables**: `app/composables/useFeatureName.ts` (camelCase with `use` prefix)
- **Types**: Supabase types in `types/database.types.ts`, global types in `types.ts`
- **Constants**: Use `SCREAMING_SNAKE_CASE` for constants

## Code Structure Patterns

### Vue Component Template
```vue
<template>
  <UCard>
    <template #header><h2>{{ title }}</h2></template>
    <!-- Always prefer Nuxt UI components -->
  </UCard>
</template>

<script setup lang="ts">
// Order: imports → props/emits → state → computed → methods → lifecycle
</script>
```

### Composable Pattern
```typescript
export const useFeature = () => {
  const state = ref()
  const loading = ref(false)
  
  return {
    state: readonly(state),
    loading: readonly(loading),
    // methods
  }
}
```

## Import & Type Conventions
- **Auto-imported**: Vue composables, Nuxt utilities, app components
- **Manual imports**: External libraries, specific utilities
- **Database types**: `import type { Database } from '~/types/database.types'`
- **App imports**: Always use `~/` prefix for app directory
- **Type imports**: Use `import type { }` for better tree-shaking

## Authentication & Security
- **Protected pages**: Add `definePageMeta({ middleware: 'auth' })`
- **Auth state**: Access only via `useAuth()` composable
- **User data isolation**: ALWAYS filter queries by authenticated `user_id`
- **Database queries**: Use generated Supabase types for type safety

## UI Component Standards
- **Priority**: Nuxt UI components > custom components
- **Icons**: Use `UIcon` with Heroicons or Lucide icon sets
- **Forms**: Use `UForm` with validation schemas
- **States**: Always show loading indicators and handle errors gracefully

## Development Workflow
1. **Create composable** for business logic first
2. **Define types** before implementation
3. **Build UI** with Nuxt UI components
4. **Add authentication** middleware if needed
5. **Test offline functionality** for PWA compliance
6. **Ensure user data isolation** in all database operations