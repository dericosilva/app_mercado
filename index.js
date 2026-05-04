const express = require("express");
const app = express();

// =============================
// CONFIG IGUAL SUA PLANILHA
// =============================
const ativos = [

  // RISCO (se subir = mercado positivo)
  { nome: "Minério de Ferro", tipo: "risco", min: -0.003, max: 0.003 },
  { nome: "Petróleo WTI", tipo: "risco", min: -0.001, max: 0.001 },
  { nome: "Nasdaq", tipo: "risco", min: -0.001, max: 0.001 },

  // PROTEÇÃO (se subir = mercado negativo)
  { nome: "VIX", tipo: "protecao", min: -0.005, max: 0.005 },
  { nome: "DXY", tipo: "protecao", min: -0.001, max: 0.001 },
  { nome: "USD/BRL", tipo: "protecao", min: -0.001, max: 0.001 }

];

let historico = [];

// =============================
// SIMULAÇÃO (estável)
// =============================
function gerarValor() {
  return (Math.random() * 0.02 - 0.01);
}

// =============================
// LÓGICA IGUAL VBA (CORRIGIDA)
// =============================
function calcularSinal(valor, min, max, tipo) {

  // neutro
  if (valor >= min && valor <= max) return "n";

  // =============================
  // RISCO
  // =============================
  if (tipo === "risco") {
    if (valor > max) return "+";   // sobe = positivo
    return "-";                    // cai = negativo
  }

  // =============================
  // PROTEÇÃO (invertido)
  // =============================
  if (tipo === "protecao") {
    if (valor > max) return "-";   // sobe = mercado ruim
    return "+";                    // cai = mercado bom
  }
}

// =============================
// ATUALIZAÇÃO
// =============================
function atualizar() {
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
}

// roda a cada 5 min
setInterval(atualizar, 300000);
atualizar();

// =============================
// FRONT PROFISSIONAL
// =============================
app.get("/", (req, res) => {

  const atual = historico[historico.length - 1];

  const grafico = historico.map(h => h.forca);

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
      }

      table {
        width: 100%;
        margin-top: 20px;
      }

      th, td {
        padding: 10px;
        text-align: center;
      }

      .positivo { color: #00ff88; }
      .negativo { color: #ff4d4d; }
      .neutro { color: #aaa; }

    </style>
  </head>

  <body>

    <h1>📊 Força do Mercado: ${atual.forca}</h1>

    <table border="1">
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

    <canvas id="grafico"></canvas>

    <script>
      new Chart(document.getElementById('grafico'), {
        type: 'line',
        data: {
          labels: ${JSON.stringify(grafico.map((_, i) => i))},
          datasets: [{
            label: 'Força',
            data: ${JSON.stringify(grafico)},
            borderWidth: 2
          }]
        }
      });
    </script>

  </body>
  </html>
  `);
});

// =============================
app.listen(process.env.PORT || 3000, () => {
  console.log("Rodando...");
});
