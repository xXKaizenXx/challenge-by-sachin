# Loan Module

This module provides comprehensive loan management functionality for the core banking system, including loan creation, approval workflows, disbursement, and monitoring.

## Features

- **Complete CRUD Operations**: Create, read, update, and delete loans
- **Advanced Filtering**: Filter loans by various criteria including client, product, staff, group, office, status, and more
- **Loan Approval Workflow**: Two-level approval system with audit trails
- **Disbursement Management**: Track loan disbursement with user attribution
- **Arrears Management**: Mark and track loans in arrears
- **Write-off Functionality**: Handle loan write-offs
- **Repayment Tracking**: Update and track next repayment dates
- **Comprehensive Audit**: Full audit trail for all loan operations

## Entity Structure

The loan entity includes all fields from the provided schema with proper naming conventions:

- **Basic Information**: Principal, interest, APR, repayment terms
- **Client & Product Relations**: Links to clients, loan products, and groups
- **Staff & Office Relations**: Staff assignment and office tracking
- **Approval Workflow**: First and second level approval tracking
- **Disbursement Tracking**: Disbursement dates and responsible users
- **Status Management**: Loan status tracking with arrears and write-off flags
- **Audit Information**: Comprehensive audit trail for all operations

## API Endpoints

### Core CRUD Operations

- `POST /api/v1/loans` - Create a new loan
- `GET /api/v1/loans` - Get all loans with filtering and pagination
- `GET /api/v1/loans/:id` - Get a specific loan by ID
- `PATCH /api/v1/loans/:id` - Update a loan
- `DELETE /api/v1/loans/:id` - Delete a loan

### Filter Endpoints

- `GET /api/v1/loans/in-arrears` - Get loans in arrears
- `GET /api/v1/loans/written-off` - Get written off loans
- `GET /api/v1/loans/can-be-used-for-top-up` - Get loans eligible for top-up
- `GET /api/v1/loans/client/:clientId` - Get loans by client
- `GET /api/v1/loans/product/:loanProductId` - Get loans by product
- `GET /api/v1/loans/staff/:staffId` - Get loans by staff
- `GET /api/v1/loans/group/:groupId` - Get loans by group
- `GET /api/v1/loans/office/:officeId` - Get loans by office
- `GET /api/v1/loans/status/:statusId` - Get loans by status
- `GET /api/v1/loans/repayment-frequency/:repaymentEvery` - Get loans by repayment frequency

### Business Logic Endpoints

- `POST /api/v1/loans/:id/approve-first-level` - Approve loan at first level
- `POST /api/v1/loans/:id/approve-second-level` - Approve loan at second level
- `POST /api/v1/loans/:id/disburse` - Disburse a loan
- `POST /api/v1/loans/:id/mark-in-arrears` - Mark loan as in arrears
- `POST /api/v1/loans/:id/write-off` - Write off a loan
- `POST /api/v1/loans/:id/update-next-repayment-date` - Update next repayment date

## Filtering Options

The main GET endpoint supports comprehensive filtering:

### Basic Filters

- `clientId` - Filter by client ID
- `loanProductId` - Filter by loan product ID
- `staffId` - Filter by staff ID
- `groupId` - Filter by group ID
- `officeId` - Filter by office ID
- `statusId` - Filter by status ID

### Boolean Filters

- `inArrears` - Filter by arrears status
- `isWrittenOff` - Filter by written off status
- `canBeUsedForTopUp` - Filter by top-up eligibility

### Range Filters

- `minPrincipal` / `maxPrincipal` - Filter by principal amount range
- `minApr` / `maxApr` - Filter by APR range

### Date Filters

- `disbursementDateFrom` / `disbursementDateTo` - Filter by disbursement date range
- `expectedDisbursementDateFrom` / `expectedDisbursementDateTo` - Filter by expected disbursement date range

### Other Filters

- `repaymentEvery` - Filter by repayment frequency (week, monthly, bi-weekly, daily, quarterly, annually)

## DTOs

### CreateLoanDto

Required fields for creating a new loan including client, product, amounts, terms, and fees.

### UpdateLoanDto

Optional fields for updating an existing loan. All fields are optional to allow partial updates.

### LoanDto

Response DTO containing all loan information for API responses.

### Response DTOs

- `LoanResponseDto` - Single loan response
- `LoansResponseDto` - Paginated list of loans response

## Business Rules

1. **Office Consistency**: Client, group, and staff must belong to the same office
2. **Status Management**: New loans are created with "Pending" status
3. **Audit Trail**: All operations maintain comprehensive audit information
4. **Approval Workflow**: Two-level approval system with proper user attribution
5. **Validation**: Comprehensive validation for all loan data including repayment frequencies

## Dependencies

- **StatusService** - For loan status management
- **ProductService** - For loan product validation
- **ClientService** - For client validation
- **GroupService** - For group validation (optional)

## Security

- Role-based access control for all endpoints
- Office-level data isolation
- Audit trails for all operations
- Input validation and sanitization

## Testing

Comprehensive test coverage including:

- Service unit tests
- Controller unit tests
- Integration tests for business logic
- Validation tests for DTOs

## Usage Examples

### Creating a Loan

```typescript
const createLoanDto = {
  clientId: 'client-uuid',
  principal: 10000,
  totalInterest: 1000,
  interestBreakDown: {
    /* interest breakdown */
  },
  totalExpectedRepayment: 11000,
  expectedDisbursementDate: new Date(),
  numberOfRepayments: 12,
  loanProductId: '1',
  loanProductName: 'Personal Loan',
  repaymentEvery: 'monthly',
  expectedFirstRepaymentOnDate: new Date(),
  timeline: {
    /* loan timeline */
  },
  repaymentsDueDates: {
    /* repayment dates */
  },
  apr: 10,
  applicationFee: 100,
  totalServiceFee: 50,
  installments: {
    /* installment details */
  },
  agreementForm: 'agreement-link',
  canBeUsedForTopUp: false,
};
```

### Filtering Loans

```typescript
// Get loans in arrears
GET /api/v1/loans/in-arrears?page=1&limit=10

// Get loans by client
GET /api/v1/loans/client/client-uuid?page=1&limit=10

// Get loans with principal between 5000 and 15000
GET /api/v1/loans?minPrincipal=5000&maxPrincipal=15000

// Get monthly repayment loans
GET /api/v1/loans?repaymentEvery=monthly
```

### Approving a Loan

```typescript
// First level approval
POST /api/v1/loans/loan-uuid/approve-first-level
{
  "approvedById": "user-uuid",
  "approvedByName": "John Doe"
}

// Second level approval
POST /api/v1/loans/loan-uuid/approve-second-level
{
  "approvedById": "user-uuid",
  "approvedByName": "Jane Smith"
}
```

### Disbursing a Loan

```typescript
POST /api/v1/loans/loan-uuid/disburse
{
  "disbursedById": "user-uuid",
  "disbursedByName": "John Doe"
}
```
