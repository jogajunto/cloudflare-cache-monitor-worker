import { Hono } from "hono";

const app = new Hono();

app.post("/", async (c) => {
  const request = c.req;

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return c.text("Corpo da requisição inválido", 400);
  }

  const { post_id, purge_time, urls } = data;

  if (!urls || !purge_time) {
    return c.text("Dados insuficientes", 400);
  }

  // Aguarda alguns segundos (5 segundos)
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const results = [];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      const lastModified = response.headers.get("Last-Modified");

      let status = "Indeterminado";
      if (lastModified) {
        const lastModifiedTime = new Date(lastModified).getTime() / 1000; // Converte para timestamp Unix

        if (lastModifiedTime >= purge_time) {
          status = "Atualizado após o purge";
        } else {
          status = "Não atualizado após o purge";
        }
      } else {
        status = "Cabeçalho Last-Modified ausente";
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
        status: "Erro ao acessar a URL",
        error: error.message,
        purge_time,
      });
    }
  }

  // Retorna uma resposta com os resultados
  return c.json({ post_id, results });
});

// Lida com outros métodos HTTP não permitidos
app.all("*", (c) => c.text("Método não permitido", 405));

export default app;
