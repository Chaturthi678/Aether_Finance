# Finance Expense Tracker: Architecture & Notification System README

This document provides a detailed breakdown of the methodology, architecture, and technology stack powering the **Finance Expense Tracker** system, specifically focusing on the new **Authentication Tabs**, **Single Demo Persona**, and **Nodemailer Gmail SMTP Alert Notification Engine**.

---

## 🛠️ Technology Stack

The **Finance Expense Tracker** is designed as a secure, high-performance fintech dashboard:

### 1. Frontend Client
- **Framework**: [React 19](https://react.dev/) configured with [Vite 8](https://vite.dev/) as the fast compilation and bundling manager.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for robust types and structural safety.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) implementing a cohesive dark-mode glassmorphic interface, custom gradients, and smooth transition animations.
- **Visualizations**: [Recharts](https://recharts.org/) for area, bar, and donut graphs.
- **Iconography**: [Lucide React](https://lucide.dev/) for vector icons.

### 2. Backend Server
- **Environment**: [Node.js](https://nodejs.org/) (v18+).
- **Framework**: [Express.js](https://expressjs.com/) exposing REST APIs and hosting compiled production client assets.
- **Email Dispatcher**: [Nodemailer](https://nodemailer.com/) utilizing native SMTP configuration.
- **Environment config**: [dotenv](https://www.npmjs.com/package/dotenv) to manage credentials cleanly.
- **Security**: [Helmet](https://helmetjs.github.io/) for header defense, [CORS](https://github.com/expressjs/cors) for domain whitelisting, and [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit) to guard against API spam.

### 3. Database & Persistence Layer
- **User-Isolated Storage**: JSON file structures mapped per-user (e.g., `transactions_${email}.json`, `notifications_${email}.json`, `preferences_${email}.json`) to isolate user data.
- **Global Index**: A SQLite database (`database.db`) for structural indexing.

---

## 🏗️ System Architecture & Workflow

The system uses a **Header-Based Database Isolation** pattern. Every request from the React frontend includes the `X-User-Email` header. The Express server extracts this email via middleware to scope all filesystem reads and writes to that user.

```mermaid
graph TD
    Client[React Frontend / App.tsx] -- API Requests with X-User-Email Header --> Express[Express.js / server.js]
    Express --> Auth[authMiddleware.js]
    Auth -- Authenticated User Email --> Controller[Route Controller]
    
    Controller -- Read/Write user-scoped file --> DB[(db.js File Database)]
    DB <--> UserFiles[budgets/transactions/notifications JSON files]
    
    Controller -- Fire Event Trigger --> Engine[notificationEngine.js]
    Engine -- Resolve Preferences --> Prefs[preferences_${email}.json]
    Engine -- Build HTML template --> Email[emailService.js]
    
    Email -- Live Credentials configured? --> Transport{Transporter Check}
    Transport -- Yes --> Gmail[Gmail SMTP Service] --> Inbox((User's Gmail Inbox))
    Transport -- No --> Ethereal[Ethereal Developer SMTP] --> Sandbox((Console Preview Link))
```

---

## 📂 Key Files & Roles

The notification and authentication system involves the following files:

### 1. Database & Middleware Core
- **[db.js](file:///c:/Users/chatu/OneDrive/Pictures/Project_expense_tracker/backend/db/db.js)**:
  - Handles reading and writing JSON files.
  - Implements **self-healing data verification**; if budget or subscription data is corrupted, empty, or missing, it automatically seeds and persists default presets.
- **[auth.js](file:///c:/Users/chatu/OneDrive/Pictures/Project_expense_tracker/backend/middleware/auth.js)**:
  - Validates session headers and extracts the active user email to populate the `req.userEmail` field.

### 2. Authentication Componentry
- **[Login.tsx](file:///c:/Users/chatu/OneDrive/Pictures/Project_expense_tracker/frontend/src/components/Login.tsx)**:
  - Renders the interactive tabs (Sign In / Create Account) and onboarding slide features.
  - Presents a single quick-login card for the **Ananya Sharma** demo persona.
- **[authController.js](file:///c:/Users/chatu/OneDrive/Pictures/Project_expense_tracker/backend/controllers/authController.js)**:
  - Verifies credentials and dynamically signs up new users (auto-seeding 15+ UPI and banking transactions).
  - Triggers the background login security notification alert.

### 3. Alerts & Mail Delivery Service
- **[emailService.js](file:///c:/Users/chatu/OneDrive/Pictures/Project_expense_tracker/backend/services/emailService.js)**:
  - Connects to Nodemailer. Checks `.env` for `EMAIL_USER` and `EMAIL_PASS`. If configured, it instantiates Gmail SMTP (`service: 'gmail'`).
  - Sets the `From` envelope address to `EMAIL_USER` to align with strict DMARC/SPF requirements.
  - Falls back to Ethereal developer SMTP if variables are empty.
  - Houses custom CSS glassmorphic HTML email templates.
- **[notificationEngine.js](file:///c:/Users/chatu/OneDrive/Pictures/Project_expense_tracker/backend/services/notificationEngine.js)**:
  - Central manager for incoming events. Determines if an email should be dispatched based on preferences in `preferences_${email}.json`.
  - Scans user transactions for large expenses (> threshold limit) or category budget violations.
  - Performs countdowns for recurring subscriptions due in $\le 1$ day.
  - Compiles monthly summary reports, calling the **Gemini Advisor API** (with local rules fallback) for Indian professional wealth-building insights.

### 4. Controller Endpoints & Views
- **[notificationController.js](file:///c:/Users/chatu/OneDrive/Pictures/Project_expense_tracker/backend/controllers/notificationController.js)** & **[notificationRoutes.js](file:///c:/Users/chatu/OneDrive/Pictures/Project_expense_tracker/backend/routes/notificationRoutes.js)**:
  - Exposes endpoints to retrieve history logs, save configuration sliders, and trigger manual simulator alerts.
- **[Notifications.tsx](file:///c:/Users/chatu/OneDrive/Pictures/Project_expense_tracker/frontend/src/views/Notifications.tsx)**:
  - Displays the custom settings toggles and numerical threshold input.
  - Renders a clean chronological timeline feed of all security alerts, bank sync reports, and transaction notifications.
  - Hosts the Sandbox Test Suite trigger buttons (Send Test Alert / AI Wealth Summary).

---

## ⚙️ How It Works (Step-by-Step Methodology)

### 1. Unified Authentication & Dynamic Persona Seeding
1. When a new user creates an account, they provide an email, name, role, and city.
2. The backend (`authController.js`) stores the credentials inside `users.json`.
3. The server instantly invokes `generateMockBankData()` to pre-seed their account ledger with typical Indian transaction structures (UPI transfers, tapri chai payments, salary credits).
4. The system launches `triggerLoginAlert()`, sending a "New Session Active" alert to their email.

### 2. Transaction Sync & Real-Time Alert Evaluation
1. When a bank sync is completed (via Setu AA Sandbox callbacks), the backend updates the transactions database.
2. The backend immediately routes the synced batch through `checkSyncAlerts()`:
   - Triggers a "Bank Data Synced Successfully" confirmation email summarizing sync volume.
   - Loops through each transaction to check if it's a Debit exceeding the user's `largeExpenseLimit` (defaulting to ₹5,000). If so, it fires a "Large Expense Detected" alert.
   - Evaluates whether category spending for the current month has exceeded the custom limit. If it has, and no alert has been dispatched this month, it sends a "Budget Limit Exceeded" alert.

### 3. Subscription & Renewal Scanning
1. Active subscriptions (Netflix, utility bills) are stored in `subscriptions_${email}.json`.
2. When the user visits the dashboard or logs in, the engine scans the renewals:
   - Calculates the difference between the current date and `nextRenewal`.
   - If the renewal is due in 0 or 1 day, it triggers an "Upcoming Bill Alert" (limited to once every 7 days per subscription to prevent duplicate spam).

### 4. AI Wealth Digest Summaries
1. Triggering an AI Wealth summary compiles the user's monthly credits, debits, savings, and top spending categories.
2. If `GEMINI_API_KEY` is present, the engine calls Google's `gemini-2.5-flash` model, using a structured prompt that describes the user's persona (e.g. Software Engineer in Bangalore) and requests 3 distinct paragraphs of professional Indian financial advice.
3. If no API key is present, the system defaults to a rule-based advisor fallback.
4. The compiled summary is dispatched directly to the user's email.
