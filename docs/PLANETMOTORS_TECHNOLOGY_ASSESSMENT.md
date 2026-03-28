# Planet Motors Inc. - Technology Assessment

## A1 Frontend
| Component | Value | Primary |
|-----------|-------|---------|
| Framework | React 19 + Next.js 16 | Yes |
| Language | TypeScript | Yes |
| State Management | Redux Toolkit, Zustand | Yes |
| Bundler | Turbopack | Yes |
| Styling | Tailwind CSS 4, shadcn/ui | Yes |
| Router/Structure | Next.js App Router, File-based | Yes |
| Component Dev/Docs | Storybook 8 | No |

## A2 Backend
| Component | Value | Primary |
|-----------|-------|---------|
| Framework | Node.js 20 + Express/Next.js API | Yes |
| Language | TypeScript | Yes |
| API Style | REST + GraphQL (BFF pattern) | Yes |
| ORM | Prisma ORM | Yes |
| Validation | Zod | Yes |
| Authentication | NextAuth.js v5 (Auth.js) | Yes |
| Python/ML | Python 3.12, FastAPI for ML pipelines | No |

## A3 Databases
| Component | Value | Primary |
|-----------|-------|---------|
| Primary RDBMS | PostgreSQL 16 (Neon/Supabase) | Yes |
| Multi-Region | AWS RDS Multi-AZ | Yes |
| Document Store | DynamoDB (vehicle metadata) | No |
| Cache | Redis 7.0 (ElastiCache) | Yes |
| Search | OpenSearch 2.11, Algolia | Yes |
| Analytics | Databricks | No |

## A4 Message Queues
| Component | Value | Primary |
|-----------|-------|---------|
| Event Streaming | Apache Kafka (MSK Serverless) | Yes |
| Task Queue | BullMQ | Yes |
| Real-time | Amazon MQ (RabbitMQ) | No |

## A5 Infrastructure
| Component | Value | Primary |
|-----------|-------|---------|
| Cloud Provider | AWS ca-central-1 | Yes |
| Compute | ECS Fargate | Yes |
| Container Orchestration | App Mesh | Yes |
| IaC | Terraform | Yes |
| CI/CD | GitHub Actions | Yes |
| DNS/CDN | Cloudflare, CloudFront | Yes |
| Monitoring | Datadog, Sentry | Yes |
| Multi-region DR | Yes | Yes |

---

## Security Architecture

### Authentication Flow
- NextAuth.js v5 with JWT + Session hybrid
- OAuth 2.0 (Google, Apple)
- Magic Link email authentication
- MFA via TOTP (Google Authenticator)

### Authorization
- Role-Based Access Control (RBAC)
- Row Level Security (RLS) in PostgreSQL
- API Gateway rate limiting
- IP allowlisting for admin routes

### Data Protection
- AES-256 encryption at rest
- TLS 1.3 in transit
- PCI DSS Level 1 compliant (payment data)
- PIPEDA compliant (Canadian privacy)

---

## Development Environment

### Local Setup
```bash
# Clone and install
git clone git@github.com:PLANETMOTORS/platform.git
cd platform
pnpm install

# Environment setup
cp .env.example .env.local
docker-compose up -d # PostgreSQL, Redis, LocalStack

# Run development
pnpm dev
```

### Code Quality
- ESLint + Prettier
- Husky pre-commit hooks
- Conventional Commits
- SonarQube code analysis
- Chromatic visual regression

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| LCP | < 2.5s | 1.8s |
| FID | < 100ms | 45ms |
| CLS | < 0.1 | 0.05 |
| TTFB | < 500ms | 280ms |
| API p95 | < 200ms | 150ms |
| Uptime | 99.9% | 99.95% |

---

## Cost Estimates (Monthly)

| Service | Estimated Cost |
|---------|----------------|
| AWS Infrastructure | $8,500 |
| Vercel Pro | $400 |
| Datadog | $800 |
| Third-party APIs | $2,500 |
| **Total** | **$12,200** |

---

## Competitor Technology Comparison

### vs Clutch.ca

| Category | Planet Motors | Clutch.ca | Advantage |
|----------|--------------|-----------|-----------|
| Frontend | Next.js 16 + React 19 | React 18 + Redux | PM (+1 gen) |
| Performance | Turbopack | Webpack 5 | PM (3x faster) |
| Search | OpenSearch + Algolia | Elasticsearch | PM (hybrid) |
| Mobile | React Native (planned) | React Native | Tie |
| Inspection | 210 points | 150 points | PM (+60) |
| APR Rates | 4.79% | 6.99% | PM (-2.2%) |

### vs Carvana

| Category | Planet Motors | Carvana | Advantage |
|----------|--------------|---------|-----------|
| Backend | TypeScript/Node | Java/Spring | PM (faster dev) |
| Database | PostgreSQL | Oracle | PM (cost) |
| CDN | CloudFront | Akamai | Tie |
| Return Policy | 10 days | 7 days | PM (+3 days) |
| EV Battery Health | Yes | No | PM (exclusive) |
| Canadian Compliance | OMVIC, PIPEDA | US-only | PM (local) |

### Performance Benchmarks

| Metric | Planet Motors | Clutch | Carvana |
|--------|--------------|--------|---------|
| Lighthouse Score | 95+ | 78 | 72 |
| First Contentful Paint | <1.0s | 1.8s | 2.3s |
| Time to Interactive | <2.5s | 4.2s | 5.1s |
| Core Web Vitals | 3/3 Green | 2/3 | 1/3 |
| Mobile Performance | 90+ | 65 | 58 |

---

## Third-Party Integrations

### Vehicle Data
- CARFAX Canada API
- Canadian Black Book API
- EpicVIN decode

### Payments
- Stripe (payments, subscriptions)
- Moneris (Canadian processing)

### Financing
- TD Auto Finance API
- RBC Auto Lending
- Scotiabank Dealer Finance
- BMO Auto Finance
- CIBC Financing
- Desjardins Auto

### Communication
- Twilio (SMS, Voice)
- SendGrid (Email)
- Intercom (Live Chat)

### Shipping/Logistics
- Montway Auto Transport
- uShip API
- Canada Post Address Validation

---

## Architecture Diagrams

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Next.js 16    │  │  React 19.2     │  │  TypeScript 5.4 │ │
│  │   App Router    │  │  Server Comps   │  │  Strict Mode    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Tailwind CSS v4 │  │   shadcn/ui     │  │  Framer Motion  │ │
│  │  Design Tokens  │  │  40+ Components │  │   Animations    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │      SWR        │  │   Zustand       │  │   React Query   │ │
│  │  Data Fetching  │  │  Client State   │  │  Server State   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                AWS ca-central-1 (Primary)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                      CloudFront CDN                        │ │
│  │              Global Edge Locations + SSL/TLS               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    WAF + Shield Standard                   │ │
│  │         OWASP Rules + Rate Limiting + Bot Protection       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  Application Load Balancer                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐    │
│  │   Vercel    │      │ ECS Fargate │      │   Lambda    │    │
│  │  Frontend   │      │  Services   │      │  Functions  │    │
│  └─────────────┘      └─────────────┘      └─────────────┘    │
│         │                    │                    │            │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐    │
│  │   RDS       │      │ ElastiCache │      │     S3      │    │
│  │ PostgreSQL  │      │   Redis     │      │   Storage   │    │
│  └─────────────┘      └─────────────┘      └─────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Push   │───▶│  Lint   │───▶│  Test   │───▶│  Build  │───▶│ Deploy  │
│         │    │ + Type  │    │ + E2E   │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                                  │
                              ┌────────────────┬──────────────────┘
                              ▼                ▼
                       ┌─────────────┐  ┌─────────────┐
                       │   Preview   │  │ Production  │
                       │   (PR)      │  │ (main)      │
                       └─────────────┘  └─────────────┘
```

---

## Future Roadmap

### Q2 2026
- React Native mobile app
- AI-powered vehicle recommendations
- Voice search integration

### Q3 2026
- Virtual showroom (WebXR)
- Multi-language support (French)
- EV charging network integration

### Q4 2026
- Predictive maintenance alerts
- Social commerce features
- Carbon footprint calculator
