# Personal Finance & Fund Management Web App

A clean, minimalist, and premium personal finance dashboard built using React, Vite, TypeScript, Tailwind CSS v4, and IndexedDB. This application runs completely locally in the browser, requires no external databases or servers, and stores all user data securely using client-side IndexedDB persistence.

---

## 🌟 Key Features

### 1. Strict Audit Balance Engine
- Fund balances are calculated dynamically from transaction history.
- No static or out-of-sync fields, ensuring 100% consistency and auditability.
- Calculation logic:
  $$\text{Balance}(F) = \sum \text{Credits}(F) - \sum \text{Expenses}(F) - \sum \text{TransfersFrom}(F) + \sum \text{TransfersTo}(F) + \sum \text{Adjustments}(F)$$

### 2. First-Launch Setup Wizard
- A beautiful step-by-step onboarding walkthrough triggered automatically on the first launch.
- Allows you to set up initial balances for default funds (*Project*, *Home*, and *Personal*) as opening balance credits.

### 3. Floating Action Button (FAB) & Unified Modals
- Fixed quick-action button in the bottom-right corner to trigger transactions from any page.
- Supports 4 tabbed transaction types: Credits, Expenses, Transfers, and Adjustments.

### 4. Statement Reconciliation System
- Easily compare actual bank statements to the calculated balance in the app.
- Computes discrepancies and generates a reconciliation adjustment transaction to balance the fund.

### 5. Rich Analytics & Visualizations
- Interactive dashboards using Recharts:
  - **Distribution**: Pie chart of fund assets.
  - **Spending Trends**: Line chart of monthly expenses.
  - **Inflow vs. Outflow**: Bar chart comparing credits and expenses.

### 6. Upcoming Expenses Checklist
- Schedule bills and reminders.
- Use **Mark as Paid** to clear the reminder and automatically log the corresponding expense transaction.

### 7. Core Settings & Customization
- Choose custom currencies, names, icons, and colors.
- Organize, archive, and restore funds.
- Import/Export structured JSON data with schema versioning checks.

### 8. Premium Dark & Light Themes
- Sleek dark and light modes styled with Tailwind CSS v4.
- Integrates with system preferences.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript
- **Bundler & Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 (Vanilla CSS variables configuration)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Storage**: Native IndexedDB (Asynchronous storage layers)

---

## 🚀 How to Run Locally

For non-technical users, a smart launcher is provided to start the app with a single action:

### On Windows:
1. Double-click the **`run.bat`** file in the project root (or **`run_finance_app.bat`** in your user directory).
2. The launcher will automatically:
   - Check if port `5186` is available.
   - Automatically terminate any conflicting zombie processes listening on port `5186`.
   - Start the Vite local development server.
   - Wait for the server to initialize.
   - Automatically launch your default web browser to `http://localhost:5186`.

### Manual Startup (Any OS):
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5186` in your browser.
