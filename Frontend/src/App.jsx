import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  // Navigation & User Management States
  const API_URL = 'https://apex-horizon-bank.onrender.com';
  const [screen, setScreen] = useState('LOGIN');
  const [userSession, setUserSession] = useState(null);
  const [profileData, setProfileData] = useState({});

  // Form Inputs: Authentication & Updates
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Form Inputs: Beneficiary Registry
  const [bName, setBName] = useState('');
  const [bBank, setBBank] = useState('');
  const [bAccount, setBAccount] = useState('');
  const [bLimit, setBLimit] = useState('');

  // Form Inputs: Money Transfer
  const [selectedReceiver, setSelectedReceiver] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // System Lists & Data Storage arrays
  const [transactions, setTransactions] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [adminCustomerList, setAdminCustomerList] = useState([]);
  const [adminTransactionList, setAdminTransactionList] = useState([]);

  // System Response Notification states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearMessages = () => { setErrorMessage(''); setSuccessMessage(''); };

  // Common input style object to keep things perfectly neat and symmetrical
  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#333333',
    boxSizing: 'border-box'
  };

  // ==========================================
  // CORE FUNCTIONS: AUTHENTICATION LAYER
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      setUserSession(res.data.user);
      setSuccessMessage("Authentication verified.");
      if (res.data.user.role === 'ADMIN') {
        setScreen('ADMIN_DASHBOARD');
        fetchAdminData();
      } else {
        setScreen('CUSTOMER_DASHBOARD');
        fetchCustomerData(res.data.user.id, res.data.user.account_number);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Invalid entry parameters.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axios.post(`${API_URL}/register`, { name, email, password, role, address, phone });
      setSuccessMessage("Account created successfully! Proceed with login.");
      setScreen('LOGIN');
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Registration validation error.");
    }
  };

  const handleLogout = () => {
    setUserSession(null);
    setScreen('LOGIN');
    clearMessages();
  };

  // ==========================================
  // CORE FUNCTIONS: CUSTOMER DASHBOARD OPERATIONS
  // ==========================================
  const fetchCustomerData = async (userId, accNum) => {
    try {
      const profileRes = await axios.get(`${API_URL}/profile/${userId}`);
      setProfileData(profileRes.data);
      setName(profileRes.data.name);
      setAddress(profileRes.data.address);
      setPhone(profileRes.data.phone);

      const txRes = await axios.get(`${API_URL}/transactions/${accNum}`);
      setTransactions(txRes.data);

      const bRes = await axios.get(`${API_URL}/beneficiaries/${userId}`);
      setBeneficiaries(bRes.data);
    } catch (err) {
      console.error("Data syncing malfunction", err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axios.put(`${API_URL}/profile/update`, { id: userSession.id, name, address, phone });
      setSuccessMessage("Personal record matrices modified.");
      fetchCustomerData(userSession.id, profileData.account_number);
    } catch (err) {
      setErrorMessage("Profile modification error.");
    }
  };

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axios.post(`${API_URL}/beneficiaries`, {
        customer_id: userSession.id, name: bName, bank_name: bBank, account_number: bAccount, transfer_limit: bLimit
      });
      setSuccessMessage("Beneficiary target safely authorized.");
      setBName(''); setBBank(''); setBAccount(''); setBLimit('');
      fetchCustomerData(userSession.id, profileData.account_number);
    } catch (err) {
      setErrorMessage("Beneficiary processing block encountered.");
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      await axios.post(`${API_URL}/transfer`, {
        senderId: userSession.id, receiverAccountNumber: selectedReceiver, amount: parseFloat(transferAmount)
      });
      setSuccessMessage("Capital extraction and transfer confirmed via ACID Ledger.");
      setTransferAmount('');
      fetchCustomerData(userSession.id, profileData.account_number);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Transfer processing terminated.");
    }
  };

  // ==========================================
  // CORE FUNCTIONS: ADMINISTRATIVE OPERATIONS
  // ==========================================
  const fetchAdminData = async () => {
    try {
      const customersRes = await axios.get(`${API_URL}/admin/customers`);
      setAdminCustomerList(customersRes.data);
      const allTxRes = await axios.get(`${API_URL}/admin/transactions`);
      setAdminTransactionList(allTxRes.data);
    } catch (err) {
      console.error("Administrative matrix syncing error", err);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: screen.includes('DASHBOARD') ? '1100px' : '550px', margin: '40px auto', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '25px', color: '#1e3a8a', letterSpacing: '1px', fontSize: '28px' }}>Apex Horizon Bank Portal</h1>

      {errorMessage && <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '4px', marginBottom: '15px', fontWeight: 'bold' }}>⚠️ {errorMessage}</div>}
      {successMessage && <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '4px', marginBottom: '15px', fontWeight: 'bold' }}>✅ {successMessage}</div>}

      {/* SCREEN 1: LOGIN BOX */}
      {screen === 'LOGIN' && (
        <form onSubmit={handleLogin}>
          <h2 style={{ marginBottom: '15px', color: '#334155' }}>User Gateway Authentication</h2>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email Address</label>
            <input type="email" required style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Secret Password</label>
            <input type="password" required style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" style={{ width: '100%', backgroundColor: '#1e3a8a', color: '#fff', padding: '12px', fontSize: '16px', borderRadius: '4px', fontWeight: 'bold' }}>Access Portal</button>
          <p style={{ marginTop: '15px', textAlign: 'center' }}>
            New Client? <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setScreen('REGISTER'); clearMessages(); }}>Register Credentials</span>
          </p>
        </form>
      )}

      {/* SCREEN 2: REGISTRATION LAYOUT */}
      {screen === 'REGISTER' && (
        <form onSubmit={handleRegister}>
          <h2 style={{ marginBottom: '15px', color: '#334155' }}>Corporate Account Enrollment</h2>
          <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', marginBottom: '5px' }}>Full Corporate Name</label><input type="text" required style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', marginBottom: '5px' }}>Email Identity Address</label><input type="email" required style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', marginBottom: '5px' }}>Secret Password</label><input type="password" required style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Security Portal Role Mapping</label>
             <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
               <option value="CUSTOMER">Standard Customer Client</option>
               <option value="ADMIN">System Administrator Authority</option>
             </select>
          </div>
          <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', marginBottom: '5px' }}>Physical Domicile Address</label><input type="text" required style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div style={{ marginBottom: '20px' }}><label style={{ display: 'block', marginBottom: '5px' }}>Phone Connection Registry</label><input type="text" required style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <button type="submit" style={{ width: '100%', backgroundColor: '#10b981', color: '#fff', padding: '12px', fontSize: '16px', borderRadius: '4px', fontWeight: 'bold' }}>Finalize Registry</button>
          <p style={{ marginTop: '15px', textAlign: 'center' }}>Already configured? <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setScreen('LOGIN'); clearMessages(); }}>Return to Gateway</span></p>
        </form>
      )}

      {/* SCREEN 3: CUSTOMER OPERATIONAL DASHBOARD */}
      {screen === 'CUSTOMER_DASHBOARD' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
            <h2>Client Core Dashboard: <span style={{ color: '#1e3a8a' }}>{profileData.name}</span></h2>
            <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Secure Session Terminate</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            {/* COLUMN LEFT: PROFILE OVERVIEW & DETAILS UPDATE */}
            <div>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h3 style={{ color: '#1e3a8a', marginBottom: '10px' }}>Secure Account Summary</h3>
                <p><strong>Account Registry Core:</strong> {profileData.account_number}</p>
                <p style={{ fontSize: '20px', marginTop: '8px', color: '#166534' }}><strong>Liquid Balance:</strong> INR {profileData.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>

              <form onSubmit={handleUpdateProfile} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: '10px' }}>Modify Personal Details</h3>
                <div style={{ marginBottom: '8px' }}><label>Legal Name</label><input type="text" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div style={{ marginBottom: '8px' }}><label>Address Metadata</label><input type="text" style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                <div style={{ marginBottom: '12px' }}><label>Phone Registry Link</label><input type="text" style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <button type="submit" style={{ backgroundColor: '#475569', color: '#fff', padding: '8px 15px', borderRadius: '4px' }}>Commit Target Modifications</button>
              </form>
            </div>

            {/* COLUMN RIGHT: BENEFICIARIES CONTROL & FUNDS MOVEMENT */}
            <div>
              <form onSubmit={handleAddBeneficiary} style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h3 style={{ color: '#1e3a8a', marginBottom: '10px' }}>Authorize New Beneficiary Target</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" placeholder="Target Legal Name" required style={inputStyle} value={bName} onChange={(e) => setBName(e.target.value)} />
                  <input type="text" placeholder="Routing Bank Name" required style={inputStyle} value={bBank} onChange={(e) => setBBank(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <input type="text" placeholder="Account Identifier Number" required style={inputStyle} value={bAccount} onChange={(e) => setBAccount(e.target.value)} />
                  <input type="number" placeholder="Transfer Limit (INR)" required style={inputStyle} value={bLimit} onChange={(e) => setBLimit(e.target.value)} />
                </div>
                <button type="submit" style={{ backgroundColor: '#10b981', color: '#fff', padding: '8px 15px', borderRadius: '4px', width: '100%' }}>Register Beneficiary Target</button>
              </form>

              <form onSubmit={handleTransfer} style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#b91c1c', marginBottom: '10px' }}>Execute Safe Asset Remittance</h3>
                <div style={{ marginBottom: '8px' }}>
                  <label>Select Target Beneficiary Node</label>
                  <select required style={inputStyle} value={selectedReceiver} onChange={(e) => setSelectedReceiver(e.target.value)}>
                    <option value="">-- Choose Target Account Node --</option>
                    {beneficiaries.map((b) => (
                      <option key={b.id} value={b.account_number}>{b.name} ({b.bank_name} - {b.account_number})</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label>Remittance Capital Volume (INR)</label>
                  <input type="number" required placeholder="0.00" min="1" style={inputStyle} value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
                </div>
                <button type="submit" style={{ backgroundColor: '#1e3a8a', color: '#fff', padding: '10px 15px', borderRadius: '4px', width: '100%', fontWeight: 'bold' }}>Execute Transaction Node</button>
              </form>
            </div>
          </div>

          {/* SYSTEM LEDGER: VIEW TRANSACTION MATRIX */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ marginBottom: '10px', color: '#1e3a8a' }}>Audited Personal Transaction Ledger</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#fff' }}>
                  <th style={{ padding: '10px' }}>Transaction ID Code</th>
                  <th style={{ padding: '10px' }}>Origin Node Account</th>
                  <th style={{ padding: '10px' }}>Destination Node Account</th>
                  <th style={{ padding: '10px' }}>Capital Quantity Transfer</th>
                  <th style={{ padding: '10px' }}>System Timestamp Log</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: tx.sender_account === profileData.account_number ? '#fff5f5' : '#f0fdf4' }}>
                    <td style={{ padding: '10px' }}>TXN-000{tx.id}</td>
                    <td style={{ padding: '10px' }}>{tx.sender_account}</td>
                    <td style={{ padding: '10px' }}>{tx.receiver_account}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: tx.sender_account === profileData.account_number ? '#b91c1c' : '#166534' }}>
                      {tx.sender_account === profileData.account_number ? `- ₹${tx.amount.toLocaleString('en-IN')}` : `+ ₹${tx.amount.toLocaleString('en-IN')}`}
                    </td>
                    <td style={{ padding: '10px' }}>{tx.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCREEN 4: ADMINISTRATIVE CONSOLE MATRIX */}
      {screen === 'ADMIN_DASHBOARD' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
            <h2 style={{ color: '#334155' }}>Administrative System Monitor Console: <span style={{ color: '#b91c1c' }}>{userSession.name}</span></h2>
            <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold' }}>Disconnect Core Session</button>
          </div>

          {/* VIEW CENTRAL BANK DIRECTORY MODULE */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ color: '#1e3a8a', marginBottom: '10px' }}>Registered Customer Core Vault Profiles (Passwords Excluded)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#475569', color: '#fff' }}>
                  <th style={{ padding: '10px' }}>Client ID</th>
                  <th style={{ padding: '10px' }}>Legal Identity Name</th>
                  <th style={{ padding: '10px' }}>Email Address Target</th>
                  <th style={{ padding: '10px' }}>Physical Address Mapping</th>
                  <th style={{ padding: '10px' }}>Phone String Record</th>
                  <th style={{ padding: '10px' }}>Mapped Account Node</th>
                  <th style={{ padding: '10px' }}>Audited Liquid Capital</th>
                </tr>
              </thead>
              <tbody>
                {adminCustomerList.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '10px' }}>USR-0{c.id}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.name}</td>
                    <td style={{ padding: '10px' }}>{c.email}</td>
                    <td style={{ padding: '10px' }}>{c.address}</td>
                    <td style={{ padding: '10px' }}>{c.phone}</td>
                    <td style={{ padding: '10px', color: '#1e3a8a', fontWeight: 'bold' }}>{c.account_number}</td>
                    <td style={{ padding: '10px', color: '#166534', fontWeight: 'bold' }}>₹{c.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GLOBAL CENTRALIZED AUDITING LEDGER SYSTEM */}
          <div>
            <h3 style={{ color: '#b91c1c', marginBottom: '10px' }}>Centralized Global Audit Transaction Ledger</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#b91c1c', color: '#fff' }}>
                  <th style={{ padding: '10px' }}>System Audit ID</th>
                  <th style={{ padding: '10px' }}>Sender Origin Node</th>
                  <th style={{ padding: '10px' }}>Receiver Target Node</th>
                  <th style={{ padding: '10px' }}>Transactional Mass Remitted</th>
                  <th style={{ padding: '10px' }}>Core Timestamp Entry</th>
                </tr>
              </thead>
              <tbody>
                {adminTransactionList.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '10px' }}>GLO-TXN-{tx.id}</td>
                    <td style={{ padding: '10px' }}>{tx.sender_account}</td>
                    <td style={{ padding: '10px' }}>{tx.receiver_account}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#b91c1c' }}>₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '10px' }}>{tx.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;