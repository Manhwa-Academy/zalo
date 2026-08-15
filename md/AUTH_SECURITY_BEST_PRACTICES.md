# 🔒 Auth Security Best Practices

## ❌ Vấn đề với Hardcoded Credentials

### Tại sao KHÔNG nên hardcode password trong SQL?

```sql
-- ❌ BAD: Hardcoded password trong migration
INSERT INTO auth_users (username, password_hash)
VALUES ('admin', '$2b$10$rBV2uLJZBXJvBqXvz3qkPOm5YLq7.FxQvZW.8IY6YGH2oZjKfwZfO');
```

**Rủi ro:**
1. ✅ Password hash có trong source code
2. ✅ Ai clone repo cũng biết default password
3. ✅ Dễ quên đổi password sau khi deploy
4. ✅ SQL file có trong Git history mãi mãi
5. ✅ Developer khác có thể dùng để hack

## ✅ Giải pháp An toàn

### 1. **Tạo User Qua Script Tương tác**

```bash
npm run create-admin
```

Script sẽ:
- ✅ Hỏi username, password, email
- ✅ Validate password strength (min 8 chars)
- ✅ Confirm password trước khi tạo
- ✅ Hash password với bcrypt
- ✅ Không lưu plain password ở đâu cả

**Output:**
```
🔐 Create First Admin User
═══════════════════════════════════════

✅ Database connected

Username [admin]: myuser
Display Name [Administrator]: John Doe
Email [admin@example.com]: john@company.com

Password (min 8 chars): ********
Confirm Password: ********

🔄 Creating user...
✅ Admin user created successfully!

📋 User Details:
   Username: myuser
   Display Name: John Doe
   Email: john@company.com

🎉 You can now login with these credentials!
```

### 2. **Environment Variables cho Default Credentials**

```env
# .env (NEVER commit this file!)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=your-secure-password-here
```

**Setup script:**
```typescript
const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin'
const password = process.env.DEFAULT_ADMIN_PASSWORD

if (!password) {
  throw new Error('DEFAULT_ADMIN_PASSWORD must be set!')
}

const hash = await bcrypt.hash(password, 10)
```

### 3. **Force Password Change on First Login**

```typescript
// Add column to auth_users
ALTER TABLE auth_users ADD COLUMN must_change_password BOOLEAN DEFAULT false;

// Set true for default admin
UPDATE auth_users SET must_change_password = true WHERE username = 'admin';

// Check in login API
if (user.must_change_password) {
  return {
    success: true,
    requirePasswordChange: true,
    redirectTo: '/change-password'
  }
}
```

### 4. **Password Complexity Requirements**

```typescript
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number')
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character (!@#$%^&*)')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

## 🔐 Password Hashing Best Practices

### Bcrypt Configuration

```typescript
import bcrypt from 'bcryptjs'

// Cost factor: 10 is good balance between security and performance
// Higher = more secure but slower
const COST_FACTOR = 10

// Hash password
const hash = await bcrypt.hash(password, COST_FACTOR)

// Verify password
const match = await bcrypt.compare(password, hash)
```

**Cost Factor Guide:**
- `8` - Fast, less secure (for dev/testing)
- `10` - ✅ Recommended for production
- `12` - Very secure, slower (high-security apps)
- `14+` - Extreme security, very slow

### Password Storage

```typescript
// ❌ NEVER STORE PLAIN PASSWORD
const user = {
  username: 'admin',
  password: 'secret123' // ❌ BAD!
}

// ✅ ALWAYS HASH
const user = {
  username: 'admin',
  password_hash: '$2b$10$...' // ✅ GOOD
}

// ❌ NEVER LOG PASSWORD
console.log('Login:', username, password) // ❌ BAD!

// ✅ LOG SAFELY
console.log('Login attempt:', username) // ✅ GOOD
```

## 🛡️ Session Security

### Secure Cookie Settings

```typescript
{
  httpOnly: true,              // ✅ Prevent XSS attacks
  secure: true,                // ✅ HTTPS only
  sameSite: 'strict',          // ✅ Prevent CSRF
  maxAge: 7 * 24 * 60 * 60,    // ✅ Auto-expire
  path: '/',
  domain: '.example.com'       // ✅ Subdomain support
}
```

### Session Token Generation

```typescript
import { v4 as uuidv4 } from 'uuid'

// ❌ BAD: Predictable token
const token = `${username}-${Date.now()}`

// ✅ GOOD: Random UUID + timestamp
const token = `${uuidv4()}-${Date.now()}`

// ✅ BETTER: Multiple sources of entropy
const token = `${uuidv4()}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`
```

### Session Expiry

```typescript
// ✅ Always set expiry
const expiresAt = new Date()
expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

// ✅ Sliding expiry: extend on activity
UPDATE auth_sessions 
SET expires_at = CURRENT_TIMESTAMP + INTERVAL '7 days',
    last_active = CURRENT_TIMESTAMP
WHERE session_token = $1
```

## 🔍 Audit Logging

### What to Log

```typescript
// ✅ Login success/failure
await logAuthEvent(userId, 'login', ipAddress, userAgent, deviceInfo, true)

// ✅ Logout
await logAuthEvent(userId, 'logout', ipAddress, userAgent, deviceInfo, true)

// ✅ Failed login attempts
await logAuthEvent(null, 'login', ipAddress, userAgent, {}, false, 'Invalid credentials')

// ✅ Password changes
await logAuthEvent(userId, 'password_change', ipAddress, userAgent, {}, true)

// ✅ Session expired
await logAuthEvent(userId, 'session_expired', null, null, {}, true)
```

### What NOT to Log

```typescript
// ❌ NEVER log passwords (even hashed)
console.log('Password hash:', passwordHash) // ❌ BAD!

// ❌ NEVER log session tokens in plain
console.log('Session token:', sessionToken) // ❌ BAD!

// ✅ Log partial token for debugging
console.log('Session:', sessionToken.substring(0, 8) + '...') // ✅ OK
```

## 🚨 Rate Limiting

### Prevent Brute Force Attacks

```typescript
// Track failed login attempts
const failedAttempts = new Map<string, number>()

async function checkRateLimit(username: string): Promise<boolean> {
  const attempts = failedAttempts.get(username) || 0
  
  if (attempts >= 5) {
    // Block for 15 minutes
    console.log(`Rate limit: ${username} blocked`)
    return false
  }
  
  return true
}

async function recordFailedAttempt(username: string) {
  const attempts = failedAttempts.get(username) || 0
  failedAttempts.set(username, attempts + 1)
  
  // Clear after 15 minutes
  setTimeout(() => {
    failedAttempts.delete(username)
  }, 15 * 60 * 1000)
}
```

## 📋 Security Checklist

### Database
- [ ] Password hash with bcrypt (cost >= 10)
- [ ] Never store plain passwords
- [ ] Session tokens are unique and random
- [ ] Sessions have expiry dates
- [ ] Indexes on frequently queried columns
- [ ] Foreign key constraints
- [ ] Audit log table for login/logout events

### API Endpoints
- [ ] Validate session on every protected route
- [ ] Rate limit login attempts
- [ ] Return generic error messages (don't reveal if username exists)
- [ ] Log all auth events
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags

### Frontend
- [ ] Don't expose session tokens in DevTools
- [ ] Clear sensitive data on logout
- [ ] Show session expiry warnings
- [ ] Force re-auth for sensitive actions
- [ ] Implement CSRF protection

### Deployment
- [ ] Change default admin password
- [ ] Set strong DATABASE_URL
- [ ] Enable HTTPS/TLS
- [ ] Set NODE_ENV=production
- [ ] Restrict database access
- [ ] Regular security audits
- [ ] Backup database regularly

## 🔧 Tools & Libraries

### Recommended Packages

```json
{
  "bcryptjs": "^2.4.3",           // Password hashing
  "uuid": "^9.0.0",               // Session tokens
  "express-rate-limit": "^6.0.0", // Rate limiting
  "helmet": "^7.0.0",             // Security headers
  "validator": "^13.0.0",         // Input validation
  "zod": "^3.0.0"                 // Schema validation
}
```

### Password Strength Testing

```bash
# Test with zxcvbn
npm install zxcvbn
```

```typescript
import zxcvbn from 'zxcvbn'

const result = zxcvbn(password)

if (result.score < 3) {
  return {
    error: 'Password too weak',
    suggestions: result.feedback.suggestions
  }
}
```

## 📚 Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [bcrypt.js Documentation](https://github.com/dcodeIO/bcrypt.js)

---

**Remember:** Security is not a feature, it's a process. Regularly review and update your security practices!
