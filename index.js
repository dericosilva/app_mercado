const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

let historico = [];

function calcularSinal(atual, anterior) {
  const min = -0.001;
  const max = 0.001;

  const dif = atual - anterior;

  if (dif >= min && dif <= max) return "n";
  if (dif > max) return "-";
  return "+";
}

async function getMinerio() {
  try {
    const { data } = await axios.get("https://finance.sina.com.cn/futures/quotes/I0.shtml?from=wap");
    const $ = cheerio.load(data);

    const texto = $("span").filter((i, el) =>
      $(el).text().includes("%")
    ).first().text();

    return parseFloat(texto.replace("%", "").replace(",", "."));
  } catch {
    return 0;
  }
}

app.get("/", (req, res) => {
  let forca = 0;

  historico.forEach(d => {
    if (d.sinal === "+") forca++;
    if (d.sinal === "-") forca--;
  });

  const lista = historico.map(d => {
    let cor = d.sinal === "+" ? "green" : d.sinal === "-" ? "red" : "gray";
    return `<li style="color:${cor}; font-size:18px">${d.sinal}</li>`;
  }).join("");

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
        text-align: center;
      }

      h1 {
        font-size: 40px;
        margin-bottom: 10px;
      }

      h2 {
        margin-top: 30px;
        color: #ccc;
      }

      .sinais {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
      }

      .sinal {
        font-size: 22px;
        font-weight: bold;
        padding: 8px 12px;
        border-radius: 6px;
      }

      .positivo { background: #003322; color: #00ff88; }
      .negativo { background: #330000; color: #ff4d4d; }
      .neutro   { background: #333; color: #aaa; }

    </style>
  </head>
  <body>

    <h1>📊 Força do Mercado: ${forca}</h1>

    <h2>Últimos sinais</h2>

    <div class="sinais">
      ${historico.map(d => {
        let classe =
          d.sinal === "+" ? "positivo" :
          d.sinal === "-" ? "negativo" :
          "neutro";

        return `<div class="sinal ${classe}">${d.sinal}</div>`;
      }).join("")}
    </div>

  </body>
  </html>
`);
});
