# Shree Balaji Travels - Bus Operating Business Admin (Client Demo)

A comprehensive, clickable, front-end-only management web app built for an Indian inter-state bus operating business (**Shree Balaji Travels, Delhi**).

---

## 🚀 Quick Start & How to Run

1. **Install Dependencies** (already installed in workspace):
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🔑 Demo Login

- **URL**: Navigate to root (`/`)
- **Email**: `owner@demo.com` (Prefilled)
- **Password**: `demo123` (Prefilled)
- **Action**: Click **"Enter Demo as Owner (Admin)"** to access the complete application immediately with full administrator privileges.

---

## 🔄 How to Reset Demo Data

At any point during the presentation, you can restore all 8 buses, 10 workers, 15 charter bookings, 40 route tickets, 40 expenses, and payments back to the pristine **2 November 2026** baseline:

1. Click the **"Reset Demo"** button in the top navigation bar, OR
2. Go to **Settings** (`/settings`) and click **"Reset Demo Data"**.
3. Confetti will fire and a confirmation toast will confirm that state has reloaded into `localStorage`.

---

## 🌟 Guided Demo Script (11-Step Live Presentation Walkthrough)

Click **"Start Guided Demo"** on the dashboard or top navbar to launch the interactive floating presenter guide that automatically walks through the client presentation:

| Step | Screen | Story to Tell the Client |
|---|---|---|
| **1. Dashboard Overview & Alerts** | Dashboard (`/`) | *"Here is your central command center: today's 2 active highway trips, monthly revenue vs expenses, pending party ledger dues, and upcoming document expiries."* |
| **2. Charter Booking & Conflict Detector** | Charter Bookings (`/charter-bookings`) | *"Create quotations for wedding (Shadi/Vivah), school trips, or govt contracts with our live km/day fare calculator. Notice that if you attempt to assign Bus `DL 01 AB 4090` on 5–7 Nov, our system **blocks double-booking** in red and suggests free buses."* |
| **3. Customer Advance & Ledger** | Payments (`/payments`) | *"When the customer pays an advance via UPI or NEFT, recording it instantly updates the party ledger, creates a verified voucher receipt, and triggers an SMS alert."* |
| **4. Route Ticketing & Seat Selection** | Route Tickets (`/route-tickets`) | *"Sell tickets on Delhi ↔ Siliguri and Delhi ↔ Patna routes. The interactive sleeper/seater visual layout lets you select upper/lower berths, marks ladies seats, computes intermediate stop fares, and issues QR code tickets."* |
| **5. Cancellation & Auto Credit Note** | Route Tickets (`/route-tickets`) | *"If a customer cancels, the time-tiered refund rules (90% > 24h, 50% 6–24h) calculate the refund amount automatically and generate a GST Credit Note without manual paperwork."* |
| **6. Expenses & Per-Trip Profit/Loss** | Expenses (`/expenses`) | *"Track diesel fuel bills with receipt attachments, FASTag expressway tolls, and maintenance. Switch to **Per-Trip P&L** to see exact bottom-line profit margins on each trip."* |
| **7. Reminders & Compliance Hub** | Reminders (`/reminders`) | *"Never get caught with expired papers: Fitness expiry and insurance alerts alert you 7 days in advance. Snooze, mark done, or send direct WhatsApp/SMS reminders in 1 click."* |
| **8. Monthly Crew Payroll** | Workers & Salary (`/workers`) | *"Review conductor and driver attendance on an interactive grid. Prorated salary + trip allowances − advances = net payable. Paying salary automatically creates an expense entry and sends SMS."* |
| **9. GST Tax Invoicing & CA Reports** | GST Invoices (`/gst`) & Reports (`/gst-reports`) | *"Automatic CGST+SGST (for Delhi customers) vs IGST (for UP/Bihar interstate passengers). One-click Excel/CSV export formatted for your Chartered Accountant's GSTR-1 filing."* |
| **10. Audit History & Safety Warnings** | Change History (`/change-history`) | *"Every modification is logged with operator name, old value, new value, and timestamp. Editing confirmed bookings triggers a compliance warning dialog."* |
| **11. Settings & Live Ticket Designer** | Settings (`/settings`) | *"Configure company letterhead, terms, and toggle fields like Passenger ID and GST lines with a **real-time live ticket preview** that re-renders as you switch toggles."* |

---

## 🇮🇳 Indian Operating Context & Design Highlights

- **Currency & Grouping**: Standard Indian lakh/crore formatting (e.g. `₹1,25,000`, `₹76,500`).
- **Dates**: Standard `DD MMM YYYY` (e.g. `02 Nov 2026`).
- **Bilingual Interface**: Quick toggle for **English / हिंदी** in the top navigation bar.
- **Mobile First**: Installable PWA look with bottom navigation bar for smartphone usage by the fleet owner on the go, and desktop sidebar for office dispatchers.
- **Exporting**: Instant CSV downloads on all registers (Bookings, Route Tickets, Customers, Expenses, Payroll, GST, and Change History).

---

## 📋 Architectural Assumptions Noted

- **Date Anchor**: Fixed to **2 November 2026** so today's departures, tomorrow's school charter, and 3-day EMI auto-debit alerts display authentically.
- **DLT Gateway**: Mock transactional SMS gateway integrated with Jio/TRAI registered Header `BALAJI`.
- **GST Rate**: Configured at statutory 5% for passenger transport services under SAC code `9964`.

