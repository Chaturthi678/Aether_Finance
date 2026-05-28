import axios from 'axios';

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  const newEmail = `testuser.jwt.${Date.now()}@aether.in`;
  let token = '';

  console.log('--- TEST 1: Registering / Logging in user ---');
  try {
    const registerRes = await axios.post(`${baseUrl}/api/auth/login`, {
      email: newEmail,
      password: 'testpassword123',
      name: 'Test JWT User',
      role: 'Software Engineer',
      city: 'Bangalore'
    });
    console.log('Register/Login Response Status:', registerRes.data.success);
    console.log('User Tier:', registerRes.data.user?.tier);
    token = registerRes.data.token;
    if (token) {
      console.log('PASS: Token successfully generated!');
    } else {
      console.error('FAIL: No token generated.');
      return;
    }
  } catch (err) {
    console.error('FAIL: Registration/Login failed:', err.response?.data || err.message);
    return;
  }

  const authHeaders = {
    headers: { 'Authorization': `Bearer ${token}` }
  };

  console.log('\n--- TEST 2: Checking transaction list (should be empty) ---');
  try {
    const txRes = await axios.get(`${baseUrl}/api/transactions`, authHeaders);
    console.log('Transactions Count:', txRes.data.transactions?.length);
    if (txRes.data.transactions?.length === 0) {
      console.log('PASS: Transactions are empty for new user.');
    } else {
      console.error('FAIL: Transactions should be empty!');
    }
  } catch (err) {
    console.error('FAIL: Failed to get transactions:', err.response?.data || err.message);
  }

  console.log('\n--- TEST 3: Syncing bank account via simulated Setu ---');
  try {
    const syncRes = await axios.post(`${baseUrl}/api/setu/sync`, {
      consentId: 'con_sim_test123'
    }, authHeaders);
    console.log('Sync Response Success:', syncRes.data.success);
    console.log('Synced Transactions Count:', syncRes.data.transactions?.length);
    
    // Check if now they have transactions
    const txRes2 = await axios.get(`${baseUrl}/api/transactions`, authHeaders);
    console.log('Post-Sync Transactions Count:', txRes2.data.transactions?.length);
    if (txRes2.data.transactions?.length > 0) {
      console.log('PASS: Transactions successfully populated after Setu sync.');
    } else {
      console.error('FAIL: Transactions still empty after Setu sync!');
    }
  } catch (err) {
    console.error('FAIL: Sync failed:', err.response?.data || err.message);
  }

  console.log('\n--- TEST 4: Getting budgets ---');
  try {
    const budgetRes = await axios.get(`${baseUrl}/api/budgets`, authHeaders);
    console.log('Budgets Loaded:', budgetRes.data.success);
    console.log('Budgets Count:', budgetRes.data.budgets?.length);
    if (budgetRes.data.budgets?.length > 0) {
      console.log('PASS: Loaded default budgets successfully.');
    } else {
      console.error('FAIL: Failed to load default budgets.');
    }
  } catch (err) {
    console.error('FAIL: Failed to get budgets:', err.response?.data || err.message);
  }

  console.log('\n--- TEST 5: Upgrading to Premium (Razorpay Upgrade simulation) ---');
  try {
    const upgradeRes = await axios.post(`${baseUrl}/api/billing/upgrade`, {}, authHeaders);
    console.log('Upgrade success:', upgradeRes.data.success);
    console.log('New User Tier:', upgradeRes.data.user?.tier);
    const newToken = upgradeRes.data.token;
    if (upgradeRes.data.user?.tier === 'premium' && newToken) {
      console.log('PASS: Tier upgraded to premium and new token issued.');
      token = newToken; // Update token for subsequent premium calls
    } else {
      console.error('FAIL: Upgrade did not transition tier to premium.');
    }
  } catch (err) {
    console.error('FAIL: Upgrade request failed:', err.response?.data || err.message);
  }

  const premiumAuthHeaders = {
    headers: { 'Authorization': `Bearer ${token}` }
  };

  console.log('\n--- TEST 6: Getting billing status (should be premium) ---');
  try {
    const statusRes = await axios.get(`${baseUrl}/api/billing/status`, premiumAuthHeaders);
    console.log('Billing Status response:', statusRes.data);
    if (statusRes.data.tier === 'premium') {
      console.log('PASS: Status endpoint correctly reports premium.');
    } else {
      console.error('FAIL: Status endpoint reports non-premium tier:', statusRes.data.tier);
    }
  } catch (err) {
    console.error('FAIL: Status check failed:', err.response?.data || err.message);
  }

  console.log('\n--- TEST 7: Cancelling Premium subscription ---');
  try {
    const cancelRes = await axios.post(`${baseUrl}/api/billing/cancel`, {}, premiumAuthHeaders);
    console.log('Cancel success:', cancelRes.data.success);
    console.log('Post-Cancel User Tier:', cancelRes.data.user?.tier);
    if (cancelRes.data.user?.tier === 'free') {
      console.log('PASS: Reverted back to free tier successfully.');
    } else {
      console.error('FAIL: Cancel did not downgrade user.');
    }
  } catch (err) {
    console.error('FAIL: Cancellation failed:', err.response?.data || err.message);
  }
}

runTests();
