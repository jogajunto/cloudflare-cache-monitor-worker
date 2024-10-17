# Cloudflare Cache Monitor Worker

This project, cloudflare-cache-monitor-worker, is a Cloudflare Worker that monitors cache purge requests and verifies whether the cached content has been updated by checking the `Last-Modified` header of URLs. The Worker also integrates with Discord to notify the results of the cache purge operations.

## Project Structure

```bash
cloudflare-cache-monitor-worker/
├── src/
│   ├── index-without-hono.js     # Worker logic without Hono (for basic requests)
│   ├── index.js                  # Main worker logic using Hono framework
│   ├── services/
│   │   └── discord.js            # Handles Discord notifications
├── tests/
│   └── worker.test.js            # Jest tests for the worker
├── package.json                  # Node.js project configuration
├── wrangler.toml                 # Cloudflare Worker settings
└── README.md                     # Documentation for the project
```

## Prerequisites

To use or contribute to this project, you need the following:

- Node.js (version 16 or later)
- Wrangler (Cloudflare's CLI tool for Workers)
- A Cloudflare account with Workers enabled.
- A Discord Webhook URL for sending notifications.

## Installation

1. Clone this repository:

```bash
git clone https://github.com/your-username/cloudflare-cache-monitor-worker.git
cd cloudflare-cache-monitor-worker
```

2. Install the dependencies:

```bash
npm install
```

3. Configure the environment variables by editing the wrangler.toml file.

## Environment Variables

You need to configure the following environment variables in the wrangler.toml file:

```toml
[vars]
DISCORD_WEBHOOK_URL = "Your Discord webhook URL"
DISCORD_EMBED_FOOTER_LABEL = "Cloudflare Cache Monitor"
DISCORD_EMBED_FOOTER_ICON_URL = "https://your-icon-url.png"
```

- `DISCORD_WEBHOOK_URL`: The URL of the Discord webhook where notifications will be sent.
- `DISCORD_EMBED_FOOTER_LABEL`: The footer label for the Discord embed message.
- `DISCORD_EMBED_FOOTER_ICON_URL`: The URL of the icon displayed in the footer of the Discord message.

## Usage

This worker listens for POST requests containing details about cache purges, including URLs and timestamps. Based on this information, it fetches the URLs, checks the Last-Modified headers, and determines whether the content was updated after the purge.

### Example request payload:

```json
{
  "post_id": 19509,
  "post_name": "projetando-cidades-mais-frescas-licoes-das-civilizacoes-antigas",
  "purge_time": 1729131107,
  "urls": [
    "https://caosplanejado.com/category/gestao-urbana/",
    "https://caosplanejado.com/projetando-cidades-mais-frescas-licoes-das-civilizacoes-antigas/"
  ]
}
```

The worker will:

1. Check the `Last-Modified` header for each URL.
2. Compare the header value with the `purge_time`.
3. Send a notification to Discord indicating whether the content was updated or not.

### Running the Worker Locally

To run the Worker locally for development:

```bash
npm run dev
```

This command will run the Worker using Wrangler's local development mode.

## Discord Integration

The Worker integrates with Discord to send notifications about the cache purge status.

- If none of the URLs have been updated after the purge, the Worker sends an error message to Discord.
- If at least one URL was updated, a success message is sent.

Discord messages include the URL status, whether it was updated after the purge, and other details.

### Sample Discord Embed:

```json
{
  "title": "✅ Cache Purge Success for Post ID 19509",
  "description": "2 URLs were updated after the purge.",
  "fields": [
    {
      "name": "https://caosplanejado.com/category/gestao-urbana/",
      "value": "Status: Updated after purge"
    },
    {
      "name": "https://caosplanejado.com/projetando-cidades-mais-frescas-licoes-das-civilizacoes-antigas/",
      "value": "Status: Not updated after purge"
    }
  ],
  "timestamp": "2024-10-16T12:00:00Z"
}
```

## Testing

The project uses Jest for testing. You can run the tests with the following command:

```bash
npm test
```

This will execute the tests defined in the tests/worker.test.js file.

### Test Example:

The test sends a POST request to the Worker, verifies that it processes the URLs correctly, and checks the result.

```javascript
test("Should process the URLs and return the correct results", async () => {
  // Test logic...
});
```

### Timeout Configuration:

The tests include a 15-second timeout to account for the delays added in the worker logic (such as waiting 5 seconds before processing URLs).

## Deploying the Worker

To deploy the Worker to Cloudflare, ensure you are logged in with wrangler and then run:

```bash
npm run deploy
```

This command will use the configuration in wrangler.toml to publish the Worker to Cloudflare.

## Contributing

We welcome contributions! Feel free to open issues or submit pull requests with improvements. Please ensure that your code passes the existing tests and that you add tests for any new functionality.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
