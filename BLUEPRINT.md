# Planet Motors - Site Blueprint

## Overview
Planet Motors is a full-stack automotive e-commerce platform built with Next.js 15, featuring vehicle inventory management, financing, trade-in services, and comprehensive customer account management.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Caching** | Upstash Redis |
| **Payments** | Stripe |
| **AI** | Vercel AI Gateway |
| **Deployment** | Vercel |

---

## Project Structure

```
planet-motors/
├── app/                          # Next.js App Router pages
│   ├── (pages)/                  # Public pages
│   │   ├── page.tsx              # Homepage
│   │   ├── inventory/            # Vehicle listings
│   │   ├── vehicles/[id]/        # Vehicle detail page (VDP)
│   │   ├── checkout/[id]/        # Purchase checkout flow
│   │   ├── financing/            # Financing application
│   │   ├── trade-in/             # Trade-in value calculator
│   │   ├── ev-battery-health/    # EV battery reports
│   │   └── ...
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── verify-email/
│   │   ├── callback/             # OAuth callback handler
│   │   └── error/
│   ├── api/v1/                   # REST API endpoints
│   │   ├── vehicles/             # Vehicle CRUD
│   │   ├── financing/            # Financing operations
│   │   ├── orders/               # Order management
│   │   ├── trade-in/             # Trade-in submissions
│   │   ├── deliveries/           # Delivery tracking
│   │   └── customers/            # Customer data
│   └── layout.tsx                # Root layout with providers
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   ├── header.tsx                # Site navigation
│   ├── footer.tsx                # Site footer
│   ├── vehicle-*.tsx             # Vehicle-related components
│   ├── reserve-vehicle-modal.tsx # Reservation flow
│   ├── auth-required-modal.tsx   # Auth gate modal
│   └── ...
├── contexts/                     # React contexts
│   └── auth-context.tsx          # Authentication state
├── lib/                          # Utilities & integrations
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Session handler
│   ├── stripe.ts                 # Stripe configuration
│   ├── redis.ts                  # Upstash Redis client
│   └── utils.ts                  # Helper functions
├── public/                       # Static assets
│   └── images/                   # Vehicle images, logos
└── middleware.ts                 # Edge middleware (auth)
```

---

## Page Routes

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, featured vehicles, trust badges |
| `/inventory` | Vehicle search & filter (supports URL params) |
| `/vehicles/[id]` | Vehicle Detail Page (VDP) with 360 viewer |
| `/financing` | Financing calculator & pre-approval form |
| `/trade-in` | Trade-in value calculator (CBB integration) |
| `/ev-battery-health` | EV battery health reports |
| `/delivery` | Delivery information & calculator |
| `/protection-plans` | Extended warranty & protection |
| `/about` | Company information |
| `/contact` | Contact form & location |
| `/faq` | Frequently asked questions |
| `/blog` | Blog/Media articles |
| `/careers` | Job listings |

### Protected Pages (Require Auth)
| Route | Description |
|-------|-------------|
| `/account` | User dashboard |
| `/checkout/[id]` | Purchase checkout flow |
| `/favorites` | Saved vehicles |
| `/compare` | Vehicle comparison tool |

### Auth Pages
| Route | Description |
|-------|-------------|
| `/auth/login` | Sign in page |
| `/auth/signup` | Registration page |
| `/auth/verify-email` | Email verification prompt |
| `/auth/callback` | OAuth callback handler |
| `/auth/error` | Auth error display |

---

## API Endpoints (v1)

### Vehicles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vehicles` | List vehicles (with filters) |
| GET | `/api/v1/vehicles/[id]` | Get vehicle details |
| GET | `/api/v1/vehicles/[id]/inspection` | Get inspection report |

### Financing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/financing/apply` | Submit finance application |
| POST | `/api/v1/financing/calculator` | Calculate payments |
| GET | `/api/v1/financing/offers` | Get financing offers |
| POST | `/api/v1/financing/offers/[id]/select` | Select offer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create order/reservation |
| GET | `/api/v1/orders` | Get user orders |

### Trade-In
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/trade-in` | Submit trade-in request |

### Deliveries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/deliveries` | List deliveries |
| GET | `/api/v1/deliveries/[id]/tracking` | Track delivery |

### Customer
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/customers/me` | Get profile |
| GET | `/api/v1/customers/me/favorites` | Get favorites |
| GET | `/api/v1/customers/me/addresses` | Get addresses |
| GET | `/api/v1/customers/me/searches` | Get saved searches |

---

## Data Models (Proposed for Headless CMS)

### Vehicle
```typescript
interface Vehicle {
  id: string
  vin: string
  stockNumber: string
  year: number
  make: string
  model: string
  trim: string
  bodyType: "Sedan" | "SUV" | "Truck" | "Coupe" | "Hatchback" | "Van"
  fuelType: "Gasoline" | "Electric" | "Hybrid" | "PHEV" | "Diesel"
  transmission: "Automatic" | "Manual"
  drivetrain: "FWD" | "RWD" | "AWD" | "4WD"
  exteriorColor: string
  interiorColor: string
  mileage: number
  price: number
  msrp?: number
  status: "available" | "pending" | "sold" | "reserved"
  condition: "new" | "used" | "certified"
  images: string[]
  features: string[]
  inspectionScore?: number
  carfaxUrl?: string
  createdAt: Date
  updatedAt: Date
  // EV-specific
  batteryHealth?: number
  batteryCapacity?: string
  range?: string
  chargingSpeed?: string
}
```

### Customer
```typescript
interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  addresses: Address[]
  favorites: string[]  // Vehicle IDs
  createdAt: Date
}
```

### Order
```typescript
interface Order {
  id: string
  customerId: string
  vehicleId: string
  status: "pending" | "reserved" | "financed" | "completed" | "cancelled"
  depositAmount: number
  totalPrice: number
  deliveryType: "pickup" | "delivery"
  deliveryAddress?: Address
  paymentMethod: "finance" | "cash"
  createdAt: Date
}
```

### TradeIn
```typescript
interface TradeIn {
  id: string
  customerId: string
  vehicleDetails: {
    year: number
    make: string
    model: string
    trim: string
    mileage: number
    condition: string
  }
  estimatedValue: number
  status: "pending" | "inspected" | "accepted" | "rejected"
  createdAt: Date
}
```

### FinanceApplication
```typescript
interface FinanceApplication {
  id: string
  customerId: string
  vehicleId: string
  employmentStatus: string
  annualIncome: number
  downPayment: number
  termMonths: number
  status: "submitted" | "reviewing" | "approved" | "declined"
  offers?: FinanceOffer[]
  createdAt: Date
}
```

### BlogPost (CMS)
```typescript
interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string  // Rich text/MDX
  category: string
  featuredImage: string
  author: string
  publishedAt: Date
  status: "draft" | "published"
}
```

---

## Headless CMS Integration Plan

### Option 1: Supabase as CMS (Recommended)
Use existing Supabase connection with a custom admin dashboard.

**Pros:**
- Already integrated
- No additional costs
- Full control over schema
- Real-time capabilities

**Implementation:**
1. Create database tables for content (vehicles, blog posts, pages)
2. Build admin dashboard at `/admin/*`
3. Use Supabase RLS for admin-only access
4. Add image upload to Supabase Storage

### Option 2: External Headless CMS
Integrate Sanity, Contentful, or Strapi.

**Pros:**
- Rich content editing UI
- Built-in media management
- Preview capabilities

**Cons:**
- Additional service cost
- More complexity
- Data sync requirements

---

## Database Schema (To Create)

```sql
-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin VARCHAR(17) UNIQUE NOT NULL,
  stock_number VARCHAR(20) UNIQUE,
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  trim VARCHAR(100),
  body_type VARCHAR(20),
  fuel_type VARCHAR(20),
  transmission VARCHAR(20),
  drivetrain VARCHAR(10),
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  mileage INTEGER,
  price DECIMAL(10,2) NOT NULL,
  msrp DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'available',
  condition VARCHAR(20),
  images TEXT[],
  features TEXT[],
  inspection_score INTEGER,
  carfax_url TEXT,
  -- EV fields
  battery_health INTEGER,
  battery_capacity VARCHAR(20),
  range VARCHAR(50),
  charging_speed VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table (extends auth.users)
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  status VARCHAR(20) DEFAULT 'pending',
  deposit_amount DECIMAL(10,2),
  total_price DECIMAL(10,2),
  delivery_type VARCHAR(20),
  payment_method VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade-ins table
CREATE TABLE trade_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  year INTEGER,
  make VARCHAR(50),
  model VARCHAR(50),
  trim VARCHAR(100),
  mileage INTEGER,
  condition VARCHAR(50),
  estimated_value DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finance applications table
CREATE TABLE finance_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  employment_status VARCHAR(50),
  annual_income DECIMAL(12,2),
  down_payment DECIMAL(10,2),
  term_months INTEGER,
  status VARCHAR(20) DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(200) UNIQUE NOT NULL,
  title VARCHAR(300) NOT NULL,
  excerpt TEXT,
  content TEXT,
  category VARCHAR(50),
  featured_image TEXT,
  author VARCHAR(100),
  status VARCHAR(20) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, vehicle_id)
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies (examples)
CREATE POLICY "Public read vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Customers read own data" ON customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Customers manage own orders" ON orders FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "Public read published posts" ON blog_posts FOR SELECT USING (status = 'published');
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Upstash Redis
REDIS_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=

# App
NEXT_PUBLIC_SITE_URL=https://planetmotors.app
```

---

## Next Steps / Roadmap

### Phase 1: Database Setup
- [ ] Create Supabase tables using schema above
- [ ] Set up RLS policies
- [ ] Migrate static vehicle data to database

### Phase 2: Admin Dashboard
- [ ] Create `/admin` route (protected)
- [ ] Vehicle management (CRUD)
- [ ] Order management
- [ ] Customer management
- [ ] Blog post editor

### Phase 3: Dynamic Content
- [ ] Connect inventory page to database
- [ ] Connect VDP to database
- [ ] Connect blog to database
- [ ] Image upload to Supabase Storage

### Phase 4: Advanced Features
- [ ] Real-time inventory updates
- [ ] Search with Typesense/Algolia
- [ ] Email notifications (Resend)
- [ ] SMS notifications (Twilio)
- [ ] Analytics dashboard

---

## Key Components Reference

| Component | Purpose |
|-----------|---------|
| `header.tsx` | Main navigation with dropdowns |
| `footer.tsx` | Site footer with links & contact |
| `vehicle-grid.tsx` | Vehicle listing grid |
| `vehicle-showcase.tsx` | Featured vehicles carousel |
| `reserve-vehicle-modal.tsx` | $250 deposit reservation |
| `auth-required-modal.tsx` | Sign-in gate for protected actions |
| `finance-application-form.tsx` | Pre-approval form |
| `similar-vehicles.tsx` | Related vehicles section |
| `live-chat.tsx` | Chat widget |

---

## Connected Integrations

1. **Supabase** - Database, Auth, Storage
2. **Upstash Redis** - Caching, Rate limiting
3. **Stripe** - Payment processing
4. **Vercel AI Gateway** - AI features (chatbot)
5. **Sanity CMS** - Headless content management

---

## Sanity CMS Integration

**Project ID**: `cgb59sfd`
**Dataset**: `production`
**Studio URL**: `studio.planetmotors.app`

### Sanity Schemas

| Schema | Fields | Purpose |
|--------|--------|---------|
| `siteSettings` | dealerName, phone, email, address, hours, financing, delivery, leadRouting | Global config |
| `homepageHero` | headline, subheadline, ctaLabel, ctaUrl, backgroundImage, active | Hero banner |
| `blogPost` | title, slug, publishedAt, excerpt, coverImage, body, seo | Blog articles |
| `faqEntry` | question, answer, category, order | FAQ page |
| `testimonial` | customerName, rating, review, vehiclePurchased, publishedAt, featured | Reviews |
| `promotion` | title, message, ctaLabel, ctaUrl, active, startDate, endDate | Promo banners |
| `protectionPlan` | name, description, price, features, coverage | Warranty plans |

### Frontend Files

```
/lib/sanity/
  client.ts       # Sanity client configuration
  queries.ts      # GROQ queries for all content types
  types.ts        # TypeScript interfaces
  fetch.ts        # Data fetching helpers with ISR caching

/app/api/sanity-webhook/route.ts  # Webhook for on-demand revalidation
```

### Environment Variables (Sanity)

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=cgb59sfd
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=sk_...
SANITY_WEBHOOK_SECRET=...
```

### Webhook Setup

Configure in Sanity Studio:
- **URL**: `https://planetmotors.app/api/sanity-webhook`
- **Secret**: Set as `SANITY_WEBHOOK_SECRET` env var
- **Trigger on**: Create, Update, Delete

---

*Last Updated: March 28, 2026*
