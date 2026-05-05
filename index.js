import express from "express"
import cors from "cors"
import axios from "axios"

const app = express()
app.use(cors())
app.use(express.static("public"))

const PORT = process.env.PORT || 3000
const API_KEY = "ef0aaaf916ba40678dc81ce4ae0ab0e0"

let historico = []
let ultimaAceleracao = 0
let ultimoTimestamp = null

// 🔥 SIMULA MICRO MOVIMENTOS (igual Excel)
function analisarCandle(open, close, high, low) {
  const movimentos = 30 // granularidade (ajusta aqui se quiser)

  let alta = 0
  let baixa = 0
  let neutro = 0

  const range = high - low

  for (let i = 0; i < movimentos; i++) {
    const pontoAnterior = low + (range * i) / movimentos
    const pontoAtual = low + (range * (i + 1)) / movimentos

    if (pontoAtual > pontoAnterior) alta++
    else if (pontoAtual < pontoAnterior) baixa++
    else neutro++
  }

  return { alta, baixa, neutro }
}

// 🔄 BUSCA REAL (5 MIN)
async function buscarDados() {
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=USD/BRL&interval=5min&outputsize=1&apikey=${API_KEY}`

    const response = await axios.get(url)
    const dados = response.data.values?.[0]

    if (!dados) return null

    if (dados.datetime === ultimoTimestamp) return null
    ultimoTimestamp = dados.datetime

    const open = parseFloat(dados.open)
    const close = parseFloat(dados.close)
    const high = parseFloat(dados.high)
    const low = parseFloat(dados.low)

    // 🔥 AQUI FICA FIEL AO EXCEL
    const { alta, baixa, neutro } = analisarCandle(open, close, high, low)

    const forca = alta - baixa
    const aceleracao = ultimaAceleracao + forca
    ultimaAceleracao = aceleracao

    const registro = {
      time: dados.datetime,
      alta,
      baixa,
      neutro,
      forca,
      aceleracao
    }

    historico.push(registro)

    if (historico.length > 500) historico.shift()

    return registro

  } catch (err) {
    console.log("Erro:", err.message)
    return null
  }
}

// ⏱ VERIFICA A CADA 1 MIN (mas só salva candle novo)
setInterval(buscarDados, 60000)

// 📊 ENDPOINTS
app.get("/dados", async (req, res) => {
  const dado = await buscarDados()
  res.json(dado || {})
})

app.get("/historico", (req, res) => {
  res.json(historico)
})

app.get("/backfill", async (req, res) => {
  historico = []
  ultimaAceleracao = 0

  for (let i = 0; i < 100; i++) {
    await buscarDados()
  }

  res.json({ status: "ok", total: historico.length })
})

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/public/index.html")
})

app.listen(PORT, () => {
  console.log("Servidor rodando")
})
    
