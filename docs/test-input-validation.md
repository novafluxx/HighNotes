# Input Validation Test Cases

Test these scenarios to verify the validation is working correctly.

## Setup

```bash
# Make sure edge functions are deployed with the latest changes
supabase functions deploy save-note --no-verify-jwt

# Get your project URL and anon key
# Set these variables in your terminal:
PROJECT_URL="https://your-project.supabase.co"
ANON_KEY="your_anon_key"
AUTH_TOKEN="your_jwt_token"  # Get from browser after logging in
```

## Test Cases

### 1. Valid Note (Should Succeed)

```bash
curl -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "note": {
      "title": "Valid Test Note",
      "content": "<p>This is <strong>valid</strong> content</p>"
    }
  }'
```

**Expected:** `200 OK` with saved note data

---

### 2. Title Too Long (Should Fail)

```bash
curl -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"note\": {
      \"title\": \"$(printf 'a%.0s' {1..256})\",
      \"content\": \"test\"
    }
  }"
```

**Expected:** `400 Bad Request`
```json
{
  "error": "Title cannot exceed 255 characters"
}
```

---

### 3. Empty Title (Should Fail)

```bash
curl -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "note": {
      "title": "   ",
      "content": "test"
    }
  }'
```

**Expected:** `400 Bad Request`
```json
{
  "error": "Title cannot be empty"
}
```

---

### 4. Content Too Large (Should Fail)

```bash
# Generate 100KB+ content
LARGE_CONTENT=$(printf 'x%.0s' {1..110000})

curl -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"note\": {
      \"title\": \"Large Content Test\",
      \"content\": \"${LARGE_CONTENT}\"
    }
  }"
```

**Expected:** `400 Bad Request`
```json
{
  "error": "Content cannot exceed 100000 characters"
}
```

---

### 5. Invalid UUID (Should Fail)

```bash
curl -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "note": {
      "id": "not-a-valid-uuid",
      "title": "Test",
      "content": "test"
    }
  }'
```

**Expected:** `400 Bad Request`
```json
{
  "error": "Invalid note ID format"
}
```

---

### 6. Title with HTML (Should Succeed but Strip HTML)

```bash
curl -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "note": {
      "title": "<script>alert(\"XSS\")</script>Test Title",
      "content": "test"
    }
  }'
```

**Expected:** `200 OK` with title saved as `"Test Title"` (HTML stripped)

---

### 7. Missing Title (Should Fail)

```bash
curl -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "note": {
      "content": "test"
    }
  }'
```

**Expected:** `400 Bad Request`
```json
{
  "error": "Title is required and must be a string"
}
```

---

### 8. Missing Content (Should Fail)

```bash
curl -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "note": {
      "title": "Test"
    }
  }'
```

**Expected:** `400 Bad Request`
```json
{
  "error": "Content is required"
}
```

---

### 9. Empty Content (Should Succeed)

```bash
curl -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "note": {
      "title": "Empty Content Test",
      "content": ""
    }
  }'
```

**Expected:** `200 OK` (empty content is allowed)

---

### 10. Valid UUID (Should Succeed)

```bash
curl -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "note": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "UUID Test",
      "content": "test"
    }
  }'
```

**Expected:** `200 OK` (valid UUID accepted)

---

## Automated Test Script

Save this as `test-validation.sh`:

```bash
#!/bin/bash

# Configuration
PROJECT_URL="${PROJECT_URL:-https://your-project.supabase.co}"
ANON_KEY="${ANON_KEY:-your_anon_key}"
AUTH_TOKEN="${AUTH_TOKEN:-your_jwt_token}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Testing save-note validation..."
echo "Project URL: $PROJECT_URL"
echo ""

# Test 1: Valid note
echo "Test 1: Valid note (should succeed)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"note":{"title":"Valid Test","content":"<p>test</p>"}}')
STATUS=$(echo "$RESPONSE" | tail -n1)
if [ "$STATUS" == "200" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL (Expected 200, got $STATUS)${NC}"
fi
echo ""

# Test 2: Title too long
echo "Test 2: Title too long (should fail)"
LONG_TITLE=$(printf 'a%.0s' {1..300})
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"note\":{\"title\":\"${LONG_TITLE}\",\"content\":\"test\"}}")
STATUS=$(echo "$RESPONSE" | tail -n1)
if [ "$STATUS" == "400" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL (Expected 400, got $STATUS)${NC}"
fi
echo ""

# Test 3: Empty title
echo "Test 3: Empty title (should fail)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"note":{"title":"   ","content":"test"}}')
STATUS=$(echo "$RESPONSE" | tail -n1)
if [ "$STATUS" == "400" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL (Expected 400, got $STATUS)${NC}"
fi
echo ""

# Test 4: Invalid UUID
echo "Test 4: Invalid UUID (should fail)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${PROJECT_URL}/functions/v1/save-note" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"note":{"id":"not-a-uuid","title":"Test","content":"test"}}')
STATUS=$(echo "$RESPONSE" | tail -n1)
if [ "$STATUS" == "400" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL (Expected 400, got $STATUS)${NC}"
fi
echo ""

echo "Testing complete!"
```

Run with:
```bash
chmod +x test-validation.sh
./test-validation.sh
```

## Browser Console Test

You can also test from your browser console when logged into the app:

```javascript
// Get auth token
const token = (await supabase.auth.getSession()).data.session.access_token

// Test title too long
fetch('https://your-project.supabase.co/functions/v1/save-note', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': 'your_anon_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    note: {
      title: 'a'.repeat(256),
      content: 'test'
    }
  })
})
.then(r => r.json())
.then(console.log)

// Expected: { error: "Title cannot exceed 255 characters" }
```
