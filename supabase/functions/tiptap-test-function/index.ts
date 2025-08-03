import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { generateHTML } from 'https://esm.sh/@tiptap/core@2.4.0'
import { generateJSON } from 'https://esm.sh/@tiptap/html@2.4.0'
import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2.4.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { note } = await req.json()

    const extensions = [StarterKit];
    const html = generateHTML(note.content, extensions);
    const json = generateJSON(html, extensions);

    return new Response(JSON.stringify({ html, json }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
