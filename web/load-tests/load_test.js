const TARGET_URL = "http://localhost:8080/";
const CONCURRENCY = 100; // 100 virtual users
const DURATION_MS = 60000; // 1 minute

async function runLoadTest() {
  console.log(`[+] Starting Load Test against: ${TARGET_URL}`);
  console.log(`[+] Concurrency : ${CONCURRENCY} virtual users`);
  console.log(`[+] Duration    : 1 minute (60,000 ms)\n`);

  const startTime = Date.now();
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;

  const responseTimes = [];

  // Worker function
  async function worker() {
    while (Date.now() - startTime < DURATION_MS) {
      const t0 = Date.now();
      try {
        const res = await fetch(TARGET_URL, {
          headers: {
            "User-Agent": "LoadTester/1.0",
          },
        });
        const duration = Date.now() - t0;

        totalRequests++;
        if (res.ok) {
          successfulRequests++;
          responseTimes.push(duration);
        } else {
          failedRequests++;
        }
      } catch (err) {
        totalRequests++;
        failedRequests++;
      }
    }
  }

  // Spawn concurrent workers
  const workers = Array.from({ length: CONCURRENCY }, () => worker());

  // Wait for all workers to finish
  await Promise.all(workers);

  const actualDurationMs = Date.now() - startTime;
  const actualDurationSec = actualDurationMs / 1000;

  // Calculate metrics
  const rps = (totalRequests / actualDurationSec).toFixed(1);
  const successRps = (successfulRequests / actualDurationSec).toFixed(1);

  let avgResponseTime = 0;
  let minResponseTime = 0;
  let maxResponseTime = 0;

  if (responseTimes.length > 0) {
    const sum = responseTimes.reduce((a, b) => a + b, 0);
    avgResponseTime = Math.round(sum / responseTimes.length);
    minResponseTime = Math.min(...responseTimes);
    maxResponseTime = Math.max(...responseTimes);
  }

  console.log("========================================");
  console.log("          LOAD TEST RESULTS             ");
  console.log("========================================");
  console.log(`Target URL        : ${TARGET_URL}`);
  console.log(`Test Duration     : ${actualDurationSec.toFixed(1)}s`);
  console.log(`Total Requests    : ${totalRequests}`);
  console.log(`Successful Req    : ${successfulRequests}`);
  console.log(`Failed Requests   : ${failedRequests}`);
  console.log("----------------------------------------");
  console.log(`Requests/sec (RPS): ${rps} req/sec`);
  console.log(`Success RPS       : ${successRps} req/sec`);
  console.log("----------------------------------------");
  console.log("Response Time:");
  console.log(`  Average: ${avgResponseTime}ms`);
  console.log(`  Min    : ${minResponseTime}ms`);
  console.log(`  Max    : ${maxResponseTime}ms`);
  console.log("========================================");
}

runLoadTest().catch(console.error);
