# Iceberg CRM – Design Document

## 1. Overview

This document describes the architectural decisions and design approach for the Iceberg CRM system.

The system is designed to manage real estate transactions, automate commission distribution, and provide full visibility into the transaction lifecycle.

The application consists of two main parts:

* A Nuxt 3 frontend application
* A NestJS + MongoDB Atlas backend

The goal of this document is not only to describe the current implementation, but also to clearly explain the reasoning behind key design decisions across the entire system.

---

## 2. Design Principles

The following principles guided the design of the system:

* **Domain-driven separation**: Agents, Properties, and Transactions are modeled as independent domains
* **Single responsibility**: UI, business logic, data access, and validation are clearly separated
* **Backend authority**: All critical business rules (commission, stage transitions) are enforced on the backend
* **Frontend clarity**: The UI should make the system state immediately understandable
* **Fault tolerance**: The application should remain usable even when API responses fail (development mode)
* **Scalability**: The system should allow adding new stages, reports, or entities without major refactoring

---

## 3. System Architecture

### Backend (NestJS)

The backend is responsible for:

* Providing RESTful APIs
* Managing data persistence via MongoDB Atlas
* Validating input using DTOs and pipes
* Enforcing transaction stage transitions
* Calculating and storing commission distribution
* Returning standardized error responses

### Frontend (Nuxt 3)

The frontend is responsible for:

* Rendering operational data in a clear and structured way
* Collecting user input and sending it to the API
* Handling UI-level validation
* Managing loading, empty, and error states
* Visualizing transaction lifecycle and financial data

This separation ensures that the backend is the single source of truth, while the frontend remains a thin and predictable presentation layer.

---

## 4. Module Organization & Backend Structure

The backend follows a domain-based modular structure:

* `AgentsModule`
* `PropertiesModule`
* `TransactionsModule`
* `ReportsModule`
* `CommonModule`

Each module includes:

* `controller` → handles HTTP requests
* `service` → contains business logic
* `repository` → manages database operations
* `dto` → defines validation rules
* `schema` → defines MongoDB models

This structure prevents business logic from leaking into controllers and keeps responsibilities clearly separated.

---

## 5. Data Modeling & Persistence Strategy

MongoDB Atlas was selected due to its flexibility and suitability for document-based data.

### Core Collections

* `agents`
* `properties`
* `transactions`

### Transaction Structure

The `transaction` entity is central and includes:

* property reference
* listing agent
* selling agent
* sale price
* stage
* commission breakdown

### Commission Storage Strategy (Key Decision)

Commission data is stored **embedded within the transaction document**.

#### Rationale:

* Acts as a **snapshot** of the financial outcome
* Prevents inconsistencies if business rules change in the future
* Enables fetching all relevant data in a single query
* Avoids unnecessary complexity of separate collections

---

## 6. Transaction Lifecycle & Stage Management

### Stages

A transaction progresses through the following stages:

* `agreement`
* `earnest_money`
* `title_deed`
* `completed`

### Decision: Strict Stage Transitions

Invalid transitions are **explicitly blocked at the backend level**.

#### Rationale:

* The workflow is linear and predictable
* Prevents inconsistent system states
* Ensures financial operations only occur at valid points
* Frontend restrictions alone are not sufficient

### Allowed Transitions

* agreement → earnest_money
* earnest_money → title_deed
* title_deed → completed

### Endpoint Design

Stage updates are handled via a dedicated endpoint:

PATCH /transactions/:id/stage

This separation is intentional because stage transitions include additional validation and side effects.

### Side Effects

* `earnest_money` → property status becomes `in_transaction`
* `title_deed` → property remains `in_transaction`
* `completed` →

  * property status becomes `sold`
  * commission is calculated and stored
  * agent earnings are updated

---

## 7. Commission Calculation Logic

### Formula

* Total commission = 5% of sale price
* 50% → agency
* 50% → agent pool

### Scenarios

#### Scenario 1: Same Agent

If the listing agent and selling agent are the same:

* The agent receives 100% of the agent pool

#### Scenario 2: Different Agents

If they are different:

* The agent pool is split equally (50/50)

### When is it calculated?

Commission is calculated **only when the transaction reaches `completed`**.

#### Rationale:

* Financial outcomes should only be finalized after completion
* Prevents partial or invalid financial records
* Ensures accurate reporting

---

## 8. API Design

A RESTful approach is used with predictable and resource-oriented endpoints.

### Transactions

* GET /transactions
* POST /transactions
* PATCH /transactions/:id
* PATCH /transactions/:id/stage

### Design Decision

Separating the stage endpoint allows:

* Isolated validation logic
* Clearer intent
* Easier testing and auditing

---

## 9. Frontend Architecture & UI Decisions

### Page Structure

* `/properties` → property management
* `/agents` → agent overview
* `/sales` → transaction lifecycle (kanban board)

### UI Patterns

* Table view → properties (comparison-heavy data)
* Card layout → agents (person-centric data)
* Kanban board → transactions (process tracking)

### Kanban Justification

* Visualizes the lifecycle clearly
* Highlights bottlenecks
* Enables fast operational decisions

---

## 10. Dashboard Behavior

* Data fetched via: GET /transactions
* Each transaction is rendered as a card
* Current stage is visually represented
* Only valid next actions are enabled

When a user triggers an action:

* PATCH /transactions/:id/stage is called
* Backend validates and processes the request
* UI updates based on response

---

## 11. State Management

Pinia is used for centralized state management.

### Responsibilities

* Store agents, properties, and transactions
* Manage API interactions
* Handle stage updates
* Provide fallback data during development

This reduces duplication and keeps data flow consistent across the app.

---

## 12. Validation & Error Handling

### Backend

* DTO-based validation
* Global validation pipe
* Whitelisting enabled
* Standardized error format

### Frontend

* Form-level validation
* Loading and empty states
* API error handling

---

## 13. Trade-offs & Design Decisions

### Embedded vs Dynamic Commission

* Embedded chosen for consistency and auditability

### Backend as Source of Truth

* Prevents logic duplication
* Ensures data integrity

### Strict Stage Flow

* Avoids invalid financial states
* Simplifies reasoning about the system

### Kanban UI

* Best fit for stage-based workflows

---

## 14. Future Improvements

* Authentication & authorization
* Role-based access control
* Audit logging
* Soft delete strategy
* Pagination & filtering
* Advanced reporting using aggregation pipelines

---

## 15. Conclusion

This system is designed with a strong focus on:

* Clear domain separation
* Centralized business logic
* Predictable data flow
* High data consistency

The chosen architecture balances simplicity and scalability, providing a solid foundation for evolving into a production-ready CRM system.
