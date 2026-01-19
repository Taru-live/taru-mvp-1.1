/**
 * Test script for AI-BUDDY-MAIN chat endpoint
 * Usage: node scripts/test-chat-main.js [uniqueid] [message]
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testChatMain(uniqueid, message) {
  const testUniqueId = uniqueid || 'TEST123456';
  const testMessage = message || 'Hello, this is a test message';

  console.log('🧪 Testing AI-BUDDY-MAIN Chat Endpoint');
  console.log('=====================================');
  console.log(`URL: ${BASE_URL}/api/chat/main`);
  console.log(`Unique ID: ${testUniqueId}`);
  console.log(`Message: ${testMessage}`);
  console.log('');

  try {
    const response = await fetch(`${BASE_URL}/api/chat/main`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testMessage,
        uniqueId: testUniqueId
      }),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('');

    const data = await response.json();
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('');
      console.log('✅ Test PASSED');
      console.log(`Response: ${data.response}`);
    } else {
      console.log('');
      console.log('❌ Test FAILED');
      console.log(`Error: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Test ERROR:', error.message);
    console.error('Make sure the server is running: npm run dev');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const uniqueid = args[0];
const message = args[1] || args.slice(1).join(' ');

testChatMain(uniqueid, message);
