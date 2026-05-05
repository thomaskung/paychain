# Paychain Design Document (POC)

## Overview
Paychain is a secure, immutable, and programmable payment protocol designed to mitigate cyberattack risks in DeFi and institutional finance. It utilizes "Disposable Smart Contracts" (DSC) as the *exclusive* mechanism for value transfer.

## Core Principles
1.  **Exclusive DSC Transfers:** There is no "transfer" primitive in the protocol. All value movement occurs via DSC deployment and interaction.
2.  **Wallet Model:** Wallets are limited to two primary actions:
    -   **Deploy:** Launch a DSC instance.
    -   **Interact:** Deposit funds into or call functions on a DSC.
3.  **Ephemeral Lifecycle:** Every DSC has a user-defined lifespan (e.g., 15 minutes). Expired contracts automatically refund deposits.
4.  **Programmable Compliance:** Integrated Oracle checks for AML/Sanctions at the point of transfer.

## Architecture Options
We are evaluating two primary paths:
1.  **L2 Solution:** Built on top of high-performance EVM or Solana chains. Uses the base layer for finality but enforces the Paychain DSC-only rules at the L2 level.
2.  **L1/L0 Solution:** A purpose-built blockchain optimized for high-throughput DSC execution with no native transfer function.

## Core Components
1.  **Permanent Smart Contracts (PSC):**
    -   Used for long-lived logic, such as token definitions (e.g., "TestCoin").
    -   Standard state storage.
    -   Higher validation cost due to persistent storage footprint.
2.  **Disposable Smart Contracts (DSC):**
    -   Used for one-off transfers or specific payment executions.
    -   Exclusive mechanism for value movement.
    -   Lower validation cost; optimized for high-throughput and pruning.
    -   Native expiry and refund logic.

## Logic Flow (POC Test Case)
-   **Step 1:** Wallet A deploys a PSC to define "TestCoin".
-   **Step 2:** Wallet B calls a function on the "TestCoin" PSC to acquire tokens.
-   **Step 3:** Wallet B deploys a DSC to transfer "TestCoin" to Wallet C.
    -   The DSC includes a 1-minute delay/expiry.
    -   The DSC checks for clearance (e.g., from an Oracle) before final transfer.

## Technical Stack (POC)
-   **Blockchain Node:** Simulated L1 node (Express/Node.js) implementing:
    -   REST API interface for external interaction and simulation control.
    -   Account management (Balances of native and PSC tokens).
    -   PSC registry and state management.
    -   DSC engine with auto-expiry.
    -   Validation fee model (PSC > DSC).
-   **Frontend:** React dashboard (Axios/Vite) to visualize the PSC/DSC lifecycle and execute the test flow via the node's REST API.

## Roadmap
1.  **Research:** Comparative analysis of L1 vs L2 architectures for DSC-only payments.
2.  **Node Prototype:** Implementation of a minimal blockchain node with a custom state machine.
3.  **DSC Engine:** Development of the "One-off" contract template and execution logic.
4.  **Frontend Dashboard:** Real-time visualization of the chain and transaction lifecycle.
