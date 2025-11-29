import { useReducer, useRef, useEffect, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import './App.css'

// ───────────────────── Types & Cards with Art ─────────────────────
type Habitat = 'forest' | 'log' | 'soil'
type Power = 'gainSpore' | 'gainNutrient' | 'drawCard'

interface Mushroom {
  id: number
  name: string
  habitat: Habitat
  cost: number
  points: number
  power: Power | null
  art: string
}

let idCounter = 0
const BASE_CARDS: Omit<Mushroom, 'id'>[] = [
  { name: 'Fly Agaric', habitat: 'forest', cost: 2, points: 2, power: 'gainSpore', art: 'images/mushrooms/agaric.jpg' },
  { name: 'Shiitake', habitat: 'log', cost: 1, points: 3, power: 'gainNutrient', art: 'images/mushrooms/shiitake.jpg' },
  { name: "Lion's Mane", habitat: 'forest', cost: 2, points: 4, power: 'drawCard', art: 'images/mushrooms/lionsmane.jpg' },
  { name: 'Morel', habitat: 'soil', cost: 3, points: 3, power: 'gainSpore', art: 'images/mushrooms/morel.jpg'},
  { name: 'Oyster', habitat: 'log', cost: 1, points: 2, power: 'gainNutrient', art: 'images/mushrooms/oyster.jpg' },
  { name: 'Reishi', habitat: 'forest', cost: 4, points: 5, power: 'gainNutrient', art: 'images/mushrooms/reishi.jpg' },
]

const createDeck = (): Mushroom[] => {
  const deck: Mushroom[] = []
  for (let i = 0; i < 6; i++) BASE_CARDS.forEach(c => deck.push({ ...c, id: idCounter++ }))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

// ───────────────────── Game Logic ─────────────────────
interface State {
  deck: Mushroom[]
  hand: Mushroom[]
  habitats: Record<Habitat, Mushroom[]>
  nutrients: number
  spores: number
  score: number
}

const initialState: State = {
  deck: createDeck(),
  hand: [],
  habitats: { forest: [], log: [], soil: [] },
  nutrients: 8,
  spores: 0,
  score: 0,
}

type Action =
  | { type: 'DRAW' }
  | { type: 'PLAY'; payload: { cardId: number; habitat: Habitat } }
  | { type: 'ACTIVATE'; payload: Habitat }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'DRAW':
      if (!state.deck.length) return state
      return { ...state, hand: [...state.hand, state.deck[0]], deck: state.deck.slice(1) }
    case 'PLAY': {
      const { cardId, habitat } = action.payload
      const card = state.hand.find(c => c.id === cardId)
      if (!card || card.habitat !== habitat || state.nutrients < card.cost || state.habitats[habitat].length >= 5) return state

      const newState = {
        ...state,
        nutrients: state.nutrients - card.cost,
        hand: state.hand.filter(c => c.id !== cardId),
        habitats: { ...state.habitats, [habitat]: [...state.habitats[habitat], card] },
        score: state.score + card.points,
      }

      if (card.power === 'gainSpore') newState.spores += 1
      if (card.power === 'gainNutrient') newState.nutrients += 1
      if (card.power === 'drawCard') return reducer(newState, { type: 'DRAW' })

      return newState
    }
    case 'ACTIVATE':
      return { ...state, nutrients: state.nutrients + state.habitats[action.payload].length }
    default:
      return state
  }
}

// ───────────────────── Component ─────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const dragging = useRef<{ card: Mushroom | null; x: number; y: number }>({ card: null, x: 0, y: 0 })
  // used to trigger re-renders while dragging (ref keeps latest values)
  const [, setDragTick] = useState(0)
  const [draggingHab, setDraggingHab] = useState<Habitat | null>(null)
  const habitatRefs = useRef<Record<Habitat, HTMLDivElement | null>>({ forest: null, log: null, soil: null })

  // Theme music controller (toggled by clicking the title)
  const themeMusicRef = useRef<HTMLAudioElement | null>(null)
  const [themePlaying, setThemePlaying] = useState(false)
  const toggleThemeMusic = () => {
    if (!themeMusicRef.current) {
      const a = new Audio('/music/MushlandTheme.mp3')
      a.loop = true
      a.volume = 0.25
      themeMusicRef.current = a
    }

    const audio = themeMusicRef.current
    if (!audio) return
    if (themePlaying) {
      audio.pause()
      setThemePlaying(false)
    } else {
      audio.play().catch(() => {})
      setThemePlaying(true)
    }
  }

  // Sounds
  const playSound = (name: 'click' | 'play' | 'draw') => {
    const audio = new Audio(`sounds/${name}.mp3`)
    audio.volume = 0.3
    audio.play().catch(() => {})
  }

  useEffect(() => { for (let i = 0; i < 5; i++) dispatch({ type: 'DRAW' }) }, [])

  const startDrag = (e: MouseEvent<HTMLDivElement>, card: Mushroom) => {
    e.preventDefault()
    dragging.current = { card, x: e.clientX, y: e.clientY }
    setDragTick(t => t + 1)
    setDraggingHab(card.habitat)
    playSound('click')
  }

  const onMouseMove = (e: globalThis.MouseEvent) => {
    if (dragging.current.card) {
      dragging.current = { ...dragging.current, x: e.clientX, y: e.clientY }
      setDragTick(t => t + 1)
    }
  }

  const onMouseUp = () => {
    if (!dragging.current.card) return
    const { x, y } = dragging.current
    let played = false

    for (const hab of ['forest', 'log', 'soil'] as const) {
      const el = habitatRefs.current[hab]
      if (el) {
        const r = el.getBoundingClientRect()
        if (x > r.left && x < r.right && y > r.top && y < r.bottom) {
          dispatch({ type: 'PLAY', payload: { cardId: dragging.current.card!.id, habitat: hab } })
          playSound('play')
          played = true
          break
        }
      }
    }
    if (!played) playSound('click')
    dragging.current.card = null
    setDragTick(t => t + 1)
    setDraggingHab(null)
  }

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const colors = { forest: '#2d6a4f', log: '#8b5a2b', soil: '#5b4636' }

  // hovered card portal state with debounce timer
  const [hoveredCard, setHoveredCard] = useState<{ card: Mushroom; rect: DOMRect } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)

  const handleCardMouseEnter = (card: Mushroom, rect: DOMRect) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    setHoveredCard({ card, rect })
  }

  const handleCardMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredCard(null)
    }, 100) // 100ms delay before clearing hover
  }

  // Small lookup for descriptions and special-ability text per mushroom
  const getDescription = (card: Mushroom) => {
    // simple placeholder descriptions (can be replaced with richer text)
    switch (card.name) {
      case 'Fly Agaric':
        return 'A bright red mushroom with white spots, historically associated with folklore and magic. It thrives in shaded forest floors.'
      case 'Shiitake':
        return 'A meaty log-loving mushroom, prized for its savory flavor and hearty texture.'
      case "Lion's Mane":
        return 'A shaggy, cascading fungus resembling a lion\'s mane; known for its unique texture and neurological lore.'
      case 'Morel':
        return 'A highly sought-after speckled mushroom that grows in moist soil and has an earthy, nutty flavor.'
      case 'Oyster':
        return 'A delicate, fan-shaped mushroom commonly found on decaying logs and rich in umami.'
      case 'Reishi':
        return 'A hardy forest mushroom with a glossy, lacquered cap; traditionally used in wellness tonics.'
      default:
        return 'A mysterious mushroom with curious properties.'
    }
  }

  const getAbilityText = (card: Mushroom) => {
    switch (card.power) {
      case 'gainSpore':
        return 'Gain 1 Spore when played.'
      case 'gainNutrient':
        return 'Gain 1 Worm (nutrient) when played.'
      case 'drawCard':
        return 'Draw 1 card immediately when played.'
      default:
        return 'No special ability.'
    }
  }

  useEffect(() => {
    return () => {
      if (themeMusicRef.current) {
        themeMusicRef.current.pause()
        themeMusicRef.current.currentTime = 0
      }
    }
  }, [])

  return (
    <div className="app">
      <div className="resources">
        <div className="resources-left">
          <h1 onClick={toggleThemeMusic} style={{ cursor: 'pointer' }} title="Toggle theme music">Mushland</h1>
        </div>
        <div className="resources-right">
          <button onClick={() => { dispatch({ type: 'DRAW' }); playSound('draw') }}>
            Draw ({state.deck.length})
          </button>
          <img src="images/icons/worm.png" alt="Worm" className="icon-worm" />
          {state.nutrients} | 
          <img src="images/icons/spore.png" alt="Spore" className="icon-spore" />
          {state.spores} |
          Score: {state.score + state.spores * 2 + state.nutrients}

        </div>
      </div>

      <div className="habitats" data-dragging={draggingHab ?? undefined}>
        {(['forest', 'log', 'soil'] as const).map(hab => (
          <div
            key={hab}
            ref={el => {habitatRefs.current[hab] = el}}
            className="habitat"
            data-habitat={hab}
            style={{ backgroundColor: colors[hab] + '60' }}
            onClick={() => dispatch({ type: 'ACTIVATE', payload: hab })}
          >
            <h3>{hab.charAt(0).toUpperCase() + hab.slice(1)}</h3>
            <div className="slots">
              {Array.from({ length: 5 }, (_, i) => {
                    const m = state.habitats[hab][i]
                    const nextIndex = state.habitats[hab].length
                    const isDragging = !!dragging.current.card
                    const draggedCard = dragging.current.card
                    const isTargetSlot = !m && isDragging && draggedCard && draggedCard.habitat === hab && i === nextIndex && state.habitats[hab].length < 5 && (state.nutrients >= draggedCard.cost)
                    return m ? (
                      <div key={m.id} className="card played" data-habitat={m.habitat} style={{ zIndex: i }}>
                    <img src={m.art} alt={m.name} />
                    <div className="info">
                      <strong>{m.name}</strong>
                      <div>{m.points} pts</div>
                    </div>
                  </div>
                ) : (
                  <div key={`${hab}-empty-${i}`} className={"slot-empty" + (isTargetSlot ? ' slot-target' : '')} />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hand">
        <div className="hand-row">
          {state.hand.map((card, i) => (
              <div
                key={card.id}
                className="card hand-card"
                data-habitat={card.habitat}
                style={{
                  zIndex: i,
                  '--hab-color': colors[card.habitat],
                  visibility: dragging.current.card && dragging.current.card.id === card.id ? 'hidden' : undefined,
                } as React.CSSProperties}
                onMouseDown={e => startDrag(e, card)}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  const r = el.getBoundingClientRect()
                  handleCardMouseEnter(card, r)
                }}
                onMouseLeave={handleCardMouseLeave}
              >
              <img src={card.art} alt={card.name} />
              <div className="info">
                <strong>{card.name}</strong>
                <div>Cost: {card.cost} Worm</div>
                {card.power && <div className="power">{card.power === 'gainSpore' ? 'Spore' : card.power === 'gainNutrient' ? 'Worm' : 'Card'}</div>}
                <div>{card.points} pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portal-rendered expanded card (placed on top of everything to avoid clipping) */}
      {hoveredCard && createPortal(
        (() => {
          // Calculate portal position with viewport clamping
          const panelWidth = 320
          const panelHalfWidth = panelWidth / 2
          let left = hoveredCard.rect.left + hoveredCard.rect.width / 2
          const top = Math.max(8, hoveredCard.rect.top - 180)
          
          // Clamp left to keep panel within viewport (accounting for translateX(-50%))
          const minLeft = panelHalfWidth + 8
          const maxLeft = window.innerWidth - panelHalfWidth - 8
          left = Math.max(minLeft, Math.min(left, maxLeft))
          
          return (
            <div
              className="card-expanded-portal"
              data-habitat={hoveredCard.card.habitat}
              style={{
                left,
                top,
                '--hab-color': colors[hoveredCard.card.habitat],
              } as React.CSSProperties}
            >
              <div className="portal-header">
                <img src={hoveredCard.card.art} alt={hoveredCard.card.name} className="portal-image" />
                <div className="portal-meta">
                  <strong>{hoveredCard.card.name}</strong>
                  <div className="portal-stats">
                    <span>Cost: {hoveredCard.card.cost}</span>
                    <span>{hoveredCard.card.points} pts</span>
                  </div>
                </div>
              </div>
              <h4>Description</h4>
              <p>{getDescription(hoveredCard.card)}</p>
              <h4>Special Ability</h4>
              <p>{getAbilityText(hoveredCard.card)}</p>
            </div>
          )
        })(),
        document.body
      )}

      {/* Drag preview */}
      {dragging.current.card && (
        <div
          className="card drag-preview"
          style={{
            position: 'fixed',
            left: dragging.current.x,
            top: dragging.current.y,
            transform: 'translate(-50%, -50%) rotate(8deg)',
            zIndex: 9999,
            '--hab-color': colors[dragging.current.card.habitat],
          } as React.CSSProperties}
        >
          <img src={dragging.current.card.art} alt={dragging.current.card.name} />
          <div className="info">
            <strong>{dragging.current.card.name}</strong>
          </div>
        </div>
      )}
    </div>
  )
}