# PLANET MOTORS - THIRD-PARTY INTEGRATIONS

## Integration Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       INTEGRATION ECOSYSTEM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    PLANET MOTORS PLATFORM                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │              │              │              │              │      │
│       ▼              ▼              ▼              ▼              ▼      │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   │
│  │ SANITY  │   │SUPABASE │   │ STRIPE  │   │ UPSTASH │   │   AI    │   │
│  │   CMS   │   │  Auth   │   │Payments │   │  Redis  │   │ Gateway │   │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   │
│       │              │              │              │              │      │
│  Content       Users &        Payment         Caching       Chatbot     │
│  Management    Database       Processing      Sessions      Assistant   │
│                                                                          │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   │
│  │ CARFAX  │   │   CBB   │   │ LENDERS │   │ GOOGLE  │   │ TWILIO  │   │
│  │ Canada  │   │Black Bk │   │ Network │   │  Maps   │   │   SMS   │   │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   │
│       │              │              │              │              │      │
│  Vehicle        Trade-In       Financing      Location        SMS       │
│  History        Valuation      Partners       Services        Alerts    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 1. Sanity CMS

### Purpose

Headless content management for vehicles, blog posts, and site content.

### Configuration

```typescript
// lib/sanity/client.ts
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, // cgb59sfd
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,       // production
  apiVersion: '2024-01-01',
  useCdn: true,
});
```

### Content Types

| Schema | Purpose |
| --- | --- |
| vehicle | Vehicle inventory |
| blogPost | Blog articles |
| faqEntry | FAQ questions |
| testimonial | Customer reviews |
| promotion | Marketing banners |
| siteSettings | Global configuration |

### Webhook

```
URL: https://planetmotors.app/api/sanity-webhook
Events: Create, Update, Delete
```

## 2. Supabase

### Purpose

PostgreSQL database, authentication, and file storage.

### Services Used

| Service | Purpose |
| --- | --- |
| Auth | User authentication |
| Database | PostgreSQL with RLS |
| Storage | Document uploads |
| Realtime | Live updates (future) |

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 3. Stripe

### Purpose

Payment processing for deposits and full purchases.

### Products

| Product | Use Case |
| --- | --- |
| Payments | One-time charges |
| Payment Intents | Secure card processing |
| Webhooks | Payment event handling |
| Radar | Fraud prevention |

### Webhook Events

```typescript
// Handled events
switch (event.type) {
  case 'payment_intent.succeeded':
    // Mark deposit as paid
    break;
  case 'payment_intent.payment_failed':
    // Notify customer
    break;
  case 'charge.refunded':
    // Process refund
    break;
}
```

### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 4. Upstash Redis

### Purpose

Serverless Redis for caching, rate limiting, and sessions.

### Use Cases

```typescript
// Rate limiting
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '60 s'),
});

// Caching
await redis.set(`vehicle:${id}`, JSON.stringify(data), { ex: 3600 });
const cached = await redis.get(`vehicle:${id}`);

// Session storage
await redis.set(`session:${userId}`, sessionData, { ex: 86400 });
```

### Environment Variables

```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

## 5. Vercel AI Gateway

### Purpose

AI-powered customer service chatbot.

### Models Available

- OpenAI GPT-5-mini
- Anthropic Claude Opus 4.6
- Google Gemini 3 Flash

### Implementation

```typescript
import { generateText } from 'ai';

const response = await generateText({
  model: 'openai/gpt-5-mini',
  system: `You are a Planet Motors sales assistant...`,
  messages: conversation,
});
```

## 6. Canadian Black Book (CBB)

### Purpose

Vehicle valuation for trade-ins.

### API Endpoints

| Endpoint | Purpose |
| --- | --- |
| /decode/vin | VIN decoding |
| /values/trade-in | Trade-in value |
| /values/retail | Retail value |
| /adjustments | Mileage/condition adjustments |

### Request Example

```typescript
const valuation = await cbb.getTradeInValue({
  vin: '1HGBH41JXMN109186',
  mileage: 45000,
  condition: 'good',
  postalCode: 'L4C 1G7'
});

// Response
{
  low: 18500,
  average: 20500,
  high: 22500,
  adjustments: {
    mileage: -500,
    condition: 0
  }
}
```

## 7. CARFAX Canada

### Purpose

Vehicle history reports for transparency.

### Integration Points

| Feature | Implementation |
| --- | --- |
| Report Links | Stored in vehicle record |
| Badges | Displayed on vehicle cards |
| Full Reports | Linked from VDP |

### Data Available

- Accident history
- Service records
- Ownership history
- Odometer readings
- Lien status

## 8. Lender Network

### Purpose

Multi-lender financing submissions.

### Integrated Lenders

| Lender | Type | Min Credit |
| --- | --- | --- |
| TD Auto Finance | Prime | 680+ |
| Scotiabank Dealer Finance | Prime | 660+ |
| RBC Auto Finance | Prime | 680+ |
| Capital One Auto | Near-Prime | 600+ |
| Fairstone Financial | Subprime | 550+ |

### Submission Flow

```typescript
// Submit to multiple lenders in parallel
const offers = await Promise.all(
  lenders.map(lender => 
    submitApplication(lender, applicationData)
  )
);

// Filter approved offers
const approved = offers.filter(o => o.status === 'approved');
```

## 9. Google Services

### Google Maps

- Delivery distance calculation
- Hub location display
- Address autocomplete

### Google Analytics 4

- User behavior tracking
- Conversion tracking
- E-commerce events

### Environment Variables

```bash
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-xxx
```

## 10. Email & SMS

### Resend (Email)

```typescript
await resend.emails.send({
  from: 'Planet Motors <noreply@planetmotors.ca>',
  to: customer.email,
  subject: 'Your Vehicle is Ready!',
  react: <DeliveryReadyEmail order={order} />
});
```

### Twilio (SMS) - Future

```typescript
await twilio.messages.create({
  body: 'Your vehicle is out for delivery!',
  to: customer.phone,
  from: '+14165551234'
});
```

## Integration Status

| Integration | Status | Priority |
| --- | --- | --- |
| Sanity CMS | Connected | High |
| Supabase | Connected | High |
| Stripe | Connected | High |
| Upstash Redis | Connected | High |
| Vercel AI | Connected | Medium |
| Canadian Black Book | Planned | High |
| CARFAX Canada | Planned | High |
| Lender Network | Planned | High |
| Google Maps | Planned | Medium |
| Twilio SMS | Planned | Low |

*Document Version: 1.0**Last Updated: March 28, 2026*