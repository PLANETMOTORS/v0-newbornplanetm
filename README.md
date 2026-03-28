# Planet Motors

> Canada's Premier Online Used Car Marketplace - Better than Clutch, Smarter than Carvana

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.0-blue.svg)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org)

## What Makes Planet Motors Different

| Feature | Planet Motors | Clutch | Carvana |
|---------|--------------|--------|---------|
| Inspection Points | **210-point** | 200-point | 150-point |
| Return Policy | **10 days** | 10 days | 7 days |
| Lender Network | **6 Canadian Banks** | 3 lenders | 1 in-house |
| Home Delivery | **Free 250km** | $299 | $599 |
| Trade-In Valuation | **Instant CBB + Photos** | Next-day | 2-3 days |
| Price Transparency | **Full breakdown** | Hidden fees | Add-ons |
| 360° Vehicle Views | **Interactive AVIF** | Static photos | Basic 360 |
| EV Battery Health | **Full report** | Not offered | Basic |

## Quick Start

```bash
# Clone the repository
git clone https://github.com/planetmotors/planetmotors-app.git
cd planetmotors-app

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0
- **Components**: shadcn/ui + Radix UI
- **State**: React 19 + SWR
- **3D/360 Viewer**: Custom AVIF-optimized viewer

### Backend
- **Runtime**: Node.js 20 LTS
- **API Framework**: Express.js 4.x
- **Database**: PostgreSQL 15 (AWS RDS)
- **Cache**: Redis 7 (AWS ElastiCache)
- **Search**: OpenSearch 2.x
- **Queue**: Apache Kafka (AWS MSK)

### Infrastructure
- **Cloud**: AWS (ca-central-1 Montreal)
- **Container**: ECS Fargate
- **CDN**: CloudFront + imgix
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Security**: AWS Shield Advanced + WAF

## Project Structure

```
planetmotors/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (marketing)/       # Public marketing pages
│   ├── account/           # Customer dashboard
│   ├── api/               # API routes
│   ├── financing/         # Multi-lender financing
│   ├── inventory/         # Vehicle listings
│   ├── sell/              # Sell your car
│   ├── trade-in/          # Trade-in valuation
│   └── vehicles/          # Vehicle detail pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   ├── vehicle/          # Vehicle-specific components
│   └── layout/           # Layout components
├── lib/                   # Utilities and helpers
│   ├── api/              # API client functions
│   ├── db/               # Database utilities
│   └── utils/            # General utilities
├── docs/                  # Technical documentation
├── infrastructure/        # Terraform configs
├── scripts/              # Database migrations, seeds
└── public/               # Static assets
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Required for development
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_test_...
CARFAX_API_KEY=...
CBB_API_KEY=...
```

See [.env.example](.env.example) for all available options.

## API Documentation

Interactive API documentation available at `/api/docs` when running locally.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/vehicles` | GET | List vehicles with filtering |
| `/api/v1/vehicles/:id` | GET | Get vehicle details |
| `/api/v1/vehicles/:id/inspection` | GET | Get 210-point inspection |
| `/api/v1/financing/prequalify` | POST | Soft credit pull |
| `/api/v1/financing/offers` | GET | Get multi-lender offers |
| `/api/v1/trade-in/instant-offer` | POST | Get instant trade-in offer |
| `/api/v1/orders` | POST | Create purchase order |
| `/api/v1/deliveries` | POST | Schedule delivery |

## Database Schema

Key tables:
- `vehicles` - 50+ fields including EV battery health
- `inspections` - 210-point inspection results
- `financing_applications` - Multi-lender applications
- `financing_offers` - Offers from 6 Canadian banks
- `trade_ins` - CBB-powered valuations
- `orders` - Full purchase workflow
- `deliveries` - Scheduling and tracking

See [COMPLETE_DATABASE_SCHEMA.md](docs/COMPLETE_DATABASE_SCHEMA.md) for full schema.

## Development

```bash
# Run development server
pnpm dev

# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm typecheck

# Build for production
pnpm build
```

## Deployment

### Vercel (Recommended for Frontend)
```bash
vercel --prod
```

### AWS ECS (Backend Services)
```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

## Security

- PIPEDA compliant (Canadian privacy)
- PCI DSS Level 1 (Stripe tokenization)
- OMVIC/AMVIC compliant (dealer regulations)
- AWS Shield Advanced + WAF
- JWT + OAuth 2.0 authentication
- All data in ca-central-1 (Montreal)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contact

- **Website**: [planetmotors.ca](https://www.planetmotors.ca)
- **Phone**: 1-866-787-3332
- **Local**: 416-985-2277
- **Email**: info@planetmotors.ca
- **Address**: 30 Major Mackenzie E, Richmond Hill, ON L4C 1G7

---

Built with precision in Canada. OMVIC Licensed Dealer.
