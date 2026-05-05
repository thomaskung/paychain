import express from 'express';
import cors from 'cors';
import { Ledger } from './ledger';
import { VM } from './vm';
import type { Transaction, Block } from './types';
import { TransactionType } from './types';
import * as crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

const ledger = new Ledger();
const vm = new VM(ledger);

let mempool: Transaction[] = [];
let chain: Block[] = [];

// Genesis Block
const genesisBlock: Block = {
    index: 0,
    transactions: [],
    timestamp: Date.now(),
    prevHash: "0",
    hash: "genesis"
};
chain.push(genesisBlock);

// Block Production Loop (Simulated Consensus)
setInterval(() => {
    if (mempool.length > 0 || true) {
        const prevBlock = chain[chain.length - 1];
        if (!prevBlock) return;

        const transactions = [...mempool];
        mempool = [];

        // 1. Transaction Execution & Base Fee Burn
        const BASE_FEE = 10; 
        transactions.forEach(tx => {
            try {
                const account = ledger.getOrCreateAccount(tx.sender);
                if (account.balance < BASE_FEE) throw new Error("Cannot afford gas");
                
                // Burn 50%, Treasury 50% (Simplified)
                account.balance -= BASE_FEE;
                ledger.totalBurned += BASE_FEE * 0.5;
                ledger.treasuryBalance += BASE_FEE * 0.5;

                vm.executeTransaction(tx);
            } catch (e: any) {
                console.error(`[Node] Transaction failed: ${e.message}`);
            }
        });

        // 2. Block Rewards (Inflationary Mining)
        const BLOCK_REWARD = 50;
        const validator = ledger.getOrCreateAccount("0xVALIDATOR_NODE");
        validator.balance += BLOCK_REWARD * 0.8; // 80% to validator
        ledger.treasuryBalance += BLOCK_REWARD * 0.2; // 20% to Treasury/Governance

        vm.processExpirations();

        const block: Block = {
            index: prevBlock.index + 1,
            transactions,
            timestamp: Date.now(),
            prevHash: prevBlock.hash,
            hash: crypto.createHash('sha256').update(prevBlock.hash + JSON.stringify(transactions)).digest('hex')
        };
        chain.push(block);
    }
}, 1000);

// API Endpoints
app.get('/status', (req, res) => {
    res.json({
        chainLength: chain.length,
        mempoolSize: mempool.length,
        treasury: ledger.treasuryBalance,
        burned: ledger.totalBurned,
        accounts: Array.from(ledger.accounts.values()),
        pscs: Array.from(ledger.pscs.values()),
        dscs: Array.from(ledger.dscs.values()),
        proposals: Array.from(ledger.proposals.values())
    });
});

app.post('/tx', (req, res) => {
    const tx: Transaction = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...req.body
    };
    mempool.push(tx);
    res.json({ success: true, txId: tx.id });
});

app.get('/blocks', (req, res) => {
    res.json(chain.slice(-20)); // Last 20 blocks
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`[Node] Paychain L1 Node running on port ${PORT}`);
});
