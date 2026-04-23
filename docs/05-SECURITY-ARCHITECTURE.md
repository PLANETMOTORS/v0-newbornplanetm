# PLANET MOTORS - SECURITY ARCHITECTURE

## Overview

Security is implemented at every layer of the Planet Motors platform to protect customer data, financial transactions, and business operations.

---

## 1. Authentication & Authorization

### 1.1 Supabase Auth

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User                    Frontend                Supabase    │
│   │                         │                       │        │
│   │  Email + Password       │                       │        │
│   │────────────────────────>│                       │        │
│   │                         │  signInWithPassword   │        │
│   │                         │──────────────────────>│        │
│   │                         │                       │        │
│   │                         │  JWT + Refresh Token  │        │
│   │                         │<──────────────────────│        │
│   │                         │                       │        │
│   │  Authenticated Session  │                       │        │
│   │<────────────────────────│                       │        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Session Management

| Feature | Implementation |
|---------|----------------|
| Token Type | JWT (RS256) |
| Access Token Expiry | 1 hour |
| Refresh Token Expiry | 7 days |
| Token Storage | HTTP-only cookies |
| Session Refresh | Automatic via middleware |

### 1.3 OAuth Providers

- Google OAuth 2.0
- Apple Sign In

---

## 2. Row Level Security (RLS)

All Supabase tables have RLS enabled with policies that restrict data access:

```sql
-- Example: Users can only view their own orders
CREATE POLICY "Users can view own orders" 
  ON orders FOR SELECT 
  USING (customer_id IN (
    SELECT id FROM customers 
    WHERE auth_user_id = auth.uid()
  ));
```

### RLS Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| customers | Own only | Self | Own only | No |
| orders | Own only | Authenticated | Own only | No |
| vehicles | Public | Admin only | Admin only | Admin only |
| financing_applications | Own only | Authenticated | Own only | No |
| payments | Own only | System | No | No |

---

## 3. API Security

### 3.1 Rate Limiting (Upstash Redis)

```typescript
// Rate limiter configuration
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
});
```

### 3.2 Input Validation

All API inputs are validated using Zod schemas:

```typescript
const OrderSchema = z.object({
  vehicle_id: z.string().uuid(),
  order_type: z.enum(['reservation', 'purchase']),
  delivery_type: z.enum(['pickup', 'delivery']),
  // ...
});
```

### 3.3 CORS Configuration

```typescript
// next.config.js
headers: [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: 'https://planetmotors.app' },
      { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
      { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
    ],
  },
]
```

---

## 4. Data Protection

### 4.1 Encryption

| Data Type | At Rest | In Transit |
|-----------|---------|------------|
| User credentials | bcrypt (Supabase) | TLS 1.3 |
| Payment data | Stripe (PCI DSS) | TLS 1.3 |
| Personal info | AES-256 | TLS 1.3 |
| API keys | Encrypted env vars | TLS 1.3 |

### 4.2 Sensitive Data Handling

```typescript
// Never log sensitive data
const sanitizeLog = (data: any) => {
  const sensitive = ['password', 'ssn', 'credit_card', 'api_key'];
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => 
      sensitive.some(s => k.toLowerCase().includes(s)) 
        ? [k, '[REDACTED]'] 
        : [k, v]
    )
  );
};
```

---

## 5. Payment Security (PCI DSS)

### 5.1 Stripe Integration

Planet Motors is **PCI DSS compliant** through Stripe:

- Card data never touches our servers
- Stripe Elements for card input
- Tokenization on Stripe's side
- Webhooks for payment events

```typescript
// Payment flow
// 1. Create PaymentIntent on server
const paymentIntent = await stripe.paymentIntents.create({
  amount: 25000, // $250.00
  currency: 'cad',
  metadata: { order_id: orderId }
});

// 2. Confirm on client with Stripe.js
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: elements.getElement(CardElement) }
});

// 3. Webhook confirms payment
// POST /api/webhooks/stripe
```

### 5.2 Fraud Prevention

- Stripe Radar for fraud detection
- 3D Secure 2.0 for high-risk transactions
- Address Verification Service (AVS)
- CVV verification

---

## 6. Infrastructure Security

### 6.1 Vercel Security

| Feature | Status |
|---------|--------|
| DDoS Protection | Enabled |
| WAF | Enabled |
| SSL/TLS | Automatic (Let's Encrypt) |
| Edge Functions | Isolated execution |
| Secrets Management | Encrypted env vars |

### 6.2 Supabase Security

| Feature | Status |
|---------|--------|
| Database Encryption | AES-256 |
| Connection Encryption | SSL required |
| Row Level Security | Enabled all tables |
| Realtime Security | JWT validation |
| Storage Security | RLS + signed URLs |

---

## 7. Compliance

### 7.1 PIPEDA (Canadian Privacy)

- Privacy policy displayed prominently
- Consent obtained before data collection
- Data retention policies enforced
- Right to access/delete personal data
- Breach notification procedures

### 7.2 CASL (Anti-Spam)

- Express consent for marketing emails
- Unsubscribe option in all emails
- Consent records maintained
- Commercial message identification

---

## 8. Security Headers

```typescript
// middleware.ts
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; ...",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

---

## 9. Monitoring & Incident Response

### 9.1 Security Monitoring

| Tool | Purpose |
|------|---------|
| Vercel Analytics | Traffic anomalies |
| Supabase Logs | Database access logs |
| Upstash Analytics | Rate limit violations |
| Stripe Dashboard | Payment fraud |

### 9.2 Incident Response Plan

1. **Detection**: Automated alerts + manual monitoring
2. **Containment**: Revoke tokens, block IPs, disable accounts
3. **Investigation**: Log analysis, impact assessment
4. **Recovery**: Restore services, patch vulnerabilities
5. **Post-Mortem**: Document incident, update procedures

---

## 10. Security Checklist

- [x] HTTPS everywhere
- [x] JWT authentication
- [x] Row Level Security
- [x] Input validation (Zod)
- [x] Rate limiting
- [x] CORS configuration
- [x] Security headers
- [x] PCI DSS compliance (Stripe)
- [x] PIPEDA compliance
- [x] Environment variable encryption
- [x] No secrets in code
- [x] Dependency scanning
- [x] Error message sanitization

---

*Document Version: 1.0*
*Last Updated: March 28, 2026*
