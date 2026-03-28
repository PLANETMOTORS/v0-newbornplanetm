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
