# Project Management API

A production-grade REST API for managing organizations, projects, and tasks with role-based access control, built with TypeScript, Express, PostgreSQL, and Prisma.

## Features

- **User Authentication** - JWT-based authentication with refresh tokens and multi-device support
- **Multi-tenant Architecture** - Manage multiple organizations with complete isolation
- **Role-Based Access Control** - OWNER, ADMIN, MEMBER roles at organization and project levels
- **Project Management** - Create and manage projects within organizations
- **Task Management** - Full task lifecycle with status tracking, priorities, and due dates
- **Member Management** - Add members to organizations and projects with role assignment
- **Advanced Filtering** - Filter tasks by status, priority, assignee, and date
- **Rate Limiting** - Token bucket algorithm for API protection
- **Input Validation** - Zod schema validation on all endpoints
- **Comprehensive Error Handling** - Meaningful error messages with proper HTTP status codes
- **Interactive API Documentation** - Swagger/OpenAPI 3.0.0 with try-it-out feature
- **174 Unit & Integration Tests** - Jest test suite with >80% coverage

## Tech Stack

| Layer                 | Technology             |
| --------------------- | ---------------------- |
| **Language**          | TypeScript 5.x         |
| **Runtime**           | Node.js 18+            |
| **Framework**         | Express.js 4.x         |
| **Database**          | PostgreSQL 14+         |
| **ORM**               | Prisma 7.x             |
| **Validation**        | Zod                    |
| **Authentication**    | JWT (jsonwebtoken)     |
| **Testing**           | Jest                   |
| **API Documentation** | Swagger/OpenAPI 3.0    |
| **Rate Limiting**     | Token Bucket Algorithm |

## Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/alesz1296-dev/project-backend-api.git
cd project-backend-api

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npx prisma migrate dev

# Run tests
npm run test

# Start development server
npm run dev
```
