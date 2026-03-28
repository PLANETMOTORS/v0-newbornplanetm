# Planet Motors Technical Blueprint

## Executive Summary

This document provides a comprehensive technical blueprint for Planet Motors, a Canadian online used car retailer. The architecture is designed to handle 9,500+ vehicles with optimized 360-degree spin viewers, multi-lender financing, and province-specific tax calculations.

---

## 1. Company Overview

| Metric | Value |
|--------|-------|
| Founded | 2024 |
| Headquarters | Toronto, Ontario, Canada |
| Employees | Target: 200+ |
| Target Revenue | $150M+ CAD |
| Vehicles | 9,500+ |
| Markets | 5 Canadian Provinces |
| Return Policy | 10-Day Return |
| Inspection | 210-point |

---

## 2. Technology Stack

### 2.1 Frontend

| Component | Technology |
|-----------|------------|
| UI Framework | React 19 |
| Language | TypeScript |
| State Management | Context API + SWR |
| Routing | Next.js App Router |
| Bundler | Turbopack |
| CSS Solution | Tailwind CSS |
| Testing (Unit) | Jest |
| Testing (E2E) | Playwright |
| Component Dev | Storybook |
| Maps | Google Maps |

### 2.2 Backend

| Component | Technology |
|-----------|------------|
| Primary Language | TypeScript (Node.js) |
| Primary Framework | Express.js 4.x |
| Secondary Language | Python 3.11+ |
| Secondary Framework | FastAPI |
| ORM | Sequelize 6.x |
| API Style | REST |
| BFF Pattern | No |

### 2.3 Databases

| Component | Technology |
|-----------|------------|
| Primary RDBMS | PostgreSQL (AWS RDS) |
| Caching | ElastiCache (Redis) |
| Search Engine | PostgreSQL Full-Text |
| Strategy | Single Database |

### 2.4 Message Queues

| Component | Technology |
|-----------|------------|
| Event Streaming | Apache Kafka |
| Task Queue | RabbitMQ |
| Enterprise Messaging | RabbitMQ |

### 2.5 Infrastructure

| Component | Technology |
|-----------|------------|
| Primary Cloud | Amazon Web Services (AWS) |
| Container Orchestration | AWS ECS (Fargate) |
| Container Runtime | Docker |
| Infrastructure as Code | Terraform |
| CI/CD | GitHub Actions |
| Region | ca-central-1 (Montreal) |

### 2.6 CDN & Edge

| Component | Technology |
|-----------|------------|
| Primary CDN | Amazon CloudFront |
| Secondary CDN | Fastly |
| DDoS Protection | AWS Shield |
| WAF | AWS WAF |
| Image CDN | imgix + CloudFront |

---

## 3. Microservices Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CloudFront + WAF + Shield Advanced              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Application Load Balancers                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     ECS FARGATE CLUSTER                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              API GATEWAY SERVICE                     │    │
│  │            (Express.js + JWT Auth)                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
│  ┌─────────────┬─────────────┬─────────────┬────────────┐   │
│  │  Inventory  │  Customer   │   Order     │  Pricing   │   │
│  │  Service    │  Service    │   Service   │  Service   │   │
│  └─────────────┴─────────────┴─────────────┴────────────┘   │
│  ┌─────────────┬─────────────┬─────────────┬────────────┐   │
│  │  Payment    │  Financing  │  Trade-In   │  Delivery  │   │
│  │  Service    │  Service    │  Service    │  Service   │   │
│  └─────────────┴─────────────┴─────────────┴────────────┘   │
│  ┌─────────────┬─────────────┬─────────────┬────────────┐   │
│  │ Notification│   Search    │    Auth     │   Media    │   │
│  │  Service    │  Service    │   Service   │  Service   │   │
│  └─────────────┴─────────────┴─────────────┴────────────┘   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 Analytics Service                    │    │
│  │                 (Python FastAPI)                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ RDS PostgreSQL│ │ ElastiCache  │ │    Amazon S3         │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Service Configuration

| Service | Technology | CPU | Memory | Min/Max Instances |
|---------|------------|-----|--------|-------------------|
| API Gateway | Express.js | 512 | 1024 | 3-10 |
| Inventory | Express.js | 256 | 512 | 2-8 |
| Pricing | Express.js | 256 | 512 | 2-6 |
| Customer | Express.js | 256 | 512 | 2-6 |
| Order | Express.js | 512 | 1024 | 2-8 |
| Payment | Express.js | 256 | 512 | 2-6 |
| Financing | Express.js | 512 | 1024 | 2-6 |
| Trade-In | Express.js | 256 | 512 | 2-6 |
| Delivery | Express.js | 256 | 512 | 1-4 |
| Notification | Express.js | 256 | 512 | 1-4 |
| Search | Express.js | 512 | 512 | 2-8 |
| Auth | Express.js | 256 | 512 | 2-6 |
| Media | Express.js | 512 | 1024 | 2-8 |
| Analytics | Python FastAPI | 1024 | 2048 | 1-4 |

---

## 4. API Architecture

### 4.1 Vehicle API

```
GET    /api/v1/vehicles              List vehicles with filtering
GET    /api/v1/vehicles/:id          Get vehicle details
GET    /api/v1/vehicles/vin/:vin     Get vehicle by VIN
POST   /api/v1/vehicles              Create vehicle (internal)
PUT    /api/v1/vehicles/:id          Update vehicle (internal)
PATCH  /api/v1/vehicles/:id/status   Update vehicle status
GET    /api/v1/vehicles/:id/photos   Get vehicle photos
POST   /api/v1/vehicles/:id/inspection  Get 210-point inspection
POST   /api/v1/vehicles/search       Advanced search
GET    /api/v1/vehicles/:id/similar  Get similar vehicles
```

### 4.2 Financing API (Multi-Lender)

```
POST   /api/v1/financing/prequalify  Soft credit pull (no impact)
POST   /api/v1/financing/apply       Full application (hard pull)
GET    /api/v1/financing/applications/:id  Get application status
GET    /api/v1/financing/offers      Get offers from multiple lenders
POST   /api/v1/financing/offers/:id/select  Select lender offer
POST   /api/v1/financing/calculate   Calculate payment
GET    /api/v1/financing/lenders     List available lenders
```

### 4.3 Order API

```
GET    /api/v1/orders                List customer orders
POST   /api/v1/orders                Create order
GET    /api/v1/orders/:id            Get order details
PATCH  /api/v1/orders/:id/status     Update order status
POST   /api/v1/orders/:id/cancel     Cancel order
GET    /api/v1/orders/:id/documents  Get order documents
POST   /api/v1/orders/:id/documents  Upload signed document
GET    /api/v1/orders/:id/timeline   Get order timeline
```

### 4.4 Trade-In API

```
POST   /api/v1/trade-in/instant-offer  Get instant offer
GET    /api/v1/trade-in/offers/:id     Get offer details
POST   /api/v1/trade-in/offers/:id/accept  Accept offer
POST   /api/v1/trade-in/offers/:id/decline  Decline offer
POST   /api/v1/trade-in/offers/:id/photos  Upload vehicle photos
GET    /api/v1/trade-in/valuation      Get CBB valuation
```

### 4.5 Delivery API

```
POST   /api/v1/deliveries            Schedule delivery
GET    /api/v1/deliveries/:id        Get delivery details
PATCH  /api/v1/deliveries/:id        Update delivery
GET    /api/v1/deliveries/:id/tracking  Get real-time tracking
GET    /api/v1/deliveries/slots      Get available time slots
GET    /api/v1/deliveries/hubs       Get hub locations
```

### 4.6 Customer API

```
GET    /api/v1/customers/me          Get current customer
PUT    /api/v1/customers/me          Update profile
GET    /api/v1/customers/me/addresses  Get saved addresses
POST   /api/v1/customers/me/addresses  Add address
GET    /api/v1/customers/me/favorites  Get favorite vehicles
POST   /api/v1/customers/me/favorites  Add to favorites
GET    /api/v1/customers/me/searches   Get saved searches
```

### 4.7 Return API (10-Day Policy)

```
POST   /api/v1/returns               Initiate return
GET    /api/v1/returns/:id           Get return status
POST   /api/v1/returns/:id/schedule-pickup  Schedule vehicle pickup
GET    /api/v1/returns/:id/refund    Get refund details
```

---

## 5. Security Architecture

### Security Layers

| Layer | Implementation | Description |
|-------|---------------|-------------|
| Edge | AWS Shield Advanced | DDoS protection, managed WAF |
| Application | Express middleware | Helmet.js, express-validator, rate limiting |
| Data | AWS KMS | Encryption at rest, column-level PII encryption |

### Authentication Flow

```
┌─────────┐      ┌─────────────┐      ┌─────────────┐
│ Client  │─────▶│ API Gateway │─────▶│ Auth Service│
└─────────┘      └─────────────┘      └─────────────┘
                                              │
                 ┌────────────────────────────┘
                 │
    ┌────────────▼───────────────┐
    │    JWT Token Validation     │
    │  - Access Token (15 min)    │
    │  - Refresh Token (7 days)   │
    └────────────────────────────┘
```

### Auth Endpoints

**1. Customer Login**
```
POST /api/v1/auth/login
├── Validate credentials
├── Check rate limits
├── Generate JWT (access + refresh)
└── Return tokens
```

**2. OAuth 2.0 Login (Google)**
```
GET /api/v1/auth/google
├── Redirect to Google
├── Receive callback
├── Create/link account
└── Generate JWT
```

**3. Token Refresh**
```
POST /api/v1/auth/refresh
├── Validate refresh token
├── Check revocation list
└── Issue new access token
```

**4. Logout**
```
POST /api/v1/auth/logout
├── Revoke refresh token
├── Clear session
└── Return success
```

---

## 6. Implementation Roadmap

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | Months 1-3 | Core Infrastructure, Auth, Search |
| Phase 2 | Months 4-6 | Orders, Payments, Financing |
| Phase 3 | Months 7-9 | Multi-lender, Trade-In, Delivery |
| Phase 4 | Months 10-12 | Analytics, A/B Testing, Mobile App |

---

*Document Version: 1.0*
*Last Updated: March 2026*
*Classification: Internal Use Only*
