const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 10000;

// =========================
// CONFIG ATIVOS (EXEMPLO)
// =========================
const ativos = [
  { nome: "VIX", url: "https://api.mocki.io/v2/549a5d8b" },
  { nome: "USD/BRL", url: "https://api.mocki.io/v2/549a5d8b" },
  { nome: "WTI", url: "https://api.mocki.io/v2/549a5d8b" }
];

// =========================
// ESTADO
// =========================
let historico = [];
let aceleracao = 0;

// =========================
// FUNÇÕES
// =========================
function classificar(variacao) {
  if (variacao < -0.3) return "Alta";
  if (variacao > 0.3) return "Queda";
  return "Neutro";
}

// MOCK (depois conectamos Investing real)
function gerarVariacaoFake() {
  return (Math.random() * 2 - 1).toFixed(2);
}

// =========================
// ATUALIZAÇÃO (CÉREBRO)
// =========================
function atualizarDados() {
  let alta = 0;
  let baixa = 0;
  let neutro = 0;

  ativos.forEach(a => {
    const variacao = parseFloat(gerarVariacaoFake());
    const direcao = classificar(variacao);

    if (direcao === "Alta") alta++;
    if (direcao === "Queda") baixa++;
    if (direcao === "Neutro") neutro++;
  });

  const ab = alta - baixa;
  aceleracao += ab;

  historico.push({
    tempo: new Date().toLocaleTimeString(),
    alta,
    baixa,
    neutro,
    ab,
    aceleracao
  });

  if (historico.length > 100) historico.shift();

  console.log("Atualizado:", { alta, baixa, ab, aceleracao });
}

// roda a cada 5 min
setInterval(atualizarDados, 300000);
atualizarDados();

// =========================
// FRONT (GRÁFICO)
// =========================
app.get("/", (req, res) => {
  res.send(`
  <html>
  <head>
    <title>Monitor Profissional</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      body {
        background: #0f0f0f;
        color: white;
        font-family: Arial;
        text-align: center;
        padding: 20px;
      }
      canvas {
        max-width: 900px;
        margin-top: 30px;
      }
    </style>
  </head>
  <body>

    <h1>📊 Monitor de Mercado</h1>

    <canvas id="grafico"></canvas>

    <script>
      const dados = ${JSON.stringify(historico)};

      const labels = dados.map(d => d.tempo);

      const chart = new Chart(document.getElementById("grafico"), {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Alta (Verde)",
              data: dados.map(d => d.alta),
              borderColor: "green",
              tension: 0.2
            },
            {
              label: "Baixa (Vermelha)",
              data: dados.map(d => d.baixa),
              borderColor: "red",
              tension: 0.2
            },
            {
              label: "Força (Alta - Baixa)",
              data: dados.map(d => d.ab),
              borderColor: "cyan",
              tension: 0.2
            },
            {
              label: "Aceleração",
              data: dados.map(d => d.aceleracao),
              borderColor: "white",
              tension: 0.2
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: { color: "white" }
            }
          },
          scales: {
            x: { ticks: { color: "white" } },
            y: { ticks: { color: "white" } }
          }
        }
      });
    </script>

  </body>
  </html>
  `);
});

// =========================
// START
// =========================
app.listen(PORT, () => {
  console.log("Rodando na porta " + PORT);
});
