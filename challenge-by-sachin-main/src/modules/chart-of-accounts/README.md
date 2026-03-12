# Chart of Accounts Module

This module provides comprehensive CRUD operations for managing the chart of accounts in the core banking system.

## Entity Structure

The `ChartOfAccountsEntity` represents a chart of accounts with the following structure:

- **accountCode** (string, unique): Account code (e.g., "1001", "2000", "4100")
- **accountName** (string): Account name
- **accountType** (enum): Account type (asset, liability, equity, income, expense, contra_asset)
- **accountSubtype** (string, optional): Account subtype (e.g., "current_asset", "long_term_liability")
- **parentAccountId** (string, optional): Parent account ID for hierarchical structure
- **isActive** (boolean): Whether the account is active (default: true)
- **description** (text, optional): Account description

## Account Types

The system supports the following account types:

- `asset`: Assets (e.g., Cash, Accounts Receivable)
- `liability`: Liabilities (e.g., Accounts Payable, Loans)
- `equity`: Equity accounts (e.g., Capital, Retained Earnings)
- `income`: Income accounts (e.g., Interest Income, Service Fees)
- `expense`: Expense accounts (e.g., Salaries, Rent)
- `contra_asset`: Contra asset accounts (e.g., Loan Loss Provisions)

## API Endpoints

### Authentication

All endpoints require authentication with `SUPER_USER` role.

### Base URL

`/api/v1/chart-of-accounts`

### Endpoints

#### 1. Get All Chart of Accounts

- **GET** `/api/v1/chart-of-accounts`
- **Query Parameters**:
  - `page` (number): Page number (default: 1)
  - `take` (number): Items per page (default: 10, max: 50)
  - `order` (string): Sort order - 'ASC' or 'DESC' (default: 'ASC')
- **Response**: Paginated list of chart of accounts

#### 2. Get Chart of Accounts Hierarchy

- **GET** `/api/v1/chart-of-accounts/hierarchy`
- **Response**: Hierarchical structure of chart of accounts (parent accounts with their children)

#### 3. Get Accounts by Type

- **GET** `/api/v1/chart-of-accounts/type/:accountType`
- **Parameters**: `accountType` - The type of accounts to retrieve
- **Response**: List of accounts filtered by type

#### 4. Get Single Chart of Accounts

- **GET** `/api/v1/chart-of-accounts/:id`
- **Parameters**: `id` - Account ID (UUID)
- **Response**: Single chart of accounts with parent and child relationships

#### 5. Create Chart of Accounts

- **POST** `/api/v1/chart-of-accounts`
- **Body**: `CreateChartOfAccountsDto`
- **Response**: Created chart of accounts

#### 6. Update Chart of Accounts

- **PATCH** `/api/v1/chart-of-accounts/:id`
- **Parameters**: `id` - Account ID (UUID)
- **Body**: `UpdateChartOfAccountsDto` (partial)
- **Response**: Updated chart of accounts

#### 7. Delete Chart of Accounts

- **DELETE** `/api/v1/chart-of-accounts/:id`
- **Parameters**: `id` - Account ID (UUID)
- **Response**: 204 No Content

## Data Transfer Objects (DTOs)

### CreateChartOfAccountsDto

```typescript
{
  accountCode: string;           // Required, unique
  accountName: string;           // Required
  accountType: AccountType;      // Required
  accountSubtype?: string;       // Optional
  parentAccountId?: string;      // Optional, UUID
  isActive?: boolean;            // Optional, default: true
  description?: string;          // Optional
}
```

### UpdateChartOfAccountsDto

Partial version of `CreateChartOfAccountsDto` - all fields are optional.

## Example Usage

### Creating a Cash Account

```json
POST /api/v1/chart-of-accounts
{
  "accountCode": "1001",
  "accountName": "Cash",
  "accountType": "asset",
  "accountSubtype": "current_asset",
  "description": "Cash on hand and in bank accounts"
}
```

### Creating a Child Account

```json
POST /api/v1/chart-of-accounts
{
  "accountCode": "1001-01",
  "accountName": "Petty Cash",
  "accountType": "asset",
  "accountSubtype": "current_asset",
  "parentAccountId": "parent-account-uuid",
  "description": "Petty cash fund"
}
```

### Updating an Account

```json
PATCH /api/v1/chart-of-accounts/account-uuid
{
  "accountName": "Updated Cash Account",
  "description": "Updated description"
}
```

## Features

- **Hierarchical Structure**: Support for parent-child relationships between accounts
- **Account Types**: Comprehensive account type classification
- **Active/Inactive Status**: Ability to deactivate accounts without deletion
- **Validation**: Comprehensive input validation with meaningful error messages
- **Pagination**: Efficient pagination for large datasets
- **Search and Filter**: Built-in search and filtering capabilities
- **Audit Trail**: Automatic tracking of creation and update timestamps

## Database Schema

The module creates a `chart_of_accounts` table with the following structure:

```sql
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'income', 'expense', 'contra_asset') NOT NULL,
    account_subtype VARCHAR(50),
    parent_account_id UUID NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL
);
```

## Testing

The module includes comprehensive unit tests for both service and controller layers:

- Service tests: `chart-of-accounts.service.spec.ts`
- Controller tests: `chart-of-accounts.controller.spec.ts`

Run tests with:

```bash
npm run test src/modules/chart-of-accounts
```
