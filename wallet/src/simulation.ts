import axios from 'axios';
import * as crypto from 'crypto';

const NODE_A = 'http://localhost:3001';
const NODE_B = 'http://localhost:3002';
const ORACLE_URL = 'http://localhost:3003';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function runSimulation() {
    console.log("--- Starting Paychain Comprehensive Simulation ---");

    const wallets = {
        A: "0x" + crypto.randomBytes(20).toString('hex'),
        B: "0x" + crypto.randomBytes(20).toString('hex'),
        C: "0x" + crypto.randomBytes(20).toString('hex')
    };

    console.log(`\nInitializing Wallets:`);
    console.log(`A: ${wallets.A}, B: ${wallets.B}, C: ${wallets.C}`);

    await axios.post(`${NODE_A}/mint`, { address: wallets.A, amount: 2000 });
    await delay(1000);

    // --- PSC Type Simulation ---

    console.log(`\n1. PSC TYPE SIMULATION`);

    // 1.1 Account PSC
    console.log(`\nDeploying ACCOUNT PSC (Private Model) for Wallet B...`);
    const pscAccountRes = await axios.post(`${NODE_A}/tx`, {
        sender: wallets.B,
        type: "DEPLOY_PSC",
        payload: {
            name: "WalletB_Account",
            type: "ACCOUNT",
            privacyModel: "PRIVATE",
            updatable: true,
            acceptConditions: { minAmount: 50 }
        }
    });
    const pscAccountAddress = `0xpsc_${pscAccountRes.data.txId.substring(0, 10)}`;
    
    // 1.2 Token PSC
    console.log(`\nDeploying TOKEN PSC (Public Model) for Wallet A...`);
    const pscTokenRes = await axios.post(`${NODE_A}/tx`, {
        sender: wallets.A,
        type: "DEPLOY_PSC",
        payload: {
            name: "GoldCoin",
            type: "TOKEN",
            initialSupply: 1000,
            privacyModel: "PUBLIC"
        }
    });
    const pscTokenAddress = `0xpsc_${pscTokenRes.data.txId.substring(0, 10)}`;

    // 1.3 Logic PSC (Swap)
    console.log(`\nDeploying LOGIC PSC (Confidential Model) for Protocol...`);
    const pscLogicRes = await axios.post(`${NODE_A}/tx`, {
        sender: wallets.A,
        type: "DEPLOY_PSC",
        payload: {
            name: "SwapProtocol",
            type: "LOGIC",
            privacyModel: "CONFIDENTIAL"
        }
    });
    const pscLogicAddress = `0xpsc_${pscLogicRes.data.txId.substring(0, 10)}`;

    await delay(4000);

    // --- DSC & Privacy Model Simulation ---

    console.log(`\n2. DSC & PRIVACY MODEL SIMULATION`);

    // 2.1 PUBLIC DSC (Standard Transfer)
    console.log(`\nExecuting PUBLIC DSC Transfer (PAY) A -> C...`);
    await performDSCTransfer(wallets.A, wallets.C, 100, "PUBLIC", null);

    // 2.2 ANONYMOUS DSC (Oracle Gated)
    console.log(`\nExecuting ANONYMOUS DSC Transfer (PAY) A -> B Account PSC (with Oracle)...`);
    await performDSCTransfer(wallets.A, pscAccountAddress, 75, "ANONYMOUS", null, true);

    // 2.3 CONFIDENTIAL DSC (Token Transfer)
    console.log(`\nExecuting CONFIDENTIAL DSC Transfer (GoldCoin) A -> C...`);
    await performDSCTransfer(wallets.A, wallets.C, 50, "CONFIDENTIAL", pscTokenAddress);

    // 2.4 PRIVATE DSC (Logic Swap)
    console.log(`\nExecuting PRIVATE DSC Transfer (Swap Interaction) A -> Swap Logic PSC...`);
    await performDSCTransfer(wallets.A, wallets.C, 100, "PRIVATE", null, false, pscLogicAddress, "swap");

    console.log(`\n3. PSC UPDATE SIMULATION`);
    console.log(`Updating Wallet B Account PSC conditions via Node B...`);
    await axios.post(`${NODE_B}/tx`, {
        sender: wallets.B,
        type: "INTERACT",
        payload: {
            target: pscAccountAddress,
            action: "updateConditions",
            params: { acceptConditions: { minAmount: 1 } }
        }
    });

    await delay(4000);
    const finalStatus = await axios.get(`${NODE_B}/status`);
    console.log(`\n--- Simulation Complete ---`);
}

async function performDSCTransfer(sender: string, recipient: string, amount: number, privacy: string, token: string | null, oracle: boolean = false, targetPSC: string | null = null, targetAction: string | null = null) {
    const deployTx = await axios.post(`${NODE_A}/tx`, {
        sender,
        type: "DEPLOY_DSC",
        payload: {
            recipient,
            amount,
            lifespan: 60,
            privacyModel: privacy,
            tokenAddress: token,
            oracleCheck: oracle,
            targetPSC,
            targetAction
        }
    });
    const dscAddress = `0xdsc_${deployTx.data.txId.substring(0, 10)}`;
    await delay(4000);

    await axios.post(`${NODE_B}/tx`, {
        sender,
        type: "INTERACT",
        payload: { target: dscAddress, action: "deposit", params: { amount } }
    });
    await delay(4000);

    let oracleSignature = null;
    if (oracle) {
        const oRes = await axios.post(`${ORACLE_URL}/verify`, { sender, recipient, amount });
        oracleSignature = oRes.data.signature;
    }

    await axios.post(`${NODE_A}/tx`, {
        sender,
        type: "INTERACT",
        payload: { target: dscAddress, action: "payout", params: { oracleSignature } }
    });
    console.log(`[Transfer] ${privacy} DSC ${dscAddress} Payout executed.`);
    await delay(4000);
}

runSimulation().catch(console.error);
