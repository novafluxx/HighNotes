import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5.2.1'
import sanitizeHtml from 'npm:sanitize-html'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const publishableKey = Deno.env.get('EDGE_SUPABASE_PUBLISHABLE_KEY') ?? ''

if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
  console.error('Missing required environment variables for save-note function.')
  throw new Error('Configuration error')
}

const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl)
const jwksClient = createRemoteJWKSet(jwksUrl)

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
    if (!note || !note.content || !note.title) {
      throw new Error('Invalid note data provided.');
    }

    // 4. Sanitize the content
    const cleanHtml = sanitizeHtml(note.content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'strong', 'em', 's']),
      allowedAttributes: {},
    });

    // 5. Prepare data for saving
    const noteToSave = {
      id: note.id, // Pass the ID for upsert
      title: note.title,
      content: cleanHtml,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    
    // If it's a new note, don't include the null ID
    if (!noteToSave.id) {
      delete noteToSave.id;
    }

    // 6. Save using the user-scoped client (RLS enforced)
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

    // 7. Return the saved note
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
