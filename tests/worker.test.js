// Sets a 15-second timeout for this test file
// This is necessary because the Worker waits 5 seconds before processing the URLs
jest.setTimeout(15000);

// Imports necessary functions from the 'wrangler' and 'node-fetch' packages
// - unstable_dev: to start the Worker locally in a test environment
// - getPlatformProxy: to simulate the Cloudflare platform environment
// - fetch: to make HTTP requests (if needed)
const { unstable_dev, getPlatformProxy } = require("wrangler");
const fetch = require("node-fetch");

// Declares the 'worker' variable to store the Worker instance
let worker;

// 'beforeAll' is a Jest function that runs before all tests
beforeAll(async () => {
  /**
   * Gets the Cloudflare platform proxy
   * This allows the Worker to interact with the Cloudflare platform during tests
   */
  const platform = getPlatformProxy();

  /**
   * Initializes the Worker in development mode for testing
   * - 'src/index.js' is the path to the Worker's main file
   * - The 'experimental' options include additional configurations
   */
  worker = await unstable_dev("src/index.js", {
    experimental: {
      disableExperimentalWarning: true, // Disables experimental warnings
      waitUntilExit: true, // Waits until all asynchronous operations are complete
    },
    platform, // Passes the platform proxy to the Worker
  });

  // Logs to the console that the Worker has started
  console.log("Worker started for testing.");
});

// 'afterAll' is a Jest function that runs after all tests
afterAll(async () => {
  // Stops the Worker after the tests
  await worker.stop();

  // Logs to the console that the Worker has stopped
  console.log("Worker stopped after testing.");
});

// Defines a test with the provided description
test("Should process the URLs and return the correct results", async () => {
  // Valid URL that returns the Last-Modified header
  const testUrl = "https://www.example.com/";

  // Get the current Last-Modified header of the URL
  const headResponse = await fetch(testUrl, { method: "HEAD" });
  const lastModifiedHeader = headResponse.headers.get("Last-Modified");

  console.log("Last modified Time Header: ", lastModifiedHeader);

  // Set the purge_time as the current timestamp
  const purgeTime = Math.floor(Date.now() / 1000); // Current time in seconds

  // Creates an object with test data that will be sent to the Worker
  const testData = {
    post_id: 123,
    purge_time: purgeTime,
    urls: [testUrl],
  };

  // Logs the data that will be sent to the Worker
  console.log("Sending the following data to the Worker:", testData);

  // Sends a POST request to the Worker with the test data
  const response = await worker.fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // Sets content type as JSON
    body: JSON.stringify(testData), // Converts the test data to a JSON string
  });

  // Logs the status of the response received from the Worker
  console.log("Response received from Worker with status:", response.status);

  // Verifies if the response status is 200 (OK)
  expect(response.status).toBe(200);

  // Extracts the response body and converts it to a JavaScript object
  const result = await response.json();

  // Logs the result processed by the Worker
  console.log("Result processed by Worker:", result);

  // Verifies if the result contains the 'post_id' property with the value 123
  expect(result).toHaveProperty("post_id", 123);

  // Verifies if 'results' is an array
  expect(Array.isArray(result.results)).toBe(true);

  // Verifies if the first element of 'results' has the 'url' property with the expected value
  expect(result.results[0]).toHaveProperty("url", testUrl);

  // Verifies if the returned status is 'Updated after purge'
  expect(result.results[0]).toHaveProperty("status", "Updated after purge");

  // Optional: Logs the returned status for the tested URL
  console.log("Status for the tested URL:", result.results[0].status);
});
