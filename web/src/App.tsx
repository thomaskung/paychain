import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Database, 
  ArrowRight, 
  Clock, 
  Wallet,
  AlertCircle
} from 'lucide-react';
import './App.css';

const NODE_URL = 'http://localhost:3001';
const ORACLE_URL = 'http://localhost:3002';

function App() {
  const [status, setStatus] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form states
  const [pscName, setPscName] = useState('TestCoin');
  const [activeAddress, setActiveAddress] = useState('0x2222222222222222222222222222222222222222'); // Wallet B default
  const [mintAmount, setMintAmount] = useState(100);
  const [dscRecipient, setDscRecipient] = useState('0x3333333333333333333333333333333333333333');
  const [dscAmount, setDscAmount] = useState(50);
  const [dscLifespan, setDscLifespan] = useState(60);

  const fetchData = async () => {
    try {
      const s = await axios.get(`${NODE_URL}/status`);
      setStatus(s.data);
      const b = await axios.get(`${NODE_URL}/blocks`);
      setBlocks(b.data.reverse());
    } catch (e) {
      console.error("Failed to fetch node data");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const deployPSC = async () => {
    setLoading(true);
    try {
      await axios.post(`${NODE_URL}/tx`, {
        type: 'DEPLOY_PSC',
        sender: '0x1111111111111111111111111111111111111111',
        payload: { name: pscName, code: 'standard_token' }
      });
      setMessage(`PSC ${pscName} deployment submitted!`);
    } catch (e) {
      setMessage('Deployment failed');
    }
    setLoading(false);
  };

  const mintTokens = async (pscAddress: string) => {
    setLoading(true);
    try {
      await axios.post(`${NODE_URL}/tx`, {
        type: 'INTERACT',
        sender: activeAddress,
        payload: { target: pscAddress, action: 'mint', params: { amount: mintAmount } }
      });
      setMessage('Minting request submitted!');
    } catch (e) {
      setMessage('Minting failed');
    }
    setLoading(false);
  };

  const deployDSC = async (tokenAddress?: string, targetPSC?: string, targetAction?: string) => {
    setLoading(true);
    try {
      await axios.post(`${NODE_URL}/tx`, {
        type: 'DEPLOY_DSC',
        sender: activeAddress,
        payload: { 
          recipient: dscRecipient, 
          amount: dscAmount, 
          tokenAddress, 
          lifespan: dscLifespan,
          targetPSC,
          targetAction
        }
      });
      setMessage('DSC Initialized. Please deposit funds to the DSC address.');
    } catch (e) {
      setMessage('DSC deployment failed');
    }
    setLoading(false);
  };

  const depositToDSC = async (dscAddress: string, amount: number, tokenAddress?: string) => {
    setLoading(true);
    try {
      await axios.post(`${NODE_URL}/tx`, {
        type: 'INTERACT',
        sender: activeAddress,
        payload: { target: dscAddress, action: 'deposit', params: { amount, tokenAddress } }
      });
      setMessage('Deposit to DSC submitted!');
    } catch (e) {
      setMessage('Deposit failed');
    }
    setLoading(false);
  };

  const triggerPayout = async (dscAddress: string) => {
    setLoading(true);
    try {
      const dsc = status.dscs.find((d: any) => d.address === dscAddress);
      
      // Oracle clearance
      const clearance = await axios.post(`${ORACLE_URL}/verify`, {
        address: dsc.recipient,
        amount: dsc.amount
      });

      if (clearance.data.status === 'CLEARED') {
        await axios.post(`${NODE_URL}/tx`, {
          type: 'INTERACT',
          sender: '0xORACLE',
          payload: { target: dscAddress, action: 'payout', params: { signature: clearance.data.signature } }
        });
        setMessage('Payout triggered with Oracle clearance!');
      } else {
        setMessage(`Oracle Rejected: ${clearance.data.reason}`);
      }
    } catch (e) {
      setMessage('Payout failed');
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <ShieldCheck className="icon-gold" size={32} />
          <h1>PAYCHAIN<span>.POC</span></h1>
        </div>
        <div className="active-wallet">
           <Wallet size={16} />
           <select value={activeAddress} onChange={e => setActiveAddress(e.target.value)}>
             <option value="0x1111111111111111111111111111111111111111">Wallet A (Admin)</option>
             <option value="0x2222222222222222222222222222222222222222">Wallet B (User)</option>
             <option value="0x3333333333333333333333333333333333333333">Wallet C (User)</option>
             <option value="0x4444444444444444444444444444444444444444">Wallet D (Blacklisted)</option>
           </select>
        </div>
        <nav className="nav">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>Dashboard</button>
          <button onClick={() => setActiveTab('node')} className={activeTab === 'node' ? 'active' : ''}>Node Status</button>
        </nav>
      </header>

      <main className="main">
        {message && (
          <div className="alert">
            <AlertCircle size={20} />
            <span>{message}</span>
            <button onClick={() => setMessage('')}>x</button>
          </div>
        )}

        {activeTab === 'dashboard' ? (
          <div className="dashboard">
            <section className="controls">
              <div className="card security-lab">
                <h2><ShieldCheck size={20} /> Security Lab</h2>
                <div className="lab-controls">
                  <button onClick={() => {
                    setDscRecipient('0x4444444444444444444444444444444444444444');
                    setMessage('Simulating Attack: Transferring to Blacklisted Wallet D.');
                  }} className="btn-danger">Test Blacklist Attack</button>
                  
                  <button onClick={() => {
                    setDscAmount(999999);
                    setMessage('Simulating Attack: Unauthorized high-value drain.');
                  }} className="btn-danger">Test High-Value Drain</button>

                  <button onClick={() => {
                    const hackerWallet = '0xHACKER_WALLET_ADDRESS';
                    setDscRecipient(hackerWallet);
                    setMessage('CRITICAL: Session Hijacked! Recipient changed to Hacker Wallet. Check Step 1.');
                  }} className="btn-danger">Test Session Hijack</button>

                  <button onClick={() => {
                    setDscLifespan(5);
                    setMessage('Simulating Prevention: Rapid Expiry Refund.');
                  }} className="btn-secondary">Test Expiry Refund</button>
                </div>
              </div>

              <div className="card">
                <h2><Zap size={20} /> Step 1: Initialize DSC</h2>
                <p>Define recipient and amount. This whitelist the sender and recipient.</p>
                <input value={dscRecipient} onChange={e => setDscRecipient(e.target.value)} placeholder="Recipient Address" />
                <input type="number" value={dscAmount} onChange={e => setDscAmount(Number(e.target.value))} placeholder="Amount" />
                <button onClick={() => deployDSC(status?.pscs[0]?.address)} disabled={loading}>Initialize DSC</button>
              </div>

              <div className="card">
                <h2><Database size={20} /> PSC Actions (Token/Swap)</h2>
                <p>Manage PSCs or use DSC for a secure Swap.</p>
                <select onChange={e => setPscName(e.target.value)}>
                  <option value="">Select PSC</option>
                  {status?.pscs.map((p: any) => <option key={p.address} value={p.address}>{p.state.name} ({p.address})</option>)}
                </select>
                <div className="button-group">
                   <button onClick={() => mintTokens(pscName)} disabled={loading}>Mint Tokens</button>
                   <button onClick={() => deployDSC(undefined, pscName, 'swap')} className="btn-secondary" disabled={loading}>Secure Swap (via DSC)</button>
                </div>
              </div>

              <div className="card">
                <h2>System Admin</h2>
                <input value={pscName} onChange={e => setPscName(e.target.value)} placeholder="Token Name" />
                <button onClick={deployPSC} disabled={loading} className="btn-secondary">Deploy New Token PSC</button>
              </div>
            </section>

            <section className="state-views">
              <div className="card">
                <h2>DSC Lifecycle Management</h2>
                <div className="list">
                  {status?.dscs.map((d: any) => (
                    <div key={d.address} className={`item ${d.status.toLowerCase().replace('_','-')}`}>
                      <div className="item-main">
                        <strong>{d.address}</strong>
                        <span>{d.amount} units to {d.recipient.substring(0,10)}...</span>
                        {d.targetPSC && <span className="meta">Interaction: {d.targetPSC}.{d.targetAction}</span>}
                      </div>
                      <div className="item-meta">
                        <span className="badge">{d.status}</span>
                        <div className="actions">
                          {d.status === 'PENDING_DEPOSIT' && d.sender === activeAddress && (
                            <button onClick={() => depositToDSC(d.address, d.amount, d.tokenAddress)}>Deposit</button>
                          )}
                          {d.status === 'ACTIVE' && (
                            <button onClick={() => triggerPayout(d.address)}>Trigger Payout</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>Accounts & Balances</h2>
                <div className="list">
                  {status?.accounts.map((a: any) => (
                    <div key={a.address} className="item">
                      <strong>{a.address.substring(0,10)}...</strong>
                      <div className="balances">
                        <span>{a.balance} NATIVE</span>
                        {Object.entries(a.tokenBalances).map(([token, bal]) => (
                          <span key={token}>{bal} {status.pscs.find((p:any)=>p.address===token)?.state.name}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="node-status">
             <div className="card">
                <h2>Blockchain Explorer</h2>
                <div className="list">
                  {blocks.map(b => (
                    <div key={b.hash} className="block-item">
                      <div className="block-header">
                        <strong>Block #{b.index}</strong>
                        <code>{b.hash.substring(0,16)}...</code>
                      </div>
                      <div className="block-body">
                        {b.transactions.length} Transactions
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
