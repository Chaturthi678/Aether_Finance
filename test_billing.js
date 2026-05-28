import axios from 'axios';

async function runBillingTests() {
  const baseUrl = 'http://localhost:3000';
  const newEmail = `science.and.technology728+testbill${Date.now()}@gmail.com`;
  
  console.log('--- TEST 1: Registering new user ---');
  try {
    const registerRes = await axios.post(`${baseUrl}/api/auth/login`, {
      email: newEmail,
      password: 'testpassword123',
      name: 'Test Billing User',
      role: 'Consultant',
      city: 'Pune'
    });
    console.log('Registration Response Tier:', registerRes.data.user?.tier);
    if (registerRes.data.user?.tier !== 'free') {
      console.error('FAIL: User should start on free tier!');
    } else {
      console.log('PASS: User successfully initialized on free tier.');
    }
  } catch (err) {
    console.error('Registration failed:', err.response?.data || err.message);
    return;
  }

  console.log('\n--- TEST 2: Checking billing status (should be free) ---');
  try {
    const statusRes = await axios.get(`${baseUrl}/api/billing/status`, {
      headers: { 'X-User-Email': newEmail }
    });
    console.log('Billing Status:', statusRes.data);
    if (statusRes.data.tier !== 'free') {
      console.error('FAIL: Tier should be free!');
    } else {
      console.log('PASS: Status endpoint correctly reports free.');
    }
  } catch (err) {
    console.error('Status check failed:', err.response?.data || err.message);
  }

  console.log('\n--- TEST 3: Upgrading user to Premium ---');
  try {
    const upgradeRes = await axios.post(`${baseUrl}/api/billing/upgrade`, {}, {
      headers: { 'X-User-Email': newEmail }
    });
    console.log('Upgrade Response User Tier:', upgradeRes.data.user?.tier);
    
    // Check status again
    const statusRes2 = await axios.get(`${baseUrl}/api/billing/status`, {
      headers: { 'X-User-Email': newEmail }
    });
    console.log('Billing Status Post-Upgrade:', statusRes2.data);
    if (statusRes2.data.tier !== 'premium') {
      console.error('FAIL: Tier should be premium after upgrade!');
    } else {
      console.log('PASS: User successfully upgraded to premium.');
    }
  } catch (err) {
    console.error('Upgrade failed:', err.response?.data || err.message);
  }

  console.log('\n--- TEST 4: Cancelling Premium subscription ---');
  try {
    const cancelRes = await axios.post(`${baseUrl}/api/billing/cancel`, {}, {
      headers: { 'X-User-Email': newEmail }
    });
    console.log('Cancel Response User Tier:', cancelRes.data.user?.tier);
    
    // Check status again
    const statusRes3 = await axios.get(`${baseUrl}/api/billing/status`, {
      headers: { 'X-User-Email': newEmail }
    });
    console.log('Billing Status Post-Cancel:', statusRes3.data);
    if (statusRes3.data.tier !== 'free') {
      console.error('FAIL: Tier should be free after cancellation!');
    } else {
      console.log('PASS: User successfully downgraded to free.');
    }
  } catch (err) {
    console.error('Cancellation failed:', err.response?.data || err.message);
  }
}

runBillingTests();
