import { useState, useEffect, useRef } from 'react'
import { chatWithAgent } from '../services/aiService'

const QUICK_TOPICS = [
  { icon: '🌮', label: 'Tacos tradicionales',    text: 'Quiero comer tacos tradicionales de Durango' },
  { icon: '🥃', label: 'Mezcal artesanal',       text: 'Recomiéndame un buen lugar para tomar mezcal artesanal' },
  { icon: '🎨', label: 'Arte y artesanías',       text: 'Me gustaría comprar artesanías típicas de Durango' },
  { icon: '📸', label: 'Lugares fotogénicos',     text: 'Busco los lugares más fotogénicos de Durango' },
  { icon: '💑', label: 'Cita romántica',          text: 'Tengo una cita romántica y quiero un lugar especial' },
  { icon: '👨‍👩‍👧', label: 'Plan familiar',          text: 'Voy con mi familia, incluidos niños. ¿Qué recomiendas?' },
  { icon: '🎭', label: 'Historia y cultura',      text: 'Quiero aprender sobre la historia y cultura de Durango' },
  { icon: '🌅', label: 'Tarde libre',             text: 'Tengo una tarde libre, ¿qué hago en Durango?' },
]

const INITIAL_MSG = {
  role: 'assistant',
  content: '¡Hola! Soy TurisBot, tu guía turístico experto de Durango 🌵\n\n¿Listo para descubrir lo mejor de la ciudad? Voy a hacerte unas preguntas rápidas para recomendarte los 3 lugares perfectos para ti.\n\n¿Cuánto tiempo tienes disponible para explorar hoy?',
  time: now(),
  isInitial: true,
}

function now() {
  return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatSection() {
  const [messages, setMessages]     = useState([INITIAL_MSG])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [dark, setDark]             = useState(false)
  const [apiKey, setApiKey]         = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [savedKey, setSavedKey]     = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg, time: now() }
    setMessages(p => [...p, userMsg])
    setLoading(true)

    try {
      // Build history: exclude UI-only fields and the seeded initial greeting
      const history = [...messages, userMsg]
        .filter(m => !m.isInitial)
        .map(({ role, content }) => ({ role, content }))
      const reply = await chatWithAgent(history, savedKey || undefined)
      setMessages(p => [...p, { role: 'assistant', content: reply, time: now() }])
    } catch (e) {
      setMessages(p => [...p, {
        role: 'error',
        content: e.message || 'Error desconocido',
        time: now(),
      }])
    }
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const newChat = () => {
    setMessages([{ ...INITIAL_MSG, time: now() }])
    setInput('')
  }

  return (
    <div className={`chat-section${dark ? ' dark' : ''}`}>
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">Match<span>Way</span></div>
          <div className="sidebar-sub">Agente Turístico IA · Durango</div>
        </div>

        <div className="sidebar-topics">
          <div className="sidebar-section-title">Nueva conversación</div>
          <button className="topic-btn" onClick={newChat} style={{ marginBottom: 8, color: '#E07840', fontWeight: 600 }}>
            <span className="topic-icon">✦</span> Nuevo chat
          </button>

          <div className="sidebar-section-title">Temas rápidos</div>
          {QUICK_TOPICS.map(t => (
            <button key={t.label} className="topic-btn" onClick={() => send(t.text)}>
              <span className="topic-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="apikey-toggle" onClick={() => setShowApiKey(p => !p)}>
            <span>🔑 API Key personalizada</span>
            <span>{showApiKey ? '▲' : '▼'}</span>
          </button>
          {showApiKey && (
            <div className="apikey-input-wrap">
              <input
                className="apikey-input"
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <button className="apikey-save" onClick={() => { setSavedKey(apiKey); setShowApiKey(false) }}>
                Guardar
              </button>
            </div>
          )}
          {savedKey && <div style={{ fontSize: 10, color: '#6A8761', marginTop: 4 }}>✓ API key personalizada activa</div>}
        </div>
      </aside>

      {/* Main chat */}
      <div className="chat-main">
        {/* Topbar */}
        <div className="chat-topbar">
          <div className="chat-avatar">🤖</div>
          <div className="chat-topbar-info">
            <div className="chat-topbar-name">TurisBot</div>
            <div className="chat-topbar-status">
              <div className="status-dot" />
              {loading ? 'Escribiendo…' : 'En línea'}
            </div>
          </div>
          <button className="darkmode-btn" onClick={() => setDark(p => !p)} title="Modo oscuro">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((m, i) => {
            if (m.role === 'error') {
              return (
                <div key={i} className="msg-error-row">
                  <span className="msg-error-icon">⚠️</span>
                  <div>
                    <div className="msg-error-label">Error de conexión</div>
                    <code className="msg-error-detail">{m.content}</code>
                  </div>
                </div>
              )
            }
            return (
              <div key={i} className={`msg-row ${m.role}`}>
                <div className="msg-avatar">{m.role === 'assistant' ? '🤖' : '👤'}</div>
                <div>
                  <div className="msg-bubble">
                    <FormattedMessage text={m.content} />
                  </div>
                  {m.time && <div className="msg-time">{m.time}</div>}
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="typing-row">
              <div className="msg-avatar" style={{ background: '#3D1E0E', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <div className="typing-bubble">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips (shown when few messages) */}
        {messages.length <= 2 && !loading && (
          <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_TOPICS.slice(0, 4).map(t => (
              <button
                key={t.label}
                onClick={() => send(t.text)}
                style={{
                  padding: '6px 12px', borderRadius: 20,
                  border: '1.5px solid #E0CDB0', background: 'white',
                  fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  color: '#5C3018', transition: 'border-color .15s, background .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.background = '#FFF5EE' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0CDB0'; e.currentTarget.style.background = 'white' }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-row">
            <textarea
              className="chat-textarea"
              rows={1}
              placeholder="Escribe tu mensaje…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
            <button className="btn-send" onClick={() => send()} disabled={!input.trim() || loading}>
              ➤
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#B08060', marginTop: 6, textAlign: 'center' }}>
            TurisBot · Powered by Gemini 2.5 Flash via OpenRouter
          </div>
        </div>
      </div>
    </div>
  )
}

function FormattedMessage({ text }) {
  const lines = text.split('\n')
  return (
    <div>
      {lines.map((line, i) => {
        // Numbered place lines: "1. **Name** - desc"
        const placeMatch = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*(.*)$/)
        if (placeMatch) {
          return (
            <div key={i} className="route-place" style={{ cursor: 'default' }}>
              <span className="route-place-num">{placeMatch[1]}.</span>
              <span>
                <strong>{placeMatch[2]}</strong>
                <span dangerouslySetInnerHTML={{ __html: placeMatch[3].replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
              </span>
            </div>
          )
        }

        // Section headers **bold**
        const boldOnly = line.match(/^\*\*(.+)\*\*$/)
        if (boldOnly) {
          return (
            <p key={i} style={{ fontWeight: 700, marginBottom: 4, marginTop: i > 0 ? 8 : 0 }}>
              {boldOnly[1]}
            </p>
          )
        }

        // Inline bold
        const withBold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        return (
          <p key={i}
            style={{ marginBottom: i < lines.length - 1 ? 4 : 0 }}
            dangerouslySetInnerHTML={{ __html: withBold || (i > 0 ? '&nbsp;' : '') }}
          />
        )
      })}
    </div>
  )
}
