---
inclusion: always
---

# High Notes - Product Guidelines

**High Notes** is a modern note-taking Progressive Web App (PWA) focused on simplicity, security, and cross-platform accessibility.

## Product Principles
- **Simplicity First**: Keep UI clean and focused on core note-taking functionality
- **Privacy by Design**: User data isolation and secure authentication are non-negotiable
- **Offline-First**: All features must work without internet connectivity
- **Progressive Enhancement**: Start with basic functionality, enhance with advanced features

## Core User Flows
1. **Authentication**: Sign up → Email confirmation → Login → Dashboard
2. **Note Management**: Create → Edit → Save → Sync → Archive/Delete
3. **PWA Installation**: Visit → Install prompt → Add to home screen → Offline usage

## Feature Constraints
- Keep note editor simple - avoid complex formatting initially
- Prioritize fast load times and responsive design
- Ensure all user actions provide immediate feedback
- Maintain consistent navigation patterns across all pages

## Content Guidelines
- Use clear, action-oriented language in UI text
- Error messages should be helpful and actionable
- Success states should be celebratory but not intrusive
- Empty states should guide users toward their first action

## Technical Product Requirements
- All user data must be scoped to authenticated users only
- Real-time sync should be transparent to users
- PWA installation should be discoverable but not pushy
- Offline functionality must gracefully handle sync conflicts