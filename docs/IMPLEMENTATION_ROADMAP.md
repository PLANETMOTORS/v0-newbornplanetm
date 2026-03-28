# Planet Motors - Implementation Roadmap

**TOTAL ESTIMATED: ~$245,000 CAD/month**

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Months 1-3)

| Week | Deliverable |
|------|-------------|
| 1-2 | AWS infrastructure setup (VPC, ECS, RDS) |
| 3-4 | Authentication service + Customer service |
| 5-6 | Inventory service + Media service |
| 7-8 | Search service (OpenSearch integration) |
| 9-10 | Frontend foundation (React, Tailwind) |
| 11-12 | Vehicle browsing + Search UI |

### Phase 2: Core Commerce (Months 4-6)

| Week | Deliverable |
|------|-------------|
| 13-14 | Order service |
| 15-16 | Payment service (Stripe integration) |
| 17-18 | Single lender financing integration |
| 19-20 | Checkout flow UI |
| 21-22 | Order management UI |
| 23-24 | Admin dashboard foundation |

### Phase 3: Advanced Features (Months 7-9)

| Week | Deliverable |
|------|-------------|
| 25-26 | Multi-lender financing (add 5 more lenders) |
| 27-28 | Trade-in service (CBB integration) |
| 29-30 | Delivery service + scheduling |
| 31-32 | 10-day return process |
| 33-34 | 210-point inspection system |
| 35-36 | Document management |

### Phase 4: Optimization (Months 10-12)

| Week | Deliverable |
|------|-------------|
| 37-38 | Performance optimization |
| 39-40 | Analytics + reporting dashboards |
| 41-42 | A/B testing framework |
| 43-44 | Mobile optimization |
| 45-46 | Load testing + security audit |
| 47-48 | Launch preparation + go-live |

---

## 6. COST ESTIMATION (Monthly CAD)

### AWS Services

| Service | Configuration | Cost |
|---------|---------------|------|
| ECS Fargate | 14 services, auto-scaling | $3,000 |
| RDS PostgreSQL | db.r6g.large, Multi-AZ | $1,200 |
| ElastiCache Redis | cache.r6g.large | $400 |
| OpenSearch | 3 nodes, m5.xlarge | $500 |
| Amazon SNS | High volume | $200 |
| Amazon SQ | High volume | $200 |
| S3 Storage | 5TB + requests | $800 |
| CloudFront | 10TB transfer | $800 |
| Data Transfer | Inter-region, internet | $4,200 |
| **AWS Subtotal** | | **$14,000** |

### Third-Party Services

| Service | Configuration | Cost |
|---------|---------------|------|
| Stripe | 2.9% + $0.30 per transaction | Variable |
| Twilio | SMS + Voice | $800 |
| SendGrid | Pro plan | $200 |
| HubSpot | Professional | $1,000 |
| FullStory | Business | $1,000 |
| Optimizely | Web experimentation | $2,000 |
| CarFax API | Per report | $500 |
| CBB API | Subscription | $500 |
| **Third-Party Subtotal** | | **$10,000** |

**TOTAL ESTIMATED: ~$24,000 CAD/month**

---

## 5. WINNER SUMMARY TABLE

| Category | Selected | Rationale |
|----------|----------|-----------|
| Cloud Provider | AWS | Canadian region, better documentation |
| Container Orchestration | ECS Fargate | Simpler than Kubernetes |
| Backend Language | Node.js/TypeScript | Faster development cycle |
| Database | PostgreSQL | Better scalability |
| Search | OpenSearch | Enterprise-grade protection |
| Security | Multi-layer (Shield, WAF, mTLS pattern) | Enterprise-grade protection |
| Authentication | JWT + OAuth 2.0 | Flexible, modern |
| Financing | Multi-lender (6 Canadian banks) | Better rates for customers |
| Analytics | FullStory + Optimizely | Session replay + A/B testing |
| Return Policy | 10-day | Customer-friendly |
| Inspection | 210-point | More thorough quality assurance |
| CRM | HubSpot | Cost-effective for growth |
| Vehicle Valuation | Canadian Black Book | Canadian market standard |
| Tax System | Provincial HST/GST/PST | Full Canadian compliance |
| CI/CD | GitHub Actions | Better developer experience |

---

## 3. ENVIRONMENT VARIABLES

```bash
# PLANETMOTORS PRODUCTION ENVIRONMENT VARIABLES

# APPLICATION
NODE_ENV=production
API_NAME=planetmotors
API_URL=https://api.planetmotors.ca

# DATABASE (PostgreSQL on AWS RDS)
DATABASE_URL=postgresql://planetmotors_admin:${DB_PASSWORD}@planetmotors-prod.cluster-xxxxx.ca-central-1.rds.amazonaws.com:5432/planetmotors
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# REDIS (AWS ElastiCache)
REDIS_URL=redis://planetmotors-cache.xxxxx.cache.amazonaws.com:6379
REDIS_TLS=true

# OPENSEARCH
OPENSEARCH_URL=https://planetmotors-search.ca-central-1.es.amazonaws.com
OPENSEARCH_INDEX_PREFIX=planetmotors

# STRIPE
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# TWILIO
TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
TWILIO_PHONE_NUMBER=+1866PLANET

# SENDGRID
SENDGRID_API_KEY=${SENDGRID_API_KEY}
SENDGRID_FROM_EMAIL=noreply@planetmotors.ca

# HUBSPOT
HUBSPOT_API_KEY=${HUBSPOT_API_KEY}
HUBSPOT_PORTAL_ID=xxxxx

# CARFAX
CARFAX_API_KEY=${CARFAX_API_KEY}
CARFAX_API_URL=https://api.carfax.ca/v1

# CANADIAN BLACK BOOK
CBB_API_KEY=${CBB_API_KEY}
CBB_API_URL=https://api.cbb.ca/v2

# LENDER APIS
TD_API_URL=https://api.tdautofinance.ca
TD_API_KEY=${TD_API_KEY}
RBC_API_URL=https://api.rbcautofinance.ca
RBC_API_KEY=${RBC_API_KEY}
SCOTIA_API_URL=https://api.scotiabankdealerfinance.ca
SCOTIA_API_KEY=${SCOTIA_API_KEY}
BMO_API_URL=https://api.bmoautofinance.ca
BMO_API_KEY=${BMO_API_KEY}
CIBC_API_URL=https://api.cibcautofinance.ca
CIBC_API_KEY=${CIBC_API_KEY}
DESJARDINS_API_URL=https://api.desjardinsauto.ca
DESJARDINS_API_KEY=${DESJARDINS_API_KEY}

# ANALYTICS
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
FULLSTORY_ORG_ID=xxxxx
OPTIMIZELY_SDK_KEY=xxxxx

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# AWS
AWS_REGION=ca-central-1
AWS_S3_BUCKET=planetmotors-media
AWS_CLOUDFRONT_DISTRIBUTION=xxxxx
```

---

## 4. TECHNICAL REVIEW CHECKLIST

### Pre-Launch Checklist

| Category | Item | Status |
|----------|------|--------|
| **Infrastructure** | VPC and subnets configured | [ ] |
| Infrastructure | Security groups locked down | [ ] |
| Infrastructure | ECS cluster running | [ ] |
| Infrastructure | RDS Multi-AZ enabled | [ ] |
| Infrastructure | ElastiCache cluster running | [ ] |
| Infrastructure | OpenSearch domain ready | [ ] |
| Infrastructure | S3 buckets created | [ ] |
| Infrastructure | CloudFront distribution active | [ ] |
| Infrastructure | SSL certificates installed | [ ] |
| Infrastructure | DNS records configured | [ ] |
| **Security** | AWS Shield Advanced enabled | [ ] |
| Security | WAF rules configured | [ ] |
| Security | Secrets in Secrets Manager | [ ] |
| Security | IAM roles follow least privilege | [ ] |
| Security | PCI-DSS compliance verified | [ ] |
| Security | PIPEDA compliance verified | [ ] |
| **Database** | Schema migrations complete | [ ] |
| Database | Tax rates loaded | [ ] |
| Database | Lenders configured | [ ] |
| Database | Hubs created | [ ] |
| Database | Inspection templates loaded | [ ] |
| Database | Backup policy configured | [ ] |
| **Integrations** | Stripe webhooks configured | [ ] |
| Integrations | CarFax API tested | [ ] |
| Integrations | CBB API tested | [ ] |
| Integrations | Equifax API tested | [ ] |
| Integrations | TransUnion API tested | [ ] |
| Integrations | All 6 lender APIs tested | [ ] |
| Integrations | Twilio verified | [ ] |
| Integrations | SendGrid domain verified | [ ] |
| Integrations | HubSpot connected | [ ] |
| **Analytics** | GA4 configured | [ ] |
| Analytics | FullStory installed | [ ] |
| Analytics | Optimizely configured | [ ] |
| **Monitoring** | CloudWatch dashboards created | [ ] |
| Monitoring | X-Ray tracing enabled | [ ] |
| Monitoring | PagerDuty alerts configured | [ ] |
| Monitoring | Slack notifications setup | [ ] |
| **Testing** | Unit tests passing | [ ] |
| Testing | E2E tests passing | [ ] |
| Testing | Load testing complete | [ ] |
| Testing | Security audit passed | [ ] |
| **Documentation** | API documentation complete | [ ] |
| Documentation | Runbook created | [ ] |
| Documentation | Incident response plan | [ ] |
