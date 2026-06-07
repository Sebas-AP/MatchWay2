import { useState, useEffect } from 'react'
import SwipeSection        from './components/SwipeSection'
import MapsSection         from './components/MapsSection'
import ChatSection         from './components/ChatSection'
import AddBusinessSection  from './components/AddBusinessSection'

const LS_KEY = 'matchway-custom-businesses'

function loadCustom() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] }
  catch { return [] }
}

export default function App() {
  const [activeTab, setActiveTab]           = useState('swipe')
  const [customBusinesses, setCustom]       = useState(loadCustom)

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(customBusinesses))
  }, [customBusinesses])

  const addBusiness = (biz) => setCustom(p => [biz, ...p])

  const allBusinesses = [...customBusinesses, ...[] /* default ones are imported in sections */]

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-logo">
          <span className="header-logo-icon">🗺️</span>
          <div>
            <div className="header-logo-name">
              <span className="logo-match">Match</span>
              <span className="logo-way">Way</span>
            </div>
            <div className="header-logo-sub">Durango, México</div>
          </div>
        </div>

        <nav className="tab-nav">
          {[
            { id: 'swipe', icon: '🃏', label: 'Ruta Match' },
            { id: 'map',   icon: '🗺️', label: 'Mapa'       },
            { id: 'chat',  icon: '🤖', label: 'Agente IA'  },
            { id: 'add',   icon: '➕', label: 'Agregar'    },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'swipe' && <SwipeSection   extraBusinesses={customBusinesses} />}
        {activeTab === 'map'   && <MapsSection    extraBusinesses={customBusinesses} />}
        {activeTab === 'chat'  && <ChatSection />}
        {activeTab === 'add'   && (
          <AddBusinessSection
            onAdd={addBusiness}
            businesses={[...customBusinesses]}
          />
        )}
      </main>
    </div>
  )
}
