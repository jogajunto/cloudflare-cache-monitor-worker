import { Hono } from "hono";
import { DiscordNotifier } from "./services/discord.js";

const app = new Hono();

app.post("/", async (c) => {
  const request = c.req;
  const env = c.env;

  let data;
  try {
    data = await request.json();
    console.log("Data received: ", data);
  } catch (e) {
    return c.text("Invalid request body", 400);
  }

  const { post_id, post_name, purge_time, urls } = data;

  if (!urls) {
    return c.text("Insufficient data: 'urls' is missing or empty", 400);
  }
  if (!purge_time) {
    return c.text("Insufficient data: 'purge_time' is missing or invalid", 400);
  }
  if (!post_name) {
    return c.text("Insufficient data: 'post_name' is missing or empty", 400);
  }

  // Filtrar as URLs que contêm o post_name
  const filteredUrls = urls.filter((url) => url.includes(post_name));

  if (filteredUrls.length === 0) {
    return c.text("No URLs match the post_name", 400);
  }

  // Wait a few seconds (5 seconds)
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const results = [];

  for (const url of filteredUrls) {
    try {
      const response = await fetch(url);
      const lastModified = response.headers.get("Last-Modified");

      let status = "Undetermined";
      if (lastModified) {
        const lastModifiedTime = new Date(lastModified).getTime() / 1000; // Convert to Unix timestamp

        if (lastModifiedTime >= purge_time) {
          status = "Updated after purge";
        } else {
          status = "Not updated after purge";
        }
      } else {
        status = "Last-Modified header missing";
      }

      results.push({
        url,
        status,
        lastModified,
        purge_time,
      });
    } catch (error) {
      results.push({
        url,
        status: "Error accessing the URL",
        error: error.message,
        purge_time,
      });
    }
  }

  // Check if at least one result has the status 'Updated after purge'
  const anyUpdated = results.some(
    (result) => result.status === "Updated after purge"
  );

  // Preparar o embed para o Discord
  const embedOptions = {
    fields: results.map((result) => ({
      name: result.url,
      value: `Status: ${result.status}`,
      inline: false,
    })),
    timestamp: new Date().toISOString(),
  };

  if (!anyUpdated) {
    // No URL was updated after purge, send error message to Discord
    embedOptions.title = `🚧 Cache Purge Error for Post ID ${post_id}`;
    embedOptions.description = "None of the URLs were updated after the purge.";
    embedOptions.color = 15548997; // Red color

    try {
      const embed = DiscordNotifier.createEmbed(embedOptions, env);
      await DiscordNotifier.send({ embeds: [embed] }, env);
    } catch (error) {
      console.error("Error sending message to Discord:", error);
    }
  } else {
    // Success message
    embedOptions.title = `✅ Cache Purge Success for Post ID ${post_id}`;
    embedOptions.description = `${results.length} URLs were updated after the purge.`;
    embedOptions.color = 5763719; // Green color

    try {
      const embed = DiscordNotifier.createEmbed(embedOptions, env);
      await DiscordNotifier.send({ embeds: [embed] }, env);
    } catch (error) {
      console.error("Error sending message to Discord:", error);
    }
  }

  // Return a response with the results
  return c.json({ post_id, results });
});

// Handle other non-allowed HTTP methods
app.all("*", (c) => c.text("Method not allowed", 405));

export default app;
