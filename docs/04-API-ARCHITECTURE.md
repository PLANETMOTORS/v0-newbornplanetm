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
| GET | /vehicles/:id | Get vehicle details | Public |
| GET | /vehicles/:id/photos | Get vehicle photos | Public |
| GET | /vehicles/:id/inspection | Get inspection report | Public |
| POST | /vehicles/:id/inquire | Submit inquiry | Public |

#### GET /vehicles

Query Parameters:

```
?make=Tesla
&model=Model+3
&year_min=2022
&year_max=2024
&price_min=30000
&price_max=60000
&fuel_type=Electric
&body_type=Sedan
&transmission=Automatic
&drivetrain=AWD
&status=available
&is_certified=true
&sort=price_asc
&page=1
&limit=20
```

Response:

```json
{
  "vehicles": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### Customers

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| GET | /customers/me | Get current user profile | Required |
| PUT | /customers/me | Update profile | Required |
| GET | /customers/me/addresses | List addresses | Required |
| POST | /customers/me/addresses | Add address | Required |
| PUT | /customers/me/addresses/:id | Update address | Required |
| DELETE | /customers/me/addresses/:id | Delete address | Required |

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

*Document Version: 1.0**Last Updated: March 28, 2026*