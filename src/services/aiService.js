const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY || ''
const MODEL = 'google/gemini-2.5-flash'
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

const headers = (key = OPENROUTER_KEY) => ({
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://match-way.durango.app',
  'X-Title': 'Match-Way Durango',
})

export async function generateRouteNarrative(likedBusinesses) {
  const list = likedBusinesses.map(b => `${b.name} (${b.category})`).join(', ')
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: `Guía turístico de Durango, México. Lugares que gustaron: ${list}.
Genera ruta narrativa en EXACTAMENTE 3 líneas numeradas con emoji. Solo las 3 líneas, sin texto extra.`,
      }],
    }),
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}

const AGENT_SYSTEM = `Eres TurisBot, guía turístico experto y amigable de Durango, Durango, México 🌵
Tu misión: recomendar 3 lugares perfectos al usuario.

REGLAS:
- Haz EXACTAMENTE una pregunta a la vez
- Orden obligatorio: 1) tiempo disponible → 2) tipo de experiencia → 3) compañía
- Tras las 3 respuestas, da las recomendaciones en el formato exacto de abajo
- Respuestas cortas, cálidas y con algún emoji

LUGARES DISPONIBLES con coordenadas:
• El Parián (Taquería, carnitas): 24.0277, -104.6532
• La Mezcalería del Centro (Mezcal, catas): 24.0295, -104.6545
• Talleres Tepehuana (Artesanías, bordados): 24.0255, -104.6520
• Tacos El Faisán (Taquería nocturna): 24.0312, -104.6510
• Casa del Aguardiente (Bar histórico, sotol): 24.0268, -104.6558
• Artesanías La Quijada (Cerámica y barro): 24.0245, -104.6570
• Birriería La Güera (Birria de chivo): 24.0322, -104.6500
• Mezcal El Agave Azul (Destilería, tours): 24.0240, -104.6525
• Taller de Mascadas (Mascadas vaqueras): 24.0298, -104.6555
• El Mesón del Coyote (Carne seca, arrachera): 24.0308, -104.6542

FORMATO RECOMENDACIONES (úsalo exacto):
🗺️ **Tu Ruta Perfecta en Durango:**

1. **[Nombre]** - [descripción en una línea]
2. **[Nombre]** - [descripción en una línea]
3. **[Nombre]** - [descripción en una línea]

✨ [Frase final motivadora de 1 línea]`

export async function chatWithAgent(messages, apiKey = OPENROUTER_KEY) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      temperature: 0.5,
      messages: [
        { role: 'system', content: AGENT_SYSTEM },
        ...messages,
      ],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('chatWithAgent error', res.status, body)
    throw new Error(`API Error ${res.status}: ${body}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

export async function getMapRecommendations(query, apiKey = OPENROUTER_KEY) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `Guía de Durango, México. Busca: "${query}". Responde SOLO JSON:
{"places":[{"name":"...","description":"...","lat":0.0,"lng":0.0,"category":"...","emoji":"..."}]}
Coordenadas: 24.024–24.033 N, 104.650–104.658 W. Solo JSON.`,
      }],
    }),
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  const data = await res.json()
  try {
    const text = data.choices[0].message.content
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch {
    /* ignore parse errors */
  }
  return { places: [] }
}
