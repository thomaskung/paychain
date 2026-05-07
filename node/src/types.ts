export type Address = string;

export enum PrivacyModel {
    PUBLIC = "PUBLIC",
    ANONYMOUS = "ANONYMOUS",
    CONFIDENTIAL = "CONFIDENTIAL",
    PRIVATE = "PRIVATE"
}

export enum PSCType {
    ACCOUNT = "ACCOUNT",
    TOKEN = "TOKEN",
    LOGIC = "LOGIC"
}

export enum DSCType {
    TRANSFER = "TRANSFER"
}

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
    isForwarded?: boolean;
}

export interface PSC {
    address: Address;
    owners: Address[];
    type: PSCType;
    code: string; 
    state: Record<string, any>;
    privacyModel: PrivacyModel;
    updatable: boolean;
    acceptConditions?: any; 
}

export interface DSC {
    address: Address;
    sender: Address;
    recipient: Address;
    type: DSCType;
    amount: number;
    depositedAmount: number;
    tokenAddress?: Address; 
    targetPSC?: Address; 
    targetAction?: string;
    lifespan: number; 
    expiry: number; 
    status: "PENDING_DEPOSIT" | "ACTIVE" | "COMPLETED" | "EXPIRED";
    conditions: any; 
    privacyModel: PrivacyModel;
    oracleCheck: boolean; 
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
    balance: number; 
    stakedAmount: number; 
    tokenBalances: Record<Address, number>; 
}

export interface GovernanceProposal {
    id: string;
    proposer: Address;
    description: string;
    votesFor: number;
    votesAgainst: number;
    status: "OPEN" | "PASSED" | "REJECTED" | "EXECUTED";
}
