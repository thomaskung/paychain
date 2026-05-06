import { Ledger } from './ledger';
import { Transaction, TransactionType, PSC, DSC, Address, PrivacyModel, PSCType, DSCType } from './types';
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
        const { code, name, privacyModel, updatable, acceptConditions, owners, type } = tx.payload;
        const address = `0xpsc_${tx.id.substring(0, 10)}`;
        const psc: PSC = {
            address,
            owners: owners || [tx.sender],
            type: type || PSCType.ACCOUNT,
            code,
            state: { name, totalSupply: 0, balances: {} },
            privacyModel: privacyModel || PrivacyModel.PUBLIC,
            updatable: updatable ?? true,
            acceptConditions
        };

        if (psc.type === PSCType.TOKEN) {
            psc.state.totalSupply = tx.payload.initialSupply || 0;
            psc.state.balances[tx.sender] = psc.state.totalSupply;
            this.ledger.updateBalance(tx.sender, psc.state.totalSupply, address);
        }

        this.ledger.addPSC(psc);
        console.log(`[VM] PSC Deployed [${psc.type}]: ${name || "Unnamed"} at ${address} [Privacy: ${psc.privacyModel}]`);
    }

    private deployDSC(tx: Transaction) {
        const { recipient, amount, tokenAddress, lifespan, targetPSC, targetAction, privacyModel, oracleCheck, conditions } = tx.payload;
        
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
            conditions: conditions || {},
            privacyModel: privacyModel || PrivacyModel.PUBLIC,
            oracleCheck: oracleCheck ?? false,
            type: DSCType.TRANSFER
        };
        
        this.ledger.addDSC(dsc);
        console.log(`[VM] DSC Initialized [${dsc.type}]: ${address} for ${amount} to ${recipient} [Privacy: ${dsc.privacyModel}]`);
    }

    private interact(tx: Transaction) {
        const { target, action, params } = tx.payload;
        
        const psc = this.ledger.getPSC(target);
        if (psc) {
            this.executePSCLogic(psc, tx.sender, action, params);
            return;
        }

        const dsc = this.ledger.getDSC(target);
        if (dsc) {
            this.executeDSCLogic(dsc, tx.sender, action, params);
            return;
        }

        throw new Error("Target not found");
    }

    private executePSCLogic(psc: PSC, sender: Address, action: string, params: any) {
        console.log(`[VM] Executing PSC ${psc.address} (${psc.type}) action: ${action}`);
        
        if (action === "updateConditions") {
            if (!psc.updatable) throw new Error("PSC is not updatable");
            if (!psc.owners.includes(sender)) throw new Error("Only owners can update this PSC");
            psc.acceptConditions = params.acceptConditions;
            console.log(`[VM] PSC ${psc.address} acceptConditions updated.`);
            return;
        }

        if (psc.type === PSCType.TOKEN) {
            if (action === "mint") {
                if (!psc.owners.includes(sender)) throw new Error("Only owners can mint");
                const amount = params.amount;
                psc.state.totalSupply += amount;
                psc.state.balances[sender] = (psc.state.balances[sender] || 0) + amount;
                this.ledger.updateBalance(sender, amount, psc.address);
            }
        }

        if (psc.type === PSCType.LOGIC) {
            if (action === "swap") {
                const { amount, fromToken } = params;
                console.log(`[VM] Logic PSC ${psc.address} executing Swap: ${amount} ${fromToken || 'PAY'}`);
                this.ledger.updateBalance(sender, amount * 2); 
            }
            if (action === "stake") {
                const { amount } = params;
                console.log(`[VM] Logic PSC ${psc.address} executing Stake: ${amount}`);
                // Simplified staking logic
                this.ledger.updateBalance(sender, amount * 0.1); // Reward
            }
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
            console.log(`[VM] DSC Payout Triggered for ${dsc.address}`);
            
            if (dsc.oracleCheck && !params.oracleSignature) {
                throw new Error("Oracle signature required to payout this DSC");
            }
            
            const recipientPSC = this.ledger.getPSC(dsc.recipient);
            if (recipientPSC && recipientPSC.acceptConditions) {
                if (recipientPSC.acceptConditions.minAmount && dsc.amount < recipientPSC.acceptConditions.minAmount) {
                    throw new Error("Transfer rejected by recipient PSC minAmount condition");
                }
            }

            if (dsc.targetPSC && dsc.targetAction) {
                const targetPSC = this.ledger.getPSC(dsc.targetPSC);
                if (targetPSC) {
                    this.executePSCLogic(targetPSC, dsc.sender, dsc.targetAction, { amount: dsc.amount, fromToken: dsc.tokenAddress });
                }
            } else {
                this.ledger.updateBalance(dsc.recipient, dsc.amount, dsc.tokenAddress);
            }
            
            dsc.status = "COMPLETED";
            console.log(`[VM] DSC ${dsc.address} Transfer Payout Completed.`);
        }
    }

    processExpirations() {
        const now = Date.now();
        const dscs = this.ledger.getAllDSCs();
        for (const dsc of dscs) {
            if ((dsc.status === "ACTIVE" || dsc.status === "PENDING_DEPOSIT") && now > dsc.expiry) {
                if (dsc.depositedAmount > 0) {
                    this.ledger.updateBalance(dsc.sender, dsc.depositedAmount, dsc.tokenAddress);
                }
                dsc.status = "EXPIRED";
            }
        }
    }
}
