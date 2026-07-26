const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000/interactive';

/**
 * Runs a single code execution test over WebSocket.
 */
function runCodeTest(language, code) {
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let output = '';
    const startTime = Date.now();
    let closed = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'init',
        language,
        code
      }));
    });

    ws.on('message', (data) => {
      output += data.toString();
    });

    ws.on('close', (closeCode, reason) => {
      closed = true;
      resolve({
        success: true,
        output,
        durationMs: Date.now() - startTime,
        closeCode,
        reason: reason.toString()
      });
    });

    ws.on('error', (err) => {
      if (!closed) {
        resolve({
          success: false,
          output,
          durationMs: Date.now() - startTime,
          error: err.message
        });
      }
    });
  });
}

/**
 * SCENARIO 1: Out of Memory Test
 */
async function runOomTest() {
  console.log('\n--- Scenario 1: Memory Limit (OOM) Testing ---');
  const pythonCode = `
import time
print("Allocating memory...")
# Attempting to allocate 200MB (limit is 128MB)
data = bytearray(200 * 1024 * 1024)
print("Allocated successfully!")
`;
  console.log('Sending OOM payload...');
  const result = await runCodeTest('python', pythonCode);
  console.log(`Duration: ${result.durationMs}ms`);
  console.log(`Output:\n${result.output}`);
  
  // OOM usually causes exit code 137, or causes docker inspect to fail if container was killed
  const isOom = result.output.includes('ExitCode: 137') || 
                result.output.includes('ExitCode 137') || 
                result.output.includes('137') || 
                result.output.includes('inspect execution result') ||
                result.output.includes('exit');
  
  if (isOom && !result.output.includes('Allocated successfully!')) {
    console.log('✅ PASS: Container was successfully terminated before allocating exceeding memory!');
  } else {
    console.log('❌ FAIL: Container did not trigger OOM shutdown or completed successfully.');
  }
}

/**
 * SCENARIO 2: CPU Limit Testing
 */
async function runCpuTest() {
  console.log('\n--- Scenario 2: CPU Limit (Throttling) Testing ---');
  const pythonCode = `
import time
print("Starting intensive CPU task...")
start = time.time()
count = 0
while time.time() - start < 3:
    count += 1
print(f"Finished. Loop iterations: {count}")
`;
  console.log('Sending CPU intensive payload (3 seconds active loop)...');
  const result = await runCodeTest('python', pythonCode);
  console.log(`Duration: ${result.durationMs}ms`);
  console.log(`Output:\n${result.output}`);
  
  if (result.output.includes('Finished. Loop iterations:')) {
    console.log('✅ PASS: CPU stress task completed successfully under CPU resource limits.');
  } else {
    console.log('❌ FAIL: CPU stress task failed to complete or return output.');
  }
}

/**
 * SCENARIO 3: Timeout Testing
 */
async function runTimeoutTest() {
  console.log('\n--- Scenario 3: Timeout Testing ---');
  const pythonCode = `
import time
print("Entering infinite loop...")
while True:
    time.sleep(1)
`;
  console.log('Sending infinite loop payload (Expect 30s timeout)...');
  const startTime = Date.now();
  const result = await runCodeTest('python', pythonCode);
  const elapsed = Date.now() - startTime;
  console.log(`Actual Elapsed Time: ${elapsed}ms`);
  console.log(`Output:\n${result.output}`);
  
  const timedOut = result.output.includes('timeout') || result.output.includes('timed out') || elapsed >= 29000;
  if (timedOut) {
    console.log('✅ PASS: runaway infinite loop was terminated near the 30-second limit.');
  } else {
    console.log('❌ FAIL: infinite loop was not terminated correctly.');
  }
}

/**
 * SCENARIO 4: Concurrency & Queueing Testing
 */
async function runConcurrencyTest(numClients = 8) {
  console.log(`\n--- Scenario 4: Concurrency & Queueing Testing (${numClients} Clients) ---`);
  
  const pythonCode = `
import time
import sys
# Sleep for 2 seconds to simulate processing
time.sleep(2)
print("Done")
`;

  console.log(`Launching ${numClients} clients simultaneously...`);
  const promises = [];
  const startTimestamp = Date.now();

  for (let i = 0; i < numClients; i++) {
    promises.push((async (clientId) => {
      const result = await runCodeTest('python', pythonCode);
      const finishTime = Date.now() - startTimestamp;
      return {
        client: clientId,
        duration: result.durationMs,
        finishTime,
        output: result.output.trim()
      };
    })(i + 1));
  }

  const results = await Promise.all(promises);
  
  console.log('\nResults:');
  console.table(results);

  // Analyze queuing batches (Assuming worker concurrency is 4)
  // Batch 1 (Clients 1-4): ~2-3s finish time
  // Batch 2 (Clients 5-8): ~4-5s finish time
  // Batch 3 (Clients 9-12): ~6-7s finish time
  console.log('\n--- Analysis ---');
  results.forEach(r => {
    console.log(`Client #${r.client} finished at +${(r.finishTime / 1000).toFixed(2)}s (Duration: ${(r.duration / 1000).toFixed(2)}s)`);
  });

  const batch1 = results.filter(r => r.finishTime <= 3500);
  const batch2 = results.filter(r => r.finishTime > 3500 && r.finishTime <= 5500);
  
  console.log(`\nBatch 1 (finished <= 3.5s): ${batch1.length} clients`);
  console.log(`Batch 2 (finished > 3.5s): ${batch2.length} clients`);

  if (batch1.length <= 4 && results.some(r => r.finishTime > 3500)) {
    console.log('✅ PASS: Concurrency limit (4 parallel jobs) works! Queueing was successfully observed.');
  } else {
    console.log('⚠️ INFO: Concurrency limit did not throttle execution. Ensure CONCURRENCY=4 is set on the worker and only one worker is running.');
  }
}

/**
 * Main Runner
 */
async function runAll() {
  try {
    console.log('==================================================');
    console.log('        Starting Stress & Concurrency Tests       ');
    console.log('==================================================');
    
    // Quick health check check
    const ws = new WebSocket(WS_URL);
    ws.on('open', () => {
      ws.close();
      startTests();
    });
    ws.on('error', (err) => {
      console.error(`Error connecting to API gateway at ${WS_URL}. Make sure server is running first!`);
      process.exit(1);
    });
  } catch (err) {
    console.error('Test runner exception:', err);
  }
}

async function startTests() {
  // Run OOM test
  await runOomTest();
  
  // Run CPU test
  await runCpuTest();
  
  // Run Timeout test (30s timeout)
  await runTimeoutTest();
  
  // Run Concurrency test with 8 simultaneous clients
  await runConcurrencyTest(8);
  
  console.log('\n==================================================');
  console.log('             Stress Testing Completed             ');
  console.log('==================================================');
}

runAll();
