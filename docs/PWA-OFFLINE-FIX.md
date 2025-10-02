# PWA Offline Support - Testing Guide

## Issues Fixed

### 1. ✅ Service Worker Registration
**Problem**: No code was registering the service worker.
**Solution**: Added `PwaReloadPrompt.vue` component with `useRegisterSW` from `virtual:pwa-register/vue`.

### 2. ✅ Navigate Fallback
**Problem**: Missing `navigateFallback` caused offline navigation to fail.
**Solution**: Added `navigateFallback: '/'` to workbox config.

### 3. ✅ HTML Precaching
**Problem**: HTML files were excluded from precaching.
**Solution**: Updated `globPatterns` to include `**/*.{js,css,html,ico,png,svg,woff,woff2}`.

### 4. ✅ Auto-Update Configuration
**Problem**: Missing explicit `clientsClaim` and `skipWaiting` settings.
**Solution**: Added both settings to ensure proper auto-update behavior.

### 5. ✅ Runtime Caching
**Problem**: Important routes like `/notes` and `/settings` weren't cached.
**Solution**: Extended runtime caching patterns to include all app routes.

## Testing Offline Support

### Method 1: Chrome DevTools (Recommended for Development)

1. **Build the app**:
   ```bash
   pnpm build
   pnpm preview
   ```

2. **Open Chrome DevTools** (F12)

3. **Go to Application tab** → Service Workers
   - Verify "Service Worker" is registered
   - Status should be "activated and running"

4. **Test Offline**:
   - Check "Offline" checkbox in Service Workers panel
   - OR go to Network tab → Select "Offline" from throttling dropdown
   - Refresh the page
   - Navigate between routes (/, /notes, /settings)
   - ✅ App should work without network

5. **Clear cache** (if testing again):
   - Application tab → Storage → "Clear site data"

### Method 2: Physical Phone - Airplane Mode

1. **Deploy to production** (Netlify, Vercel, etc.) or use your local network:
   ```bash
   pnpm build
   pnpm preview --host
   ```
   Note the local IP (e.g., http://192.168.1.x:3000)

2. **Visit from phone** (first time with internet):
   - Open browser on phone
   - Visit your deployed URL or local IP
   - Wait for "App ready to work offline" notification
   - This confirms service worker is installed

3. **Test offline**:
   - Enable Airplane Mode on phone
   - Close and reopen browser tab (or app if installed as PWA)
   - ✅ App should load and work completely offline

4. **Test PWA Install** (optional):
   - Before going offline, tap browser menu → "Add to Home Screen"
   - Install the PWA
   - Enable Airplane Mode
   - Open PWA from home screen
   - ✅ Should launch and work offline

### Method 3: Firefox DevTools

1. Build and preview: `pnpm build && pnpm preview`
2. Open DevTools (F12) → Network tab
3. Click "No Throttling" → Select "Offline"
4. Refresh page
5. ✅ App should load offline

### Method 4: Lighthouse PWA Audit

1. Build and preview: `pnpm build && pnpm preview`
2. Open Chrome DevTools → Lighthouse tab
3. Select "Progressive Web App" category
4. Click "Analyze page load"
5. Check results:
   - ✅ "Works offline" should pass
   - ✅ "Installable" should pass
   - ✅ Service worker should be registered

## What You Should See

### ✅ First Visit (Online)
- App loads normally
- After a few seconds: **"App ready to work offline"** notification appears
- Service worker is registered and active

### ✅ Subsequent Visits (Offline)
- Enable offline mode
- Navigate to `/` → Works
- Navigate to `/notes` → Works
- Navigate to `/settings` → Works
- IndexedDB data loads (your notes persist)
- All UI icons and assets load

### ✅ Update Scenario (Online)
- When a new version is deployed
- User visits the site
- **"New content available, click reload to update"** notification appears
- Click "Reload" → App updates to new version

## Common Issues & Solutions

### Issue: "Service Worker registration failed"
**Solution**: Make sure you're testing in production build (`pnpm build && pnpm preview`). Service workers don't always work in dev mode.

### Issue: App loads but shows blank page offline
**Solution**: HTML wasn't precached. Check that `globPatterns` includes `html`.

### Issue: Can't navigate between routes offline
**Solution**: `navigateFallback` is missing or incorrect. Should be set to `'/'`.

### Issue: "App ready to work offline" never appears
**Solution**: 
1. Service worker registration failed - check console for errors
2. Clear cache and try again: DevTools → Application → Clear storage
3. Ensure you're on HTTPS (or localhost) - service workers require secure context

### Issue: Old content shows up even after update
**Solution**: 
1. `clientsClaim: true` and `skipWaiting: true` should be set
2. User needs to click "Reload" when update notification appears
3. Or close all tabs and reopen

## Architecture Notes

### Service Worker Registration Flow
1. App loads → `PwaReloadPrompt.vue` mounts
2. Component calls `useRegisterSW()` which registers the service worker
3. Service worker downloads and installs
4. On successful install → `onOfflineReady` fires → Show notification
5. On subsequent visits → Service worker intercepts requests
6. If network available → NetworkFirst strategy (fetch, fallback to cache)
7. If offline → Serve from cache

### Cache Strategy
- **Precache**: Static assets (JS, CSS, HTML, icons) - cached during install
- **Runtime cache**: Dynamic routes - cached on first visit using NetworkFirst
- **Offline storage**: Note data stored in IndexedDB (separate from PWA cache)

## Debugging Tips

1. **Check Service Worker Status**:
   ```javascript
   // Run in browser console
   navigator.serviceWorker.getRegistrations().then(registrations => {
     console.log('Registered service workers:', registrations)
   }).catch(error => {
     console.error('Error fetching service worker registrations:', error)
   })
   ```

2. **Check Cache Contents**:
   - DevTools → Application → Cache Storage
   - Should see: `workbox-precache-v2`, `pages-cache`, `public-pages-cache`

3. **Force Update**:
   - DevTools → Application → Service Workers → Click "Update"
   - Or unregister and refresh

4. **View Console Logs**:
   - Service worker logs: DevTools → Application → Service Workers → Click "console"
   - App logs: Regular console

## Performance Notes

### Why HTML is Now Precached
The original comment said "avoid html to reduce install time" but this caused the offline navigation to fail. The trade-off:
- ✅ **Pros**: App works completely offline, faster subsequent loads
- ⚠️ **Cons**: Slightly larger initial service worker install (~5-20KB for HTML)

For a note-taking app, working offline is critical, so the trade-off is worth it.

### Optimization Done
- Precache only essential file types
- Runtime caching with expiration (24 hours)
- Cache size limits (10-20 entries per cache)
- `cleanupOutdatedCaches: true` removes old versions

## Next Steps

1. **Test now**: Build and test with one of the methods above
2. **Deploy**: Push to production (service workers require HTTPS)
3. **Monitor**: Check if users see the "offline ready" notification
4. **Iterate**: Adjust cache strategies based on user behavior

## Resources

- [Vite PWA Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Docs](https://developers.google.com/web/tools/workbox)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
