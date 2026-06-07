# MatchWay — Plataforma Turística IA para Durango, México

## Descripción general

MatchWay es una aplicación web de turismo inteligente enfocada en Durango, Durango, México. Combina una interfaz de estilo Tinder para descubrir lugares locales, un mapa interactivo con agente IA, un chat turístico conversacional y un sistema comunitario para agregar negocios. El diseño sigue una paleta cálida inspirada en la identidad visual de Durango — terracota, agave y adobe — con una estética tipo Uber/Uber Eats.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 |
| Estilos | CSS puro con design tokens (`--variable`) en `:root` |
| Mapa | Google Maps JavaScript API v3 |
| IA | OpenRouter API → modelo `google/gemini-2.5-flash` |
| Persistencia | `localStorage` (negocios de la comunidad) |
| Geocodificación | Google Geocoding API |
| Entorno | Variables de entorno vía `VITE_OPENROUTER_KEY` en `.env` |

No hay backend, base de datos ni autenticación. Todo corre en el navegador.

---

## Estructura del proyecto

```
match-way/
├── src/
│   ├── App.jsx                        # Shell principal: tabs, estado global, localStorage
│   ├── main.jsx                       # Punto de entrada React
│   ├── index.css                      # Todos los estilos (design tokens + componentes)
│   ├── components/
│   │   ├── SwipeSection.jsx           # Tab "Ruta Match" — swipe + pantalla de resultado
│   │   ├── MapsSection.jsx            # Tab "Mapa" — Google Maps + panel de agente
│   │   ├── ChatSection.jsx            # Tab "Agente IA" — chat completo con TurisBot
│   │   └── AddBusinessSection.jsx     # Tab "Agregar" — formulario comunitario
│   ├── data/
│   │   └── businesses.js              # 10 negocios predefinidos de Durango
│   └── services/
│       └── aiService.js               # Capa de acceso a OpenRouter (3 funciones)
├── .env                               # VITE_OPENROUTER_KEY (no commiteado)
├── .gitignore
└── package.json
```

---

## Secciones de la aplicación

### 1. Ruta Match (`SwipeSection`)

Interfaz de swipe estilo Tinder para descubrir lugares turísticos de Durango.

**Flujo de usuario:**
1. Se presentan tarjetas apiladas de negocios (imagen o gradiente + emoji de categoría)
2. El usuario arrastra a la derecha (❤️ like) o a la izquierda (✕ pasar)
3. Al acumular **3 likes**, la pantalla avanza automáticamente a la ruta optimizada
4. Si se acaba el mazo antes de 3 likes, se muestra el resultado con lo que haya

**Pantalla de resultado:**
- Lista numerada de los lugares elegidos con foto/emoji
- Llamada automática a la IA al entrar con exactamente 3 matches
- La IA genera un itinerario narrativo en 3 líneas con el orden óptimo de visita
- Botón manual "Generar mi ruta con IA" si el mazo se terminó con menos de 3

**Físicas de arrastre:**
- Umbral de 80 px para activar el swipe
- Etiquetas "LIKE" / "NOPE" con opacidad proporcional al desplazamiento
- Rotación suave proporcional al drag horizontal
- Animación de salida a 700 px en 320 ms

---

### 2. Mapa (`MapsSection`)

Mapa interactivo de Durango con marcadores personalizados y agente IA contextual.

**Características del mapa:**
- Estilo visual cálido personalizado (fondo arena, calles beige, agua turquesa)
- Marcadores SVG con pin de gota de agua, color por categoría y emoji en el centro
- InfoWindow al hacer clic en un marcador (nombre, categoría, rating, precio, horario, dirección)
- Círculo de radio ajustable centrado en el zócalo de Durango (coordenadas: 24.0277, -104.6532)
- Filtro por radio de 1 a 50 km; los marcadores fuera del radio se ocultan automáticamente
- Los negocios de la comunidad aparecen automáticamente como marcadores adicionales

**Controles del mapa:**
- Tarjeta de radio con slider: muestra el número de lugares visibles en tiempo real
- Leyenda de categorías (primeras 5 + contador de negocios comunitarios si los hay)

**Panel del agente IA:**
- Botón flotante "🤖 Preguntar al Agente" sobre el mapa
- Panel deslizable (overlay) con historial de conversación y typing indicator
- Cuando el agente menciona un negocio por nombre, el mapa hace pan automático al marcador y abre su InfoWindow
- Input de API key personalizada (collapsable con `<details>`)

---

### 3. Agente IA (`ChatSection`)

Interfaz de chat completa con TurisBot, el guía turístico conversacional de Durango.

**Layout:**
- Sidebar izquierdo con logo, botón "Nuevo chat" y 8 temas rápidos preconfigurados
- Panel derecho con topbar (avatar + estado "En línea" / "Escribiendo…" + botón modo oscuro)
- Área de mensajes con scroll automático al último mensaje
- Input con `textarea` autoexpandible (máx 120 px) y botón de envío
- 4 chips de temas rápidos visibles cuando hay ≤ 2 mensajes

**Comportamiento del agente:**
- Mensaje inicial precargado: saludo de TurisBot con la primera pregunta
- El historial enviado a la API excluye el mensaje inicial (marcado con `isInitial: true`)
- Errores de API mostrados en fila especial con icono ⚠️, etiqueta "Error de conexión" y el mensaje técnico en `<code>`
- API key personalizada en el footer del sidebar (input tipo password, se guarda en estado local)

**Modo oscuro:**
- Toggle con botón ☀️/🌙 en el topbar
- Clase `.dark` en el contenedor raíz; todos los colores se redefinen vía CSS

**Temas rápidos preconfigurados:**

| Icono | Tema | Texto enviado |
|---|---|---|
| 🌮 | Tacos tradicionales | "Quiero comer tacos tradicionales de Durango" |
| 🥃 | Mezcal artesanal | "Recomiéndame un buen lugar para tomar mezcal artesanal" |
| 🎨 | Arte y artesanías | "Me gustaría comprar artesanías típicas de Durango" |
| 📸 | Lugares fotogénicos | "Busco los lugares más fotogénicos de Durango" |
| 💑 | Cita romántica | "Tengo una cita romántica y quiero un lugar especial" |
| 👨‍👩‍👧 | Plan familiar | "Voy con mi familia, incluidos niños. ¿Qué recomiendas?" |
| 🎭 | Historia y cultura | "Quiero aprender sobre la historia y cultura de Durango" |
| 🌅 | Tarde libre | "Tengo una tarde libre, ¿qué hago en Durango?" |

---

### 4. Agregar Negocio (`AddBusinessSection`)

Formulario comunitario para que los usuarios contribuyan nuevos lugares a la plataforma.

**Campos del formulario:**

| Campo | Tipo | Validación |
|---|---|---|
| Imagen | File input (JPG/PNG/WEBP, máx 5 MB) | Opcional; preview inline |
| Nombre | Text input | Obligatorio |
| Categoría | Select (11 opciones) | Obligatorio; muestra badge con color y emoji |
| Descripción | Textarea (3 filas) | Opcional |
| Calificación | Range slider 1.0–5.0 (paso 0.1) | Obligatorio; muestra estrellas en tiempo real |
| Ubicación | Text input (dirección) | Obligatorio; geocodificada con Google Geocoding API |
| Precio | Botones $ / $$ / $$$ / $$$$ | Preseleccionado en $$ |
| Horario | Text input | Opcional; default "Consultar" |

**Proceso al enviar:**
1. Validación de campos obligatorios
2. Geocodificación de la dirección (fallback: coordenadas aleatorias cerca del centro de Durango si falla la API)
3. Construcción del objeto negocio con `id: custom-{timestamp}`, `isCustom: true`, colores y emoji de la categoría
4. Llamada a `onAdd(biz)` en `App.jsx` → se guarda en estado global + `localStorage`
5. El negocio aparece inmediatamente en SwipeSection, MapsSection y en la lista comunitaria

**Lista comunitaria:**
- Grid de tarjetas debajo del formulario mostrando solo los negocios con `isCustom: true`
- Cada tarjeta muestra: hero (imagen o gradiente+emoji), categoría en color, nombre, rating+precio, dirección

---

## Capa de IA (`aiService.js`)

Tres funciones exportadas que acceden a OpenRouter:

### `generateRouteNarrative(likedBusinesses)`
- Usada por SwipeSection al completar 3 matches
- Prompt: lista de negocios elegidos → pide 3 líneas numeradas con emoji
- `max_tokens: 300`, `temperature: 0.7`

### `chatWithAgent(messages, apiKey?)`
- Usada por ChatSection y MapsSection
- Incluye system prompt completo de TurisBot con 10 lugares y sus coordenadas
- Protocolo conversacional: 3 preguntas obligatorias (tiempo → experiencia → compañía) → recomendación en formato específico
- `max_tokens: 512`, `temperature: 0.5`
- Lanza `Error` con el código HTTP y body si `!res.ok`

### `getMapRecommendations(query, apiKey?)`
- Disponible pero no usada actualmente en la UI
- Devuelve JSON `{ places: [{ name, description, lat, lng, category, emoji }] }`
- Coordenadas acotadas al centro histórico de Durango

**Configuración de API:**
```
Modelo:   google/gemini-2.5-flash
Base URL: https://openrouter.ai/api/v1/chat/completions
Headers:  HTTP-Referer: https://match-way.durango.app
          X-Title: Match-Way Durango
```

La API key se lee de `import.meta.env.VITE_OPENROUTER_KEY` (variable de entorno Vite). Tanto ChatSection como MapsSection permiten al usuario ingresar una key personalizada que sobreescribe la de entorno en tiempo de ejecución.

---

## Datos: negocios predefinidos

10 negocios reales/ficticios del centro de Durango en 3 categorías:

**Taquerías (4):**
- El Parián — carnitas desde 1965 · ⭐ 4.8 · $$
- Tacos El Faisán — nocturno, chile pasado · ⭐ 4.6 · $
- Birriería La Güera — birria de chivo · ⭐ 4.9 · $$
- El Mesón del Coyote — arrachera y carne seca, norteño en vivo · ⭐ 4.5 · $$$

**Mezcalerías (3):**
- La Mezcalería del Centro — 40+ variedades, catas · ⭐ 4.9 · $$$
- Casa del Aguardiente — bar histórico 100 años, sotol · ⭐ 4.5 · $$
- Mezcal El Agave Azul — destilería con tours · ⭐ 4.7 · $$$

**Artesanías (3):**
- Talleres Tepehuana — bordados indígenas tepehuan · ⭐ 4.7 · $$
- Artesanías La Quijada — cerámica y barro negro colonial · ⭐ 4.8 · $$
- Taller de Mascadas — mascadas vaqueras, telar de pedal · ⭐ 4.6 · $$$

Todos tienen: `id`, `name`, `category`, `emoji`, `description`, `rating`, `price`, `lat`, `lng`, `address`, `hours`, `tags`, `color`, `bgGradient`.

---

## Diseño visual

**Paleta de colores (CSS custom properties):**

| Variable | Valor | Uso |
|---|---|---|
| `--uber-black` | `#0D0D0D` | Texto principal |
| `--uber-white` | `#FFFFFF` | Fondos de tarjetas |
| `--uber-warm` | `#F5F0E8` | Fondo general (arena) |
| `--uber-green` | `#4A6741` | Mezcalerías, estados "ok" |
| `--uber-green-dk` | `#3A5231` | Verde oscuro |
| `--uber-orange` | `#C4622D` | Acento principal (terracota) |
| `--uber-orange-dk` | `#A0491F` | Hover/activo naranja |
| `--gray-100` | `#F0EBE3` | Bordes sutiles |
| `--gray-500` | `#8C7B6B` | Texto secundario |

**Tipografía:** Inter (Google Fonts) como primera opción, con fallback a system-ui.

**Colores por categoría de negocio:**

| Categoría | Color |
|---|---|
| Taquería | `#C4622D` (terracota) |
| Mezcalería | `#4A6741` (agave) |
| Artesanías | `#8B4513` (barro) |
| Centro recreativo | `#2980B9` |
| Bar / Cantina | `#8E44AD` |
| Café / Restaurante | `#D35400` |
| Hotel | `#1ABC9C` |
| Museo | `#795548` |
| Parque / Naturaleza | `#27AE60` |
| Tienda | `#F39C12` |
| Otro | `#7F8C8D` |

---

## API keys

| Servicio | Variable | Uso |
|---|---|---|
| OpenRouter (IA) | `VITE_OPENROUTER_KEY` en `.env` | Chat + rutas + recomendaciones |
| Google Maps JS | Hardcodeada en `MapsSection.jsx` | Renderizado del mapa |
| Google Geocoding | Hardcodeada en `AddBusinessSection.jsx` | Convertir dirección a coordenadas |

> Las Google Maps keys están hardcodeadas en el código fuente. La key de OpenRouter se mueve a `.env` para no exponerla en el repositorio.

---

## Flujo de datos entre componentes

```
App.jsx
  ├── customBusinesses (estado) ←→ localStorage
  │     ├── SwipeSection   ← extraBusinesses prop
  │     ├── MapsSection    ← extraBusinesses prop
  │     └── AddBusinessSection ← businesses prop + onAdd callback
  └── ChatSection (sin prop de negocios; usa el sistema prompt del agente)
```

Los negocios agregados por la comunidad se propagan en tiempo real a SwipeSection (aparecen en el mazo) y a MapsSection (aparecen como marcadores).

---

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo (con hot-reload)
npm run dev        # → http://localhost:5173

# Build de producción
npm run build      # genera /dist

# Preview del build
npm run preview
```

**Configuración de API key antes de correr:**
```bash
# Crear .env en la raíz del proyecto
echo "VITE_OPENROUTER_KEY=sk-or-v1-..." > .env
```
