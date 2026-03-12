# Accruals Module

This module handles daily interest and penalty accruals for loans. It provides functionality to record, track, and manage accruals throughout the loan lifecycle.

## Features

- **Daily Accrual Recording**: Record interest and penalty accruals on a daily basis
- **Status Management**: Track accrual status (Pending, Posted, Reversed)
- **GL Integration**: Mark accruals as posted to General Ledger with reference numbers
- **Flexible Filtering**: Filter accruals by loan, schedule, date range, status, and GL posted status
- **Business Operations**: Mark accruals as posted or reversed

## Entity Structure

The `AccrualEntity` includes:

- `loanId`: Reference to the loan
- `scheduleId`: Reference to the loan schedule
- `accrualDate`: Date of the accrual
- `interestAccrued`: Daily interest amount
- `penaltyAccrued`: Daily penalty amount (optional)
- `status`: Current status (Pending/Posted/Reversed)
- `glPosted`: Whether posted to General Ledger
- `glReference`: GL reference number

## API Endpoints

### Basic CRUD Operations

- `POST /api/v1/accruals` - Create a new accrual
- `GET /api/v1/accruals` - Get all accruals with filters
- `GET /api/v1/accruals/:id` - Get accrual by ID
- `PATCH /api/v1/accruals/:id` - Update accrual
- `DELETE /api/v1/accruals/:id` - Delete accrual

### Business Operations

- `GET /api/v1/accruals/loan/:loanId` - Get all accruals for a loan
- `GET /api/v1/accruals/schedule/:scheduleId` - Get all accruals for a schedule
- `GET /api/v1/accruals/date-range/:fromDate/:toDate` - Get accruals in date range
- `POST /api/v1/accruals/:id/post` - Mark accrual as posted to GL
- `POST /api/v1/accruals/:id/reverse` - Reverse an accrual

### Query Parameters

- `loanId` - Filter by loan ID
- `scheduleId` - Filter by schedule ID
- `status` - Filter by status (Pending/Posted/Reversed)
- `accrualDateFrom` - Filter by accrual date from
- `accrualDateTo` - Filter by accrual date to
- `glPosted` - Filter by GL posted status

## Usage Examples

### Create Daily Accrual

```json
POST /api/v1/accruals
{
  "loanId": "123",
  "scheduleId": "456",
  "accrualDate": "2024-01-15",
  "interestAccrued": "25.50",
  "penaltyAccrued": "0.00"
}
```

### Mark as Posted

```json
POST /api/v1/accruals/123/post
{
  "glReference": "GL-2024-001"
}
```

### Get Accruals for Date Range

```
GET /api/v1/accruals/date-range/2024-01-01/2024-01-31?status=Posted
```

## Database Schema

The module creates an `accruals` table with the following structure:

- Primary key with auto-increment
- Foreign key relationships to loans and loan_schedule tables
- Indexes on loan_id and accrual_date for performance
- Timestamps for audit trail

## Integration

This module integrates with:

- **Loan Module**: References loan entities
- **Loan Schedule Module**: References schedule entities
- **General Ledger System**: Tracks posting status and references
