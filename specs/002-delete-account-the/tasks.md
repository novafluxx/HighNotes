# Tasks: delete-account

**Input**: Design documents from `/specs/002-delete-account-the/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `app/` for frontend, `supabase/functions/` for backend
- Adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Verify project dependencies and add any required packages for account deletion
- [ ] T002 [P] Configure TypeScript types for account deletion operations

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T003 [P] Contract test for POST /auth/delete-account in tests/contract/test_delete_account.spec.ts
- [ ] T004 [P] Integration test for successful account deletion in tests/integration/test_delete_account_success.spec.ts
- [ ] T005 [P] Integration test for deletion cancellation in tests/integration/test_delete_account_cancel.spec.ts
- [ ] T006 [P] Integration test for offline deletion queue in tests/integration/test_delete_account_offline.spec.ts
- [ ] T007 [P] Integration test for deletion failure handling in tests/integration/test_delete_account_failure.spec.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T008 Create account settings page in app/pages/settings.vue
- [ ] T009 Add delete account button and confirmation dialog to app/pages/settings.vue
- [ ] T010 Implement account deletion composable in app/composables/useAccountDeletion.ts
- [ ] T011 Add offline deletion queue handling in app/composables/useOfflineNotes.ts
- [ ] T012 Create Supabase edge function for account deletion in supabase/functions/delete-account/index.ts
- [ ] T013 Update realtime subscription cleanup in app/composables/useNotes.ts

## Phase 3.4: Integration
- [ ] T014 Connect account deletion to Supabase auth.admin.deleteUser()
- [ ] T015 Implement cascade data deletion for user notes
- [ ] T016 Add error handling and user feedback
- [ ] T017 Update PWA offline handling for account deletion

## Phase 3.5: Polish
- [ ] T018 [P] Unit tests for account deletion composable in tests/unit/test_useAccountDeletion.spec.ts
- [ ] T019 [P] Unit tests for offline queue deletion in tests/unit/test_offline_deletion.spec.ts
- [ ] T020 Performance tests for deletion operation
- [ ] T021 Update documentation for account deletion feature
- [ ] T022 Run quickstart.md validation scenarios

## Dependencies
- Tests (T003-T007) before implementation (T008-T017)
- T008 blocks T009
- T010 blocks T011, T014
- T012 blocks T014
- Implementation before polish (T018-T022)

## Parallel Example
```
# Launch T003-T007 together:
Task: "Contract test for POST /auth/delete-account in tests/contract/test_delete_account.spec.ts"
Task: "Integration test for successful account deletion in tests/integration/test_delete_account_success.spec.ts"
Task: "Integration test for deletion cancellation in tests/integration/test_delete_account_cancel.spec.ts"
Task: "Integration test for offline deletion queue in tests/integration/test_delete_account_offline.spec.ts"
Task: "Integration test for deletion failure handling in tests/integration/test_delete_account_failure.spec.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task</content>
<parameter name="filePath">/Users/novafluxx/Documents/Projects/HighNotes/specs/002-delete-account-the/tasks.md
