import { Ledger } from './ledger';
import { Transaction, TransactionType, PSC, DSC, Address } from './types';
import * as crypto from 'crypto';

export class VM {
    ledger: Ledger;

    constructor(ledger: Ledger) {
        this.ledger = ledger;
    }

    executeTransaction(tx: Transaction) {
        switch (tx.type) {
            case TransactionType.DEPLOY_PSC:
                this.deployPSC(tx);
                break;
            case TransactionType.DEPLOY_DSC:
                this.deployDSC(tx);
                break;
            case TransactionType.INTERACT:
                this.interact(tx);
                break;
        }
    }

    private deployPSC(tx: Transaction) {
        const { code, name } = tx.payload;
        const address = `0xpsc_${tx.id.substring(0, 10)}`;
        const psc: PSC = {
            address,
            owner: tx.sender,
            code,
            state: { name, totalSupply: 0, balances: {} }
        };
        this.ledger.addPSC(psc);
        console.log(`[VM] PSC Deployed: ${name} at ${address}`);
    }

    private deployDSC(tx: Transaction) {
        const { recipient, amount, tokenAddress, lifespan, targetPSC, targetAction } = tx.payload;
        
        const address = `0xdsc_${tx.id.substring(0, 10)}`;
        const dsc: DSC = {
            address,
            sender: tx.sender,
            recipient,
            amount,
            depositedAmount: 0,
            tokenAddress,
            targetPSC,
            targetAction,
            lifespan,
            expiry: Date.now() + lifespan * 1000,
            status: "PENDING_DEPOSIT",
            conditions: tx.payload.conditions || {}
        };
        
        this.ledger.addDSC(dsc);
        console.log(`[VM] DSC Initialized: ${address} for ${amount} to ${recipient}. Waiting for deposit.`);
    }

    private interact(tx: Transaction) {
        const { target, action, params } = tx.payload;
        
        // If target is PSC
        const psc = this.ledger.getPSC(target);
        if (psc) {
            this.executePSCLogic(psc, tx.sender, action, params);
            return;
        }

        // If target is DSC
        const dsc = this.ledger.getDSC(target);
        if (dsc) {
            this.executeDSCLogic(dsc, tx.sender, action, params);
            return;
        }

        throw new Error("Target not found");
    }

    private executePSCLogic(psc: PSC, sender: Address, action: string, params: any) {
        console.log(`[VM] Executing PSC ${psc.address} action: ${action}`);
        
        if (action === "mint") {
            const amount = params.amount;
            psc.state.totalSupply += amount;
            psc.state.balances[sender] = (psc.state.balances[sender] || 0) + amount;
            this.ledger.updateBalance(sender, amount, psc.address);
        }

        if (action === "swap") {
            // Simplified swap: 1 TestCoin = 2 Native
            const { amount, fromToken } = params;
            console.log(`[VM] Swap PSC logic triggered: ${amount} ${fromToken}`);
            // In a real swap, the tokens would already be in the PSC or transferred via DSC
            this.ledger.updateBalance(sender, amount * 2); 
        }
    }

    private executeDSCLogic(dsc: DSC, sender: Address, action: string, params: any) {
        if (action === "deposit") {
            if (dsc.status !== "PENDING_DEPOSIT") throw new Error("DSC not accepting deposits");
            if (sender !== dsc.sender) throw new Error("Only whitelisted sender can deposit");
            
            const amount = params.amount;
            if (amount !== dsc.amount) throw new Error(`Incorrect deposit amount. Expected ${dsc.amount}`);

            const senderAccount = this.ledger.getOrCreateAccount(sender);
            if (dsc.tokenAddress) {
                const currentBalance = senderAccount.tokenBalances[dsc.tokenAddress] || 0;
                if (currentBalance < amount) throw new Error("Insufficient token balance");
                senderAccount.tokenBalances[dsc.tokenAddress] = currentBalance - amount;
            } else {
                if (senderAccount.balance < amount) throw new Error("Insufficient native balance");
                senderAccount.balance -= amount;
            }

            dsc.depositedAmount = amount;
            dsc.status = "ACTIVE";
            console.log(`[VM] DSC ${dsc.address} Deposit Successful. Status: ACTIVE.`);
            return;
        }

        if (dsc.status !== "ACTIVE") throw new Error("DSC not active (needs deposit or already closed)");

        if (action === "payout") {
            console.log(`[VM] DSC Payout/Execute Triggered for ${dsc.address}`);
            
            if (dsc.targetPSC && dsc.targetAction) {
                // If this DSC was for a PSC interaction (like a swap)
                console.log(`[VM] DSC Forwarding to PSC: ${dsc.targetPSC}.${dsc.targetAction}`);
                const targetPSC = this.ledger.getPSC(dsc.targetPSC);
                if (targetPSC) {
                    this.executePSCLogic(targetPSC, dsc.sender, dsc.targetAction, { amount: dsc.amount, fromToken: dsc.tokenAddress });
                }
            } else {
                // Standard wallet-to-wallet transfer
                this.ledger.updateBalance(dsc.recipient, dsc.amount, dsc.tokenAddress);
            }
            
            dsc.status = "COMPLETED";
        }
    }

    processExpirations() {
        const now = Date.now();
        const dscs = this.ledger.getAllDSCs();
        for (const dsc of dscs) {
            if ((dsc.status === "ACTIVE" || dsc.status === "PENDING_DEPOSIT") && now > dsc.expiry) {
                console.log(`[VM] DSC Expired: ${dsc.address}.`);
                if (dsc.depositedAmount > 0) {
                    console.log(`[VM] Refunding ${dsc.depositedAmount} to ${dsc.sender}`);
                    this.ledger.updateBalance(dsc.sender, dsc.depositedAmount, dsc.tokenAddress);
                }
                dsc.status = "EXPIRED";
            }
        }
    }
}
