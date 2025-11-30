# 🚀 Migration Plan: Supabase → Cloudflare D1 + Auth (2025)

**Status:** Research Complete ✅
**Last Updated:** November 30, 2025
**Estimated Timeline:** 10-18 days
**Estimated Cost:** $0-5/mo (vs $0-25/mo for Supabase)

---

## 📊 Executive Summary

### Current Stack
- **Framework:** Nuxt 4.2.1 (SSR + PWA)
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth (email/password)
- **Real-time:** Supabase Realtime (WebSocket subscriptions)
- **Edge Functions:** Supabase Edge Functions (Deno)
- **Offline:** IndexedDB with queue-based sync

### Target Stack
- **Database:** Cloudflare D1 (SQLite) with Drizzle ORM
- **Auth:** nuxt-auth-utils (recommended) OR Better Auth
- **Real-time:** Polling (simple) OR PartyKit/Durable Objects (advanced)
- **Edge Functions:** Nuxt Server Routes (Nitro on Cloudflare Workers)
- **Offline:** Keep existing IndexedDB implementation
- **Deployment:** Cloudflare Workers (not Pages)

---

## ⚠️ Important 2025 Updates

Based on comprehensive research, here are critical updates to consider:

1. **✅ D1 FTS5 Supported** - Full-text search works (use lowercase `fts5`)
2. **⚠️ D1 Triggers Buggy** - Work locally but fail on cloud; sync FTS5 manually in app code
3. **⚠️ D1 Free Tier Enforced** - Starting Feb 10, 2025: 5M reads, 100K writes/day
4. **✅ D1 Performance Improved** - 60% faster queries as of January 2025
5. **❌ Lucia Auth Deprecated** - Sunset March 2025, removed from recommendations
6. **✅ nuxt-auth-utils Recommended** - Official Nuxt solution for Cloudflare Workers
7. **✅ PartyKit Acquired** - Now part of Cloudflare ecosystem for real-time
8. **⚠️ NuxtHub Admin Shutting Down** - Dec 31, 2025, use direct Cloudflare deployment
9. **✅ Cloudflare Email Service** - Private beta available for transactional emails
10. **✅ Workers > Pages** - Cloudflare's 2025 direction, use Workers preset

---

## 🎯 Migration Phases

| Phase | Component | Complexity | Estimated Time |
|-------|-----------|------------|----------------|
| 1 | Database Schema (D1 + Drizzle) | Medium | 1-2 days |
| 2 | Authentication (nuxt-auth-utils) | Medium | 2-3 days |
| 3 | CRUD Operations | Medium | 2-3 days |
| 4 | Real-time Sync | Medium | 1-2 days |
| 5 | Full-text Search | Low | 1 day |
| 6 | Offline Sync | Low | 1-2 days |
| 7 | Email Sending | Low | 1 day |
| 8 | Testing & Deployment | Medium | 1-2 days |

**Total:** 10-18 days

---

## 📋 Phase 1: Database Migration

### 1.1 Install Dependencies

```bash
npm install drizzle-orm
npm install -D drizzle-kit
npm install -D @cloudflare/workers-types
```

### 1.2 Create D1 Databases

```bash
# Production database
npx wrangler d1 create high-notes-production

# Development database
npx wrangler d1 create high-notes-dev
```

### 1.3 Configure wrangler.toml

Create `wrangler.toml` in project root:

```toml
name = "high-notes"
main = ".output/server/index.mjs"
compatibility_date = "2025-01-15"

[[d1_databases]]
binding = "DB"
database_name = "high-notes-production"
database_id = "<your-production-db-id>"

[[d1_databases.preview]]
binding = "DB"
database_name = "high-notes-dev"
database_id = "<your-dev-db-id>"
```

### 1.4 Define Schema with Drizzle

Create `/server/database/schema.ts`:

```typescript
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
}))

// Profiles table
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  encryptionSalt: text('encryption_salt'),
  kdfParams: text('kdf_params'),
  hasEncryption: integer('has_encryption', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  keyVerificationPayload: text('key_verification_payload'),
}, (table) => ({
  userIdIdx: index('idx_profiles_user_id').on(table.userId),
}))

// Notes table
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  isEncrypted: integer('is_encrypted', { mode: 'boolean' }).default(false),
  encryptedPayload: text('encrypted_payload'),
}, (table) => ({
  userIdIdx: index('idx_notes_user_id').on(table.userId),
  userUpdatedIdx: index('idx_notes_user_updated').on(table.userId, table.updatedAt),
  isEncryptedIdx: index('idx_notes_is_encrypted').on(table.userId, table.isEncrypted),
}))
```

### 1.5 Full-Text Search Setup

Create `/server/database/fts-schema.sql`:

```sql
-- Full-text search virtual table (lowercase "fts5" required!)
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  note_id UNINDEXED,
  title,
  content
);
```

**⚠️ Important:** D1 triggers are buggy on cloud. Sync FTS5 manually in application code instead.

### 1.6 Database Utility

Create `/server/utils/db.ts`:

```typescript
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

export function useDB() {
  const event = useEvent()
  const db = event.context.cloudflare?.env?.DB

  if (!db) {
    throw createError({ statusCode: 500, message: 'Database not available' })
  }

  return drizzle(db, { schema })
}
```

### 1.7 Update Nuxt Config

Update `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages',
    experimental: {
      asyncContext: true, // Required for useEvent()
    },
  },
})
```

---

## 🔐 Phase 2: Authentication

### 2.1 Install nuxt-auth-utils (Recommended)

```bash
npm install nuxt-auth-utils
npm install @node-rs/argon2
```

**Why nuxt-auth-utils?**
- ✅ Official Nuxt recommendation for Cloudflare Workers
- ✅ Uses encrypted session cookies (no DB needed for sessions)
- ✅ Edge-compatible, actively maintained
- ✅ Simpler than Better Auth or Auth.js

### 2.2 Configure Auth Module

Update `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-auth-utils'],

  runtimeConfig: {
    session: {
      maxAge: 60 * 60, // 1 hour
    },
  },
})
```

### 2.3 Create Auth Endpoints

#### Login: `/server/api/auth/login.post.ts`

```typescript
import { eq } from 'drizzle-orm'
import { users } from '~/server/database/schema'
import { verify } from '@node-rs/argon2'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const db = useDB()
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const validPassword = await verify(user.passwordHash, password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  if (!validPassword) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  await setUserSession(event, {
    user: { id: user.id, email: user.email },
  })

  return { user: { id: user.id, email: user.email } }
})
```

#### Signup: `/server/api/auth/signup.post.ts`

```typescript
import { hash } from '@node-rs/argon2'
import { users, profiles } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const db = useDB()

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })

  const userId = crypto.randomUUID()
  const profileId = crypto.randomUUID()

  await db.batch([
    db.insert(users).values({ id: userId, email, passwordHash }),
    db.insert(profiles).values({ id: profileId, userId, hasEncryption: false }),
  ])

  await setUserSession(event, {
    user: { id: userId, email },
  })

  return { user: { id: userId, email } }
})
```

#### Logout: `/server/api/auth/logout.post.ts`

```typescript
export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { success: true }
})
```

#### Current User: `/server/api/auth/me.get.ts`

```typescript
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  return { user: session.user || null }
})
```

### 2.4 Auth Middleware

Create `/server/middleware/auth.ts`:

```typescript
export default defineEventHandler(async (event) => {
  if (event.path.startsWith('/api/') && !event.path.startsWith('/api/auth/')) {
    const session = await getUserSession(event)

    if (!session.user) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    event.context.user = session.user
  }
})
```

---

## 🔄 Phase 3: CRUD Operations

### 3.1 Fetch Notes

Create `/server/api/notes/index.get.ts`:

```typescript
import { eq, desc, sql } from 'drizzle-orm'
import { notes } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = 30
  const offset = (page - 1) * limit
  const searchQuery = query.search as string | undefined

  const db = useDB()

  if (searchQuery && searchQuery.trim().length >= 3) {
    // FTS5 search
    const searchResults = await db.all(sql`
      SELECT n.id, n.user_id, n.title, n.updated_at
      FROM notes n
      JOIN notes_fts fts ON n.id = fts.note_id
      WHERE n.user_id = ${user.id} AND notes_fts MATCH ${searchQuery.trim()}
      ORDER BY rank
      LIMIT 30
    `)
    return { notes: searchResults }
  }

  // Regular paginated query
  const userNotes = await db
    .select({
      id: notes.id,
      userId: notes.userId,
      title: notes.title,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(eq(notes.userId, user.id))
    .orderBy(desc(notes.updatedAt))
    .limit(limit)
    .offset(offset)

  return { notes: userNotes }
})
```

### 3.2 Save Note

Create `/server/api/notes/save.post.ts`:

```typescript
import { eq, and, sql } from 'drizzle-orm'
import { notes } from '~/server/database/schema'
import sanitizeHtml from 'sanitize-html'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const { note } = await readBody(event)

  const db = useDB()

  // Validation
  if (!note.title || note.title.length > 255) {
    throw createError({ statusCode: 400, message: 'Invalid title' })
  }

  // Sanitize
  const sanitizedTitle = sanitizeHtml(note.title, { allowedTags: [] })
  const sanitizedContent = sanitizeHtml(note.content || '', {
    allowedTags: ['h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'strong', 'em', 's'],
  })

  const now = new Date().toISOString()

  if (note.id) {
    // Update
    await db.update(notes).set({
      title: sanitizedTitle,
      content: sanitizedContent,
      updatedAt: now,
    }).where(and(eq(notes.id, note.id), eq(notes.userId, user.id)))

    // Sync FTS5 manually
    await db.run(sql`
      UPDATE notes_fts
      SET title = ${sanitizedTitle}, content = ${sanitizedContent}
      WHERE note_id = ${note.id}
    `)

    const [updated] = await db.select().from(notes).where(eq(notes.id, note.id)).limit(1)
    return updated
  } else {
    // Create
    const newId = crypto.randomUUID()

    await db.insert(notes).values({
      id: newId,
      userId: user.id,
      title: sanitizedTitle,
      content: sanitizedContent,
      createdAt: now,
      updatedAt: now,
    })

    // Sync FTS5 manually
    await db.run(sql`
      INSERT INTO notes_fts (note_id, title, content)
      VALUES (${newId}, ${sanitizedTitle}, ${sanitizedContent})
    `)

    const [created] = await db.select().from(notes).where(eq(notes.id, newId)).limit(1)
    return created
  }
})
```

### 3.3 Delete Note

Create `/server/api/notes/[id].delete.ts`:

```typescript
import { eq, and, sql } from 'drizzle-orm'
import { notes } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const noteId = getRouterParam(event, 'id')

  const db = useDB()

  // Delete from FTS5 first
  await db.run(sql`DELETE FROM notes_fts WHERE note_id = ${noteId}`)

  // Delete note
  await db.delete(notes).where(and(eq(notes.id, noteId!), eq(notes.userId, user.id)))

  return { success: true }
})
```

---

## ⚡ Phase 4: Real-time Sync

### Option 1: Simple Polling (Recommended for MVP)

Update `/app/composables/useNotes.ts`:

```typescript
let pollInterval: NodeJS.Timeout | null = null

const startPolling = () => {
  if (pollInterval) return

  pollInterval = setInterval(async () => {
    if (!isOnline.value || !user.value) return

    try {
      const lastUpdated = notes.value[0]?.updated_at || new Date(0).toISOString()
      const { notes: latestNotes } = await $fetch('/api/notes', {
        query: { since: lastUpdated },
      })

      latestNotes.forEach((serverNote) => {
        const idx = notes.value.findIndex(n => n.id === serverNote.id)
        if (idx !== -1) {
          if (new Date(serverNote.updated_at) > new Date(notes.value[idx].updated_at)) {
            notes.value[idx] = serverNote
          }
        } else {
          notes.value.unshift(serverNote)
        }
      })
    } catch (error) {
      console.error('Polling error:', error)
    }
  }, 10000) // 10 seconds
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

watch(user, (currentUser) => {
  if (currentUser) startPolling()
  else stopPolling()
}, { immediate: true })

onScopeDispose(() => stopPolling())
```

### Option 2: PartyKit (Advanced Real-time)

PartyKit was acquired by Cloudflare and provides WebSocket-based real-time sync using Durable Objects.

**Pricing:** Very affordable with WebSocket hibernation (~$0.41/month for moderate traffic)

See full implementation in detailed migration guide.

---

## 🔍 Phase 5: Full-Text Search

Already implemented in Phase 3! D1 FTS5 is confirmed working.

**Key Points:**
- ✅ Use lowercase `fts5` when creating virtual tables
- ⚠️ Triggers are buggy - sync manually in application code
- ✅ Performance is excellent

**Query Examples:**

```sql
-- Simple match
SELECT * FROM notes_fts WHERE notes_fts MATCH 'keyword'

-- Phrase match
SELECT * FROM notes_fts WHERE notes_fts MATCH '"exact phrase"'

-- Boolean operators
SELECT * FROM notes_fts WHERE notes_fts MATCH 'word1 AND word2'
```

---

## 🔄 Phase 6: Offline Sync

Update sync queue processor in `/app/composables/useNotes.ts`:

```typescript
const syncPendingQueue = async () => {
  // ... existing logic ...

  if (item.type === 'create' && item.note) {
    const saved = await $fetch('/api/notes/save', {
      method: 'POST',
      body: { note: { ...item.note, id: null } },
    })
    // ... handle ID replacement
  }

  if (item.type === 'update' && item.note) {
    const saved = await $fetch('/api/notes/save', {
      method: 'POST',
      body: { note: item.note },
    })
    // ... handle update
  }

  if (item.type === 'delete' && item.note_id) {
    await $fetch(`/api/notes/${item.note_id}`, { method: 'DELETE' })
    // ... handle deletion
  }
}
```

---

## 📧 Phase 7: Email Sending

### Option 1: Cloudflare Email Service (Recommended)

Cloudflare announced Email Service in September 2025 (currently in private beta).

```toml
# wrangler.toml
[[send_email]]
name = "EMAIL"
```

```typescript
// server/api/auth/reset-password.post.ts
export default defineEventHandler(async (event) => {
  const { EMAIL } = event.context.cloudflare.env

  await EMAIL.send({
    from: 'noreply@yourdomain.com',
    to: user.email,
    subject: 'Reset your password',
    html: '<p>Click here to reset...</p>',
  })
})
```

### Option 2: Resend (Third-party)

```bash
npm install resend
```

Free tier: 100 emails/day

---

## 🧪 Phase 8: Testing & Deployment

### Local Development

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Run local development
npm run dev

# Test with remote D1
npm run dev -- --remote
```

### Deploy to Cloudflare Workers

```bash
# Build
npm run build

# Deploy
wrangler deploy
```

### Environment Variables

```bash
wrangler secret put SESSION_SECRET
wrangler secret put RESEND_API_KEY
```

---

## ⚠️ Key Challenges & Solutions

### 1. D1 Triggers Buggy on Cloud
**Solution:** Sync FTS5 manually in application code instead of triggers

### 2. D1 Foreign Keys Cannot Be Disabled
**Solution:** Use `PRAGMA defer_foreign_keys = ON` for batch operations

### 3. D1 Free Tier Enforcement (Feb 10, 2025)
**Solution:**
- Monitor usage in Cloudflare dashboard
- Optimize queries with indexes and batching
- Upgrade to Workers Paid ($5/mo) if needed

### 4. Batch Operation Limits
**Solution:** SQLite/D1 limits to 100 bound parameters - chunk large batches

### 5. No Row Level Security
**Solution:** Enforce authorization in server middleware

---

## 💰 Cost Comparison

| Service | Supabase | Cloudflare |
|---------|----------|------------|
| **Database** | Free: 500MB<br>Paid: $25/mo | **Free: 5M reads, 100K writes/day**<br>(Enforced Feb 10, 2025) |
| **Auth** | Included | **Free** (nuxt-auth-utils) |
| **Real-time** | Included | **Free** (polling)<br>**~$0.41/mo** (PartyKit) |
| **Functions** | Included | **Free** (Nitro on Workers) |
| **Email** | Not included | **Cloudflare Email Service** (beta)<br>or Resend: 100/day free |
| **Total** | $0-25/mo | **$0-5/mo** |

---

## 📋 Migration Checklist

### Pre-Migration
- [ ] Backup Supabase database
- [ ] Export user data and notes
- [ ] Set up Cloudflare account
- [ ] Create D1 databases (dev + production)

### Database (1-2 days)
- [ ] Install Drizzle ORM
- [ ] Define schema in TypeScript
- [ ] Create FTS5 virtual table
- [ ] Generate and apply migrations
- [ ] Test D1 queries locally

### Authentication (2-3 days)
- [ ] Install nuxt-auth-utils
- [ ] Implement auth endpoints
- [ ] Add password hashing (Argon2)
- [ ] Create auth middleware
- [ ] Test auth flows

### CRUD Operations (2-3 days)
- [ ] Create Nuxt server routes
- [ ] Implement Drizzle queries
- [ ] Add HTML sanitization
- [ ] Manual FTS5 sync
- [ ] Update client composables

### Real-time (1-2 days)
- [ ] Implement polling (10s interval)
- [ ] Test cross-device sync
- [ ] (Optional) Set up PartyKit

### Search (1 day)
- [ ] Test FTS5 queries
- [ ] Verify search accuracy

### Offline Sync (1-2 days)
- [ ] Update queue processor
- [ ] Test offline operations
- [ ] Test sync when online

### Email (1 day)
- [ ] Set up email service
- [ ] Implement password reset
- [ ] Test email delivery

### Deployment (1-2 days)
- [ ] Configure wrangler.toml
- [ ] Set environment variables
- [ ] Deploy to Cloudflare Workers
- [ ] Monitor performance

---

## 📚 Additional Resources

### Documentation
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Drizzle ORM D1 Guide](https://orm.drizzle.team/docs/connect-cloudflare-d1)
- [nuxt-auth-utils](https://github.com/Atinux/nuxt-auth-utils)
- [PartyKit on Cloudflare](https://blog.cloudflare.com/cloudflare-acquires-partykit/)
- [Nuxt Cloudflare Deployment](https://nuxt.com/deploy/cloudflare)

### Community Resources
- [Better Auth Cloudflare Package](https://github.com/zpg6/better-auth-cloudflare)
- [Auth.js D1 Adapter](https://authjs.dev/getting-started/adapters/d1)
- [Migrate from NuxtHub Guide](https://dev.to/dennisadriaans/migrate-from-nuxthub-to-cloudflare-directly-4ncd)

---

## 🎯 Next Steps

1. Review this migration plan with the team
2. Set up Cloudflare account and create D1 databases
3. Begin Phase 1: Database migration
4. Test each phase thoroughly before moving to the next
5. Keep existing Supabase setup running until migration is complete and tested
6. Plan a gradual rollout or feature flag approach for production deployment

---

**Questions or concerns?** Open an issue or discussion in the repository.
