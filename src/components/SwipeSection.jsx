import { useState, useEffect, useRef } from 'react'
import { businesses } from '../data/businesses'
import { generateRouteNarrative } from '../services/aiService'

const THRESHOLD = 80

export default function SwipeSection({ extraBusinesses = [] }) {
  const allCards = [...extraBusinesses, ...businesses]
  const [deck, setDeck] = useState(allCards)
  const [liked, setLiked] = useState([])
  const [disliked, setDisliked] = useState([])
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (!showResult) setDeck([...extraBusinesses, ...businesses])
  }, [extraBusinesses.length])

  const reset = () => {
    setDeck([...extraBusinesses, ...businesses])
    setLiked([])
    setDisliked([])
    setShowResult(false)
  }

  const onSwipe = (direction, card) => {
    if (direction === 'right') {
      const newLiked = [...liked, card]
      setLiked(newLiked)

      // ── MODO UBER: Si llega a 3 "Likes", salta directo a la ruta ──
      if (newLiked.length === 3) {
        setTimeout(() => setShowResult(true), 340) // Espera que termine la animación de salida
        return 
      }
    } else {
      setDisliked(p => [...p, card])
    }

    setDeck(p => {
      const next = p.slice(1)
      // Si se acaban las tarjetas antes de juntar los 3 likes, muestra el resultado con lo que tenga
      if (next.length === 0) {
        setTimeout(() => setShowResult(true), 340)
      }
      return next
    })
  }

  if (showResult) return <ResultScreen liked={liked} total={allCards.length} onReset={reset} />

  const topCard = deck[0]
  if (!topCard) return null

  return (
    <div className="swipe-v2">
      {/* Header */}
      <div className="swipe-v2-header">
        <h1 className="swipe-v2-title">Ruta Match</h1>
        <div className="swipe-v2-pills">
          <span className="v2-pill v2-pill-left">{deck.length} lugares</span>
          {/* El contador cambia de color o resalta al acercarse al objetivo de 3 */}
          <span className={`v2-pill v2-pill-right ${liked.length >= 2 ? 'target-reached' : ''}`}>
            ❤️ {liked.length}/3
          </span>
        </div>
      </div>

      {/* Card stack */}
      <div className="swipe-v2-stage">
        <div className="swipe-cards-inner">
          {deck.slice(1, 3).reverse().map((card, i) => (
            <div
              key={card.id}
              className="card-v2-ghost"
              style={{
                transform: `scale(${0.91 + i * 0.045}) translateY(${(2 - i) * 14}px)`,
                zIndex: i,
                backgroundImage: card.image ? `url(${card.image})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                background: card.image ? undefined : card.bgGradient,
              }}
            />
          ))}
          <SwipeCard key={topCard.id} card={topCard} onSwipe={onSwipe} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="swipe-v2-actions">
        <button
          className="btn-action btn-action-x"
          onClick={() => onSwipe('left', topCard)}
          aria-label="Pasar"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
            <line x1="3" y1="3" x2="17" y2="17" /><line x1="17" y1="3" x2="3" y2="17" />
          </svg>
        </button>

        <button
          className="btn-action btn-action-heart"
          onClick={() => onSwipe('right', topCard)}
          aria-label="Me gusta"
        >
          <svg width="26" height="24" viewBox="0 0 26 24" fill="white">
            <path d="M13 22S1 14.3 1 7.5A6 6 0 0 1 13 4.2 6 6 0 0 1 25 7.5C25 14.3 13 22 13 22z" />
          </svg>
        </button>
      </div>

      <p className="swipe-v2-hint">Elige 3 favoritos para armar tu recorrido</p>
    </div>
  )
}

/* ── Swipe Card (Se mantiene igual para cuidar tus físicas de arrastre) ── */
function SwipeCard({ card, onSwipe }) {
  const [dx, setDx]           = useState(0)
  const [dragging, setDragging] = useState(false)
  const [exiting, setExiting]   = useState(null)
  const startXRef = useRef(0)

  const triggerSwipe = (dir) => {
    if (exiting) return
    setExiting(dir)
    setTimeout(() => onSwipe(dir, card), 320)
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const x = e.touches ? e.touches[0].clientX : e.clientX
      setDx(x - startXRef.current)
    }
    const onUp = () => {
      setDragging(false)
      if (dx > THRESHOLD) triggerSwipe('right')
      else if (dx < -THRESHOLD) triggerSwipe('left')
      else setDx(0)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging, dx])

  const startDrag = (e) => {
    if (exiting) return
    startXRef.current = e.touches ? e.touches[0].clientX : e.clientX
    setDragging(true)
  }

  const activeDx  = exiting === 'right' ? 700 : exiting === 'left' ? -700 : dx
  const rotation  = activeDx * 0.07
  const progress  = Math.min(Math.abs(activeDx) / THRESHOLD, 1)
  const isLike    = activeDx > THRESHOLD * 0.4
  const isNope    = activeDx < -THRESHOLD * 0.4

  return (
    <div
      className="card-v2"
      style={{
        transform: `translateX(${activeDx}px) rotate(${rotation}deg)`,
        transition: exiting
          ? 'transform .32s cubic-bezier(.4,1,.4,1), opacity .28s'
          : dragging ? 'none' : 'transform .22s ease',
        opacity: exiting ? 0 : 1,
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      {card.image
        ? <img className="card-v2-bg" src={card.image} alt={card.name} draggable={false} />
        : (
          <div className="card-v2-bg card-v2-emoji-bg" style={{ background: card.bgGradient }}>
            <span className="card-v2-big-emoji">{card.emoji}</span>
          </div>
        )
      }

      <div className="card-v2-gradient" />

      <div className="card-v2-label card-v2-like-label" style={{ opacity: isLike ? progress : 0 }}>
        LIKE
      </div>
      <div className="card-v2-label card-v2-nope-label" style={{ opacity: isNope ? progress : 0 }}>
        NOPE
      </div>

      <div className="card-v2-rating">⭐ {card.rating}</div>

      <div className="card-v2-content">
        <span className="card-v2-category">{card.category.toUpperCase()}</span>
        <h2 className="card-v2-name">{card.name}</h2>
        {card.description && <p className="card-v2-desc">{card.description}</p>}
        <p className="card-v2-address">📍 {card.address}</p>
      </div>

      {card.isCustom && (
        <div className="card-v2-community">📍 Comunidad</div>
      )}
    </div>
  )
}

/* ── Result Screen (Autoejecución de la IA al entrar con 3 matches) ── */
function ResultScreen({ liked, total, onReset }) {
  const [route, setRoute]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  // Efecto Uber: Si el usuario llega aquí con 3 lugares, disparamos la IA en automático 
  useEffect(() => {
    if (liked.length === 3) {
      generateRoute()
    }
  }, [liked])

  const generateRoute = async () => {
    setLoading(true)
    setError('')
    try {
      const text = await generateRouteNarrative(liked)
      setRoute(text)
    } catch {
      setError('No se pudo optimizar la ruta de entrega. Intenta de nuevo.')
    }
    setLoading(false)
  }

  return (
    <div className="result-v2">
      <div className="result-v2-header">
        <h2 className="result-v2-title">Tu Ruta Optimizada</h2>
        <p className="result-v2-sub">
          {liked.length === 3 
            ? '¡Match perfecto! Combinamos tus 3 elecciones en una ruta continua.' 
            : `${liked.length} lugares seleccionados.`}
        </p>
      </div>

      {liked.length > 0 ? (
        <>
          <div className="result-v2-scroll-area">
            <div className="result-v2-scroll">
              {liked.map((b, index) => (
                <div key={b.id} className="result-v2-card" style={{ position: 'relative' }}>
                  {/* Número de parada tipo ruta Uber Eats */}
                  <span style={{
                    position: 'absolute', top: 6, left: 6, zIndex: 5,
                    background: '#000', color: '#fff', width: 20, height: 20,
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </span>
                  
                  <div className="result-v2-card-hero" style={{ background: b.image ? '#1a1a1a' : b.bgGradient }}>
                    {b.image
                      ? <img src={b.image} alt={b.name} className="result-v2-card-img" />
                      : <span className="result-v2-card-emoji">{b.emoji}</span>
                    }
                  </div>
                  <div className="result-v2-card-info">
                    <div className="result-v2-card-name">{b.name}</div>
                    <div className="result-v2-card-cat">{b.category}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Si entró con menos de 3 (porque se acabó el mazo), dejamos el botón manual */}
          {!route && !loading && liked.length < 3 && (
            <div className="result-v2-cta">
              <button className="btn-primary result-v2-btn" onClick={generateRoute}>
                🗺️ Generar mi ruta con IA
              </button>
            </div>
          )}

          {loading && (
            <div className="result-v2-loading">
              <div className="spinner" />
              <p>Calculando el orden óptimo de tu viaje…</p>
            </div>
          )}

          {route && (
            <div className="result-v2-route">
              <div className="result-v2-route-label">📋 Itinerario de Viaje</div>
              <p className="result-v2-route-text">{route}</p>
            </div>
          )}

          {error && <p className="result-v2-error">{error}</p>}
        </>
      ) : (
        <div className="result-v2-empty">
          No seleccionaste locales para tu parada.
        </div>
      )}

      <button className="btn-ghost result-v2-reset" onClick={onReset}>
        🔄 Cambiar destinos (Reiniciar)
      </button>
    </div>
  )
}