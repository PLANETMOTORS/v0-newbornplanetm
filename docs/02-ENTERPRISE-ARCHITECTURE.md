> ⚠️ Note: This document describes a planned enterprise architecture. The current production deployment uses:Hosting: Vercel (Next.js serverless)Database: Supabase (PostgreSQL)Cache: Upstash RedisCMS: SanityCI/CD: GitHub Actions (.github/workflows/ci.yml)The AWS infrastructure described below is a future migration target, not the current state.

# PLANET MOTORS - ENTERPRISE ARCHITECTURE

## 1. System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SYSTEMS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   CARFAX     │  │  Canadian    │  │   Stripe     │  │   Lenders    │    │
│  │   Canada     │  │  Black Book  │  │   Payments   │  │   Network    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │             │
│         └─────────────────┼─────────────────┼─────────────────┘             │
│                           │                 │                               │
│                           ▼                 ▼                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     PLANET MOTORS PLATFORM                           │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                    VERCEL EDGE NETWORK                       │    │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │   │
│  │  │  │  Next.js    │  │  API Routes │  │  Edge Functions     │  │    │   │
│  │  │  │  Frontend   │  │  /api/v1/*  │  │  (Middleware)       │  │    │   │
│  │  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │    │   │
│  │  └─────────┼────────────────┼────────────────────┼─────────────┘    │   │
│  │            │                │                    │                   │   │
│  │            ▼                ▼                    ▼                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                     DATA LAYER                               │    │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │   │
│  │  │  │  Supabase   │  │  Upstash    │  │  Sanity CMS         │  │    │   │
│  │  │  │  PostgreSQL │  │  Redis      │  │  Content Store      │  │    │   │
│  │  │  │  + Auth     │  │  Cache      │  │                     │  │    │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Customer   │  │   Admin      │  │   Delivery   │  │   Finance    │    │
│  │   (Web/Mobile)│  │   (Studio)   │  │   Partners   │  │   Team       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Application Architecture

### 2.1 Frontend Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP ROUTER                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │  Layouts    │  │  Components         │  │
│  │  /app/*     │  │  (Shared)   │  │  /components/*      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Contexts  │  │   Hooks     │  │  Utilities          │  │
│  │  /contexts  │  │  /hooks     │  │  /lib/*             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 API Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    API ROUTES (/api/v1)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /vehicles      - Inventory CRUD                             │
│  /customers     - Customer management                        │
│  /orders        - Order processing                           │
│  /financing     - Finance applications                       │
│  /trade-ins     - Trade-in valuations                        │
│  /deliveries    - Delivery scheduling                        │
│  /payments      - Payment processing (Stripe)                │
│  /auth          - Authentication endpoints                   │
│  /webhooks      - External service webhooks                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Data Layer

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA STORES                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SUPABASE POSTGRESQL                                         │
│  ├── customers          (User accounts)                      │
│  ├── customer_addresses (Shipping/billing)                   │
│  ├── vehicles           (Inventory - synced from Sanity)     │
│  ├── orders             (Purchases)                          │
│  ├── financing_apps     (Credit applications)                │
│  ├── trade_ins          (Trade-in requests)                  │
│  ├── deliveries         (Shipping records)                   │
│  └── payments           (Transaction records)                │
│                                                              │
│  SANITY CMS                                                  │
│  ├── vehicle            (Inventory source of truth)          │
│  ├── blogPost           (Blog content)                       │
│  ├── faqEntry           (FAQ content)                        │
│  ├── testimonial        (Customer reviews)                   │
│  ├── siteSettings       (Global configuration)               │
│  └── promotion          (Marketing banners)                  │
│                                                              │
│  UPSTASH REDIS                                               │
│  ├── session:*          (User sessions)                      │
│  ├── cache:vehicles:*   (Inventory cache)                    │
│  ├── ratelimit:*        (API rate limiting)                  │
│  └── analytics:*        (Real-time metrics)                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 3. Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NETWORK TOPOLOGY                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INTERNET                                                    │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  CLOUDFLARE / VERCEL EDGE                            │    │
│  │  - DDoS Protection                                   │    │
│  │  - SSL/TLS Termination                               │    │
│  │  - CDN Caching                                       │    │
│  │  - Edge Functions                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  VERCEL SERVERLESS                                   │    │
│  │  - Next.js Runtime                                   │    │
│  │  - API Routes                                        │    │
│  │  - ISR (Incremental Static Regeneration)             │    │
│  └─────────────────────────────────────────────────────┘    │
│      │                                                       │
│      ├──────────────┬──────────────┬──────────────┐         │
│      ▼              ▼              ▼              ▼         │
│  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐      │
│  │Supabase│    │Upstash │    │ Sanity │    │ Stripe │      │
│  │  (DB)  │    │(Redis) │    │ (CMS)  │    │(Payment│      │
│  └────────┘    └────────┘    └────────┘    └────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 4. Data Flow Diagrams

### 4.1 Vehicle Purchase Flow

```
Customer          Frontend           API              Database          Stripe
   │                 │                │                  │                │
   │  Browse         │                │                  │                │
   │────────────────>│                │                  │                │
   │                 │  GET /vehicles │                  │                │
   │                 │───────────────>│                  │                │
   │                 │                │  SELECT vehicles │                │
   │                 │                │─────────────────>│                │
   │                 │                │<─────────────────│                │
   │                 │<───────────────│                  │                │
   │<────────────────│                │                  │                │
   │                 │                │                  │                │
   │  Reserve        │                │                  │                │
   │────────────────>│                │                  │                │
   │                 │ POST /orders   │                  │                │
   │                 │───────────────>│                  │                │
   │                 │                │  INSERT order    │                │
   │                 │                │─────────────────>│                │
   │                 │                │                  │                │
   │                 │                │  Create Payment  │                │
   │                 │                │─────────────────────────────────>│
   │                 │                │<─────────────────────────────────│
   │                 │<───────────────│                  │                │
   │<────────────────│                │                  │                │
   │                 │                │                  │                │
```

### 4.2 Multi-Lender Financing Flow

```
Customer          Frontend           API            Lender API        Database
   │                 │                │                  │                │
   │  Apply          │                │                  │                │
   │────────────────>│                │                  │                │
   │                 │ POST /finance  │                  │                │
   │                 │───────────────>│                  │                │
   │                 │                │  Submit to Lender A               │
   │                 │                │─────────────────>│                │
   │                 │                │  Submit to Lender B               │
   │                 │                │─────────────────>│                │
   │                 │                │  Submit to Lender C               │
   │                 │                │─────────────────>│                │
   │                 │                │<─────────────────│                │
   │                 │                │                  │                │
   │                 │                │  Store offers    │                │
   │                 │                │─────────────────────────────────>│
   │                 │<───────────────│                  │                │
   │<────────────────│                │                  │                │
   │                 │                │                  │                │
   │  Select Offer   │                │                  │                │
   │────────────────>│                │                  │                │
   │                 │ PUT /finance   │                  │                │
   │                 │───────────────>│                  │                │
   │                 │                │  Accept offer    │                │
   │                 │                │─────────────────>│                │
   │                 │                │<─────────────────│                │
   │                 │<───────────────│                  │                │
   │<────────────────│                │                  │                │
```

## 5. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GITHUB                                                      │
│     │                                                        │
│     │  Push to main                                          │
│     ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  VERCEL BUILD                                        │    │
│  │  1. Install dependencies (pnpm)                      │    │
│  │  2. Run type checking                                │    │
│  │  3. Run linting                                      │    │
│  │  4. Build Next.js                                    │    │
│  │  5. Deploy to Edge Network                           │    │
│  └─────────────────────────────────────────────────────┘    │
│     │                                                        │
│     ├──────────────────┬──────────────────┐                 │
│     ▼                  ▼                  ▼                 │
│  ┌────────┐       ┌────────┐        ┌────────┐             │
│  │Preview │       │Staging │        │  Prod  │             │
│  │  (PR)  │       │ (dev)  │        │ (main) │             │
│  └────────┘       └────────┘        └────────┘             │
│                                                              │
│  DOMAINS:                                                    │
│  - Preview: *.vercel.app                                     │
│  - Staging: staging.planetmotors.app                         │
│  - Production: planetmotors.app, planetmotors.ca             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

*Document Version: 1.0**Last Updated: March 28, 2026*