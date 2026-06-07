import { useState, useRef } from 'react'

const MAPS_KEY = 'AIzaSyAsYTSO5peyt3IodcajbYFTTN7e2MjDHRU'
const DURANGO  = { lat: 24.0277, lng: -104.6532 }

const CATEGORIES = [
  'Taquería', 'Mezcalería', 'Artesanías', 'Centro recreativo',
  'Bar / Cantina', 'Café / Restaurante', 'Hotel', 'Museo',
  'Parque / Naturaleza', 'Tienda', 'Otro',
]

const CAT_GRADIENT = {
  'Taquería':            'linear-gradient(135deg, #C4622D, #A0491F)',
  'Mezcalería':          'linear-gradient(135deg, #4A6741, #3A5231)',
  'Artesanías':          'linear-gradient(135deg, #8B4513, #6B3410)',
  'Centro recreativo':   'linear-gradient(135deg, #2980B9, #1A5F8A)',
  'Bar / Cantina':       'linear-gradient(135deg, #8E44AD, #6C3483)',
  'Café / Restaurante':  'linear-gradient(135deg, #D35400, #A84300)',
  'Hotel':               'linear-gradient(135deg, #1ABC9C, #148F77)',
  'Museo':               'linear-gradient(135deg, #795548, #5D4037)',
  'Parque / Naturaleza': 'linear-gradient(135deg, #27AE60, #1E8449)',
  'Tienda':              'linear-gradient(135deg, #F39C12, #D68910)',
  'Otro':                'linear-gradient(135deg, #7F8C8D, #5D6D7E)',
}

const CAT_COLOR = {
  'Taquería': '#C4622D', 'Mezcalería': '#4A6741', 'Artesanías': '#8B4513',
  'Centro recreativo': '#2980B9', 'Bar / Cantina': '#8E44AD',
  'Café / Restaurante': '#D35400', 'Hotel': '#1ABC9C', 'Museo': '#795548',
  'Parque / Naturaleza': '#27AE60', 'Tienda': '#F39C12', 'Otro': '#7F8C8D',
}

const CAT_EMOJI = {
  'Taquería': '🌮', 'Mezcalería': '🥃', 'Artesanías': '🎨',
  'Centro recreativo': '🌄', 'Bar / Cantina': '🍺',
  'Café / Restaurante': '☕', 'Hotel': '🏨', 'Museo': '🏛️',
  'Parque / Naturaleza': '🌿', 'Tienda': '🛍️', 'Otro': '📍',
}

const EMPTY = {
  nombre: '', categoria: '', descripcion: '',
  calificacion: '4.0', ubicacion: '', precio: '$$', horario: '',
}

async function geocodeAddress(address) {
  try {
    const q = encodeURIComponent(`${address}, Durango, México`)
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${MAPS_KEY}`
    )
    const data = await res.json()
    if (data.results?.[0]) {
      const { lat, lng } = data.results[0].geometry.location
      return { lat, lng }
    }
  } catch { /* fall through */ }
  return {
    lat: DURANGO.lat + (Math.random() - 0.5) * 0.018,
    lng: DURANGO.lng + (Math.random() - 0.5) * 0.018,
  }
}

export default function AddBusinessSection({ onAdd, businesses }) {
  const [form, setForm]         = useState(EMPTY)
  const [imageData, setImageData] = useState(null)
  const [imageName, setImageName] = useState('')
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState(false)
  const [errors, setErrors]     = useState({})
  const fileRef = useRef(null)

  const set = (field, value) =>
    setForm(p => ({ ...p, [field]: value }))

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = ev => setImageData(ev.target.result)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim())    e.nombre    = 'El nombre es obligatorio'
    if (!form.categoria)        e.categoria = 'Selecciona una categoría'
    if (!form.ubicacion.trim()) e.ubicacion = 'La ubicación es obligatoria'
    const r = parseFloat(form.calificacion)
    if (isNaN(r) || r < 1 || r > 5) e.calificacion = 'Entre 1.0 y 5.0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    const coords = await geocodeAddress(form.ubicacion)
    const cat = form.categoria

    const newBiz = {
      id: `custom-${Date.now()}`,
      name:        form.nombre.trim(),
      category:    cat,
      description: form.descripcion.trim(),
      rating:      parseFloat(parseFloat(form.calificacion).toFixed(1)),
      price:       form.precio,
      hours:       form.horario.trim() || 'Consultar',
      address:     form.ubicacion.trim(),
      tags:        [],
      emoji:       CAT_EMOJI[cat]  || '📍',
      color:       CAT_COLOR[cat]  || '#7F8C8D',
      bgGradient:  CAT_GRADIENT[cat] || 'linear-gradient(135deg,#7F8C8D,#5D6D7E)',
      lat:         coords.lat,
      lng:         coords.lng,
      image:       imageData || null,
      isCustom:    true,
    }

    onAdd(newBiz)
    setSaving(false)
    setSuccess(true)
    setForm(EMPTY)
    setImageData(null)
    setImageName('')
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="add-section">
      <div className="add-header">
        <h2 className="add-title">Agregar Negocio</h2>
        <p className="add-sub">Comparte un lugar especial de Durango con la comunidad</p>
      </div>

      {success && (
        <div className="add-success">
          ✅ ¡Negocio agregado! Aparecerá en Ruta Match y en el Mapa.
        </div>
      )}

      <form className="add-form" onSubmit={handleSubmit} noValidate>

        {/* Image upload */}
        <div className="field-group">
          <label className="field-label">Imagen</label>
          <div
            className={`image-drop${imageData ? ' has-image' : ''}`}
            onClick={() => fileRef.current?.click()}
          >
            {imageData ? (
              <>
                <img src={imageData} alt="preview" className="image-preview" />
                <div className="image-overlay">
                  <span>Cambiar imagen</span>
                </div>
              </>
            ) : (
              <div className="image-placeholder">
                <span className="image-icon">📷</span>
                <span className="image-hint">Toca para subir una foto</span>
                <span className="image-hint-sub">JPG, PNG o WEBP · máx 5 MB</span>
              </div>
            )}
          </div>
          {imageName && <span className="image-name">{imageName}</span>}
          <input
            ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImage}
          />
        </div>

        {/* Nombre */}
        <div className="field-group">
          <label className="field-label" htmlFor="nombre">
            Nombre <span className="required">*</span>
          </label>
          <input
            id="nombre" className={`field-input${errors.nombre ? ' error' : ''}`}
            placeholder="Ej. Mirador de Los Remedios"
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
          />
          {errors.nombre && <span className="field-error">{errors.nombre}</span>}
        </div>

        {/* Categoría */}
        <div className="field-group">
          <label className="field-label" htmlFor="categoria">
            Categoría <span className="required">*</span>
          </label>
          <div className="select-wrap">
            <select
              id="categoria"
              className={`field-select${errors.categoria ? ' error' : ''}`}
              value={form.categoria}
              onChange={e => set('categoria', e.target.value)}
            >
              <option value="">Seleccionar categoría…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {form.categoria && (
              <span className="cat-preview-badge" style={{ background: CAT_COLOR[form.categoria] }}>
                {CAT_EMOJI[form.categoria]} {form.categoria}
              </span>
            )}
          </div>
          {errors.categoria && <span className="field-error">{errors.categoria}</span>}
        </div>

        {/* Descripción */}
        <div className="field-group">
          <label className="field-label" htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion" className="field-textarea"
            rows={3}
            placeholder="Cuéntanos qué hace especial a este lugar…"
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
          />
        </div>

        {/* Calificación */}
        <div className="field-group">
          <label className="field-label">
            Calificación <span className="required">*</span>
          </label>
          <div className="rating-row">
            <span className="rating-display">
              {'⭐'.repeat(Math.round(parseFloat(form.calificacion) || 0))}
              <span className="rating-value">{parseFloat(form.calificacion).toFixed(1)}</span>
            </span>
            <input
              type="range" min="1" max="5" step="0.1"
              className="rating-slider"
              value={form.calificacion}
              onChange={e => set('calificacion', e.target.value)}
            />
            <div className="rating-range"><span>1.0</span><span>5.0</span></div>
          </div>
          {errors.calificacion && <span className="field-error">{errors.calificacion}</span>}
        </div>

        {/* Ubicación */}
        <div className="field-group">
          <label className="field-label" htmlFor="ubicacion">
            Ubicación <span className="required">*</span>
          </label>
          <input
            id="ubicacion" className={`field-input${errors.ubicacion ? ' error' : ''}`}
            placeholder="Ej. Cerro de Los Remedios s/n, Los Remedios, Durango, Dgo"
            value={form.ubicacion}
            onChange={e => set('ubicacion', e.target.value)}
          />
          <span className="field-hint">📍 La dirección se usará para posicionar el marcador en el mapa</span>
          {errors.ubicacion && <span className="field-error">{errors.ubicacion}</span>}
        </div>

        {/* Precio */}
        <div className="field-group">
          <label className="field-label">Precio</label>
          <div className="price-options">
            {['$', '$$', '$$$', '$$$$'].map(p => (
              <button
                key={p} type="button"
                className={`price-opt${form.precio === p ? ' selected' : ''}`}
                onClick={() => set('precio', p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Horario */}
        <div className="field-group">
          <label className="field-label" htmlFor="horario">Horario</label>
          <input
            id="horario" className="field-input"
            placeholder="Ej. 9:00 - 18:00"
            value={form.horario}
            onChange={e => set('horario', e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary btn-submit" disabled={saving}>
          {saving ? '📍 Geocodificando dirección…' : '➕ Agregar Negocio'}
        </button>
      </form>

      {/* Lista de negocios agregados */}
      {businesses.filter(b => b.isCustom).length > 0 && (
        <div className="custom-list">
          <h3 className="custom-list-title">Negocios agregados por la comunidad</h3>
          <div className="custom-grid">
            {businesses.filter(b => b.isCustom).map(b => (
              <div key={b.id} className="custom-card">
                <div className="custom-card-hero" style={{ background: b.image ? undefined : b.bgGradient }}>
                  {b.image
                    ? <img src={b.image} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 32 }}>{b.emoji}</span>
                  }
                </div>
                <div className="custom-card-body">
                  <div className="custom-card-cat" style={{ color: b.color }}>{b.category}</div>
                  <div className="custom-card-name">{b.name}</div>
                  <div className="custom-card-meta">⭐ {b.rating} · {b.price}</div>
                  <div className="custom-card-addr">📍 {b.address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
