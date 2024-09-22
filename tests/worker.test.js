// Define o tempo limite de 15 segundos para este arquivo de teste
// Isso é necessário porque o Worker aguarda 5 segundos antes de processar as URLs
jest.setTimeout(15000);

// Importa as funções necessárias do pacote 'wrangler' e 'node-fetch'
// - unstable_dev: para iniciar o Worker localmente em ambiente de teste
// - getPlatformProxy: para simular o ambiente da plataforma Cloudflare
// - fetch: para realizar requisições HTTP (se necessário)
const { unstable_dev, getPlatformProxy } = require("wrangler");
const fetch = require("node-fetch");

// Declara a variável 'worker' que armazenará a instância do Worker
let worker;

// 'beforeAll' é uma função do Jest que é executada antes de todos os testes
beforeAll(async () => {
  /**
   * Obtém o proxy da plataforma Cloudflare
   * Isso permite que o Worker interaja com a plataforma Cloudflare durante os testes
   */
  const platform = getPlatformProxy();

  /**
   * Inicializa o Worker em ambiente de desenvolvimento para testes
   * - 'src/index.js' é o caminho para o arquivo principal do Worker
   * - As opções 'experimental' incluem configurações adicionais
   */
  worker = await unstable_dev("src/index.js", {
    experimental: {
      disableExperimentalWarning: true, // Desabilita avisos experimentais
      waitUntilExit: true, // Aguarda até que todas as operações assíncronas sejam concluídas
    },
    platform, // Passa o proxy da plataforma para o Worker
  });

  // Loga no console que o Worker foi iniciado
  console.log("Worker iniciado para testes.");
});

// 'afterAll' é uma função do Jest que é executada após todos os testes
afterAll(async () => {
  // Encerra o Worker após os testes
  await worker.stop();

  // Loga no console que o Worker foi encerrado
  console.log("Worker encerrado após os testes.");
});

// Define um teste com a descrição fornecida
test("Deve processar as URLs e retornar os resultados corretos", async () => {
  // URL válida que retorna o cabeçalho Last-Modified
  const testUrl = "https://www.example.com/";

  // Obter o cabeçalho Last-Modified atual da URL
  const headResponse = await fetch(testUrl, { method: "HEAD" });
  const lastModifiedHeader = headResponse.headers.get("Last-Modified");

  console.log("Last modified Time Header: ", lastModifiedHeader);

  // Definir o purge_time como o timestamp atual
  const purgeTime = Math.floor(Date.now() / 1000); // Tempo atual em segundos

  // Cria um objeto com os dados de teste que serão enviados ao Worker
  const testData = {
    post_id: 123,
    purge_time: purgeTime,
    urls: [testUrl],
  };

  // Loga os dados que serão enviados ao Worker
  console.log("Enviando os seguintes dados ao Worker:", testData);

  // Envia uma requisição POST para o Worker com os dados de teste
  const response = await worker.fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" }, // Define o tipo de conteúdo como JSON
    body: JSON.stringify(testData), // Converte os dados de teste para uma string JSON
  });

  // Loga o status da resposta recebida do Worker
  console.log("Resposta recebida do Worker com status:", response.status);

  // Verifica se o status da resposta é 200 (OK)
  expect(response.status).toBe(200);

  // Extrai o corpo da resposta e converte para um objeto JavaScript
  const result = await response.json();

  // Loga o resultado processado pelo Worker
  console.log("Resultado processado pelo Worker:", result);

  // Verifica se o resultado contém a propriedade 'post_id' com o valor 123
  expect(result).toHaveProperty("post_id", 123);

  // Verifica se 'results' é um array
  expect(Array.isArray(result.results)).toBe(true);

  // Verifica se o primeiro elemento de 'results' tem a propriedade 'url' com o valor esperado
  expect(result.results[0]).toHaveProperty("url", testUrl);

  // Verifica se o status retornado é 'Atualizado após o purge'
  expect(result.results[0]).toHaveProperty("status", "Atualizado após o purge");

  // Opcional: Loga o status retornado para a URL testada
  console.log("Status para a URL testada:", result.results[0].status);
});
