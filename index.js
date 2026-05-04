const express = require("express");
const axios = require("axios");

const app = express();

let historico = [];

// ============================
// CONFIG ATIVOS (igual planilha)
// ============================
const ativos = [
  { nome: "Minério de Ferro", tipo: "risco", min: -0.003, max: 0.003 },
  { nome: "S&P 500 VIX", tipo: "protecao", min: -0.005, max: 0.005 },
  { nome: "USD/BRL", tipo: "protecao", min: -0.001, max: 0.001 },
  { nome: "Petróleo WTI", tipo: "risco", min: -0.001, max: 0.001 }
];

// ============================
// SIMULAÇÃO DADOS (depois trocamos por API real)
// ============================
function gerarValor() {
  return (Math.random() * 0.02 - 0.01); // -1% a +1%
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
async function atualizar() {
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

    if (historico.length > 200) historico.shift();

    console.log("Atualizado:", forca);

  } catch (erro) {
    console.log("Erro:", erro.message);
  }
}

// roda a cada 5 min
setInterval(atualizar, 300000);
atualizar();

// ============================
// FRONT
// ============================
app.get("/", (req, res) => {
  if (historico.length === 0) {
    return res.send("Carregando...");
  }

  const ultimo = historico[historico.length - 1];

  res.send(`
  <html>
  <head>
    <title>Monitor de Mercado</title>
    <style>
      body {
        font-family: Arial;
        background: #0f0f0f;
        color: #fff;
        padding: 30px;
      }

      h1 {
        text-align: center;
        font-size: 40px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 30px;
      }

      th, td {
        padding: 10px;
        text-align: center;
      }

      th {
        background: #222;
      }

      tr:nth-child(even) {
        background: #1a1a1a;
      }

      .positivo { color: #00ff88; }
      .negativo { color: #ff4d4d; }
      .neutro { color: #aaa; }

    </style>
  </head>
  <body>

    <h1>📊 Força do Mercado: ${ultimo.forca}</h1>

    <table>
      <tr>
        <th>Ativo</th>
        <th>Variação</th>
        <th>Sinal</th>
      </tr>

      ${ultimo.ativos.map(a => {
        let classe =
          a.sinal === "+" ? "positivo" :
          a.sinal === "-" ? "negativo" :
          "neutro";

        return `
          <tr>
            <td>${a.nome}</td>
            <td>${(a.valor * 100).toFixed(2)}%</td>
            <td class="${classe}">${a.sinal}</td>
          </tr>
        `;
      }).join("")}

    </table>

  </body>
  </html>
  `);
});

// ============================
app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando");
});
