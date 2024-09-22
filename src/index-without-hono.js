addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return new Response("Corpo da requisição inválido", { status: 400 });
  }

  const { post_id, purge_time, urls } = data;

  if (!urls || !purge_time) {
    return new Response("Dados insuficientes", { status: 400 });
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
      });
    } catch (error) {
      results.push({
        url,
        status: "Erro ao acessar a URL",
        error: error.message,
      });
    }
  }

  // Retorna uma resposta com os resultados
  return new Response(JSON.stringify({ post_id, results }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
