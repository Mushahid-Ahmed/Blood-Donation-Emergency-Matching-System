# Project Summary: Blood Donation Emergency Matching System

##  The Problem
During medical emergencies, finding a matching blood donor is often a chaotic, time-consuming process. Families of patients (attendants) typically resort to broadcasting requests on social media or WhatsApp groups, which leads to several major issues:
1. **Delays:** Precious time is lost waiting for the right person to see the post.
2. **Privacy Risks:** Attendants and donors are forced to share personal contact information publicly.
3. **Misinformation & Spam:** Outdated or fulfilled requests continue circulating, leading to spam calls long after the emergency is over.
4. **Donor Fatigue:** Donors are often contacted when they are not eligible (e.g., recently donated or too far away).

##  Target Users & Roles
The platform operates on a strict Role-Based Access Control (RBAC) model to ensure efficiency and data privacy:
- **Attendant:** The family member or friend of the patient who urgently needs blood. They submit the initial request and track its progress.
- **Donor:** Volunteers who register their blood group and location. They receive targeted notifications only when they are a confirmed match and currently eligible.
- **Verifier:** Hospital or system staff who manually verify the authenticity of the emergency request before it is broadcasted to the donor pool.
- **Coordinator:** Managers who oversee verified requests, communicate securely with matched donors, and update the fulfillment status (e.g., Donated, No-Show).
- **Admin:** System administrators who manage user accounts, oversee platform health, and adjust global configurations (like cooldown periods).

##  MVP Scope
The Minimum Viable Product (MVP) focuses on the core workflow of securing emergency blood donations efficiently:
1. **Secure Onboarding:** Registration and authentication for all user roles.
2. **Emergency Request Submission:** A streamlined form for attendants to post requests.
3. **Verification Workflow:** A queue system for Verifiers to approve or reject requests.
4. **Intelligent Matching Engine:** Automatically pairs verified requests with nearby, eligible donors of the exact required blood group.
5. **Double-Blind Consent System:** Hides contact details from both parties until the Donor explicitly accepts the match.
6. **Fulfillment Tracking:** Tools for Coordinators to track the lifecycle of the donation from 'Committed' to 'Donated'.
7. **Basic AI Assistance:** Simple integrations for urgency classification and no-show risk assessment.

##  Completed Modules
- **Infrastructure & Database:** Fully implemented PostgreSQL database with Prisma ORM, handling users, profiles, requests, matches, and audit logs.
- **Authentication:** NextAuth.js integrated with role-based middleware routing.
- **Core Business Logic:** Blood compatibility matrices and eligibility cooldown calculators (e.g., 56 days between donations) are fully operational.
- **Matching Engine:** Automatically executed upon request verification, connecting the right donors to the right hospitals.
- **Role-Specific Dashboards:** Custom UI/UX for all 5 roles, complete with tracking, statistics, and required actions.
- **System Config & Administration:** Real-time settings updates for Admins.
- **AI Service Integrations:** Google Gemini is wired into the request creation and matching loops to provide intelligent suggestions.

##  Future Scope
While the MVP solves the immediate crisis workflow, future iterations of the platform could include:
1. **Live GPS Tracking:** Integrating Maps APIs to track the donor's ETA to the hospital in real-time.
2. **Push Notifications & SMS:** Upgrading from in-app notifications to real SMS and WhatsApp API integrations for instant alerts.
3. **Gamification & Rewards:** Introducing a points system, badges, and leaderboards to incentivize regular donors.
4. **Hospital Inventory Integration:** Connecting directly to hospital blood bank APIs to auto-fulfill requests if inventory already exists.
5. **Advanced AI:** Predictive analytics to forecast blood shortages in specific cities based on historical emergency data.
