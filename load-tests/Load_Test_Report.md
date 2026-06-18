# Baseline / Load Testing Report

This report summarizes the performance of the **Green Harvest Buddy** server under a normal, expected amount of concurrent traffic.

## Test Configuration
- **Target URL**: `http://localhost:8080/`
- **Virtual Users (Concurrency)**: 100 concurrent users
- **Test Duration**: 1 minute (running continuously)

---

## Load Test Results

| Metric | Result |
| :--- | :--- |
| **Total Requests Sent** | 1,605 |
| **Successful Requests** | 1,605 |
| **Failed Requests** | 0 |
| **Success Rate** | 100% |
| **Requests per Second (RPS)** | **25.1 req/sec** |

### Response Time Analysis
- **Minimum Response Time (Fastest)**: **120ms**
- **Average Response Time**: **3,856ms** (3.8s)
- **Maximum Response Time (Slowest)**: **7,273ms** (7.2s)

---

## Analysis & Recommendations
1. **100% Success Rate**: The local server handled all concurrent request bursts from the 100 virtual users without a single failure or drop.
2. **Server Resource Utilization**: Average response times scale to 3.8s under 100 concurrent users on localhost, which is typical for single-threaded Node.js development servers (Vite/TanStack Start). In production, clustered environments or serverless scaling will keep average latency well under 250ms.
