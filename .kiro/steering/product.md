---
inclusion: always
---

# High Notes - Product Guidelines

**High Notes** is a modern note-taking Progressive Web App (PWA) focused on simplicity, security, and cross-platform accessibility.

## Core Design Principles

### Simplicity First
- **Always** prioritize core note-taking functionality over advanced features
- **Never** add complex formatting tools in initial implementations
- **Use** minimal UI elements - prefer single-purpose buttons and clear navigation
- **Avoid** feature bloat - each new feature must serve the core use case

### Privacy by Design
- **Always** scope database queries to authenticated users (`user_id` filtering)
- **Never** expose user data across accounts
- **Implement** secure authentication flows with proper error handling
- **Validate** user permissions on every data operation

### Offline-First Architecture
- **All** core features must function without internet connectivity
- **Implement** optimistic updates with conflict resolution
- **Cache** essential data using service workers
- **Provide** clear offline/online status indicators

## User Experience Standards

### Authentication Flow
- **Required steps**: Sign up → Email confirmation → Login → Dashboard
- **Always** show loading states during authentication
- **Redirect** unauthenticated users to login page
- **Handle** email confirmation gracefully with clear success/error states

### Note Management Patterns
- **Create**: Instant note creation with auto-save
- **Edit**: Real-time sync with conflict resolution
- **Save**: Automatic saving with visual confirmation
- **Delete**: Confirmation dialog for destructive actions

### UI Interaction Rules
- **Immediate feedback**: All user actions must show instant response
- **Loading states**: Use skeleton loaders for content, spinners for actions
- **Error handling**: Show specific, actionable error messages
- **Empty states**: Include clear call-to-action for first-time users
- **Navigation**: Maintain consistent patterns across all pages

## Content & Messaging Guidelines

### UI Text Standards
- **Use** action-oriented language ("Create Note", "Save Changes")
- **Write** concise labels and descriptions
- **Avoid** technical jargon in user-facing text

### Error Messages
- **Be specific**: "Failed to save note" not "Something went wrong"
- **Provide solutions**: Include next steps or retry options
- **Stay helpful**: Avoid blame language

### Success States
- **Confirm actions**: "Note saved successfully"
- **Be celebratory but brief**: Avoid intrusive celebrations
- **Use** subtle animations for positive feedback

## Technical Implementation Requirements

### Data Security
- **Always** filter queries by authenticated user ID
- **Never** expose user data in client-side code
- **Implement** proper RLS (Row Level Security) policies
- **Validate** user permissions server-side

### Performance Standards
- **Target** <3 second initial load time
- **Implement** lazy loading for non-critical components
- **Optimize** images and assets for web delivery
- **Use** efficient database queries with proper indexing

### PWA Implementation
- **Make** installation discoverable but not intrusive
- **Implement** proper service worker caching strategies
- **Handle** offline/online transitions gracefully
- **Provide** native app-like experience on mobile devices

## Feature Development Guidelines

### When Adding New Features
1. **Start** with basic functionality
2. **Test** offline behavior
3. **Ensure** user data isolation
4. **Implement** proper loading/error states
5. **Validate** against core user flows

### What to Avoid
- **Complex formatting tools** in initial implementations
- **Features that require constant internet connection**
- **UI elements that clutter the core note-taking experience**
- **Features that compromise user privacy or data security**