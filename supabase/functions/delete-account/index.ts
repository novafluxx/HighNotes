import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5.2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const publishableKey = Deno.env.get('EDGE_SUPABASE_PUBLISHABLE_KEY') ?? ''

if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
  console.error('Missing required environment variables for delete-account function.')
  throw new Error('Configuration error')
}

const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl)
const jwksClient = createRemoteJWKSet(jwksUrl)

function unauthorizedResponse(message = 'Authentication required') {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
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
      jwt: token,
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    throw new Error('Unauthorized')
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId } = await verifyRequest(req)

    // Use admin client for database operations (RLS bypass needed for deletion)
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body
    const { confirmation } = await req.json()

    // Validate confirmation phrase
    if (confirmation !== 'DELETE') {
      return new Response(
        JSON.stringify({ error: 'Invalid confirmation phrase' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete all user notes first (cascade)
    const { error: notesError } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('user_id', userId)

    if (notesError) {
      console.error('Error deleting user notes:', notesError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete the user account using admin client
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('Error deleting user account:', deleteUserError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete account' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account and all data deleted successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in delete-account function:', error)
    if ((error as Error).message === 'Unauthorized') {
      return unauthorizedResponse()
    }

    return new Response(
      JSON.stringify({ error: 'Failed to delete account' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
