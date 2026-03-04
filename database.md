# Database Schema Documentation

## Overview

The Project Management API uses **PostgreSQL** for data persistence with **Prisma** as the ORM layer. The schema is designed for a multi-tenant SaaS architecture with role-based access control at both organization and project levels.

## Entity Relationship Diagram

                          ┌──────────────┐
                          │    User      │
                          │              │
                          │ id (PK)      │
                          │ email (UK)   │
                          │ firstName    │
                          │ lastName     │
                          │ passwordHash │
                          │ avatar       │
                          │ createdAt    │
                          │ updatedAt    │
                          └──────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ↓                 ↓                 ↓
     ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐
     │ Membership   │  │ProjectMember │  │ RefreshTokenRecord│
     │              │  │    ship      │  │                   │
     │ (Org-Level)  │  │              │  │ id                │
     │              │  │ (Project-Lvl)│  │ token (UK)        │
     │ userId (FK)  │  │              │  │ userId (FK)       │
     │ orgId (FK)   │  │ userId (FK)  │  │ expiresAt         │
     │ role (ENUM)  │  │ projectId(FK)│  │ revokedAt         │
     │              │  │ role (ENUM)  │  │ createdAt         │
     └──────────────┘  └──────────────┘  │ updatedAt         │
            │                 │           └───────────────────┘
            ↓                 ↓
     ┌──────────────┐    ┌──────────────┐
     │Organization │    │   Project    │
     │              │    │              │
     │ id (PK)      │    │ id (PK)      │
     │ name         │    │ name         │
     │ description  │    │ description  │
     │ slug (UK)    │    │ organizationId(FK)
     │ ownerId (FK) │    │ createdBy(FK)│
     │ createdAt    │    │ status(ENUM) │
     │ updatedAt    │    │ createdAt    │
     │              │    │ updatedAt    │
     └──────────────┘    └──────────────┘
                               │
                               ↓
                          ┌──────────────┐
                          │    Task      │
                          │              │
                          │ id (PK)      │
                          │ title        │
                          │ description  │
                          │ projectId(FK)│
                          │ createdBy(FK)│
                          │ assignedTo(FK│
                          │ status(ENUM) │
                          │ priority(ENUM)
                          │ dueDate      │
                          │ createdAt    │
                          │ updatedAt    │
                          └──────────────┘
