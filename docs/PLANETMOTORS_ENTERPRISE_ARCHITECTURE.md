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

## System Context

### External Systems

```
EXTERNAL SYSTEMS
├── CARFAX (Valuation)
├── Canadian Black Book (Valuation)
├── EasyDeal Canada (Clutch!)
├── TransUnion Canada (Credit!)
├── TD Auto Finance (Lender)
├── RBC (Lender)
├── Scotiabank (Lender)
├── BMO (Lender)
├── CIBC (Lender)
├── Desjardins (Lender)
├── Stripe (Payments)
├── Twilio (SMS/Voice)
├── SendGrid (Email)
├── FullStory (Analytics)
└── Optimizely (A/B Testing)

PLANET MOTORS PLATFORM (AWS ca-central-1)
├── CloudFront + WAF + Shield
├── Application Load Balancers
├── ECS Fargate Cluster (10 services)
├── RDS PostgreSQL
├── ElastiCache Redis
├── OpenSearch
├── S3
├── SQS
├── MSK (Kafka)
└── Amazon MQ (RabbitMQ)
```

---

## Network Architecture

### VPC Configuration

```
VPC: 10.0.0.0/16

Public Subnets (10.0.200.0/24, 10.0.102.0/24, 10.0.103.0/24):
├── NAT Gateways
├── Application Load Balancers
└── Bastion Hosts

Private Subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24):
├── ECS Fargate Services
├── RDS PostgreSQL
├── ElastiCache Redis
├── OpenSearch
└── Amazon MQ
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

| Tool | Purpose | Source |
|------|---------|--------|
| CloudWatch | Metrics, logs, alarms | Clutch |
| X-Ray | Distributed tracing | Clutch |
| FullStory | Session replay | Carvana |
| PagerDuty | Alerting | Carvana |

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

*Document Version: 1.0*
*Last Updated: March 2026*
*Classification: Internal Use Only*
