# PLANET MOTORS - TECHNICAL BLUEPRINT

## Executive Summary

Planet Motors is a modern automotive e-commerce platform built for the Canadian market, enabling customers to buy, sell, and finance vehicles entirely online with nationwide delivery.

## Technology Stack

### Frontend

| Technology | Version | Purpose |
| --- | --- | --- |
| Next.js | 16.2.0 | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | Latest | Component library |
| Framer Motion | 12.x | Animations |

### Backend

| Technology | Purpose |
| --- | --- |
| Next.js API Routes | REST API endpoints |
| Supabase | PostgreSQL database, Auth, Storage |
| Upstash Redis | Caching, rate limiting, sessions |
| Vercel Edge Functions | Serverless compute |

### Integrations

| Service | Purpose |
| --- | --- |
| Sanity CMS | Headless content management |
| Stripe | Payment processing |
| Vercel AI Gateway | AI chatbot assistance |
| Canadian Black Book | Vehicle valuations |
| CARFAX Canada | Vehicle history reports |

### Infrastructure

| Service | Purpose |
| --- | --- |
| Vercel | Hosting, CDN, Edge Network |
| Supabase Cloud | Managed PostgreSQL |
| GitHub | Version control, CI/CD |

## Core Features

### 1. Vehicle Inventory Management

- Real-time inventory from Sanity CMS
- Advanced filtering (make, model, year, price, fuel type, body type)
- 360-degree photo galleries
- Video walkarounds
- EV battery health reports

### 2. Purchase Flow

- Online reservation ($250 refundable deposit)
- Full checkout process
- Multi-step form validation
- Order confirmation & tracking

### 3. Financing

- Multi-lender pre-approval
- Real-time rate calculator
- Credit application processing
- Soft credit check (no impact on score)

### 4. Trade-In

- Instant vehicle valuation (CBB integration)
- Photo upload capability
- Trade-in value toward purchase

### 5. Delivery

- Nationwide delivery calculator
- Zone-based pricing
- Real-time tracking
- Pickup scheduling

### 6. Customer Portal

- Account management
- Order history
- Saved vehicles
- Finance applications

## Quality Assurance

### PM Certified Program

- 210-point inspection on every vehicle
- Mechanical, safety, and cosmetic checks
- Full inspection report available
- Certified badge on qualifying vehicles

### Customer Protection

- 10-day money-back guarantee
- Comprehensive warranty options
- Protection plans available
- CARFAX reports included

## Performance Targets

| Metric | Target |
| --- | --- |
| Page Load (LCP) | < 2.5s |
| Time to Interactive | < 3.5s |
| First Contentful Paint | < 1.8s |
| Cumulative Layout Shift | < 0.1 |
| Core Web Vitals | All Green |

## Security Standards

- HTTPS everywhere (TLS 1.3)
- Supabase Row Level Security (RLS)
- CSRF protection
- Rate limiting via Upstash
- PCI DSS compliance (via Stripe)
- PIPEDA compliance (Canadian privacy)

*Document Version: 1.0**Last Updated: March 28, 2026*