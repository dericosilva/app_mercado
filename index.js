const express = require("express");

const app = express();

// ============================
// CONFIGURAÇÃO DOS ATIVOS (SUA PLANILHA)
// ============================
const ativos = [
  { nome: "Minério de Ferro", tipo: "risco", min: -0.003, max: 0.003 },
  { nome: "S&P 500 VIX", tipo: "protecao", min: -0.005, max: 0.005 },
  { nome: "USD/BRL", tipo: "protecao", min: -0.001, max: 0.001 },
  { nome: "Petróleo WTI", tipo: "risco", min: -0.001, max: 0.001 },
  { nome: "Nasdaq", tipo: "risco", min: -0.001, max: 0.001 },
  { nome: "DXY", tipo: "protecao", min: -0.001, max: 0.001 }
];

let historico = [];

// ============================
// SIMULAÇÃO (ESTÁVEL)
// ============================
function gerarValor() {
  return (Math.random() * 0.02 - 0.01);
}

// ============================
// LÓGICA IGUAL VBA
// ============================
function calcularSinal(valor, min, max, tipo) {
  if (valor >= min && valor <= max) return "n";

  if (tipo === "risco") {
    return valor > max ? "-" : "+";
  } else {
    return valor > max ? "+" : "-";
  }
}

// ============================
// ATUALIZAÇÃO
// ============================
function atualizar() {
  try {
    let snapshot = [];
    let forca = 0;

    ativos.forEach(a => {
      const valor = gerarValor();
      const sinal = calcularSinal(valor, a.min, a.max, a.tipo);

      snapshot.push({
        nome: a.nome,
        valor,
        sinal
      });

      if (sinal === "+") forca++;
      if (sinal === "-") forca--;
    });

    historico.push({
      data: new Date(),
      ativos: snapshot,
      forca
    });

    if (historico.length > 300) historico.shift();

  } catch (e) {
    console.log("Erro:", e.message);
  }
}

// roda a cada 5 min
setInterval(atualizar, 300000);
atualizar();

// ============================
// FRONT COMPLETO (DASHBOARD)
// ============================
app.get("/", (req, res) => {
  if (!historico.length) return res.send("Carregando...");

  const atual = historico[historico.length - 1];

  // gráfico simples (histórico)
  const grafico = historico.map(h => h.forca).join(",");

  res.send(`
  <html>
  <head>
    <title>Monitor Profissional</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
      body {
        font-family: Arial;
        background: #0f0f0f;
        color: #fff;
        padding: 20px;
      }

      h1 {
        text-align: center;
        font-size: 36px;
      }

      .card {
        background: #1a1a1a;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 20px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th, td {
        padding: 10px;
        text-align: center;
      }

      th {
        background: #222;
      }

      .positivo { color: #00ff88; }
      .negativo { color: #ff4d4d; }
      .neutro { color: #aaa; }

    </style>
  </head>

  <body>

    <h1>📊 Força do Mercado: ${atual.forca}</h1>

    <div class="card">
      <h2>Ativos</h2>
      <table>
        <tr>
          <th>Ativo</th>
          <th>Variação</th>
          <th>Sinal</th>
        </tr>

        ${atual.ativos.map(a => {
          let classe =
            a.sinal === "+" ? "positivo" :
            a.sinal === "-" ? "negativo" :
            "neutro";

          return `
          <tr>
            <td>${a.nome}</td>
            <td>${(a.valor * 100).toFixed(2)}%</td>
            <td class="${classe}">${a.sinal}</td>
          </tr>`;
        }).join("")}

      </table>
    </div>

    <div class="card">
      <h2>Histórico da Força</h2>
      <canvas id="grafico"></canvas>
    </div>

    <script>
      const ctx = document.getElementById('grafico');

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: [${historico.map((_, i) => i).join(",")}],
          datasets: [{
            label: 'Força',
            data: [${grafico}],
            borderWidth: 2
          }]
        }
      });
    </script>

  </body>
  </html>
  `);
});

// ============================
app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando");
});
