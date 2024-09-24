// src/services/discord.js

export class DiscordNotifier {
  static async send(message, env) {
    const DISCORD_WEBHOOK_URL = env.DISCORD_WEBHOOK_URL;

    if (!DISCORD_WEBHOOK_URL) {
      throw new Error("DISCORD_WEBHOOK_URL não está definida!");
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        return response;
      } else if (response.status === 429) {
        // Rate limit excedido
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000; // Tempo em milissegundos

        console.warn(
          `Rate limit excedido. Tentativa ${attempt} de ${maxRetries}. Aguardando ${waitTime}ms antes de tentar novamente.`
        );

        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        // Outro erro
        const errorText = await response.text();
        throw new Error(
          `Erro ao enviar mensagem para o Discord: ${response.status} ${response.statusText} - ${errorText}`
        );
      }
    }

    throw new Error(
      `Falha ao enviar mensagem para o Discord após ${maxRetries} tentativas devido a rate limits.`
    );
  }

  static createEmbed(options, env) {
    const DISCORD_EMBED_FOOTER_LABEL =
      env.DISCORD_EMBED_FOOTER_LABEL || "Jogajunto GitHub Listener";
    const DISCORD_EMBED_FOOTER_ICON_URL =
      env.DISCORD_EMBED_FOOTER_ICON_URL ||
      "https://jogajunto.co/apple-touch-icon.png";

    // Estrutura básica de um embed
    const embed = {
      title: options.title || "",
      description: options.description || "",
      url: options.url || "",
      /**
       *  Colors:
       *
       *  White           16777215
       *  Greyple	        10070709
       *  Black	        2303786
       *  DarkButNotBlack	2895667
       *  NotQuiteBlack	2303786
       *  Blurple	        5793266
       *  Green	        5763719
       *  Yellow	        16705372
       *  Fuchsia	        15418782
       *  Red	            15548997
       */
      color: options.color || 3106979,
      timestamp: options.timestamp || new Date().toISOString(),
      footer: options.footer
        ? {
            icon_url: options.footer.icon_url || "",
            text: options.footer.text || "",
          }
        : {
            icon_url: DISCORD_EMBED_FOOTER_ICON_URL,
            text: DISCORD_EMBED_FOOTER_LABEL,
          },
      thumbnail: options.thumbnail
        ? {
            url: options.thumbnail.url || "",
          }
        : undefined,
      image: options.image
        ? {
            url: options.image.url || "",
          }
        : undefined,
      author: options.author
        ? {
            name: options.author.name || "",
            url: options.author.url || "",
            icon_url: options.author.icon_url || "",
          }
        : undefined,
      fields: options.fields || [],
    };

    return this.#deepClean(embed);
  }

  // Método privado para limpar o objeto
  static #deepClean(obj) {
    for (let key in obj) {
      if (obj[key] === undefined || obj[key] === null || obj[key] === "") {
        delete obj[key];
      } else if (typeof obj[key] === "object") {
        this.#deepClean(obj[key]);
      }
    }
    return obj;
  }
}
