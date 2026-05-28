# 🪙 Aether Finance: Indian Personal Expense Tracker & AI Assistant

Aether Finance is a premium, dark-mode-first personal financial management application tailored specifically for the Indian ecosystem. It integrates local bank account simulation (via mock Setu Account Aggregator pipelines), advanced transaction ledgers, SMS financial alert parsing, drag-and-drop receipt scanning via multimodal AI, budget category gauges, subscription trackers, and a floating context-aware AI Assistant.

The frontend is built using **React, TypeScript, Tailwind CSS v4, Lucide Icons, and Recharts**, while the backend is powered by **Express.js** and a local file-based JSON ledger database.

---

## 🚀 Key Features

1. **Dashboard Overview**: Track your net worth, total inflows (Income), outflows (Expenses), and Net Savings Rate. Visualize Month-on-Month trends using interactive Recharts Area and Bar graphs.
2. **Setu Mock Sync**: Overwrite or populate your transaction database instantly using a simulated Indian bank consent pipeline containing realistic transaction records (UPI, NEFT, salary credits, tapri chai payments).
3. **Transaction Ledger**:
   * **Advanced Table**: Sort, search, page, and filter transaction records by type (debits/credits) or category.
   * **SMS Alert Parser**: Paste raw SMS debit/credit alerts from Indian banks (SBI, HDFC, ICICI, etc.) and let Aether extract the amount, date, narration, and auto-categorize it.
   * **CSV Statement Import**: Bulk import transaction logs matching standard header formats.
   * **Manual Entry Form**: Fast addition of transactions directly to the ledger.
4. **AI Receipt Scanner**: Snap a webcam snapshot or drag-and-drop a receipt image (JPEG/PNG). The backend scans the receipt using Gemini 2.5 Flash and extracts details (merchant name, amount, date, category) into a review modal.
5. **Budgets & Renewals**:
   * **Smart Gauges**: Set custom monthly category budget limits. Progress bars automatically glow amber (at >80% limit) or red (exceeded) to keep your spending in check.
   * **Subscription Tracker**: List and monitor active renewals (Netflix, broadband, Jio Fiber, utilities) with automated countdown timers to upcoming bills.
6. **Detailed Analytics**: Inspect expense breakdowns via interactive Donut charts and view merchant spending leaderboards.
7. **Context-Aware AI Assistant**: A bottom-right floating panel that absorbs the global transaction ledger state. You can query Aether AI in natural language to analyze your spending or receive customized savings tips (e.g., tracking small tea/UPI payments). Works offline using a rule-based analyzer if no Gemini key is set.

---

## 📂 Project Directory Structure

```text
├── .vscode/                 # VS Code configurations
│   └── launch.json          # Side-by-side backend & frontend debugging profiles
├── frontend/                # React Vite TypeScript frontend workspace
│   ├── src/
│   │   ├── components/      # Common UI parts (Sidebar, AI Assistant)
│   │   ├── views/           # Views (Dashboard, Transactions, Scanner, Budgets, Analytics)
│   │   ├── types/           # TS definitions
│   │   ├── App.tsx          # State coordinator
│   │   ├── main.tsx         # DOM entry
│   │   └── index.css        # Tailwind v4 theme configurations
│   ├── package.json         # Client packages and build scripts
│   ├── postcss.config.js    # PostCSS configs mapped to @tailwindcss/postcss
│   └── vite.config.ts       # Proxy configurations and output path definitions
├── public/                  # Static folder where frontend compiles (production assets)
├── .env                     # Local environment settings (Gemini API keys, etc.)
├── db.js                    # Database mapping utilities
├── transactions.json        # File-based database ledger
├── setuMock.js              # Mock banking data pipeline
├── server.js                # Express REST API engine
└── package.json             # Root-level build and start scripts
```

---

## 🛠️ Requirements & Installation

1. Make sure you have **Node.js** (v18 or higher) and **npm** installed on your machine.
2. Clone or open the project folder in your workspace.
3. Open a terminal in the project root and install all dependencies:
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   ```

### Configure Environment Variables
Create a file named `.env` in the root folder of the project (you can copy `.env.example` as a template):
```env
PORT=3000
GEMINI_API_KEY=your-gemini-api-key-here
```
*Note: If `GEMINI_API_KEY` is not provided, the receipt scanner and AI Assistant will run gracefully in local fallback mode using mock data and local rule-based analytics.*

---

## 💻 Running the Project on VS Code

VS Code allows you to launch both components side-by-side with one click using the pre-configured `.vscode/launch.json`.

### Method A: Single-Click Debugging (Recommended)
1. Open the project folder in **VS Code**.
2. Install the recommended extensions if prompted (e.g., ESLint, Tailwind CSS IntelliSense).
3. Press **`F5`** or click on the **Run and Debug** icon on the left sidebar (the play symbol with a bug).
4. In the dropdown at the top of the Run panel, select **`Full App (Dev Mode)`** and click the green play button.
5. VS Code will automatically spin up two integrated terminal panes:
   * **Launch Backend (Express)** running on `http://localhost:3000`
   * **Launch Frontend (Vite)** running on `http://localhost:5173` (proxied to 3000)
6. Open your browser to **`http://localhost:5173`** to access the dev site with Hot Module Reload (HMR) enabled, or **`http://localhost:3000`** to view the production build.

---

## 🖥️ Running the Project via Command Line (Alternative)

If you prefer using standard CLI terminals, you have two options depending on whether you want a production preview or hot-reloading development servers:

### Option A: Development Mode (Hot-Reloading)
Run the server and client separately to enable instant changes:
1. **Terminal 1 (Backend)**:
   ```bash
   npm run start
   ```
2. **Terminal 2 (Frontend)**:
   ```bash
   npm run client
   ```
3. Access the web app at `http://localhost:5173`.

### Option B: Production Build (Single Port serving compiled app)
Vite compiles the frontend into `/public` assets, and Express serves it on port 3000:
1. Build the frontend:
   ```bash
   npm run build
   ```
2. Start the Express server:
   ```bash
   npm run start
   ```
3. Open your browser to `http://localhost:3000` to view the compiled web app.

---

## 🔍 Verification & Testing Steps

1. **Dashboard & Sync**: Click **Sync Real Bank via Setu** on the Dashboard view. Verify that the syncing status updates and the dashboard is instantly filled with 10 mock transactions and charts.
2. **SMS Alerts**: Go to **Transactions** > **Paste SMS**, paste the following text:
   `Debited Rs. 420.00 from A/C X9877 to Swiggy on 2026-05-22. Ref: UPI.`
   Click **Parse & Fill Form** and verify that Swiggy, ₹420.00, DEBIT, and Food & Dining are loaded.
3. **AI Chat Assistant**: Click the floating bubble in the bottom right, select `"Analyze my spending"` or type `"Give me saving tips"`, and verify that the advisor returns mathematical insights based on the synced transactions.
