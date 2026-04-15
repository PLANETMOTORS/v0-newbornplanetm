# PLANET MOTORS - API ARCHITECTURE

## Overview

Planet Motors exposes a RESTful API at `/api/v1/*` for all client-server communication.

## Base URL

```
Production: https://planetmotors.app/api/v1
Staging:    https://staging.planetmotors.app/api/v1
```

## Authentication

All protected endpoints require a valid Supabase JWT token.

```http
Authorization: Bearer <supabase_access_token>
```

## API Endpoints

### Vehicles

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | /vehicles | List all vehicles | Public |
| POST | /vehicles/search | Advanced vehicle search with aggregations | Public |
| GET | /vehicles/:id | Get vehicle details | Public |
| GET | /vehicles/:id/photos | Get vehicle photos | Public |
| GET | /vehicles/:id/inspection | Get inspection report | Public |
| POST | /vehicles/:id/inquire | Submit inquiry | Public |

#### GET /vehicles

Query Parameters:

```
?make=Tesla
&model=Model+3
&minYear=2022
&maxYear=2024
&minPrice=30000
&maxPrice=60000
&fuelType=Electric
&bodyStyle=Sedan
&transmission=Automatic
&drivetrain=AWD
&exteriorColor=White
&status=available
&q=model+3          (text search across make/model/trim)
&sort=price         (created_at | price | year | mileage | make | model)
&order=asc          (asc | desc, default: desc)
&page=1
&limit=20           (max 250)
&includeFilters=true  (return facet values for filter UI)
```

Response:

```json
{
  "success": true,
  "data": {
    "vehicles": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8,
      "hasMore": true
    },
    "filters": {
      "makes": ["Audi", "BMW", "Tesla"],
      "bodyStyles": ["Sedan", "SUV"],
      "fuelTypes": ["Electric", "Gasoline"],
      "priceRange": { "min": 18000, "max": 120000 },
      "yearRange": { "min": 2018, "max": 2026 }
    }
  }
}
```

> `filters` is only included when `includeFilters=true`. Prices are returned in dollars (converted from the internal cent storage).

**Caching:** Responses are cached in Redis for 5 minutes (`Cache-Control: public, s-maxage=300, stale-while-revalidate=600`). The `X-Cache` response header indicates `HIT` or `MISS`. Facets are cached separately for 10 minutes per `status` value.

#### POST /vehicles/search

Advanced search with aggregations for the filter sidebar.

Request Body:

```json
{
  "query": "tesla model 3",
  "filters": {
    "makes": ["Tesla"],
    "bodyStyles": ["Sedan"],
    "fuelTypes": ["Electric"],
    "priceRange": { "min": 30000, "max": 60000 },
    "yearRange": { "min": 2022, "max": 2024 }
  },
  "sort": { "field": "price", "order": "asc" },
  "pagination": { "page": 1, "limit": 20 }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "vehicles": [...],
    "total": 12,
    "aggregations": {
      "makes": [{ "key": "Tesla", "count": 12 }],
      "bodyStyles": [{ "key": "Sedan", "count": 8 }, { "key": "SUV", "count": 4 }],
      "priceRanges": [
        { "key": "Under $30k", "count": 0 },
        { "key": "$30k-$50k", "count": 7 },
        { "key": "$50k-$75k", "count": 5 },
        { "key": "$75k-$100k", "count": 0 },
        { "key": "Over $100k", "count": 0 }
      ]
    }
  }
}
```

Aggregations are computed from all `available` vehicles (not just the current page) and cached in Redis for 10 minutes.

### Customers

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | /customers/me | Get current user profile | Required |
| PUT | /customers/me | Update profile | Required |
| GET | /customers/me/addresses | List addresses | Required |
| POST | /customers/me/addresses | Add address | Required |
| PUT | /customers/me/addresses/:id | Update address | Required |
| DELETE | /customers/me/addresses/:id | Delete address | Required |

#### GET /customers/me

Returns the authenticated user's profile from the `profiles` table.

Response:

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "phone": "+1 416-555-0100",
      "notificationPreferences": { "email": true, "sms": false },
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-04-14T12:00:00.000Z"
    }
  }
}
```

#### PUT /customers/me

Upserts the authenticated user's profile. Only the fields provided are updated.

Request Body (all fields optional):

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1 416-555-0100",
  "notificationPreferences": { "email": true, "sms": false }
}
```

Validation rules:
- `firstName` / `lastName`: 1–50 characters; letters (any Unicode script), spaces, hyphens, and apostrophes only. Input is NFC-normalized before validation.
- `phone`: up to 20 characters; digits, spaces, `+`, `(`, `)`, `.`, `-` only.

### Orders

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | /orders | List user's orders | Required |
| GET | /orders/:id | Get order details | Required |
| POST | /orders | Create order/reservation | Required |
| PUT | /orders/:id | Update order | Required |
| POST | /orders/:id/cancel | Cancel order | Required |

#### POST /orders

Request Body:

```json
{
  "vehicle_id": "uuid",
  "order_type": "reservation",
  "delivery_type": "delivery",
  "delivery_address_id": "uuid",
  "payment_method": "finance",
  "financing_application_id": "uuid",
  "trade_in_id": "uuid",
  "protection_plan_id": "uuid"
}
```

### Financing

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | /financing/applications | List user's applications | Required |
| GET | /financing/applications/:id | Get application details | Required |
| POST | /financing/applications | Submit application | Required |
| PUT | /financing/applications/:id | Update application | Required |
| GET | /financing/applications/:id/offers | Get loan offers | Required |
| POST | /financing/applications/:id/offers/:offerId/select | Select offer | Required |
| GET | /financing/calculator | Calculate payments | Public |

#### POST /financing/applications

Request Body:

```json
{
  "vehicle_id": "uuid",
  "requested_amount": 45000,
  "down_payment": 5000,
  "preferred_term_months": 60,
  "employment_status": "employed",
  "employer_name": "Company Inc",
  "job_title": "Engineer",
  "employment_years": 5,
  "annual_income": 85000,
  "housing_status": "rent",
  "monthly_housing_payment": 1800,
  "credit_check_consent": true,
  "terms_accepted": true
}
```

#### GET /financing/calculator

Query Parameters:

```
?amount=45000
&down_payment=5000
&term_months=60
&interest_rate=6.99
```

Response:

```json
{
  "monthly_payment": 869.32,
  "total_interest": 6159.20,
  "total_cost": 51159.20,
  "amortization_schedule": [...]
}
```

### Trade-Ins

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | /trade-ins | List user's trade-ins | Required |
| GET | /trade-ins/:id | Get trade-in details | Required |
| POST | /trade-ins | Submit trade-in request | Required |
| PUT | /trade-ins/:id | Update trade-in | Required |
| POST | /trade-ins/estimate | Get instant estimate | Public |
| POST | /trade-ins/:id/accept | Accept offer | Required |

#### POST /trade-ins/estimate

Request Body:

```json
{
  "year": 2020,
  "make": "Toyota",
  "model": "Camry",
  "trim": "LE",
  "mileage": 45000,
  "condition": "good",
  "postal_code": "L4C 1G7"
}
```

Response:

```json
{
  "estimated_value": {
    "low": 18500,
    "mid": 20500,
    "high": 22500
  },
  "cbb_value": 20500,
  "factors": {
    "mileage_adjustment": -500,
    "condition_adjustment": 0,
    "market_adjustment": 300
  }
}
```

### Deliveries

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | /deliveries/:orderId | Get delivery status | Required |
| POST | /deliveries/calculate | Calculate delivery cost | Public |
| PUT | /deliveries/:id/schedule | Schedule delivery/pickup | Required |

#### POST /deliveries/calculate

Request Body:

```json
{
  "postal_code": "V6B 1A1",
  "vehicle_id": "uuid"
}
```

Response:

```json
{
  "available": true,
  "distance_km": 4400,
  "delivery_fee": 599,
  "estimated_days": "7-10",
  "pickup_available": false,
  "nearest_hub": {
    "name": "Planet Motors Vancouver",
    "distance_km": 15
  }
}
```

### Payments

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | /payments/create-intent | Create Stripe PaymentIntent | Required |
| POST | /payments/confirm | Confirm payment | Required |
| GET | /payments/:orderId | Get payment history | Required |
| POST | /payments/refund | Request refund | Required |

#### POST /payments/create-intent

Request Body:

```json
{
  "order_id": "uuid",
  "payment_type": "deposit",
  "amount": 250
}
```

Response:

```json
{
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx"
}
```

### Webhooks

| Endpoint | Source | Description |
| --- | --- | --- |
| /webhooks/stripe | Stripe | Payment events |
| /webhooks/sanity | Sanity | Content updates |
| /webhooks/cbb | Canadian Black Book | Valuation updates |

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
| --- | --- | --- |
| VALIDATION_ERROR | 400 | Invalid request data |
| UNAUTHORIZED | 401 | Missing/invalid auth token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (e.g., vehicle already reserved) |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Rate Limiting

| Endpoint Type | Limit |
| --- | --- |
| Public endpoints | 100 req/min |
| Authenticated endpoints | 200 req/min |
| Webhooks | 1000 req/min |

Rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1679529600
```

## Pagination

All list endpoints support pagination:

```
?page=1&limit=20
```

Response includes:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Versioning

API version is included in the URL path: `/api/v1/*`

Breaking changes will increment the version number. Previous versions will be supported for 12 months after a new version is released.

*Document Version: 1.1**Last Updated: April 15, 2026*