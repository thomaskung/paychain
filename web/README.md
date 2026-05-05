# Paychain Web Dashboard

The Paychain Web Dashboard is a modern, real-time interface designed to visualize and interact with the Paychain L1 node and the Compliance Oracle.

## Tech Stack
- **Framework:** React 18+ (TypeScript)
- **Build Tool:** Vite
- **Icons:** Lucide-React
- **HTTP Client:** Axios
- **Styling:** Vanilla CSS (App.css)

## Environment & Connections
The dashboard is configured to communicate with the following local services:
- **L1 Blockchain Node:** `http://localhost:3001`
- **Compliance Oracle:** `http://localhost:3002`

## Test Wallets
The following hardcoded wallets are used for the POC simulation:
- **Wallet A:** `0x1111111111111111111111111111111111111111` (Benign)
- **Wallet B:** `0x2222222222222222222222222222222222222222` (Benign - Default active sender)
- **Wallet C:** `0x3333333333333333333333333333333333333333` (Benign - Target for cleared payouts)
- **Wallet D:** `0x4444444444444444444444444444444444444444` (Blacklisted - Target for rejected payouts)

## Getting Started
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Ensure the `node` and `oracle` services are running simultaneously.
