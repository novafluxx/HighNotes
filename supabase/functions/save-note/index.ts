import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import sanitizeHtml from 'npm:sanitize-html'; // Using sanitize-html

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // 1. Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // 2. Get the user
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized');
    }

    // 3. Get note from request body
    const { note } = await req.json()
    if (!note) {
      throw new Error('Invalid note data provided.');
    }

    // 4. Handle encrypted vs non-encrypted notes
    let noteToSave;
    
    if (note.is_encrypted) {
      // For encrypted notes: validate encrypted_payload and clear plaintext fields
      if (!note.encrypted_payload) {
        throw new Error('Encrypted notes must include encrypted_payload.');
      }
      
      noteToSave = {
        id: note.id,
        title: '', // Clear title for encrypted notes
        content: '', // Clear content for encrypted notes  
        is_encrypted: true,
        encrypted_payload: note.encrypted_payload,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
    } else {
      // For non-encrypted notes: validate and sanitize content
      if (!note.content || !note.title) {
        throw new Error('Non-encrypted notes must include title and content.');
      }
      
      // Sanitize the content
      const cleanHtml = sanitizeHtml(note.content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'strong', 'em', 's']),
        allowedAttributes: {},
      });

      noteToSave = {
        id: note.id,
        title: note.title,
        content: cleanHtml,
        is_encrypted: false,
        encrypted_payload: null, // Clear encrypted payload for non-encrypted notes
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
    }
    // 5. If it's a new note, don't include the null ID
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
          is_encrypted: noteToSave.is_encrypted,
          encrypted_payload: noteToSave.encrypted_payload,
          updated_at: noteToSave.updated_at,
        })
        .eq('id', noteToSave.id)
        .eq('user_id', user.id)
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
          is_encrypted: noteToSave.is_encrypted,
          encrypted_payload: noteToSave.encrypted_payload,
          user_id: user.id,
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
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: err.message === 'Unauthorized' ? 401 : 400,
    })
  }
})
