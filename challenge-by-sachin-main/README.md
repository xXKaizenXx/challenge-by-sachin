
---

# Setup

## 1. Install Dependencies

```bash
yarn install
```

---

# Coding Challenge Duration

Candidates are given **4 days to complete this coding challenge**.

The **4-day period starts from the moment the challenge is received**.

During this time, the candidate is expected to:

* Identify the issues in the system
* Implement the necessary fixes
* Ensure the application builds and runs successfully
* Submit their solution via a **Pull Request**

Submissions received **after the 4-day window may not be considered**.

---

# Contribution Guidelines

Contributions are welcome through pull requests.

1. Fork this repository.
2. Clone your fork locally.
3. Checkout the `main` branch:

```bash
git checkout main
```

4. Pull the latest changes:

```bash
git pull upstream main
```

5. Create a new branch for your fix or feature:

```bash
git checkout -b <fix/feature>-<short-description>
```

6. Commit your changes and push to your fork.
7. Open a Pull Request against this repository.

Your changes will then be reviewed.

---

# Database Setup

The project requires a PostgreSQL database populated using the provided `core_banking.sql` file.

## Prerequisites

Ensure the following are available:

* PostgreSQL installed and running
* `psql` command-line tool
* A PostgreSQL user with sufficient privileges (e.g., `postgres`)
* The `core_banking.sql` file in the project directory

---

## 1. Create the Database

If the database does not already exist, run:

```bash
psql -h localhost -U postgres -c "CREATE DATABASE core_banking;"
```

You will be prompted for your PostgreSQL password.

If the database already exists, you can skip this step.

---

## 2. Import the Database

Run the following command to import the schema and data:

```bash
psql -h localhost -U postgres -d core_banking < core_banking.sql
```

This command loads all tables, relationships, and seed data into the `core_banking` database.

---

## 3. Verify the Import

You can confirm the import was successful by listing the tables:

```bash
psql -h localhost -U postgres -d core_banking
\dt
```

---

## Example Full Workflow

```bash
psql -h localhost -U postgres -c "CREATE DATABASE core_banking;"
psql -h localhost -U postgres -d core_banking < core_banking.sql
psql -h localhost -U postgres -d core_banking
\dt
```

---

## Demo Credentials

```
Username: training
Password: test@123
```

---

# Running the Application

### Development

```bash
yarn start:dev
```

---

# Known Issues

This project contains **intentional issues** meant for debugging and evaluation.

Your task is to **identify the cause and implement the correct fix** so the system behaves as expected.

---

## 1. Group Endpoint Missing `officeName`

### Problem

When retrieving a group by its ID, the API response does not include the **office name**, even though the group belongs to an office.

### Expected Behavior

The endpoint should return the **office name as part of the group data**.

### Developer Task

* Locate the endpoint responsible for retrieving a group by ID.
* Investigate why the office name is not included.
* Update the query or response mapping so the office name is returned.

### Expected Result

The API response should include the correct `officeName`.

---

## 2. Status Filter Ignored

### Problem

The endpoint that retrieves groups accepts a `status` filter, but the filter has **no effect**.
All groups are returned regardless of the provided value.

### Expected Behavior

When a `status` parameter is provided, the API should return **only groups with that status**.

### Developer Task

* Locate where the groups query is executed.
* Ensure the `status` parameter is applied to the query.

### Expected Result

Providing `status=ACTIVE` should return **only active groups**.

---

## 3. Build Failure

### Problem

The project fails to start or build due to a **missing or incorrect import**.

### Expected Behavior

The project should **compile and run successfully**.

### Developer Task

* Identify the source of the build error.
* Correct the missing or incorrect import.

### Expected Result

The project should start successfully with:

```bash
yarn start:dev
```

---

## 4. RBAC Bypass (Authentication Issue)

### Problem

Some protected endpoints are accessible **without the required permissions**.

### Expected Behavior

Endpoints requiring authentication or specific roles should **properly enforce access restrictions**.

### Developer Task

* Review how authentication and authorization are implemented.
* Ensure role checks and guards are correctly applied.

### Expected Result

Users without the required permissions should **not be able to access restricted endpoints**.

---

# Tech Stack

* **Framework:** NestJS
* **Language:** TypeScript
* **Database:** PostgreSQL
* **ORM:** TypeORM
* **Testing:** Jest

---

## Candidate Implementation Notes

This section documents the changes implemented to address the intentional issues described above, and how to run and verify the solution locally.

### Implemented Fixes

- **1. Group endpoint missing `officeName`**
  - Updated the `GET /api/v1/groups/:id` endpoint to return a `GroupResponseDto` (wrapping `GroupDto`) instead of a raw entity.
  - `GroupDto` already exposes `officeName`, so the group detail response now includes the correct `officeName` as part of the group data.

- **2. Status filter ignored**
  - `GroupFiltersDto` already defined an optional `status?: string` filter.
  - Updated `GroupService.getGroups` to apply this filter by adding a `status.name ILIKE :statusName` condition when `filters.status` is provided.
  - This ensures calls like `GET /api/v1/groups?status=ACTIVE` return only groups with the requested status, while preserving existing role and office scoping.

- **3. Build failure (missing/incorrect import)**
  - Added the missing `AppService` import in `app.controller.ts`, resolving TypeScript errors related to `AppService` being unknown.
  - Imported `GroupResponseDto` into `group.controller.ts` and used it in the `GET /api/v1/groups/:id` handler.
  - Fixed the `GroupController` class structure so all route handlers are defined inside the class.
  - Verified that `yarn build` now completes successfully.

- **4. RBAC bypass (authentication/authorization issue)**
  - The `PATCH /api/v1/groups/:id/system-name` endpoint was documented as "Super User only" but allowed both `SUPER_USER` and `BRANCH_MANAGER`.
  - Tightened the `@Auth` decorator to `@Auth([RoleType.SUPER_USER])` so only Super Users can update group system names.
  - This aligns the effective RBAC with the documented behavior and removes the extra privilege previously granted to Branch Managers. Other protected endpoints continue to use the existing `Auth` decorator, `AuthGuard`, and `RolesGuard` stack.

### Quickstart (Local Setup)

- **Prerequisites**
  - Node.js ≥ 18
  - PostgreSQL running locally
  - `core_banking.sql` file available in the project root

- **Database**

  ```bash
  psql -h localhost -U postgres -c "CREATE DATABASE core_banking;"
  psql -h localhost -U postgres -d core_banking < core_banking.sql
  ```

- **Install & Build**

  ```bash
  yarn install
  yarn build
  ```

- **Run in Development**

  On Unix-like shells (macOS/Linux/Git Bash/WSL):

  ```bash
  yarn start:dev
  ```

  > Note (Windows): the `NODE_ENV=development` syntax used in the `start:dev` script is POSIX-style. On pure Command Prompt/PowerShell, you may need to run via a POSIX-compatible shell (e.g., Git Bash/WSL) or adjust the script to use a cross-platform environment tool such as `cross-env`.

### Verification Checklist

- **Groups list with status filter**
  - Call `GET /api/v1/groups?status=ACTIVE` with a user that has appropriate permissions.
  - Confirm only groups with status `Active` are returned.

- **Group by ID includes `officeName`**
  - Call `GET /api/v1/groups/:id`.
  - Confirm the response body includes `data.officeName` with the expected value.

- **RBAC on system name update**
  - Call `PATCH /api/v1/groups/:id/system-name`:
    - As a `SUPER_USER` → request succeeds with valid input.
    - As any other role (e.g., `BRANCH_MANAGER`) → request is rejected with `403 Forbidden`.

- **Build**
  - Run `yarn build` and confirm it completes without TypeScript errors.

---

# License

MIT License.

---