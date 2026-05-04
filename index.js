import express from "express"
import axios from "axios"
import fs from "fs"
import cors from "cors"

const app = express()
app.use(cors())

const PORT = process.env.PORT || 3000

// 🔑 SUA API KEY
const API_KEY = "ef0aaaf916ba40678dc81ce4ae0ab0e0"

// 📊 ATIVOS (exemplo - você pode expandir depois)
const ativos = [
  "PETR4.SA",
  "VALE3.SA",
  "ITUB4.SA",
  "BBDC4.SA",
  "WIN$N",
  "WDO$N"
]

// 🧠 HISTÓRICO
let historico = []

// 📂 carregar histórico salvo
if (fs.existsSync("historico.json")) {
  historico = JSON.parse(fs.readFileSync("historico.json"))
}

// 💾 salvar histórico
function salvarHistorico() {
  fs.writeFileSync("historico.json", JSON.stringify(historico, null, 2))
}

// 🔍 classificar ativo (igual sua lógica do Excel)
function classificar(variacao) {
  if (variacao <= -0.3) return "Alta"
  if (variacao >= 0.3) return "Queda"
  return "Neutro"
}

// 📡 buscar dados de um ativo
async function buscarAtivo(symbol) {
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&outputsize=2&apikey=${API_KEY}`
    const response = await axios.get(url)

    const valores = response.data.values

    if (!valores || valores.length < 2) return null

    const atual = parseFloat(valores[0].close)
    const anterior = parseFloat(valores[1].close)

    const variacao = ((atual - anterior) / anterior) * 100

    return classificar(variacao)

  } catch (err) {
    console.error("Erro ativo:", symbol)
    return null
  }
}

// 🧠 coleta geral
async function coletarDados() {
  try {
    let alta = 0
    let baixa = 0
    let neutro = 0

    for (let ativo of ativos) {
      const resultado = await buscarAtivo(ativo)

      if (resultado === "Alta") alta++
      else if (resultado === "Queda") baixa++
      else neutro++
    }

    const forca = alta - baixa

    let aceleracao = forca
    if (historico.length > 0) {
      aceleracao += historico[historico.length - 1].aceleracao
    }

    const dados = {
      time: new Date().toISOString(),
      alta,
      baixa,
      neutro,
      forca,
      aceleracao
    }

    historico.push(dados)

    // limitar histórico
    if (historico.length > 1000) {
      historico.shift()
    }

    salvarHistorico()

    console.log("OK:", dados)

  } catch (err) {
    console.error("Erro geral:", err.message)
  }
}

// ⏱️ roda automático (1 min)
setInterval(coletarDados, 60000)

// 🚀 ENDPOINTS

// tempo real
app.get("/dados", (req, res) => {
  if (historico.length === 0) return res.json({})
  res.json(historico[historico.length - 1])
})

// histórico completo
app.get("/historico", (req, res) => {
  res.json(historico)
})

// 🔥 BACKFILL (últimos minutos)
app.get("/backfill", async (req, res) => {
  try {
    const symbol = "PETR4.SA"

    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&outputsize=100&apikey=${API_KEY}`
    const response = await axios.get(url)

    res.json(response.data.values)

  } catch (err) {
    res.status(500).json({ erro: "backfill falhou" })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
