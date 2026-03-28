# Planet Motors - Network Architecture

## DOCUMENT 2: ENTERPRISE ARCHITECTURE & SYSTEM DESIGN

---

## 1. ARCHITECTURE PRINCIPLES

| Principle | Description |
|-----------|-------------|
| **Simplicity First** | ECS over Kubernetes, single database, REST APIs |
| **Scale When Needed** | Auto-scaling, multi-tenancy, start horizontal when required |
| **Security Always** | Multi-layer security, encryption everywhere |
| **Customer-Centric** | 10-day returns, 210-point inspection, multi-lender financing |
| **Data-Driven** | FullStory for UX, Optimizely for experiments |
| **Canadian-First** | Data residency, provincial taxes, local lenders |

---

## 2. SYSTEM CONTEXT DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SYSTEMS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  VEHICLE DATA         │  CREDIT & FINANCING      │  PAYMENTS               │
│  ┌──────────────┐    │  ┌────────────────────┐  │  ┌─────────────────┐    │
│  │ CarFax      │    │  │ Equifax CA        │  │  │ Stripe         │    │
│  │ CBB         │    │  │ TransUnion CA     │  │  │ Plaid          │    │
│  │ Database    │    │  │ TD Auto           │  │  │ Interac        │    │
│  └──────────────┘    │  │ RBC              │  │  └─────────────────┘    │
│                      │  │ Scotiabank       │  │                         │
│  ANALYTICS          │  │ BMO              │  │  COMMUNICATIONS         │
│  ┌──────────────┐    │  │ CIBC             │  │  ┌─────────────────┐    │
│  │ GA4         │    │  │ Desjardins       │  │  │ Twilio         │    │
│  │ FullStory   │    │  └────────────────────┘  │  │ SendGrid       │    │
│  │ Optimizely  │    │                         │  │ HubSpot        │    │
│  └──────────────┘    │  INSURANCE             │  └─────────────────┘    │
│                      │  ┌────────────────────┐  │                         │
│                      │  │ Sonnet           │  │                         │
│                      │  │ Loblaw           │  │                         │
│                      │  └────────────────────┘  │                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. NETWORK ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VPC: 10.0.0.0/16                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┬─────────────────────┬─────────────────────┐       │
│  │  AVAILABILITY       │  AVAILABILITY       │  AVAILABILITY       │       │
│  │  ZONE A             │  ZONE B             │  ZONE C             │       │
│  ├─────────────────────┼─────────────────────┼─────────────────────┤       │
│  │                     │                     │                     │       │
│  │  Public Subnet      │  Public Subnet      │  Public Subnet      │       │
│  │  10.0.1.0/24        │  10.0.2.0/24        │  10.0.3.0/24        │       │
│  │  ┌───────────────┐  │  ┌───────────────┐  │  ┌───────────────┐  │       │
│  │  │ - NAT Gateway │  │  │ - NAT Gateway │  │  │ - NAT Gateway │  │       │
│  │  │ - ALB         │  │  │ - ALB         │  │  │ - ALB         │  │       │
│  │  │ - Bastion Host│  │  │               │  │  │               │  │       │
│  │  └───────────────┘  │  └───────────────┘  │  └───────────────┘  │       │
│  │                     │                     │                     │       │
│  ├─────────────────────┼─────────────────────┼─────────────────────┤       │
│  │                     │                     │                     │       │
│  │  Private Subnet     │  Private Subnet     │  Private Subnet     │       │
│  │  10.0.4.0/24        │  10.0.5.0/24        │  10.0.6.0/24        │       │
│  │  ┌───────────────┐  │  ┌───────────────┐  │  ┌───────────────┐  │       │
│  │  │ - ECS Tasks   │  │  │ - ECS Tasks   │  │  │ - ECS Tasks   │  │       │
│  │  │ - RDS (Primary│  │  │ - RDS (Standby│  │  │               │  │       │
│  │  │ - ElastiCache │  │  │ - ElastiCache │  │  │ - ElastiCache │  │       │
│  │  │ - OpenSearch  │  │  │ - OpenSearch  │  │  │ - OpenSearch  │  │       │
│  │  │ - MQ Broker   │  │  │ - MQ Broker   │  │  │ - MQ Broker   │  │       │
│  │  └───────────────┘  │  └───────────────┘  │  └───────────────┘  │       │
│  │                     │                     │                     │       │
│  └─────────────────────┴─────────────────────┴─────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────────┐
                              │    AWS ca-central-1  │
                              │      (Montreal)      │
                              └──────────────────────┘

                                  ┌────────────┐
                                  │ EDGE LAYER │
                                  └────────────┘
```

### Security Groups

```
- alb-sg: 443 from 0.0.0.0/0
- ecs-sg: 3000 from alb-sg
- rds-sg: 5432 from ecs-sg
- redis-sg: 6379 from ecs-sg
- opensearch-sg: 443 from ecs-sg
- mq-sg: 5672 from ecs-sg
```

---

## 4. DATA FLOW DIAGRAMS

### 4.1 Vehicle Purchase Flow

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│     CUSTOMER     │         │   PLANETMOTORS   │         │    EXTERNAL      │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│                  │         │                  │         │                  │
│ 1. Browse        │────────>│                  │         │                  │
│    vehicles      │         │ 2. Query inventory│───────>│ PostgreSQL       │
│                  │<────────│                  │<────────│                  │
│                  │         │                  │         │                  │
│ 3. Vehicle list  │         │                  │         │                  │
│                  │         │                  │         │                  │
│ 4. View vehicle  │────────>│                  │         │                  │
│    details       │         │                  │         │                  │
│                  │         │ 5. Get CarFax    │────────>│ CarFax           │
│                  │<────────│    report        │<────────│                  │
│                  │         │                  │         │                  │
│ 6. Vehicle +     │         │                  │         │                  │
│    history       │         │                  │         │                  │
│                  │         │                  │         │                  │
│ 7. Apply for     │────────>│                  │         │                  │
│    financing     │         │ 8. Soft credit   │────────>│ Equifax          │
│                  │         │    pull          │<────────│                  │
│                  │         │                  │         │                  │
│                  │         │ 9. Get offers    │────────>│ TD, RBC,         │
│                  │<────────│    from 6 lenders│<────────│ Scotia, BMO,     │
│                  │         │                  │         │ CIBC, Desjardins │
│10. Financing     │         │                  │         │                  │
│    offers        │         │                  │         │                  │
│                  │         │                  │         │                  │
│11. Select offer  │────────>│                  │         │                  │
│    + pay         │         │12. Process       │────────>│ Stripe           │
│                  │<────────│    payment       │<────────│                  │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

### 4.2 Multi-Lender Financing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MULTI-LENDER FINANCING FLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Customer Application                                                       │
│        │                                                                    │
│        ▼                                                                    │
│  ┌─────────────────┐                                                        │
│  │ Credit Check    │──── Soft Pull via Equifax/TransUnion                   │
│  │ (Soft Pull)     │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PARALLEL LENDER REQUESTS                          │   │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌──────────┐         │   │
│  │  │ TD  │  │ RBC │  │SCOTI│  │ BMO │  │CIBC │  │DESJARDINS│         │   │
│  │  │4.79%│  │4.99%│  │5.19%│  │5.49%│  │5.79%│  │  6.99%   │         │   │
│  │  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └────┬─────┘         │   │
│  │     │        │        │        │        │          │                │   │
│  └─────┴────────┴────────┴────────┴────────┴──────────┴────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│                      ┌─────────────────────────────┐                        │
│                      │  Aggregate & Rank Offers    │                        │
│                      │  (Best rate first)          │                        │
│                      └──────────────┬──────────────┘                        │
│                                     │                                        │
│                                     ▼                                        │
│                      ┌─────────────────────────────┐                        │
│                      │  Display Offers to Customer │                        │
│                      └─────────────────────────────┘                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. MICROSERVICES ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PLANETMOTORS SERVICES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CORE SERVICES (ECS Fargate)                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │ api-gateway │  │ auth-svc    │  │ customer-svc│  │ vehicle-svc │ │  │
│  │  │ (Kong)      │  │ (JWT/OAuth) │  │             │  │             │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │ order-svc   │  │financing-svc│  │ payment-svc │  │ delivery-svc│ │  │
│  │  │             │  │ (6 lenders) │  │ (Stripe)    │  │             │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │ trade-in-svc│  │ return-svc  │  │inspect-svc  │  │ search-svc  │ │  │
│  │  │ (CBB)       │  │ (10-day)    │  │ (210-point) │  │ (OpenSearch)│ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐                                    │  │
│  │  │ media-svc   │  │notification │                                    │  │
│  │  │ (S3/CF)     │  │ (Twilio/SG) │                                    │  │
│  │  └─────────────┘  └─────────────┘                                    │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  DATA LAYER                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │ PostgreSQL  │  │ Redis       │  │ OpenSearch  │  │ S3          │ │  │
│  │  │ (RDS)       │  │ (ElastiCache│  │             │  │             │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
