import express from 'express';
import cors from 'cors';
import axios from 'axios';
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

const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];

setInterval(() => {
    if (mempool.length > 0) {
        const prevBlock = chain[chain.length - 1];
        if (!prevBlock) return;

        const transactions = [...mempool];
        mempool = [];

        const BASE_FEE = 10; 
        transactions.forEach(tx => {
            try {
                const account = ledger.getOrCreateAccount(tx.sender);
                // Simple gas check (disabled for POC if balance is insufficient so test wallets don't get stuck)
                if (account.balance >= BASE_FEE) {
                    account.balance -= BASE_FEE;
                    ledger.totalBurned += BASE_FEE * 0.5;
                    ledger.treasuryBalance += BASE_FEE * 0.5;
                }
                vm.executeTransaction(tx);
            } catch (e: any) {
                console.error(`[Node] Transaction failed: ${e.message}`);
            }
        });

        const BLOCK_REWARD = 50;
        const validator = ledger.getOrCreateAccount("0xVALIDATOR_NODE");
        validator.balance += BLOCK_REWARD * 0.8; 
        ledger.treasuryBalance += BLOCK_REWARD * 0.2; 

        vm.processExpirations();

        const block: Block = {
            index: prevBlock.index + 1,
            transactions,
            timestamp: Date.now(),
            prevHash: prevBlock.hash,
            hash: crypto.createHash('sha256').update(prevBlock.hash + JSON.stringify(transactions)).digest('hex')
        };
        chain.push(block);
        console.log(`[Node] Block ${block.index} minted with ${transactions.length} txs`);
    }
}, 3000);

app.get('/status', (req, res) => {
    res.json({
        chainLength: chain.length,
        mempoolSize: mempool.length,
        treasury: ledger.treasuryBalance,
        burned: ledger.totalBurned,
        accounts: Array.from(ledger.accounts.values()),
        pscs: Array.from(ledger.pscs.values()),
        dscs: Array.from(ledger.dscs.values())
    });
});

app.post('/tx', (req, res) => {
    const tx: Transaction = {
        id: req.body.id || crypto.randomUUID(),
        timestamp: req.body.timestamp || Date.now(),
        type: req.body.type,
        sender: req.body.sender,
        payload: req.body.payload,
        signature: req.body.signature,
        isForwarded: req.body.isForwarded
    };

    // Deduplication
    if (mempool.some(t => t.id === tx.id) || chain.some(b => b.transactions.some(t => t.id === tx.id))) {
        return res.json({ success: true, txId: tx.id });
    }

    mempool.push(tx);

    // Broadcast to peers to simulate immutability
    if (!tx.isForwarded) {
        PEERS.forEach(peer => {
            axios.post(`${peer}/tx`, { ...tx, isForwarded: true }).catch(() => {});
        });
    }

    res.json({ success: true, txId: tx.id });
});

// Airdrop endpoint for the POC simulation
app.post('/mint', (req, res) => {
    const { address, amount } = req.body;
    ledger.updateBalance(address, amount);
    console.log(`[Node] Minted ${amount} PAY to ${address}`);
    res.json({ success: true });
});

app.get('/blocks', (req, res) => {
    res.json(chain.slice(-20));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`[Node] Paychain L1 Node running on port ${PORT}. Peers: ${PEERS.length}`);
});
