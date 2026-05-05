# Paychain Research: L1 vs L2 for DSC-Exclusive Payments

## Objective
To determine the optimal architecture for a payment-focused blockchain where **Disposable Smart Contracts (DSC)** are the *only* mechanism for value transfer.

## 1. Comparative Analysis

### Option A: Specialized L1 (Custom Protocol)
- **Concept:** A blockchain built from the ground up (e.g., using Cosmos SDK, Substrate, or a custom Go/Rust node) that lacks a native `send` or `transfer` transaction type.
- **Pros:**
    - **Protocol-Level Enforcement:** We can strictly enforce that *every* transaction must be a DSC deployment or interaction. No "backdoors" for simple transfers.
    - **Optimized VM:** The virtual machine can be simplified to only handle DSC logic, increasing throughput (millions/sec target).
    - **Native Expiry:** Block headers can natively track contract lifespans and trigger refunds at the protocol level (more efficient than manual triggers).
- **Cons:**
    - **Security Bootstrapping:** Needs a dedicated validator set. High risk of 51% attacks in early stages.
    - **Ecosystem Isolation:** Bridging to other chains is complex.

### Option B: Restricted L2 (EVM/Solana Rollup)
- **Concept:** A Layer 2 rollup where the sequencer is programmed to reject any transaction that isn't a Paychain DSC interaction.
- **Pros:**
    - **Inherited Security:** Leverages the security of a major L1 (Ethereum/Solana).
    - **Interoperability:** Easier to bridge assets from the L1.
- **Cons:**
    - **Layer Leakage:** If a user can withdraw to the L1, they bypass the Paychain "Safe DSC" rules.
    - **Overhead:** Carrying the full baggage of an EVM (if using Ethereum L2) slows down the target "millions/sec" throughput.

---

## 2. Evaluation of "No Default Transfer" Requirement
The user requirement for **no native transfer function** strongly points towards a **Specialized L1 (L0/L1)**. 

Standard blockchains (Bitcoin, Ethereum, Solana) are built around the concept of "Accounts" and "Balances" with a primary "Transfer" primitive. To build a system where the *only* way to move money is via a temporary escrow (DSC), a custom state machine is required.

### Proposed State Machine Logic:
1.  **State:** Accounts have balances, but the `TRANS_TYPE_SEND` is omitted from the protocol's transaction handler.
2.  **Transaction Types:**
    -   `TX_DEPLOY_DSC`: Creates a new contract instance with a `locked_balance`.
    -   `TX_DEPOSIT`: Adds balance to an existing DSC (only if sender matches).
    -   `TX_CALL`: Executes DSC logic (e.g., triggering a payout via Oracle signature).
3.  **Protocol-Level Sweeper:** At each block, the node checks for expired DSCs and moves `locked_balance` back to the `sender_balance`.

### Recommendation for POC
For the POC, we should implement a **Simulated L1 Node**.
-   **Why?** It allows us to demonstrate the "No Transfer" constraint and the "Lifespan/Expiry" logic which are the unique value propositions of Paychain.
-   **Implementation:** A TypeScript-based node (Express) that simulates a p2p network, consensus, and a custom state machine, exposing a REST API for client interactions.

---

## 4. Technical Feasibility of "Millions of DSCs/sec"
To achieve this, the L1 must use:
-   **Parallel Execution:** Since each DSC is independent (one-off), they can be processed in parallel across multiple CPU cores without state contention.
-   **Minimal State:** Once a DSC expires or completes, its state can be pruned from the active ledger, keeping the "hot" state size extremely small.
-   **BFT Consensus:** Using a high-speed consensus mechanism like HotStuff or Bullshark.
