import express from "express"
import cors from "cors"
import axios from "axios"

const app = express()
app.use(cors())
app.use(express.static("public"))

const PORT = process.env.PORT || 3000

// 🔑 SUA API KEY
const API_KEY = "ef0aaaf916ba40678dc81ce4ae0ab0e0"

// 📊 HISTÓRICO EM MEMÓRIA
let historico = []

// 📈 VARIÁVEIS DE CONTROLE
let ultimaForca = 0
let ultimaAceleracao = 0

// 🔄 BUSCA DADOS DO MERCADO (WDO via USD/BRL proxy)
async function buscarDados() {
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=USD/BRL&interval=1min&apikey=${API_KEY}`
    
    const response = await axios.get(url)

    const dados = response.data.values?.[0]

    if (!dados) return null

    const open = parseFloat(dados.open)
    const close = parseFloat(dados.close)

    let alta = 0
    let baixa = 0
    let neutro = 0

    if (close > open) alta = 1
    else if (close < open) baixa = 1
    else neutro = 1

    // 🔥 FORÇA (igual Excel: Alta - Baixa)
    let forca = alta - baixa

    // 🔥 ACELERAÇÃO (acumulado)
    let aceleracao = ultimaAceleracao + forca

    ultimaForca = forca
    ultimaAceleracao = aceleracao

    const registro = {
      time: new Date().toISOString(),
      alta,
      baixa,
      neutro,
      forca,
      aceleracao
    }

    historico.push(registro)

    // mantém últimos 500 pontos
    if (historico.length > 500) historico.shift()

    return registro

  } catch (err) {
    console.log("Erro ao buscar dados:", err.message)
    return null
  }
}

// ⏱ COLETA AUTOMÁTICA (a cada 10 segundos)
setInterval(buscarDados, 10000)

// 📊 ENDPOINT TEMPO REAL
app.get("/dados", async (req, res) => {
  const dado = await buscarDados()
  res.json(dado || {})
})

// 📚 ENDPOINT HISTÓRICO
app.get("/historico", (req, res) => {
  res.json(historico)
})

// ⏪ BACKFILL (simula histórico inicial)
app.get("/backfill", async (req, res) => {
  historico = []
  ultimaAceleracao = 0

  for (let i = 0; i < 50; i++) {
    await buscarDados()
  }

  res.json({ status: "backfill completo", total: historico.length })
})

// 🏠 ROOT
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html")
})

// 🚀 START
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
