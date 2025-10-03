# Security Setup Guide

This document covers security-related configuration for the High Notes application.

## CORS Configuration for Edge Functions

As of the latest security update, edge functions now enforce strict CORS origin validation to prevent unauthorized cross-origin requests.

### Setting Up Allowed Origins

The edge functions (`save-note` and `delete-account`) require the `ALLOWED_ORIGINS` environment variable to be configured.

#### Format
Comma-separated list of allowed origins (no spaces around commas):

```bash
https://your-production-domain.com,https://www.your-production-domain.com,http://localhost:3000
```

#### Local Development

For local development, if `ALLOWED_ORIGINS` is not set, the functions automatically allow:
- `http://localhost:3000` (Nuxt dev server)
- `http://localhost:4173` (Vite preview server)

#### Production Setup

**Via Supabase CLI:**

```bash
# Set the allowed origins for your production environment
supabase secrets set ALLOWED_ORIGINS="https://your-domain.com,https://www.your-domain.com"

# Verify the secret was set
supabase secrets list
```

**Via Supabase Dashboard:**

1. Go to your project in Supabase Dashboard
2. Navigate to **Edge Functions** → **Manage secrets**
3. Add a new secret:
   - Key: `ALLOWED_ORIGINS`
   - Value: `https://your-domain.com,https://www.your-domain.com`
4. Click **Save**

**Important:** After setting the secret, you need to redeploy your edge functions:

```bash
supabase functions deploy save-note
supabase functions deploy delete-account
```

### Testing CORS Configuration

You can test CORS by making a request from your browser console:

```javascript
fetch('https://your-project.supabase.co/functions/v1/save-note', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://your-domain.com'
  }
})
.then(response => {
  console.log('CORS headers:', response.headers.get('Access-Control-Allow-Origin'))
})
```

Expected result: The `Access-Control-Allow-Origin` header should match your domain.

## Other Security Configurations

### Environment Variables Checklist

Ensure all required secrets are configured:

- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Server secret key (edge functions only). When using the new Supabase JWT signing keys, copy the `SECRET_KEY` value emitted by `pnpx supabase status -o env` into this variable locally.
- ✅ `EDGE_SUPABASE_PUBLISHABLE_KEY` - Publishable/anon key (must match frontend; local dev falls back to `SUPABASE_ANON_KEY` if unset)
- ✅ `ALLOWED_ORIGINS` - Comma-separated allowed CORS origins

### Row Level Security (RLS)

All database tables have RLS enabled with user-scoped policies. No additional configuration needed.

### Rate Limiting

Authentication rate limits are configured in `supabase/config.toml`:
- Sign-in/Sign-up: 30 requests per 5 minutes per IP
- Token refresh: 150 per 5 minutes per IP
- Email OTP: 2 per hour

To modify, edit the `[auth.rate_limit]` section in `supabase/config.toml` and apply with:

```bash
supabase db push
```

## Deployment Checklist

Before deploying to production:

1. ✅ Set `ALLOWED_ORIGINS` environment variable in Supabase
2. ✅ Ensure `EDGE_SUPABASE_PUBLISHABLE_KEY` matches your frontend configuration
3. ✅ Verify RLS policies are enabled on all tables
4. ✅ Test CORS from your production domain
5. ✅ Monitor edge function logs for unauthorized access attempts

## Troubleshooting

### CORS Errors in Production

**Symptom:** Browser shows "CORS policy" errors

**Solutions:**
1. Verify `ALLOWED_ORIGINS` is set correctly (no trailing slashes, correct protocol)
2. Ensure your domain matches exactly (including `www` subdomain if applicable)
3. Check edge function logs: `supabase functions logs save-note`
4. Verify functions were redeployed after setting the secret

### Local Development CORS Issues

**Symptom:** CORS errors when testing locally

**Solutions:**
1. Make sure you're accessing via `http://localhost:3000` (not `127.0.0.1`)
2. If using a custom port, add it to `ALLOWED_ORIGINS`
3. Check that edge functions are running locally: `supabase functions serve`

## Security Best Practices

1. **Never commit secrets** to version control (`.env` is in `.gitignore`)
2. **Rotate keys regularly** - especially service role keys
3. **Monitor logs** for suspicious activity
4. **Use HTTPS only** in production (HTTP only for localhost)
5. **Keep dependencies updated** - run `pnpm update` regularly

## Reporting Security Issues

If you discover a security vulnerability, please report it privately to the maintainers rather than creating a public issue.
