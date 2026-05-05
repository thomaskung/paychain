# Paychain: Disposable Smart Contract (DSC) Payment Protocol

Paychain is a Proof-of-Concept (POC) for a secure, immutable, and programmable payment protocol designed for institutional and high-security DeFi environments. 

## The Core Innovation: Disposable Smart Contracts (DSC)

Traditional blockchains treat "Token Transfer" as a native primitive. Paychain replaces this with **Disposable Smart Contracts**. Every payment is a unique, one-off contract instance.

---

## Documentation Index
-   **[DESIGN.md](./DESIGN.md)**: Architectural principles and core components.
-   **[VISION.md](./VISION.md)**: The "Dual-Provider" economic model and value proposition.
-   **[RESEARCH.md](./RESEARCH.md)**: Comparative analysis of L1 vs L2 architectures.
-   **[SECURITY.md](./SECURITY.md)**: Detailed attack scenarios and DSC-based mitigations.
-   **[GOVERNANCE.md](./GOVERNANCE.md)**: Tokenomics (Paycoin) and staking mechanisms.

---

## Advanced Security Features

### 1. 3-Step Secure Payment Flow
-   **Initialize**: Whitelist the sender and recipient without locking funds yet.
-   **Verify**: Allows off-chain verification of the contract parameters.
-   **Deposit**: The whitelisted sender locks the *exact* amount into the DSC.
-   **Oracle-Gated Payout**: Funds are only released after a real-time compliance check.

### 2. Programmable Compliance
-   Integrated Oracle screening.
-   **Wallet D** is specifically blacklisted for testing purposes.
-   **Wallets A, B, and C** are benign.

### 3. Secure PSC Interactivity (Swaps)
-   Direct interaction with Permanent Smart Contracts (PSCs) can be risky.
-   Paychain uses DSCs as a "Secure Bridge" for PSC interactions (e.g., swapping tokens).
-   The DSC holds the funds and only executes the PSC logic after Oracle clearance.

---

## System Architecture

-   **`node/`**: A simulated L1 Blockchain Node (TypeScript/Express).
-   **`oracle/`**: A Compliance Oracle (TypeScript/Express) with a blacklist.
-   **`web/`**: A Modern Dashboard (React/Vite/Vanilla CSS) with a wallet switcher.

---

## POC Walkthrough

### 1. Initialize a Payment
- Use the **Initialize DSC** card to whitelist a recipient and set an amount.
- This creates a contract in `PENDING_DEPOSIT` state.

### 2. Deposit Funds
- As the sender, find the DSC in the lifecycle list and click **Deposit**.
- This locks the funds. Status flips to `ACTIVE`.

### 3. Compliance Clearance
- Click **Trigger Payout**.
- If the recipient is **Wallet D**, the Oracle will reject the payout.
- If the recipient is **Wallet C**, the Oracle clears it, and funds are transferred.

### 4. Secure Swap
- Use the **Secure Swap (via DSC)** button.
- This ensures that tokens moving to a swap contract are protected by the same DSC isolation and Oracle gating as standard payments.

---

## Running the Services

1. **Start the Node**: `cd node && npm start` (Port 3001)
2. **Start the Oracle**: `cd oracle && npm start` (Port 3002)
3. **Start the Dashboard**: `cd web && npm run dev` (Port 5173)
