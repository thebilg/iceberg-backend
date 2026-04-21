# Iceberg CRM – Backend

## Live API

https://iceberg-backend-production-e7ad.up.railway.app/

## Overview

This repository contains the backend implementation of the Iceberg CRM system.

The system is designed to manage real estate transactions, automate commission distribution, and ensure full traceability of the transaction lifecycle.

Built with a strong focus on clean architecture, business rule centralization, and data consistency.

---

## Tech Stack

* Node.js (LTS)
* TypeScript
* NestJS
* MongoDB Atlas
* Mongoose
* Jest (for unit testing)

---

## Core Features

* Transaction lifecycle management (agreement → completed)
* Strict stage transition validation
* Automated commission calculation
* Financial breakdown per transaction
* RESTful API design
* DTO-based validation & error handling

---

## Project Structure

```txt
src/
  modules/
    agent/
    property/
    transaction/
```

Each module includes:

* controller (HTTP layer)
* service (business logic)
* dto (validation)
* schema (MongoDB models)

---

## Transaction Flow

Transactions move through the following stages:

* agreement
* earnest_money
* title_deed
* completed

Invalid transitions are blocked at the backend level to ensure data integrity.

---

## Commission Logic

* Total commission = 5% of sale price
* 50% → agency
* 50% → agents

Rules:

* Same agent → gets 100% of agent share
* Different agents → split equally

Commission is calculated only when a transaction reaches `completed`.

---

## API Endpoints

### Agents

* GET /agents
* POST /agents
* DELETE /agents/:id

### Properties

* GET /properties
* POST /properties
* DELETE /properties/:id

### Transactions

* GET /transactions
* POST /transactions
* PATCH /transactions/:id/stage
* DELETE /transactions/:id

---

## Validation & Error Handling

* DTO + Validation Pipe
* Whitelist enabled
* Standard error response format

---

## Environment Variables

Required for backend runtime:

* `MONGO_URI` - MongoDB Atlas connection string

Optional:

* `PORT` - server port, defaults to `8080`
* `FRONTEND_URL` - frontend origin used during deployment coordination

Example local setup:

```bash
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
PORT=8080
FRONTEND_URL=http://localhost:3000
```

---

## Running the Project

```bash
npm install
npm run start:dev
```

---

## Backend Unit Tests

The case requires mandatory backend unit tests for commission rules, stage transitions, and core business logic.

This requirement is currently covered in:

* `src/modules/transaction/transaction.service.spec.ts`

Covered scenarios:

* commission split when listing and selling agents are the same
* commission split when listing and selling agents are different
* valid stage transitions
* invalid stage transition rejection
* alias-based stage normalization
* transaction creation business rules
* completion side effects (`sold` status, earnings update, commission persistence)

Run the relevant unit test file with:

```bash
npm test -- --runInBand transaction.service.spec.ts
```

Run all tests with:

```bash
npm test
```

---

## Design Document

For backend architecture, data model decisions, and frontend integration notes:

👉 See DESIGN.md

---

## Notes

* Business logic is centralized in the service layer
* Backend is the single source of truth for all rules
* Commission data is stored as a snapshot inside transactions

---
