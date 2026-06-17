# Blood Donation Emergency Matching System

An intelligent, role-based platform designed to match emergency blood requests with eligible donors in real-time, reducing the delay in critical situations.

## 🚀 Features

### Role-Based Access Control
- **Attendant (Patient's family/friend):** Can submit emergency blood requests and track fulfillment status.
- **Donor:** Receives real-time notifications for compatible requests in their city, can accept/decline consent requests, and track donation history.
- **Verifier (Hospital/System staff):** Reviews incoming requests for authenticity before broadcasting to donors.
- **Coordinator:** Manages the end-to-end fulfillment of verified requests, communicates with donors, and updates donation status.
- **Admin:** Manages system configurations (cooldown periods, request expiry), users, and monitors overall system health.

### Core Modules
- **Intelligent Matching Engine:** Matches verified requests with donors based on exact blood group compatibility and location.
- **Eligibility & Cooldown Tracking:** Automatically calculates donor eligibility based on their last donation date and system cooldown rules (e.g., 56 days).
- **Privacy-First Consent System:** Protects donor and attendant contact information until mutual consent is established.
- **AI Integration:** Uses AI to classify request urgency and predict donor no-show risks to assist coordinators.

## 🏗️ Architecture

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui.
- **Backend:** Next.js API Routes (Serverless functions).
- **Database:** PostgreSQL managed via Prisma ORM.
- **Authentication:** NextAuth.js v5 (Credentials Provider) with JWT sessions.
- **AI Service:** Google Gemini AI integrated via `@google/generative-ai`.
- **State Management:** Zustand (for client-side state) & React Server Components.

## ⚙️ Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mushahid-Ahmed/Blood-Donation-Emergency-Matching-System.git
   cd Blood-Donation-Emergency-Matching-System
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   # PostgreSQL Database Connection String
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bloodmatch?schema=public"

   # NextAuth Secret (Generate via: openssl rand -base64 32)
   AUTH_SECRET="your_generated_secret_here"
   
   # NextAuth URL
   NEXTAUTH_URL="http://localhost:3000"

   # Google Gemini API Key for AI features
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```

4. **Database Setup:**
   Ensure your PostgreSQL instance is running. Then execute:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
   *Note: The seed script creates the initial admin user and system configurations.*

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:3000`.

## 🔐 Demo Credentials

Use the following credentials to test different roles (password for all is `password123` unless otherwise stated):

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@bloodmatch.com | admin123 |
| **Donor** | donor@example.com | password123 |
| **Attendant** | attendant@example.com | password123 |
| **Verifier** | verifier@example.com | password123 |
| **Coordinator** | coordinator@example.com | password123 |

## 🤖 AI Usage Declaration

This application utilizes Artificial Intelligence (Google Gemini) in non-critical decision support roles:
1. **Urgency Classification:** AI analyzes the request description and outputs a suggested urgency level (Critical, Urgent, Standard) to assist Verifiers.
2. **No-Show Risk Scoring:** AI predicts the likelihood of a donor missing their appointment based on historical behavior and request context.

**Important:** AI outputs are treated strictly as *suggestions*. Final decisions (verifying requests, calling donors, confirming fulfillment) are always made by human Verifiers and Coordinators.

## 🔒 Security & Privacy Basics

- **No Exposed Secrets:** All environment variables are kept strictly on the server side.
- **Role Verification:** Both middleware and API routes perform strict role-checking before authorizing actions.
- **Privacy Masking:** Contact details between Donors and Attendants remain hidden until the Donor explicitly accepts the match consent.
