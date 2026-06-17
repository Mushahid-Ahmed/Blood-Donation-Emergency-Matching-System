# System Architecture & ERD Diagrams

This document contains the visual representations of the system architecture and the database schema for the Blood Donation Emergency Matching System. These diagrams are generated using Mermaid syntax.

## 🏗️ System Architecture Diagram

This diagram illustrates how the different user roles interact with the Next.js full-stack application, how the backend services communicate with external AI, and the data flow into the PostgreSQL database.

```mermaid
graph TD
    %% User Roles
    subgraph Users
        A[Attendant]
        D[Donor]
        V[Verifier]
        C[Coordinator]
        AD[Admin]
    end

    %% Frontend Layer
    subgraph "Frontend Layer (Next.js Client)"
        UI[React / shadcn UI]
        AuthClient[NextAuth Session Provider]
    end

    %% Backend Layer
    subgraph "Backend Layer (Next.js Server)"
        API[API Routes / Server Actions]
        AuthServer[NextAuth Auth Provider]
        MatchEngine[Matching Engine Algorithm]
        AIWrapper[AI Integration Service]
    end

    %% Data Layer
    subgraph "Data Layer"
        ORM[Prisma ORM]
        DB[(PostgreSQL Database)]
    end

    %% External APIs
    subgraph "External Services"
        Gemini[Google Gemini AI]
    end

    %% Connections
    A -.->|Submits Emergency Request| UI
    D -.->|Receives Notification & Consents| UI
    V -.->|Verifies Request Legitimacy| UI
    C -.->|Manages Fulfillment Lifecycle| UI
    AD -.->|Configures System Rules| UI

    UI <--> AuthClient
    AuthClient <--> AuthServer
    UI <-->|HTTP/REST| API

    API <--> AuthServer
    API <--> MatchEngine
    API <--> AIWrapper
    
    API <--> ORM
    MatchEngine <--> ORM
    
    AIWrapper <-->|Urgency / Risk Scoring| Gemini
    
    ORM <-->|Read/Write| DB
```

---

## 🗄️ Database Schema (ERD)

This Entity-Relationship Diagram (ERD) outlines the core database tables and how they relate to one another to form the foundation of the matching system.

```mermaid
erDiagram
    %% Core Entities
    User {
        String id PK
        String name
        String email
        String password
        Role role
    }

    DonorProfile {
        String id PK
        String userId FK
        BloodGroup bloodGroup
        String city
        Boolean isEligible
        DateTime lastDonationDate
    }

    BloodRequest {
        String id PK
        String attendantId FK
        String verifiedById FK
        BloodGroup bloodGroup
        Int unitsNeeded
        String hospitalName
        UrgencyLevel urgency
        RequestStatus status
    }

    DonorMatch {
        String id PK
        String requestId FK
        String donorId FK
        Int matchScore
        ConsentStatus consentStatus
        FulfillmentStatus fulfillmentStatus
    }

    DonationRecord {
        String id PK
        String donorId FK
        String requestId FK
        String matchId FK
        Int units
        DateTime donatedAt
    }

    Notification {
        String id PK
        String userId FK
        NotificationType type
        String body
    }

    AuditLog {
        String id PK
        String actorId FK
        String action
        String targetType
    }

    SystemConfig {
        String id PK
        String key
        String value
    }

    %% Relationships
    User ||--o| DonorProfile : "has (if role is DONOR)"
    User ||--o{ BloodRequest : "submits (as Attendant)"
    User ||--o{ BloodRequest : "verifies (as Verifier)"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "performs action"
    
    DonorProfile ||--o{ DonorMatch : "matched to"
    DonorProfile ||--o{ DonationRecord : "donates"
    
    BloodRequest ||--o{ DonorMatch : "generates matches"
    BloodRequest ||--o{ DonationRecord : "fulfilled via"
    
    DonorMatch ||--o| DonationRecord : "results in"
```

## How to View These Diagrams
If you are viewing this file on **GitHub**, GitHub will automatically render these Mermaid code blocks into visual diagrams. 
If you are viewing this locally, you can use any markdown previewer that supports Mermaid (such as the Markdown Preview Enhanced extension for VS Code) or copy the code blocks into [Mermaid Live Editor](https://mermaid.live).
