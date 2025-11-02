/*
  test-eth-login.js
  -----------------
  Quick test helper for local development only.
  - Requests a nonce for the configured CMS address
  - Signs the message with PRIVATE_KEY (read from env or fill below)
  - Posts the signature to /auth/ethereum/verify and prints tokens

  USAGE:
    # install deps first (once)
    npm install node-fetch@2 ethers

    # Option A: export PRIVATE_KEY (only for test key) and run
    $env:PRIVATE_KEY = '0x....'    # PowerShell
    node test-eth-login.js

    # Option B: edit the PRIVATE_KEY constant below (NOT RECOMMENDED)
*/

const fetch = require('node-fetch');
const { ethers } = require('ethers');

const SERVER = process.env.SERVER_URL || 'http://localhost:5000';
const ETH_ADDRESS = process.env.ETH_ADDRESS || '0x3ff964e530ece8587da1b67d9a43de5d734ef0de';
const PRIVATE_KEY = process.env.PRIVATE_KEY || null; // Set this only for test wallets

async function run() {
  if (!PRIVATE_KEY) {
    console.log('No PRIVATE_KEY provided.');
    console.log('To run this script automatically provide a test private key in the PRIVATE_KEY env var.');
    console.log('Example (PowerShell):');
    console.log("$env:PRIVATE_KEY = '0xYOUR_TEST_PRIVATE_KEY'; node test-eth-login.js");
    console.log('\nAlternatively, use MetaMask to sign the nonce and call /auth/ethereum/verify from Postman.');
    process.exit(0);
  }

  try {
    // 1) Request nonce
    const nonceRes = await fetch(`${SERVER}/auth/ethereum/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ethereumAddress: ETH_ADDRESS })
    });

    if (!nonceRes.ok) {
      const text = await nonceRes.text();
      throw new Error(`Failed getting nonce: ${nonceRes.status} ${text}`);
    }

    const { nonce } = await nonceRes.json();
    console.log('Nonce received:', nonce);

    // 2) Sign the message
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const message = `Sign this message to log in: ${nonce}`;
    const signature = await wallet.signMessage(message);
    console.log('Signature:', signature);

    // 3) Verify signature
    const verifyRes = await fetch(`${SERVER}/auth/ethereum/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ethereumAddress: ETH_ADDRESS, signature })
    });

    const verifyJson = await verifyRes.json();

    if (!verifyRes.ok) {
      throw new Error(`Verify failed: ${verifyRes.status} ${JSON.stringify(verifyJson)}`);
    }

    console.log('Verify response:', verifyJson);

    // 4) Decode access token payload
    if (verifyJson.accessToken) {
      const payload = JSON.parse(Buffer.from(verifyJson.accessToken.split('.')[1], 'base64').toString());
      console.log('Access token payload:', payload);
    }
  } catch (err) {
    console.error('Error during test run:', err.message || err);
    process.exit(1);
  }
}

run();
