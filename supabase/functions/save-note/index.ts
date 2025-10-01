import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5.2.1'
import sanitizeHtml from 'npm:sanitize-html'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const publishableKey = Deno.env.get('EDGE_SUPABASE_PUBLISHABLE_KEY') ?? ''

// Configure allowed origins from environment variable
// Format: comma-separated list, e.g., "https://example.com,https://app.example.com,http://localhost:3000"
const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS') ?? ''
const allowedOrigins = allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean)

// Fallback to localhost for development if no origins configured
const nodeEnv = Deno.env.get('NODE_ENV') ?? 'development'
if (allowedOrigins.length === 0 && nodeEnv === 'development') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:4173')
}

// Helper function to get CORS headers based on request origin
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') ?? ''
  const isAllowed = allowedOrigins.includes(origin)
  
  return {
    // If the origin is not allowed, set to 'null' to explicitly disallow credentials for disallowed origins.
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  }
}

if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
  console.error('Missing required environment variables for save-note function.')
  throw new Error('Configuration error')
}

const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl)
const jwksClient = createRemoteJWKSet(jwksUrl)

// Validation constants
const TITLE_MAX_LENGTH = 255
const CONTENT_MAX_LENGTH = 100000 // Including HTML tags (10x the visible char limit for markup overhead)
const TITLE_MIN_LENGTH = 1

// Helper function to validate note input
function validateNoteInput(note: any): { valid: boolean; error?: string } {
  // Check if note object exists
  if (!note || typeof note !== 'object') {
    return { valid: false, error: 'Invalid note data provided' }
  }

  // Validate title
  if (!note.title || typeof note.title !== 'string') {
    return { valid: false, error: 'Title is required and must be a string' }
  }

  const trimmedTitle = note.title.trim()
  if (trimmedTitle.length < TITLE_MIN_LENGTH) {
    return { valid: false, error: 'Title cannot be empty' }
  }

  if (trimmedTitle.length > TITLE_MAX_LENGTH) {
    return { valid: false, error: `Title cannot exceed ${TITLE_MAX_LENGTH} characters` }
  }

  // Validate content
  if (note.content === undefined || note.content === null) {
    return { valid: false, error: 'Content is required' }
  }

  if (typeof note.content !== 'string') {
    return { valid: false, error: 'Content must be a string' }
  }

  if (note.content.length > CONTENT_MAX_LENGTH) {
    return { valid: false, error: `Content cannot exceed ${CONTENT_MAX_LENGTH} characters` }
  }

  // Validate id if present (should be UUID or null)
  if (note.id !== null && note.id !== undefined) {
    if (typeof note.id !== 'string') {
      return { valid: false, error: 'Note ID must be a string or null' }
    }
    // Basic UUID format check (loose validation)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(note.id)) {
      return { valid: false, error: 'Invalid note ID format' }
    }
  }

  return { valid: true }
}

async function verifyRequest(req: Request) {
  const apiKeyHeader = req.headers.get('apikey')
  if (!apiKeyHeader || apiKeyHeader !== publishableKey) {
    throw new Error('Unauthorized')
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authHeader.substring('Bearer '.length).trim()
  try {
    const { payload } = await jwtVerify(token, jwksClient, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    })

    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new Error('Unauthorized')
    }

    return {
      userId: payload.sub,
      role: payload.role,
      jwt: token,
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    throw new Error('Unauthorized')
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const { userId } = await verifyRequest(req)

    // Create Supabase client for database operations (using service role for RLS bypass if needed)
    const supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    )

    // 3. Get note from request body
    const { note } = await req.json()
    
    // 4. Validate input
    const validation = validateNoteInput(note)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // 5. Sanitize both title and content
    // Title: strip all HTML tags
    const cleanTitle = sanitizeHtml(note.title.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    })

    // Content: allow rich text formatting tags
    const cleanHtml = sanitizeHtml(note.content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'strong', 'em', 's']),
      allowedAttributes: {},
    })

    // 6. Prepare data for saving
    const noteToSave = {
      id: note.id, // Pass the ID for upsert
      title: cleanTitle,
      content: cleanHtml,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    
    // If it's a new note, don't include the null ID
    if (!noteToSave.id) {
      delete noteToSave.id;
    }

    // 7. Save using the user-scoped client (RLS enforced)
    let savedNote;
    let error;
    if (noteToSave.id) {
      // Update existing note owned by the user
      const updateResult = await supabaseClient
        .from('notes')
        .update({
          title: noteToSave.title,
          content: noteToSave.content,
          updated_at: noteToSave.updated_at,
        })
        .eq('id', noteToSave.id)
        .eq('user_id', userId)
        .select()
        .single();
      savedNote = updateResult.data;
      error = updateResult.error;
    } else {
      // Insert new note for the user
      const insertResult = await supabaseClient
        .from('notes')
        .insert({
          title: noteToSave.title,
          content: noteToSave.content,
          user_id: userId,
          updated_at: noteToSave.updated_at,
        })
        .select()
        .single();
      savedNote = insertResult.data;
      error = insertResult.error;
    }

    if (error) {
      throw new Error(error.message);
    }

    // 8. Return the saved note
    return new Response(JSON.stringify(savedNote), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    const error = err as Error;
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message === 'Unauthorized' ? 401 : 400,
    })
  }
})
