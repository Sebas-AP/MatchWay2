import { useState, useEffect, useRef } from 'react'
import { businesses } from '../data/businesses'
import { chatWithAgent } from '../services/aiService'

const MAPS_KEY = 'AIzaSyAsYTSO5peyt3IodcajbYFTTN7e2MjDHRU'
const DURANGO = { lat: 24.0277, lng: -104.6532 }

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const CAT_COLOR = {
  'Taquería':            '#C4622D',
  'Mezcalería':          '#4A6741',
  'Artesanías':          '#8B4513',
  'Centro recreativo':   '#2980B9',
  'Bar / Cantina':       '#8E44AD',
  'Café / Restaurante':  '#D35400',
  'Hotel':               '#1ABC9C',
  'Museo':               '#795548',
  'Parque / Naturaleza': '#27AE60',
  'Tienda':              '#F39C12',
  'Otro':                '#7F8C8D',
}

function markerSvg(color, emoji) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg width="42" height="52" viewBox="0 0 42 52" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 0C9.4 0 0 9.4 0 21c0 15.5 21 31 21 31S42 36.5 42 21C42 9.4 32.6 0 21 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="21" cy="21" r="13" fill="white" fill-opacity="0.92"/>
      <text x="21" y="27" text-anchor="middle" font-size="16" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${emoji}</text>
    </svg>`
  )}`
}

let scriptLoading = false

function loadMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return }
    if (scriptLoading) {
      const poll = setInterval(() => {
        if (window.google?.maps) { clearInterval(poll); resolve() }
      }, 100)
      return
    }
    scriptLoading = true
    window.__mapsReady = resolve
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&callback=__mapsReady`
    s.async = true
    s.onerror = reject
    document.head.appendChild(s)
  })
}

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f5f0e8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f0e8' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#3d1e0e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e8d5b0' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#d4c4a0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#c8b890' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b8d4c8' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c8d8b0' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
]

export default function MapsSection({ extraBusinesses = [] }) {
  const allBiz = [...extraBusinesses, ...businesses]

  const mapDivRef  = useRef(null)
  const mapRef     = useRef(null)
  const markersRef = useRef({})
  const circleRef  = useRef(null)
  const infoRef    = useRef(null)

  const [mapsReady, setMapsReady] = useState(false)
  const [mapError, setMapError]   = useState(false)
  const [radius, setRadius]       = useState(5)
  const [panelOpen, setPanelOpen] = useState(false)
  const [messages, setMessages]   = useState([
    { role: 'assistant', content: '¡Hola! Soy tu guía de Durango 🌵 ¿Qué tipo de lugar buscas hoy?', isInitial: true }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [savedKey, setSavedKey] = useState('')
  const [apiKey, setApiKey]   = useState('')

  useEffect(() => {
    loadMapsScript()
      .then(() => setMapsReady(true))
      .catch(() => setMapError(true))
  }, [])

  // Helper: add a single marker to the map
  const addMarker = (biz) => {
    if (!mapRef.current || markersRef.current[biz.id]) return
    const G = window.google
    const color = CAT_COLOR[biz.category] || '#7F8C8D'
    const marker = new G.maps.Marker({
      position: { lat: biz.lat, lng: biz.lng },
      map: mapRef.current,
      title: biz.name,
      icon: {
        url: markerSvg(color, biz.emoji),
        scaledSize: new G.maps.Size(42, 52),
        anchor: new G.maps.Point(21, 52),
      },
    })
    marker.addListener('click', () => {
      infoRef.current?.setContent(
        `<div class="info-popup">
          <div class="info-popup-emoji">${biz.emoji}</div>
          <div class="info-popup-name">${biz.name}</div>
          <div class="info-popup-cat">${biz.category}${biz.isCustom ? ' · 📍 Comunidad' : ''}</div>
          <div class="info-popup-meta">⭐ ${biz.rating} · ${biz.price} · ${biz.hours}</div>
          <div class="info-popup-meta" style="margin-top:4px">📍 ${biz.address}</div>
        </div>`
      )
      infoRef.current?.open(mapRef.current, marker)
    })
    markersRef.current[biz.id] = marker
  }

  // Init map with default businesses
  useEffect(() => {
    if (!mapsReady || !mapDivRef.current || mapRef.current) return
    const G = window.google
    mapRef.current = new G.maps.Map(mapDivRef.current, {
      center: DURANGO, zoom: 15,
      styles: MAP_STYLES,
      mapTypeControl: false, streetViewControl: false,
      fullscreenControl: false, zoomControl: true,
    })
    infoRef.current = new G.maps.InfoWindow()
    circleRef.current = new G.maps.Circle({
      map: mapRef.current, center: DURANGO,
      radius: radius * 1000,
      strokeColor: '#C4622D', strokeOpacity: .7, strokeWeight: 2,
      fillColor: '#C4622D', fillOpacity: .04,
    })
    businesses.forEach(addMarker)
  }, [mapsReady])

  // Add markers for new custom businesses as they arrive
  useEffect(() => {
    if (!mapsReady) return
    extraBusinesses.forEach(addMarker)
  }, [mapsReady, extraBusinesses.length])

  // Update marker visibility + circle when radius changes
  useEffect(() => {
    if (!mapRef.current) return
    allBiz.forEach(biz => {
      const dist = haversine(DURANGO.lat, DURANGO.lng, biz.lat, biz.lng)
      markersRef.current[biz.id]?.setVisible(dist <= radius)
    })
    circleRef.current?.setRadius(radius * 1000)
  }, [radius, mapsReady, extraBusinesses.length])

  const highlightBusiness = (name) => {
    const biz = allBiz.find(b => b.name.toLowerCase().includes(name.toLowerCase()))
    if (!biz || !mapRef.current) return
    const marker = markersRef.current[biz.id]
    if (marker) {
      marker.setVisible(true)
      mapRef.current.panTo({ lat: biz.lat, lng: biz.lng })
      mapRef.current.setZoom(16)
      setTimeout(() => {
        infoRef.current?.setContent(
          `<div class="info-popup">
            <div class="info-popup-emoji">${biz.emoji}</div>
            <div class="info-popup-name">${biz.name}</div>
            <div class="info-popup-cat">${biz.category}</div>
            <div class="info-popup-meta">⭐ ${biz.rating} · ${biz.price}</div>
          </div>`
        )
        infoRef.current?.open(mapRef.current, marker)
      }, 300)
    }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg = { role: 'user', content: text }
    setMessages(p => [...p, userMsg])
    setInput('')
    setLoading(true)
    try {
      const history = [...messages, userMsg]
        .filter(m => !m.isInitial)
        .map(({ role, content }) => ({ role, content }))
      const reply = await chatWithAgent(history, savedKey || undefined)
      setMessages(p => [...p, { role: 'assistant', content: reply }])
      allBiz.forEach(b => {
        if (reply.toLowerCase().includes(b.name.toLowerCase())) {
          highlightBusiness(b.name)
        }
      })
    } catch (e) {
      console.error('MapsSection chatWithAgent error:', e)
      const detail = e?.message?.includes('402') ? 'Sin créditos en la API key. Usa una API key personalizada abajo.' :
                     e?.message?.includes('401') ? 'API key inválida. Usa una API key personalizada abajo.' :
                     e?.message?.includes('429') ? 'Límite de peticiones alcanzado. Espera un momento.' :
                     'Error al conectar con el agente. Intenta de nuevo 🙏'
      setMessages(p => [...p, { role: 'assistant', content: detail }])
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const visibleCount = allBiz.filter(b =>
    haversine(DURANGO.lat, DURANGO.lng, b.lat, b.lng) <= radius
  ).length

  return (
    <div className="maps-section">
      <div className="map-container">
        {mapError && (
          <div className="map-loading">
            <span style={{ fontSize: 48 }}>⚠️</span>
            <p>No se pudo cargar Google Maps.<br />Verifica la API key.</p>
          </div>
        )}
        {!mapError && !mapsReady && (
          <div className="map-loading">
            <div className="spinner" style={{ borderTopColor: '#C4622D' }} />
            <p>Cargando mapa de Durango…</p>
          </div>
        )}
        <div ref={mapDivRef} className="map-div" style={{ display: mapsReady && !mapError ? 'block' : 'none' }} />

        {mapsReady && (
          <div className="map-controls">
            <div className="radius-card">
              <div className="radius-label">RADIO DE BÚSQUEDA</div>
              <div>
                <span className="radius-value">{radius}</span>
                <span className="radius-unit">km · {visibleCount} lugares</span>
              </div>
              <input
                type="range" min="1" max="50" value={radius}
                className="radius-slider"
                onChange={e => setRadius(Number(e.target.value))}
              />
              <div className="radius-range"><span>1 km</span><span>50 km</span></div>
            </div>
            <div className="map-legend">
              <div className="legend-title">CATEGORÍAS</div>
              {Object.entries(CAT_COLOR).slice(0, 5).map(([cat, color]) => (
                <div key={cat} className="legend-item">
                  <div className="legend-dot" style={{ background: color }} />
                  {cat}
                </div>
              ))}
              {extraBusinesses.length > 0 && (
                <div className="legend-item" style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid #E0CDB0' }}>
                  <div className="legend-dot" style={{ background: '#555', border: '2px solid #C4622D' }} />
                  <span style={{ fontWeight: 600 }}>Comunidad ({extraBusinesses.length})</span>
                </div>
              )}
            </div>
          </div>
        )}

        {mapsReady && (
          <div className="map-agent-toggle">
            <button className="btn-agent-toggle" onClick={() => setPanelOpen(true)}>
              🤖 Preguntar al Agente
            </button>
          </div>
        )}
      </div>

      {panelOpen && (
        <div className="map-panel-overlay" onClick={e => { if (e.target === e.currentTarget) setPanelOpen(false) }}>
          <div className="map-panel">
            <div className="panel-handle" />
            <div className="panel-header">
              <span className="panel-title">🤖 Guía Turístico IA</span>
              <button className="btn-close" onClick={() => setPanelOpen(false)}>✕</button>
            </div>
            <div className="panel-messages">
              {messages.map((m, i) => (
                <div key={i} className={`msg-row ${m.role}`}>
                  <div className="msg-avatar">{m.role === 'assistant' ? '🤖' : '👤'}</div>
                  <div className="msg-bubble" style={{ fontSize: 13 }}>
                    <FormattedMsg text={m.content} onPlaceClick={highlightBusiness} />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="typing-row">
                  <div className="msg-avatar" style={{ background: '#3D1E0E', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</div>
                  <div className="typing-bubble">
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                  </div>
                </div>
              )}
            </div>
            <div className="panel-input-row">
              <textarea
                rows={1} className="chat-textarea"
                placeholder="Escribe tu pregunta…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                style={{ minHeight: 40 }}
              />
              <button className="btn-send" onClick={send} disabled={!input.trim() || loading}>➤</button>
            </div>
            <div style={{ padding: '6px 12px 10px', borderTop: '1px solid #EDE0CC' }}>
              <details>
                <summary style={{ fontSize: 11, color: '#B08060', cursor: 'pointer' }}>🔑 API Key personalizada</summary>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    style={{ flex: 1, fontSize: 11, padding: '4px 8px', border: '1px solid #E0CDB0', borderRadius: 6 }}
                  />
                  <button
                    onClick={() => setSavedKey(apiKey)}
                    style={{ fontSize: 11, padding: '4px 10px', background: '#C4622D', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  >
                    OK
                  </button>
                </div>
                {savedKey && <div style={{ fontSize: 10, color: '#6A8761', marginTop: 4 }}>✓ API key activa</div>}
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FormattedMsg({ text, onPlaceClick }) {
  const parts = text.split('\n')
  return (
    <div>
      {parts.map((line, i) => {
        const placeMatch = line.match(/^\d+\.\s+\*\*(.+?)\*\*(.*)$/)
        if (placeMatch) {
          const name = placeMatch[1]
          const rest = placeMatch[2]
          return (
            <div key={i} className="route-place" onClick={() => onPlaceClick?.(name)} title="Ver en mapa">
              <span className="route-place-num">{line.match(/^\d+/)?.[0]}.</span>
              <span><strong>{name}</strong>{rest}</span>
            </div>
          )
        }
        const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        return (
          <p key={i} style={{ marginBottom: i < parts.length - 1 ? 4 : 0 }}
            dangerouslySetInnerHTML={{ __html: boldLine || '&nbsp;' }}
          />
        )
      })}
    </div>
  )
}
