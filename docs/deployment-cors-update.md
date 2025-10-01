# Quick Deployment Commands for CORS Security Update

## 1. Set the ALLOWED_ORIGINS environment variable

Replace `your-domain.com` with your actual production domain(s):

```bash
# Single domain
supabase secrets set ALLOWED_ORIGINS="https://your-domain.com"

# Multiple domains (no spaces!)
supabase secrets set ALLOWED_ORIGINS="https://your-domain.com,https://www.your-domain.com,https://app.your-domain.com"

# Include localhost for testing (optional)
supabase secrets set ALLOWED_ORIGINS="https://your-domain.com,http://localhost:3000"
```

## 2. Deploy the updated edge functions

```bash
# Deploy save-note function
supabase functions deploy save-note --no-verify-jwt

# Deploy delete-account function
supabase functions deploy delete-account --no-verify-jwt
```

## 3. Verify deployment

```bash
# Check that the secret was set
supabase secrets list

# Check function logs
supabase functions logs save-note --tail
supabase functions logs delete-account --tail
```

## 4. Test from your application

Once deployed, test by:
1. Opening your production application
2. Try saving a note
3. Check browser console for any CORS errors

If you see CORS errors, verify:
- The domain in `ALLOWED_ORIGINS` matches exactly (including protocol and subdomain)
- No trailing slashes in the URLs
- Functions were redeployed after setting the secret

## Local Development

For local development, no configuration is needed. The functions automatically allow:
- `http://localhost:3000`
- `http://localhost:4173`

To test locally with custom origins:
```bash
# In your .env file or terminal
export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:4173,http://127.0.0.1:3000"

# Then run Supabase locally
supabase functions serve
```

## Rollback (if needed)

If you need to temporarily allow all origins (NOT recommended for production):

```bash
supabase secrets set ALLOWED_ORIGINS="*"
supabase functions deploy save-note --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
```

**Warning:** Only use wildcard (`*`) for testing. Always use specific domains in production.
