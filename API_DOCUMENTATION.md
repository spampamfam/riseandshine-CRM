# CRM API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a valid JWT token sent via:
- HTTP-only cookie (preferred)
- Authorization header: `Bearer <token>`

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### POST /auth/login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### POST /auth/logout
Logout user and clear session.

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

#### GET /auth/me
Get current user information.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Leads Management

#### GET /leads
Get user's leads with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (new, contacted, qualified, converted)
- `search` (string): Search in name and contact fields

**Response (200):**
```json
{
  "leads": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "John Doe",
      "contact": "john@example.com",
      "source": "website",
      "status": "new",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### POST /leads
Create a new lead.

**Request Body:**
```json
{
  "name": "John Doe",
  "contact": "john@example.com",
  "source": "website",
  "status": "new"
}
```

**Response (201):**
```json
{
  "lead": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "John Doe",
    "contact": "john@example.com",
    "source": "website",
    "status": "new",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /leads/:id
Update an existing lead.

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "contact": "john.updated@example.com",
  "source": "referral",
  "status": "contacted"
}
```

**Response (200):**
```json
{
  "lead": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "John Doe Updated",
    "contact": "john.updated@example.com",
    "source": "referral",
    "status": "contacted",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T01:00:00Z"
  }
}
```

#### DELETE /leads/:id
Delete a lead.

**Response (200):**
```json
{
  "message": "Lead deleted successfully"
}
```

#### GET /leads/stats
Get lead statistics for the current user.

**Response (200):**
```json
{
  "stats": {
    "total": 25,
    "new": 10,
    "contacted": 8,
    "qualified": 5,
    "converted": 2
  }
}
```

#### GET /leads/export
Export user's leads to CSV format.

**Response (200):**
```json
{
  "message": "CSV export ready",
  "data": [
    {
      "name": "John Doe",
      "contact": "john@example.com",
      "source": "website",
      "status": "new",
      "created_at": "01/01/2024"
    }
  ],
  "filename": "leads_1234567890.csv"
}
```

### Admin Endpoints

#### GET /admin/users
Get all users with their lead counts (admin only).

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "lead_count": 25
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### GET /admin/stats
Get system-wide statistics (admin only).

**Response (200):**
```json
{
  "stats": {
    "total_users": 100,
    "total_leads": 2500,
    "leads_by_status": {
      "new": 1000,
      "contacted": 800,
      "qualified": 500,
      "converted": 200
    },
    "recent_activity": {
      "leads_last_30_days": 150,
      "users_last_30_days": 10
    }
  }
}
```

#### GET /admin/users/:userId
Get detailed information about a specific user (admin only).

**Query Parameters:**
- `page` (number): Page number for user's leads (default: 1)
- `limit` (number): Items per page for user's leads (default: 10)

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "leads": [
    {
      "id": "uuid",
      "name": "John Doe",
      "contact": "john@example.com",
      "source": "website",
      "status": "new",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "stats": {
    "total": 25,
    "new": 10,
    "contacted": 8,
    "qualified": 5,
    "converted": 2
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### DELETE /admin/users/:userId
Delete a user and all their leads (admin only).

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Lead not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Rate limit headers included in responses

## CORS
- Origin: `http://localhost:8080` (configurable)
- Credentials: true
- Methods: GET, POST, PUT, DELETE, OPTIONS

## Security Headers
- Helmet.js for security headers
- Content Security Policy
- XSS Protection
- No Sniff
- Frame Options 