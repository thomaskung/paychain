# Paychain Governance & Tokenomics (Paycoin)

## 1. The Utility Token: Paycoin (PAY)
PAY is the native unit of the Paychain ecosystem, serving as:
- **Gas Fee Unit:** Used to pay Validators for DSC/PSC operations.
- **Governance Coin:** Used for on-chain voting on protocol upgrades and parameter changes.
- **Staking Asset:** Required for Validator and Oracle operator participation.

---

## 2. Validator & Oracle Staking Mechanisms

### Validator Nodes (Inspired by Solana/Ethereum)
- **Role:** Infrastructure security and high-speed execution.
- **Staking:** Validators must stake a minimum amount of PAY.
- **Rewards:** 
    - **Inflationary Mining:** Earn new PAY tokens per block.
    - **Gas Fees:** Receive 100% of priority tips and 50% of the base gas fee.
- **Slashing:** Malicious behavior (double-signing) or persistent downtime results in a percentage loss of staked PAY.

### Oracle Operators (Inspired by Pyth/Chainlink)
- **Role:** High-integrity compliance and risk data.
- **Staking:** Operators stake PAY to back the accuracy of their signatures.
- **Rewards:**
    - **Service Fees:** Earn PAY directly from users/PSCs for compliance checks.
    - **Integrity Bonus:** A portion of inflationary rewards allocated to top-performing Oracles based on confidence scores.
- **Slashing:** Providing signatures for blacklisted wallets or failing verification audits triggers stake slashing.

---

## 3. Deflationary Tokenomics & Burning
Paychain adopts a **Native Burn Mechanism** (similar to ETH EIP-1559) to create artificial scarcity:
- **Base Fee Burn:** 50% of the base gas fee for *every* transaction (DSC/PSC) is permanently burned (removed from supply).
- **Compliance Surcharge Burn:** A small % of every Oracle service fee is burned.
- **Slashing Burn:** 50% of all slashed tokens are burned; 50% go to the Treasury.

---

## 4. On-chain Governance & Treasury
- **Governance Pool:** A portion of inflationary rewards (e.g., 10%) is allocated to a decentralized treasury.
- **Proposals:** PAY holders can vote on:
    - **Protocol Upgrades:** Changing BFT consensus parameters or VM features.
    - **Budget Allocation:** Funding new wallet creation and "First PSC" account creation grants.
- **Onboarding Fund:** To solve the "Cold Start" problem, the Treasury funds the deployment cost of the first **Account PSC** for verified new institutional users, ensuring they can immediately opt-in to security policies.

---

## 5. Comparative Research Summary

### Validator Mechanism (ETH vs SOL)
Paychain adopts the **Solana** high-throughput model (100% Priority fees to validators) but incorporates the **Ethereum** EIP-1559 "Base Fee Burn" to balance the inflationary mining rewards.

### Oracle Mechanism (Chainlink vs Pyth)
Paychain adopts the **Pyth** "Data Marketplace" model, where Oracles are incentivized for speed and direct accountability (First-party data), but integrates a **Chainlink-style** "Community Delegation" where PAY holders can stake behind their trusted Oracles to earn a share of the fees.
