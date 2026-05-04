import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.static("public"));

const API_KEY = process.env.API_KEY; // 🔒 seguro

const PORT = process.env.PORT || 3000;

// ===== ATIVOS =====
const ativos = [
  { nome: "S&P 500", symbol: "SPX", tipo: "risco" },
  { nome: "VIX", symbol: "VIX", tipo: "seguranca" },
  { nome: "Petróleo", symbol: "WTI", tipo: "risco" },
  { nome: "USD/BRL", symbol: "USD/BRL", tipo: "seguranca" }
];

// ===== PEGAR VARIAÇÃO =====
async function pegarVariacao(symbol) {
  try {
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${API_KEY}`;
    const { data } = await axios.get(url);
    return parseFloat(data.percent_change) || 0;
  } catch {
    return 0;
  }
}

// ===== CLASSIFICAÇÃO =====
function classificar(valor, tipo) {
  if (tipo === "risco") {
    if (valor < -0.3) return "Alta";
    if (valor > 0.3) return "Queda";
    return "Neutro";
  } else {
    if (valor < -0.3) return "Queda";
    if (valor > 0.3) return "Alta";
    return "Neutro";
  }
}

// ===== HISTÓRICO =====
function salvar(dado) {
  const path = "historico.json";
  let hist = [];

  if (fs.existsSync(path)) {
    hist = JSON.parse(fs.readFileSync(path));
  }

  hist.push(dado);

  if (hist.length > 500) hist.shift();

  fs.writeFileSync(path, JSON.stringify(hist, null, 2));
}

// ===== PEGAR HISTÓRICO =====
function getHistorico() {
  if (!fs.existsSync("historico.json")) return [];
  return JSON.parse(fs.readFileSync("historico.json"));
}

// ===== ROTA PRINCIPAL =====
app.get("/dados", async (req, res) => {
  let altas = 0;
  let baixas = 0;
  let neutros = 0;

  let lista = [];

  for (let ativo of ativos) {
    const variacao = await pegarVariacao(ativo.symbol);
    const sinal = classificar(variacao, ativo.tipo);

    if (sinal === "Alta") altas++;
    else if (sinal === "Queda") baixas++;
    else neutros++;

    lista.push({ nome: ativo.nome, variacao, sinal });
  }

  const forca = altas - baixas;

  const historico = getHistorico();
  const ultimaAceleracao = historico.length > 0 ? historico[historico.length - 1].aceleracao : 0;

  const aceleracao = ultimaAceleracao + forca;

  const dado = {
    hora: new Date().toLocaleTimeString(),
    altas,
    baixas,
    neutros,
    forca,
    aceleracao
  };

  salvar(dado);

  res.json({ resumo: dado, ativos: lista });
});

// ===== HISTÓRICO =====
app.get("/historico", (req, res) => {
  res.json(getHistorico());
});

app.listen(PORT, () => console.log("Servidor rodando"));
