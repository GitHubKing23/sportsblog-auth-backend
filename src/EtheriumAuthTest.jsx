import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const EthereumAuthTest = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      // 1. Connect to MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);

      // 2. Get nonce from backend
      const nonceRes = await axios.post('http://localhost:5000/auth/ethereum/nonce', {
        ethereumAddress: address
      });

      const nonceMessage = `Sign this message to log in: ${nonceRes.data.nonce}`;

      // 3. Sign the message with MetaMask
      const signature = await signer.signMessage(nonceMessage);

      // 4. Send signature to backend for verification
      const verifyRes = await axios.post('http://localhost:5000/auth/ethereum/verify', {
        ethereumAddress: address,
        signature
      });

      setToken(verifyRes.data.token);
      setMessage("✅ Logged in successfully!");
    } catch (err) {
      console.error("Login error:", err);
      setError("❌ " + (err?.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🔐 Ethereum Login</h2>
      <button onClick={handleLogin}>Sign in with MetaMask</button>

      {walletAddress && <p>Wallet: {walletAddress}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {token && (
        <>
          <h4>JWT Token:</h4>
          <textarea style={{ width: "100%", height: "100px" }} value={token} readOnly />
        </>
      )}
    </div>
  );
};

export default EthereumAuthTest;
