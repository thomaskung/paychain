export type Address = string;

export enum TransactionType {
    DEPLOY_PSC = "DEPLOY_PSC",
    DEPLOY_DSC = "DEPLOY_DSC",
    INTERACT = "INTERACT",
}

export interface Transaction {
    id: string;
    type: TransactionType;
    sender: Address;
    payload: any;
    signature?: string;
    timestamp: number;
}

export interface PSC {
    address: Address;
    owner: Address;
    code: string; // Simplified for POC
    state: Record<string, any>;
}

export interface DSC {
    address: Address;
    sender: Address;
    recipient: Address;
    amount: number;
    depositedAmount: number;
    tokenAddress?: Address; // If it's a PSC token
    targetPSC?: Address; // If the DSC is for interacting with a PSC
    targetAction?: string;
    lifespan: number; // in seconds
    expiry: number; // timestamp
    status: "PENDING_DEPOSIT" | "ACTIVE" | "COMPLETED" | "EXPIRED";
    conditions: any;
}

export interface Block {
    index: number;
    transactions: Transaction[];
    timestamp: number;
    prevHash: string;
    hash: string;
}

export interface Account {
    address: Address;
    balance: number; // Paycoin (PAY) - Used for gas and governance
    stakedAmount: number; // Staked for Validator/Oracle role
    tokenBalances: Record<Address, number>; // PSC Address -> Balance
}

export interface GovernanceProposal {
    id: string;
    proposer: Address;
    description: string;
    votesFor: number;
    votesAgainst: number;
    status: "OPEN" | "PASSED" | "REJECTED" | "EXECUTED";
    expiry: number;
}
