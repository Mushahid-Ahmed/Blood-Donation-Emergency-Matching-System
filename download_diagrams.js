const fs = require('fs');
const https = require('https');

const architecture = `graph TD
    subgraph Users
        A[Attendant]
        D[Donor]
        V[Verifier]
        C[Coordinator]
        AD[Admin]
    end
    subgraph "Frontend Layer (Next.js Client)"
        UI[React / shadcn UI]
        AuthClient[NextAuth Session Provider]
    end
    subgraph "Backend Layer (Next.js Server)"
        API[API Routes / Server Actions]
        AuthServer[NextAuth Auth Provider]
        MatchEngine[Matching Engine Algorithm]
        AIWrapper[AI Integration Service]
    end
    subgraph "Data Layer"
        ORM[Prisma ORM]
        DB[(PostgreSQL Database)]
    end
    subgraph "External Services"
        Gemini[Google Gemini AI]
    end
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
    ORM <-->|Read/Write| DB`;

const erd = `erDiagram
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
    User ||--o| DonorProfile : "has (if role is DONOR)"
    User ||--o{ BloodRequest : "submits (as Attendant)"
    User ||--o{ BloodRequest : "verifies (as Verifier)"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "performs action"
    DonorProfile ||--o{ DonorMatch : "matched to"
    DonorProfile ||--o{ DonationRecord : "donates"
    BloodRequest ||--o{ DonorMatch : "generates matches"
    BloodRequest ||--o{ DonationRecord : "fulfilled via"
    DonorMatch ||--o| DonationRecord : "results in"`;

// Function to encode string to base64 properly handling unicode if necessary (standard b64 is fine for this ascii text)
const b64Arch = Buffer.from(architecture).toString('base64');
const b64Erd = Buffer.from(erd).toString('base64');

const download = (url, path) => {
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to download ${path}: ${res.statusCode} ${res.statusMessage}`);
      return;
    }
    const file = fs.createWriteStream(path);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Successfully generated ${path}`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${path}:`, err.message);
  });
};

const archUrl = `https://mermaid.ink/img/${b64Arch}?type=png`;
const erdUrl = `https://mermaid.ink/img/${b64Erd}?type=png`;

download(archUrl, 'Architecture_Diagram.png');
download(erdUrl, 'ERD_Diagram.png');
