# Product Module

This module manages loan products in the core banking system. All operations are restricted to super users only.

## Entity Structure

The `Product` entity represents loan products with the following fields:

- `productId` (Primary Key): Auto-incrementing product identifier
- `productName` (Required): Name of the loan product (max 100 characters)
- `interestRate` (Required): Annual interest rate (0.00 to 999.99)
- `interestMethod` (Required): Interest calculation method (flat, reducing_balance, compound)
- `minAmount` (Optional): Minimum loan amount
- `maxAmount` (Optional): Maximum loan amount
- `termMinMonths` (Optional): Minimum term in months
- `termMaxMonths` (Optional): Maximum term in months
- `lateFee` (Optional): Late fee amount
- `gracePeriodDays` (Optional): Grace period in days

## API Endpoints

All endpoints require super user authentication and authorization.

### Create Product

- **POST** `/product`
- **Description**: Create a new loan product
- **Access**: Super User only
- **Body**: `CreateProductDto`

### Get All Products

- **GET** `/product`
- **Description**: Retrieve all loan products
- **Access**: Super User only
- **Response**: Array of `ProductResponseDto`

### Get Product by ID

- **GET** `/product/:id`
- **Description**: Retrieve a specific loan product by ID
- **Access**: Super User only
- **Response**: `ProductResponseDto`

### Update Product

- **PATCH** `/product/:id`
- **Description**: Update an existing loan product
- **Access**: Super User only
- **Body**: `UpdateProductDto`
- **Response**: `ProductResponseDto`

### Delete Product

- **DELETE** `/product/:id`
- **Description**: Delete a loan product
- **Access**: Super User only

## Validation Rules

1. **Product Name**: Required, string, max 100 characters
2. **Interest Rate**: Required, number between 0.00 and 999.99
3. **Interest Method**: Required, must be one of: flat, reducing_balance, compound
4. **Amount Range**: If both min and max amounts are provided, max must be greater than min
5. **Term Range**: If both min and max terms are provided, max must be greater than min
6. **Positive Values**: All numeric fields (except interest rate) must be positive
7. **Non-negative Values**: Interest rate, late fee, and grace period must be non-negative

## Interest Methods

- **flat**: Interest calculated on the original principal amount
- **reducing_balance**: Interest calculated on the remaining principal balance
- **compound**: Interest calculated on principal plus accumulated interest

## Database Schema

The module creates a `loan_products` table with the following structure:

```sql
CREATE TABLE loan_products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(100) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    interest_method ENUM('flat', 'reducing_balance', 'compound'),
    min_amount DECIMAL(12,2),
    max_amount DECIMAL(12,2),
    term_min_months INT,
    term_max_months INT,
    late_fee DECIMAL(10,2),
    grace_period_days INT
);
```

## Usage Example

```typescript
// Create a new loan product
const newProduct = {
  productName: "Personal Loan",
  interestRate: 12.5,
  interestMethod: "reducing_balance",
  minAmount: 1000,
  maxAmount: 50000,
  termMinMonths: 6,
  termMaxMonths: 60,
  lateFee: 25.00,
  gracePeriodDays: 5
};

// API call
POST /product
Authorization: Bearer <super_user_token>
Content-Type: application/json

{
  "productName": "Personal Loan",
  "interestRate": 12.5,
  "interestMethod": "reducing_balance",
  "minAmount": 1000,
  "maxAmount": 50000,
  "termMinMonths": 6,
  "termMaxMonths": 60,
  "lateFee": 25.00,
  "gracePeriodDays": 5
}
```
