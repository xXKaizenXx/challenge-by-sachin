# Group Package Module

## Paginated Group Packages Endpoint

### GET `/api/v1/group-packages/paginated`

This endpoint returns paginated group packages based on the user's role and office permissions.

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `take` (optional): Number of items per page (default: 20, max: 100)
- `order` (optional): Sort order - 'ASC' or 'DESC' (default: 'ASC')
- `role` (optional): Filter by role type

#### Response Format

```json
{
  "success": true,
  "message": "Group packages fetched successfully",
  "data": [
    {
      "id": "package-id",
      "groupId": "group-id",
      "groupName": "Group Name",
      "userId": "user-id",
      "username": "loan_officer_username",
      "loans": [
        {
          "principal": 2000,
          "totalInterest": "140.44",
          "expectedDisbursementDate": "2025-07-02",
          "repaymentsDueDates": {
            "dates": [
              "2025-07-07T00:00:00.000Z",
              "2025-08-04T00:00:00.000Z",
              "2025-09-01T00:00:00.000Z",
              "2025-10-06T00:00:00.000Z"
            ]
          },
          "installments": {
            "count": 4,
            "amount": 590
          },
          "status": "true",
          "businessType": "SME"
        }
      ]
    }
  ],
  "metaData": {
    "page": 1,
    "take": 20,
    "itemCount": 50,
    "pageCount": 3,
    "hasPreviousPage": false,
    "hasNextPage": true
  }
}
```

#### Role-Based Access

- **Loan Officers**: Can only see their own group packages
- **Branch Managers, Super Users, Regional Managers**: Can see group packages from their office and all child offices

#### Example Usage

```bash
# Get first page with 10 items per page
GET /api/v1/group-packages/paginated?page=1&take=10

# Get second page with default items per page
GET /api/v1/group-packages/paginated?page=2

# Get items in descending order
GET /api/v1/group-packages/paginated?order=DESC
```
