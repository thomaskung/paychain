import { Account, Address, PSC, DSC, GovernanceProposal } from './types';

export class Ledger {
    accounts: Map<Address, Account> = new Map();
    pscs: Map<Address, PSC> = new Map();
    dscs: Map<Address, DSC> = new Map();
    proposals: Map<string, GovernanceProposal> = new Map();
    treasuryBalance: number = 0;
    totalBurned: number = 0;

    constructor() {
        // Initialize with test accounts
        this.getOrCreateAccount("0x1111111111111111111111111111111111111111").balance = 10000; // Wallet A (Admin)
        this.getOrCreateAccount("0x2222222222222222222222222222222222222222").balance = 5000;  // Wallet B
        this.getOrCreateAccount("0x3333333333333333333333333333333333333333").balance = 5000;  // Wallet C
        this.getOrCreateAccount("0x4444444444444444444444444444444444444444").balance = 5000;  // Wallet D
    }

    getOrCreateAccount(address: Address): Account {
        if (!this.accounts.has(address)) {
            this.accounts.set(address, {
                address,
                balance: 0,
                stakedAmount: 0,
                tokenBalances: {}
            });
        }
        return this.accounts.get(address)!;
    }

    addPSC(psc: PSC) {
        this.pscs.set(psc.address, psc);
    }

    addDSC(dsc: DSC) {
        this.dscs.set(dsc.address, dsc);
    }

    updateBalance(address: Address, amount: number, tokenAddress?: Address) {
        const account = this.getOrCreateAccount(address);
        if (tokenAddress) {
            account.tokenBalances[tokenAddress] = (account.tokenBalances[tokenAddress] || 0) + amount;
        } else {
            account.balance += amount;
        }
    }

    getPSC(address: Address): PSC | undefined {
        return this.pscs.get(address);
    }

    getDSC(address: Address): DSC | undefined {
        return this.dscs.get(address);
    }

    getAllDSCs(): DSC[] {
        return Array.from(this.dscs.values());
    }
}
