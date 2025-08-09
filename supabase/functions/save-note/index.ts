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
      user_id: user.id,
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
