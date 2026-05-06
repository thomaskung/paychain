import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Mock AML/Sanction database
const blacklistedAddresses = [
    "0x4444444444444444444444444444444444444444" // Wallet D
];

const benignAddresses = [
    "0x1111111111111111111111111111111111111111", // Wallet A
    "0x2222222222222222222222222222222222222222", // Wallet B
    "0x3333333333333333333333333333333333333333"  // Wallet C
];

app.post('/verify', (req, res) => {
    const { address, amount } = req.body;
    
    console.log(`[Oracle] Verifying address: ${address} for amount: ${amount}`);
    
    if (blacklistedAddresses.includes(address)) {
        return res.json({ 
            status: "REJECTED", 
            reason: "Address on global sanction list" 
        });
    }

    if (amount > 10000) {
        return res.json({ 
            status: "REJECTED", 
            reason: "High-value transaction requires manual review" 
        });
    }

    res.json({ 
        status: "CLEARED", 
        signature: `SIG_OK_${Date.now()}` 
    });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`[Oracle] Paychain Compliance Oracle running on port ${PORT}`);
});
