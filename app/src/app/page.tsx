'use client'

import { useState, useEffect } from 'react'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'

const CRITERIA = [
  'Internet funcionó',
  'Espacio de trabajo adecuado',
  'Comida y bebidas',
  'Valor para participantes',
  '¿Lo financiarías otra vez?',
]

const SCORE_LABELS = ['Falló', 'Cumplió', 'Superó'] as const
const SCORE_COLORS = ['#EAC9F8', '#7ED6D1', '#968CFF']

type Screen = 'landing' | 'connect' | 'checking' | 'form' | 'not-eligible' | 'already-submitted' | 'confirmed'

// Decorative signal dots — "many sources → one concordia"
const DOTS = [
  { top: '6%',  left: '8%',  size: 14, color: '#968CFF', opacity: 0.7 },
  { top: '10%', left: '72%', size: 9,  color: '#7ED6D1', opacity: 0.6 },
  { top: '18%', left: '88%', size: 18, color: '#EAC9F8', opacity: 0.5 },
  { top: '3%',  left: '45%', size: 7,  color: '#6C3BFF', opacity: 0.4 },
  { top: '28%', left: '5%',  size: 11, color: '#7ED6D1', opacity: 0.55 },
  { top: '32%', left: '92%', size: 8,  color: '#968CFF', opacity: 0.5 },
  { top: '15%', left: '28%', size: 5,  color: '#EAC9F8', opacity: 0.6 },
  { top: '22%', left: '60%', size: 6,  color: '#6C3BFF', opacity: 0.45 },
  { top: '8%',  left: '55%', size: 10, color: '#7ED6D1', opacity: 0.4 },
]

function SignalDots() {
  return (
    <>
      {DOTS.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            borderRadius: '50%',
            backgroundColor: d.color,
            opacity: d.opacity,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  )
}

function MonadBadge() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#F0EDFF',
      border: '1.5px solid #C8BBFF',
      borderRadius: 24,
      padding: '5px 12px',
      marginBottom: 4,
    }}>
      {/* Monad diamond */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1L13 7L7 13L1 7Z" fill="#6C3BFF"/>
      </svg>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#6C3BFF', letterSpacing: 0.5 }}>
        Monad Blitz CDMX
      </span>
    </div>
  )
}

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [scores, setScores] = useState<(number | null)[]>(Array(5).fill(null))
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [screen, setScreen] = useState<Screen>('landing')

  const { data: isValidator } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'selectedValidators',
    args: [address!],
    query: { enabled: !!address && screen === 'checking' },
  })

  const { data: alreadySubmitted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasSubmitted',
    args: [address!],
    query: { enabled: !!address && isValidator === true && screen === 'checking' },
  })

  useEffect(() => {
    if (screen !== 'checking') return
    if (isValidator === undefined) return
    if (isValidator === false) { setScreen('not-eligible'); return }
    if (alreadySubmitted === undefined) return
    setScreen(alreadySubmitted ? 'already-submitted' : 'form')
  }, [isValidator, alreadySubmitted, screen])

  const { writeContractAsync, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash ?? undefined })

  const allSelected = scores.every((s) => s !== null)

  async function handleConnect() {
    await connect({ connector: connectors[0] })
    setScreen('checking')
  }

  async function handleSubmit() {
    if (!allSelected) return
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'submitValidation',
        args: [scores as [number, number, number, number, number]],
      })
      setTxHash(hash)
      setScreen('confirmed')
    } catch (e) { console.error(e) }
  }

  function handleDisconnect() {
    disconnect()
    setScreen('landing')
    setScores(Array(5).fill(null))
    setTxHash(null)
  }

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  return (
    <div style={s.root}>
      <div style={s.phone}>

        {/* ── LANDING ─────────────────────────────────────────────── */}
        {screen === 'landing' && (
          <div style={{ ...s.content, position: 'relative', overflow: 'hidden' }}>
            <SignalDots />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{ height: 24 }} />
              {/* Wordmark */}
              <h1 style={s.wordmark}>Concordia</h1>
              <p style={{ ...s.subtitle, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>
                Validación colectiva
              </p>

              {/* Monad badge */}
              <MonadBadge />

              {/* Signal line decoration */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', margin: '12px 0' }}>
                {[...Array(9)].map((_, i) => (
                  <div key={i} style={{
                    width: i === 4 ? 24 : 6,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: i === 4 ? '#6C3BFF' : '#D0C8FF',
                    opacity: i === 4 ? 1 : 0.6,
                  }} />
                ))}
              </div>

              <p style={{ color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 1.6, maxWidth: 280 }}>
                Tu opinión sobre este evento quedará registrada para siempre en Monad. Sin intermediarios.
              </p>

              <div style={{ flex: 1 }} />

              <button style={s.cta} onClick={() => setScreen('connect')}>
                Entrar al evento
              </button>
              <p style={s.poweredBy}>Powered by Monad Testnet · Chain 10143</p>
            </div>
          </div>
        )}

        {/* ── CONNECT ─────────────────────────────────────────────── */}
        {screen === 'connect' && (
          <div style={s.content}>
            <button style={s.backBtn} onClick={() => setScreen('landing')}>← Volver</button>
            <div style={{ fontSize: 52, marginBottom: 8 }}>🔐</div>
            <h2 style={s.screenTitle}>Conecta tu wallet</h2>
            <p style={s.subtitle}>Verificaremos si fuiste seleccionado como validador en esta ronda.</p>
            <div style={{ flex: 1 }} />
            <button style={{ ...s.cta, marginBottom: 8 }} onClick={handleConnect}>
              Conectar wallet
            </button>
          </div>
        )}

        {/* ── CHECKING ────────────────────────────────────────────── */}
        {screen === 'checking' && (
          <div style={{ ...s.content, justifyContent: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p style={s.subtitle}>Verificando elegibilidad...</p>
            <p style={{ color: '#bbb', fontSize: 12, marginTop: 8, fontFamily: 'monospace' }}>{shortAddr}</p>
          </div>
        )}

        {/* ── NOT ELIGIBLE ────────────────────────────────────────── */}
        {screen === 'not-eligible' && (
          <div style={s.content}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ fontSize: 64 }}>🤷</div>
              <h2 style={s.screenTitle}>No seleccionado</h2>
              <p style={{ ...s.subtitle, maxWidth: 260 }}>
                Esta wallet no fue incluida como validadora en esta ronda.
              </p>
              <p style={{ color: '#bbb', fontSize: 12, fontFamily: 'monospace' }}>{shortAddr}</p>
            </div>
            <button style={s.secondaryBtn} onClick={handleDisconnect}>
              Usar otra wallet
            </button>
          </div>
        )}

        {/* ── ALREADY SUBMITTED ───────────────────────────────────── */}
        {screen === 'already-submitted' && (
          <div style={s.content}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ fontSize: 64 }}>✅</div>
              <h2 style={s.screenTitle}>Ya validaste</h2>
              <p style={{ ...s.subtitle, maxWidth: 260 }}>
                Tu señal ya está registrada onchain. Gracias por participar.
              </p>
              <p style={{ color: '#bbb', fontSize: 12, fontFamily: 'monospace' }}>{shortAddr}</p>
            </div>
            <button style={s.secondaryBtn} onClick={handleDisconnect}>Salir</button>
          </div>
        )}

        {/* ── FORM ────────────────────────────────────────────────── */}
        {screen === 'form' && (
          <div style={{ ...s.content, paddingTop: 20 }}>
            <div style={s.formHeader}>
              <div>
                <MonadBadge />
                <h2 style={{ ...s.screenTitle, marginTop: 10, fontSize: 18, lineHeight: 1.3 }}>
                  ¿Merecería financiamiento otra vez?
                </h2>
              </div>
              <button style={s.disconnectBtn} onClick={handleDisconnect}>✕</button>
            </div>

            <div style={{ width: '100%', marginTop: 20, paddingBottom: 8 }}>
              {CRITERIA.map((criterion, i) => (
                <div key={i} style={{ marginBottom: 20, paddingLeft: 4, paddingRight: 4 }}>
                  <p style={s.criterionLabel}>{criterion}</p>
                  <div style={{ display: 'flex', gap: 8, paddingLeft: 4, paddingRight: 4 }}>
                    {SCORE_LABELS.map((label, score) => {
                      const selected = scores[i] === score
                      return (
                        <button
                          key={score}
                          style={{
                            flex: 1,
                            padding: '11px 0',
                            borderRadius: 12,
                            border: `2px solid ${selected ? SCORE_COLORS[score] : '#E8E8E8'}`,
                            backgroundColor: selected ? SCORE_COLORS[score] : '#FAFAFA',
                            fontSize: 12,
                            fontWeight: selected ? 700 : 400,
                            fontFamily: "'Signika', sans-serif",
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            color: '#222',
                          }}
                          onClick={() => {
                            const next = [...scores]
                            next[i] = score
                            setScores(next)
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              style={{ ...s.cta, opacity: allSelected && !isPending && !isConfirming ? 1 : 0.4, cursor: allSelected ? 'pointer' : 'not-allowed' }}
              disabled={!allSelected || isPending || isConfirming}
              onClick={handleSubmit}
            >
              {isPending || isConfirming ? 'Enviando...' : 'Enviar validación'}
            </button>
            <p style={{ color: '#bbb', fontSize: 11, marginTop: 8, fontFamily: 'monospace' }}>{shortAddr}</p>
          </div>
        )}

        {/* ── CONFIRMED ───────────────────────────────────────────── */}
        {screen === 'confirmed' && txHash && (
          <div style={s.content}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 16 }}>
              <div style={{ fontSize: 72 }}>🎉</div>
              <h2 style={s.screenTitle}>Tu señal fue registrada</h2>
              <p style={{ ...s.subtitle, maxWidth: 260 }}>Formas parte del veredicto colectivo.</p>

              <div style={s.infoBox}>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Wallet</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{shortAddr}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Hora</span>
                  <span style={{ fontSize: 13 }}>{new Date().toLocaleString('es-MX')}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Tx</span>
                  <a
                    href={`https://testnet.monadscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#6C3BFF', textDecoration: 'none', fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}
                  >
                    {txHash.slice(0, 10)}...{txHash.slice(-6)} ↗
                  </a>
                </div>
              </div>

              <div style={s.merch}>🎁 Muestra esta pantalla para recoger merch</div>
            </div>

            <button style={s.secondaryBtn} onClick={handleDisconnect}>Salir</button>
          </div>
        )}

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    backgroundColor: '#111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Signika', system-ui, sans-serif",
  },
  phone: {
    width: '100%',
    maxWidth: 390,
    minHeight: 700,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    boxShadow: '0 0 0 8px #1e1e1e, 0 0 0 10px #2a2a2a, 0 40px 80px rgba(0,0,0,0.7)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '28px 28px 28px',
    overflowY: 'auto',
  },
  wordmark: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 42,
    fontWeight: 800,
    color: '#111',
    letterSpacing: -1,
    margin: 0,
    textAlign: 'center',
  },
  screenTitle: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 22,
    fontWeight: 700,
    color: '#111',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    margin: '4px 0 0',
    textAlign: 'center',
    lineHeight: 1.6,
    fontFamily: "'Signika', sans-serif",
  },
  cta: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#6C3BFF',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Signika', sans-serif",
  },
  secondaryBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'transparent',
    color: '#6C3BFF',
    border: '2px solid #6C3BFF',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 12,
    fontFamily: "'Signika', sans-serif",
  },
  backBtn: {
    alignSelf: 'flex-start',
    background: 'none',
    border: 'none',
    color: '#6C3BFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 24,
    fontFamily: "'Signika', sans-serif",
  },
  disconnectBtn: {
    background: 'none',
    border: 'none',
    color: '#bbb',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
    flexShrink: 0,
    lineHeight: 1,
  },
  formHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  criterionLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#222',
    marginBottom: 10,
    fontFamily: "'Signika', sans-serif",
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F7F5FF',
    borderRadius: 14,
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  infoRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontWeight: 700,
    color: '#6C3BFF',
    fontSize: 13,
    minWidth: 44,
    fontFamily: "'Signika', sans-serif",
  },
  merch: {
    width: '100%',
    padding: '14px 20px',
    backgroundColor: '#EAC9F8',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    color: '#111',
    textAlign: 'center',
    fontFamily: "'Signika', sans-serif",
  },
  poweredBy: {
    fontSize: 11,
    color: '#ccc',
    paddingTop: 16,
    fontFamily: 'monospace',
  },
}
