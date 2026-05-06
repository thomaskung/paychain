export type Address = string;

export enum PrivacyModel {
    PUBLIC = "PUBLIC",
    ANONYMOUS = "ANONYMOUS",
    CONFIDENTIAL = "CONFIDENTIAL",
    PRIVATE = "PRIVATE"
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
}
