# Planet Motors Enterprise Architecture & System Design

## Architecture Principles

| Principle | Source | Description |
|-----------|--------|-------------|
| Simplicity First | Clutch | ECS over Kubernetes, single DB |
| Scale When Needed | Carvana | Auto-scaling, multi-lender |
| Security Always | Carvana | Multi-layer security |
| Customer-Centric | Clutch | 10-day returns, 210-point inspection |
| Data-Driven | Carvana | FullStory, Optimizely |

---

## System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SYSTEMS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  VEHICLE DATA           CREDIT & FINANCING        PAYMENTS              │
│  ┌──────────┐           ┌──────────────┐          ┌──────────┐          │
│  │ Carfax   │           │ Equifax CA   │          │ Stripe   │          │
│  │ CBB      │           │ TransUnion CA│          │ Plaid    │          │
│  │ DataOne  │           │ TD Auto      │          │ Interac  │          │
│  └──────────┘           │ RBC          │          └──────────┘          │
│                         │ Scotiabank   │                                │
│                         │ BMO          │          COMMUNICATIONS        │
│                         │ CIBC         │          ┌──────────┐          │
│                         │ Desjardins   │          │ Twilio   │          │
│                         └──────────────┘          │ SendGrid │          │
│                                                   │ HubSpot  │          │
│  ANALYTICS              INSURANCE                 └──────────┘          │
│  ┌──────────┐           ┌──────────┐                                    │
│  │ GA4      │           │ Sonnet   │                                    │
│  │ FullStory│           │ Lubrico  │                                    │
│  │Optimizely│           └──────────┘                                    │
│  └──────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PLANETMOTORS PLATFORM                                │
│                     AWS ca-central-1 (Montreal)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    EDGE LAYER                                    │   │
│   │   CloudFront (CDN) + AWS WAF + AWS Shield Advanced              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    LOAD BALANCING                                │   │
│   │              Application Load Balancers (ALB)                    │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    COMPUTE LAYER                                 │   │
│   │                    ECS FARGATE CLUSTER                           │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│   │  │API GW   │ │Inventory│ │Customer │ │Order    │ │Payment  │   │   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│   │  │Financing│ │Trade-In │ │Delivery │ │Notific. │ │Search   │   │   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │   │
│   │  │Auth     │ │Media    │ │Analytics│ │Pricing  │               │   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    DATA LAYER                                    │   │
│   �����  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│   │  │RDS      │ │ElastiCa.│ │OpenSear.│ │S3       │ │MSK      │   │   │
│   │  │Postgres │ │Redis    │ │Search   │ │Storage  │ │Kafka    │   │   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Customers (Web/Mobile)  │  Admin Staff  │  Delivery Drivers           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Microservices Architecture

```
                        INTERNET
                            |
              CloudFront + WAF + Shield Advanced
                            |
                   Application Load Balancers
                            |
        ┌───────────────────┼───────────────────┐
        │           ECS FARGATE CLUSTER          │
        │                                        │
        │  ┌─────────────────────────────────┐  │
        │  │       API GATEWAY SERVICE        │  │
        │  │      (Express.js + JWT Auth)     │  │
        │  └─────────────────────────────────┘  │
        │                   │                    │
        │  ┌────────────────┼────────────────┐  │
        │  │                │                │  │
        │  ▼                ▼                ▼  │
        │ Inventory    Customer    Order       │
        │ Service      Service     Service     │
        │                                       │
        │ Payment     Financing    Trade-In    │
        │ Service     Service      Service     │
        │                                       │
        │ Delivery    Notification  Search     │
        │ Service     Service       Service    │
        │                                       │
        │ Auth        Media        Analytics   │
        │ Service     Service      Service     │
        └───────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │               DATA LAYER               │
        │                                        │
        │  RDS        ElastiCache   S3          │
        │  PostgreSQL Redis        Storage      │
        │                                        │
        │  OpenSearch  MSK         Amazon MQ    │
        │  Search      Kafka       RabbitMQ     │
        └────────────────────────────────────────┘
```

### Microservices Overview

| Service | Responsibility | Key Endpoints |
|---------|---------------|---------------|
| API Gateway | Request routing, JWT validation, rate limiting | All /api/* routes |
| Inventory | Vehicle CRUD, 360 images, availability | /vehicles, /search |
| Customer | User profiles, preferences, favorites | /customers, /favorites |
| Order | Purchase flow, reservations, contracts | /orders, /reservations |
| Payment | Stripe integration, refunds | /payments, /refunds |
| Financing | Multi-lender submissions, approvals | /financing, /applications |
| Trade-In | CBB valuation, vehicle appraisals | /trade-ins, /valuations |
| Delivery | Scheduling, tracking, hub routing | /deliveries, /tracking |
| Notification | SMS, email, push notifications | /notifications |
| Search | OpenSearch indexing, filters | /search, /autocomplete |
| Auth | JWT tokens, OAuth, sessions | /auth, /sessions |
| Media | Image upload, AVIF conversion, CDN | /media, /images |
| Analytics | Event tracking, reporting | /analytics, /events |

---

## Network Architecture

### VPC Configuration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VPC: 10.0.0.0/16                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  AVAILABILITY ZONE A        AVAILABILITY ZONE B        AVAILABILITY ZONE C
│  ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│  │ Public Subnet     │     │ Public Subnet     │     │ Public Subnet     │
│  │ 10.0.101.0/24     │     │ 10.0.102.0/24     │     │ 10.0.103.0/24     │
│  │                   │     │                   │     │                   │
│  │ - NAT Gateway     │     │ - NAT Gateway     │     │ - NAT Gateway     │
│  │ - ALB             │     │ - ALB             │     │ - ALB             │
│  │ - Bastion Host    │     │                   │     │                   │
│  └───────────────────┘     └───────────────────┘     └───────────────────┘
│                                                                          │
│  ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│  │ Private Subnet    │     │ Private Subnet    │     │ Private Subnet    │
│  │ 10.0.1.0/24       │     │ 10.0.2.0/24       │     │ 10.0.3.0/24       │
│  │                   │     │                   │     │                   │
│  │ - ECS Tasks       │     │ - ECS Tasks       │     │ - ECS Tasks       │
│  │ - RDS (Primary)   │     │ - RDS (Standby)   │     │                   │
│  │ - ElastiCache     │     │ - ElastiCache     │     │ - ElastiCache     │
│  │ - OpenSearch      │     │ - OpenSearch      │     │                   │
│  │ - MSK Broker      │     │ - MSK Broker      │     │ - MSK Broker      │
│  └───────────────────┘     └───────────────────┘     └───────────────────┘
│                                                                          │
│  Security Groups:                                                        │
│  - alb-sg: 443 from 0.0.0.0/0                                           │
│  - ecs-sg: 3000-3100 from alb-sg                                        │
│  - rds-sg: 5432 from ecs-sg                                             │
│  - redis-sg: 6379 from ecs-sg                                           │
│  - opensearch-sg: 443 from ecs-sg                                       │
│  - msk-sg: 9092 from ecs-sg                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 4.1 Vehicle Purchase Flow

```
CUSTOMER                    PLANETMOTORS                         EXTERNAL
   │                            │                                    │
   │ 1. Browse vehicles         │                                    │
   │ ─────────────────────────► │                                    │
   │                            │ 2. Query inventory                 │
   │                            │ ──────────────► PostgreSQL         │
   │ ◄───────────────────────── │                                    │
   │ 3. Vehicle list            │                                    │
   │                            │                                    │
   │ 4. View vehicle details    │                                    │
   │ ─────────────────────────► │                                    │
   │                            │ 5. Get Carfax report               │
   │                            │ ──────────────────────────────────►│ Carfax
   │                            │ ◄──────────────────────────────────│
   │ ◄───────────────────────── │                                    │
   │ 6. Vehicle + history       │                                    │
   │                            │                                    │
   │ 7. Apply for financing     │                                    │
   │ ─────────────────────────► │                                    │
   │                            │ 8. Soft credit pull                │
   │                            │ ──────────────────────────────────►│ Equifax
   │                            │ ◄──────────────────────────────────│
   │                            │                                    │
   │                            │ 9. Get offers from 6 lenders       │
   │                            │ ──────────────────────────────────►│ TD, RBC...
   │                            │ ◄──────────────────────────────────│
   │ ◄───────────────────────── │                                    │
   │ 10. Financing offers       │                                    │
   │                            │                                    │
   │ 11. Select offer + pay     │                                    │
   │ ─────────────────────────► │                                    │
   │                            │ 12. Process payment                │
   │                            │ ──────────────────────────────────►│ Stripe
   │                            │ ◄──────────────────────────────────│
   │                            │                                    │
   │                            │ 13. Create order                   │
   │                            │ ──────────────────► PostgreSQL     │
   │                            │                                    │
   │                            │ 14. Send confirmation              │
   │                            │ ──────────────────────────────────►│ SendGrid
   │ ◄───────────────────────── │                                    │
   │ 15. Order confirmation     │                                    │
   │                            │                                    │
   │ 16. Schedule delivery      │                                    │
   │ ─────────────────────────► │                                    │
   │                            │ 17. Create delivery                │
   │                            │ ──────────────────► PostgreSQL     │
   │ ◄───────────────────────── │                                    │
   │ 18. Delivery scheduled     │                                    │
```

### 4.2 Multi-Lender Financing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-LENDER FINANCING FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

CUSTOMER submits financing application
          │
          ▼
┌─────────────────────┐
│  FINANCING SERVICE  │
│  (Express.js)       │
└─────────────────────┘
          │
          │ 1. Soft credit pull (no score impact)
          ▼
┌─────────────────────┐
│    CREDIT BUREAUS   │
│  Equifax + TransU   │
└─────────────────────┘
          │
          │ 2. Credit score + report
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PARALLEL LENDER REQUESTS                              │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────��────────────┤
│ TD Auto │   RBC   │ Scotia  │   BMO   │  CIBC   │Desjard. │            │
│ Finance │         │  bank   │         │         │         │            │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤            │
│ 4.99%   │ 5.49%   │ 5.29%   │ 5.99%   │ 5.49%   │ 4.79%   │  RATES    │
│ 84 mo   │ 84 mo   │ 84 mo   │ 72 mo   │ 84 mo   │ 96 mo   │  TERMS    │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────────┘
          │
          │ 3. Aggregate and rank offers
          ▼
┌─────────────────────┐
│   OFFER RANKING     │
│   1. Best Rate      │
│   2. Lowest Payment │
│   3. Longest Term   │
└─────────────────────┘
          │
          │ 4. Present options to customer
          ▼
┌─────────────────────┐
│      CUSTOMER       │
│   Selects offer     │
└─────────────────────┘
          │
          │ 5. Hard credit pull + final approval
          ▼
┌─────────────────────┐
│   SELECTED LENDER   │
│   Final approval    │
│   Loan documents    │
└─────────────────────┘
```

---

## CI/CD Pipeline (GitHub Actions)

### Workflow

```yaml
workflow:
  1. Push to main branch
  2. Run tests (unit, Cypress)
  3. Build Docker images
  4. Push to ECR
  5. Deploy to staging (ECS)
  6. Run integration tests
  7. Manual approval
  8. Deploy to production (ECS)
  9. Health check
  10. Notify team
```

---

## Monitoring & Observability

### Metrics Dashboard

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| API Response Time (p99) | > 500ms | > 1000ms | Scale up, optimize queries |
| Error Rate | > 1% | > 5% | Alert on-call, investigate |
| CPU Utilization | > 70% | > 85% | Auto-scale triggers |
| Memory Utilization | > 75% | > 90% | Auto-scale triggers |
| Database Connections | > 80% | > 95% | Connection pooling |
| Redis Hit Rate | < 90% | < 80% | Review cache strategy |
| Kafka Lag | > 1000 | > 5000 | Scale consumers |

### Alerting Rules

```yaml
# CloudWatch Alarms

high_error_rate:
  metric: ErrorRate
  threshold: 5%
  period: 5 minutes
  action: PagerDuty critical

high_latency:
  metric: p99ResponseTime
  threshold: 1000ms
  period: 5 minutes
  action: PagerDuty warning

database_connections:
  metric: DatabaseConnections
  threshold: 95%
  period: 1 minute
  action: PagerDuty critical

payment_failures:
  metric: PaymentFailureRate
  threshold: 2%
  period: 5 minutes
  action: PagerDuty critical, SMS to finance team
```

### Tools

| Tool | Purpose |
|------|---------|
| CloudWatch | Metrics, logs, alarms |
| X-Ray | Distributed tracing |
| FullStory | Session replay |
| PagerDuty | Alerting |
| Sentry | Error tracking |
| Slack | Notifications |

---

## Carvana vs Clutch.ca Comparison

### Company Overview

| Metric | Clutch.ca (Canada) | Carvana (USA) |
|--------|-------------------|---------------|
| Founded | 2017 | 2012 |
| Headquarters | Toronto, Ontario | Tempe, Arizona |
| CEO | Dan Park | Ernest Garcia III |
| Employees | 392 | 5,000+ |
| Revenue (2024) | $320M CAD | $10.7B+ USD |
| Vehicles Sold (2024) | ~15,000 | 312,000+ |
| Public/Private | Private | Public (NYSE: CVNA) |
| Total Funding | $362M CAD | IPO (2017) + Debt |
| Profitability | Q3 2024 | EBITDA positive 2024 |
| Markets Served | 5 Canadian Provinces | 50 US States |
| Return Policy | 10-Day Return | 7-Day Return |
| Inspection Points | 210-point | 150-point |

### Technology Stack Comparison

| Component | Carvana | Clutch.ca |
|-----------|---------|-----------|
| Frontend | React 18 / TypeScript / Redux | React 18 / TypeScript / Context API |
| Backend | C# (.NET Core 8) | TypeScript (Node.js / Express.js) |
| Database | Azure SQL + Cosmos DB | PostgreSQL (AWS RDS) |
| Cloud | Microsoft Azure | Amazon Web Services |
| Container | Azure Kubernetes (AKS) | AWS ECS Fargate |
| CDN | Azure Front Door + Akamai | CloudFront + Fastly |

### API Strategy

| Aspect | Carvana | Clutch.ca |
|--------|---------|-----------|
| Primary API | REST | REST |
| GraphQL | Yes (Apollo Server) | No |
| Versioning | /api/v1/ | /api/v1/ |
| Authentication | JWT + OAuth 2.0 | JWT |
| Rate Limiting | Azure API Management | Express rate-limit |
| Documentation | OpenAPI 3.0 | OpenAPI 3.0 |

---

## Key Architecture Decisions

### 1. Why ECS Fargate over Kubernetes?

- **Simplicity**: No cluster management overhead
- **Cost**: Lower operational costs for smaller team
- **Scale**: Sufficient for current vehicle volume
- **Migration Path**: Can move to EKS when needed

### 2. Why PostgreSQL over DynamoDB?

- **Relational Data**: Orders, financing have complex relationships
- **Full-Text Search**: Built-in for vehicle search
- **ACID Compliance**: Critical for financial transactions
- **Cost**: More predictable pricing

### 3. Why Multi-Lender from Day 1?

- **Competition**: Better rates for customers
- **Approval Rates**: Higher overall approval
- **Revenue**: Lender kickbacks
- **Differentiation**: Key competitive advantage

---

## Environment Variables

### Application

```bash
NODE_ENV=production
APP_NAME=planetmotors
APP_URL=https://www.planetmotors.ca
API_URL=https://api.planetmotors.ca
ADMIN_URL=https://admin.planetmotors.ca
```

### Database & Cache

```bash
# PostgreSQL (AWS RDS)
DATABASE_URL=postgresql://planetmotors_admin:${DB_PASSWORD}@planetmotors-prod.xxxxx.ca-central-1.rds.amazonaws.com:5432/planetmotors
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_SSL=true

# Redis (AWS ElastiCache)
REDIS_URL=redis://planetmotors-cache.xxxxx.cache.amazonaws.com:6379
REDIS_TLS=true

# OpenSearch
OPENSEARCH_URL=https://planetmotors-search.ca-central-1.es.amazonaws.com
OPENSEARCH_INDEX_PREFIX=planetmotors
```

### AWS Services

```bash
AWS_REGION=ca-central-1
S3_BUCKET_VEHICLES=planetmotors-vehicle-images
S3_BUCKET_DOCUMENTS=planetmotors-documents
S3_BUCKET_INSPECTIONS=planetmotors-inspections
CLOUDFRONT_DISTRIBUTION_ID=EXXXXXXXXXX
CLOUDFRONT_DOMAIN=cdn.planetmotors.ca
```

### Authentication

```bash
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=12
OAUTH_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
OAUTH_GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
OAUTH_CALLBACK_URL=https://api.planetmotors.ca/auth/google/callback
```

### Payments (Stripe)

```bash
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
STRIPE_API_VERSION=2024-12-18
```

### Credit Bureaus

```bash
EQUIFAX_API_URL=https://api.equifax.ca
EQUIFAX_API_KEY=${EQUIFAX_API_KEY}
EQUIFAX_MEMBER_CODE=${EQUIFAX_MEMBER_CODE}
TRANSUNION_API_URL=https://api.transunion.ca
TRANSUNION_API_KEY=${TRANSUNION_API_KEY}
TRANSUNION_SUBSCRIBER_CODE=${TRANSUNION_SUBSCRIBER_CODE}
```

### Lender Integrations

```bash
TD_AUTO_API_URL=https://api.td.com/auto-finance
TD_AUTO_API_KEY=${TD_AUTO_API_KEY}
TD_AUTO_DEALER_ID=${TD_AUTO_DEALER_ID}
RBC_API_URL=https://api.rbc.com/financing
RBC_API_KEY=${RBC_API_KEY}
SCOTIA_API_URL=https://api.scotiabank.com/dealer-finance
SCOTIA_API_KEY=${SCOTIA_API_KEY}
BMO_API_URL=https://api.bmo.com/auto
BMO_API_KEY=${BMO_API_KEY}
CIBC_API_URL=https://api.cibc.com/vehicle-financing
CIBC_API_KEY=${CIBC_API_KEY}
DESJARDINS_API_URL=https://api.desjardins.com/auto
DESJARDINS_API_KEY=${DESJARDINS_API_KEY}
```

### Vehicle Data

```bash
CARFAX_API_URL=https://api.carfax.ca
CARFAX_API_KEY=${CARFAX_API_KEY}
CARFAX_DEALER_ID=${CARFAX_DEALER_ID}
CBB_API_URL=https://api.canadianblackbook.com
CBB_API_KEY=${CBB_API_KEY}
DATAONE_API_URL=https://api.dataonesoftware.com
DATAONE_API_KEY=${DATAONE_API_KEY}
```

### Communications

```bash
# Twilio
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
TWILIO_PHONE_NUMBER=+16475551234
TWILIO_MESSAGING_SERVICE_SID=${TWILIO_MESSAGING_SERVICE_SID}

# SendGrid
SENDGRID_API_KEY=${SENDGRID_API_KEY}
SENDGRID_FROM_EMAIL=hello@planetmotors.ca
SENDGRID_FROM_NAME=PlanetMotors

# HubSpot
HUBSPOT_API_KEY=${HUBSPOT_API_KEY}
HUBSPOT_PORTAL_ID=${HUBSPOT_PORTAL_ID}
```

### Analytics

```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=${GA4_API_SECRET}
FULLSTORY_ORG_ID=${FULLSTORY_ORG_ID}
OPTIMIZELY_SDK_KEY=${OPTIMIZELY_SDK_KEY}
```

### Insurance & Warranty

```bash
SONNET_API_URL=https://api.sonnet.ca
SONNET_API_KEY=${SONNET_API_KEY}
LUBRICO_API_URL=https://api.lubrico.ca
LUBRICO_API_KEY=${LUBRICO_API_KEY}
```

### Bank Verification

```bash
PLAID_CLIENT_ID=${PLAID_CLIENT_ID}
PLAID_SECRET=${PLAID_SECRET}
PLAID_ENV=production
```

### Monitoring

```bash
SENTRY_DSN=${SENTRY_DSN}
PAGERDUTY_API_KEY=${PAGERDUTY_API_KEY}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
```

### Feature Flags

```bash
FEATURE_MULTI_LENDER=true
FEATURE_TRADE_IN=true
FEATURE_HOME_DELIVERY=true
FEATURE_AB_TESTING=true
FEATURE_SESSION_REPLAY=true
```

### Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_FINANCING_MAX=10
```

---

## Pre-Launch Technical Review Checklist

| Category | Item | Status |
|----------|------|--------|
| **Infrastructure** | VPC and subnets configured | [ ] |
| **Infrastructure** | Security groups locked down | [ ] |
| **Infrastructure** | ECS cluster running | [ ] |
| **Infrastructure** | RDS Multi-AZ enabled | [ ] |
| **Infrastructure** | ElastiCache cluster running | [ ] |
| **Infrastructure** | OpenSearch domain ready | [ ] |
| **Infrastructure** | S3 buckets created | [ ] |
| **Infrastructure** | CloudFront distribution active | [ ] |
| **Infrastructure** | SSL certificates installed | [ ] |
| **Infrastructure** | DNS records configured | [ ] |
| **Security** | AWS Shield Advanced enabled | [ ] |
| **Security** | WAF rules configured | [ ] |
| **Security** | Secrets in Secrets Manager | [ ] |
| **Security** | IAM roles follow least privilege | [ ] |
| **Security** | PCI DSS compliance verified | [ ] |
| **Security** | PIPEDA compliance verified | [ ] |
| **Database** | Schema migrations complete | [ ] |
| **Database** | Tax rates loaded | [ ] |
| **Database** | Lenders configured | [ ] |
| **Database** | Hubs created | [ ] |
| **Database** | Inspection templates loaded | [ ] |
| **Database** | Backup policy configured | [ ] |
| **Integrations** | Stripe webhooks configured | [ ] |
| **Integrations** | Carfax API tested | [ ] |
| **Integrations** | CBB API tested | [ ] |
| **Integrations** | Equifax API tested | [ ] |
| **Integrations** | TransUnion API tested | [ ] |
| **Integrations** | All 6 lender APIs tested | [ ] |
| **Integrations** | Twilio verified | [ ] |
| **Integrations** | SendGrid domain verified | [ ] |
| **Integrations** | HubSpot connected | [ ] |
| **Analytics** | GA4 configured | [ ] |
| **Analytics** | FullStory installed | [ ] |
| **Analytics** | Optimizely configured | [ ] |
| **Monitoring** | CloudWatch dashboards created | [ ] |
| **Monitoring** | X-Ray tracing enabled | [ ] |
| **Monitoring** | PagerDuty alerts configured | [ ] |
| **Monitoring** | Slack notifications setup | [ ] |
| **Testing** | Unit tests passing | [ ] |
| **Testing** | E2E tests passing | [ ] |
| **Testing** | Load testing complete | [ ] |
| **Testing** | Security scan passed | [ ] |
| **Documentation** | API documentation complete | [ ] |
| **Documentation** | Runbook created | [ ] |
| **Documentation** | Incident response plan | [ ] |

---

## Winner Summary Table

| Category | Selected | Rationale |
|----------|----------|-----------|
| **Cloud Provider** | AWS | Canadian region, better documentation |
| **Container Orchestration** | ECS Fargate | Simpler than Kubernetes |
| **Backend Language** | Node.js/TypeScript | Faster development cycle |
| **Database** | PostgreSQL | Open source, powerful |
| **Search** | OpenSearch | Better scalability |
| **Security** | Multi-layer (Shield, WAF, mTLS) | Enterprise-grade protection |
| **Authentication** | JWT + OAuth 2.0 | Flexible, modern |
| **Financing** | Multi-lender (6 Canadian banks) | Better rates for customers |
| **Analytics** | FullStory + Optimizely | Session replay + A/B testing |
| **Return Policy** | 10-day | Customer-friendly |
| **Inspection** | 210-point | More thorough quality assurance |
| **CRM** | HubSpot | Cost-effective for growth |
| **Vehicle Valuation** | Canadian Black Book | Canadian market standard |
| **Tax System** | Provincial HST/GST/PST | Full Canadian compliance |
| **CI/CD** | GitHub Actions | Better developer experience |

---

*Document Version: 1.0*
*Last Updated: March 2026*
*Classification: Internal Use Only*
