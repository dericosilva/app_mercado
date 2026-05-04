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

async function atualizar() {
  const valor = await getMinerio();

  const anterior = historico.length ? historico.at(-1).valor : valor;
  const sinal = calcularSinal(valor, anterior);

  historico.push({ valor, sinal, data: new Date() });

  if (historico.length > 200) historico.shift();
}

setInterval(atualizar, 300000);
atualizar();

app.get("/", (req, res) => {
  let forca = 0;

  historico.forEach(d => {
    if (d.sinal === "+") forca++;
    if (d.sinal === "-") forca--;
  });

  res.send(`
    <h1>Força: ${forca}</h1>
    <ul>
      ${historico.map(d => `<li>${d.sinal}</li>`).join("")}
    </ul>
  `);
});

app.listen(process.env.PORT || 3000);
