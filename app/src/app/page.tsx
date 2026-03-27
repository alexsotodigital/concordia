'use client'

import { useState } from 'react'
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

type Screen = 'landing' | 'connect' | 'form' | 'not-eligible' | 'already-submitted' | 'confirmed'

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
    query: {
      enabled: !!address,
      onSuccess: (data: boolean) => {
        if (screen === 'connect') {
          setScreen(data ? 'form' : 'not-eligible')
        }
      },
    },
  })

  const { data: alreadySubmitted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasSubmitted',
    args: [address!],
    query: {
      enabled: !!address && isValidator === true,
      onSuccess: (data: boolean) => {
        if (data && screen === 'form') setScreen('already-submitted')
      },
    },
  })

  const { writeContractAsync, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
  })

  const allSelected = scores.every((s) => s !== null)

  async function handleConnect() {
    await connect({ connector: connectors[0] })
    setScreen('connect')
    // screen will update via useReadContract callbacks
    setTimeout(() => {
      if (isValidator === true) setScreen(alreadySubmitted ? 'already-submitted' : 'form')
      else if (isValidator === false) setScreen('not-eligible')
    }, 1500)
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
    } catch (e) {
      console.error(e)
    }
  }

  function handleDisconnect() {
    disconnect()
    setScreen('landing')
    setScores(Array(5).fill(null))
    setTxHash(null)
  }

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  return (
    <div style={styles.root}>
      <div style={styles.phone}>

        {/* ─── LANDING ───────────────────────────────────────────── */}
        {screen === 'landing' && (
          <div style={styles.content}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏛️</div>
            <h1 style={styles.title}>Concordia</h1>
            <p style={styles.subtitle}>Validación colectiva</p>

            <div style={styles.eventCard}>
              <p style={styles.eventLabel}>Evento</p>
              <p style={styles.eventName}>Monad Blitz CDMX</p>
              <p style={styles.eventDate}>Marzo 2026</p>
            </div>

            <p style={{ color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 1.5, marginBottom: 32 }}>
              Si fuiste seleccionado como validador, tu opinión quedará registrada para siempre en Monad.
            </p>

            <button style={styles.cta} onClick={() => setScreen('connect')}>
              Entrar al evento
            </button>

            <p style={styles.poweredBy}>Powered by Monad Testnet</p>
          </div>
        )}

        {/* ─── CONNECT ───────────────────────────────────────────── */}
        {screen === 'connect' && !isConnected && (
          <div style={styles.content}>
            <button style={styles.backBtn} onClick={() => setScreen('landing')}>← Volver</button>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔐</div>
            <h1 style={styles.title}>Conecta tu wallet</h1>
            <p style={styles.subtitle}>Verificaremos si fuiste seleccionado como validador</p>
            <button style={{ ...styles.cta, marginTop: 32 }} onClick={handleConnect}>
              Conectar wallet
            </button>
          </div>
        )}

        {/* ─── LOADING (wallet connected, checking eligibility) ──── */}
        {screen === 'connect' && isConnected && (
          <div style={{ ...styles.content, justifyContent: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
            <p style={styles.subtitle}>Verificando elegibilidad...</p>
            <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>{shortAddr}</p>
          </div>
        )}

        {/* ─── NOT ELIGIBLE ──────────────────────────────────────── */}
        {screen === 'not-eligible' && (
          <div style={styles.content}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
            <h1 style={styles.title}>No seleccionado</h1>
            <p style={styles.subtitle}>Esta wallet no fue seleccionada como validadora en esta ronda.</p>
            <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>{shortAddr}</p>
            <button style={styles.secondaryBtn} onClick={handleDisconnect}>
              Usar otra wallet
            </button>
          </div>
        )}

        {/* ─── ALREADY SUBMITTED ─────────────────────────────────── */}
        {screen === 'already-submitted' && (
          <div style={styles.content}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <h1 style={styles.title}>Ya validaste</h1>
            <p style={styles.subtitle}>Tu señal ya está registrada onchain. Gracias por participar.</p>
            <p style={{ color: '#999', fontSize: 12, marginTop: 8 }}>{shortAddr}</p>
            <button style={styles.secondaryBtn} onClick={handleDisconnect}>
              Salir
            </button>
          </div>
        )}

        {/* ─── FORM ──────────────────────────────────────────────── */}
        {screen === 'form' && isValidator && !alreadySubmitted && (
          <div style={{ ...styles.content, paddingTop: 16 }}>
            <div style={styles.formHeader}>
              <div>
                <p style={{ fontSize: 11, color: '#999', margin: 0 }}>MONAD BLITZ CDMX</p>
                <h1 style={{ ...styles.title, fontSize: 20 }}>¿Merecería financiamiento otra vez?</h1>
              </div>
              <button style={styles.disconnectBtn} onClick={handleDisconnect}>✕</button>
            </div>

            <div style={{ width: '100%', marginTop: 16 }}>
              {CRITERIA.map((criterion, i) => (
                <div key={i} style={styles.criterionBlock}>
                  <p style={styles.criterionLabel}>{criterion}</p>
                  <div style={styles.btnGroup}>
                    {SCORE_LABELS.map((label, score) => {
                      const selected = scores[i] === score
                      return (
                        <button
                          key={score}
                          style={{
                            ...styles.scoreBtn,
                            backgroundColor: selected ? SCORE_COLORS[score] : '#F5F5F5',
                            borderColor: selected ? SCORE_COLORS[score] : '#E0E0E0',
                            fontWeight: selected ? 700 : 400,
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
              style={{
                ...styles.cta,
                opacity: allSelected && !isPending && !isConfirming ? 1 : 0.45,
                cursor: allSelected ? 'pointer' : 'not-allowed',
              }}
              disabled={!allSelected || isPending || isConfirming}
              onClick={handleSubmit}
            >
              {isPending || isConfirming ? 'Enviando...' : 'Enviar validación'}
            </button>
            <p style={{ color: '#999', fontSize: 11, marginTop: 8 }}>{shortAddr} · Monad Testnet</p>
          </div>
        )}

        {/* ─── CONFIRMED ─────────────────────────────────────────── */}
        {(screen === 'confirmed' || isSuccess) && txHash && (
          <div style={styles.content}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <h1 style={styles.title}>Tu señal fue registrada</h1>
            <p style={styles.subtitle}>Formas parte del veredicto colectivo.</p>

            <div style={styles.infoBox}>
              <p style={styles.infoRow}><span style={styles.label}>Wallet</span>{shortAddr}</p>
              <p style={styles.infoRow}><span style={styles.label}>Hora</span>{new Date().toLocaleString('es-MX')}</p>
              <p style={styles.infoRow}>
                <span style={styles.label}>Tx</span>
                <a
                  href={`https://testnet.monadscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#6C3BFF', textDecoration: 'none', wordBreak: 'break-all', fontSize: 12 }}
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-6)} ↗
                </a>
              </p>
            </div>

            <div style={styles.merch}>🎁 Muestra esta pantalla para recoger merch</div>

            <button style={styles.secondaryBtn} onClick={handleDisconnect}>
              Salir
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    backgroundColor: '#111111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'system-ui, sans-serif',
  },
  phone: {
    width: '100%',
    maxWidth: 390,
    minHeight: 700,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    boxShadow: '0 0 0 8px #222, 0 0 0 10px #333, 0 32px 64px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 24px 24px',
    gap: 8,
    overflowY: 'auto',
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#111',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    margin: '4px 0 0',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  eventCard: {
    width: '100%',
    backgroundColor: '#F5F0FF',
    borderRadius: 16,
    padding: '16px',
    margin: '16px 0',
    textAlign: 'center',
  },
  eventLabel: { fontSize: 11, color: '#6C3BFF', fontWeight: 700, letterSpacing: 1, margin: 0 },
  eventName: { fontSize: 18, fontWeight: 700, color: '#111', margin: '4px 0 0' },
  eventDate: { fontSize: 13, color: '#888', margin: '2px 0 0' },
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
    marginTop: 8,
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
    marginTop: 16,
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
    marginBottom: 16,
  },
  disconnectBtn: {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
    flexShrink: 0,
  },
  formHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  criterionBlock: { width: '100%', marginBottom: 16 },
  criterionLabel: { fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 8 },
  btnGroup: { display: 'flex', gap: 8 },
  scoreBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 12,
    border: '2px solid',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F9F9FF',
    borderRadius: 12,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 16,
  },
  infoRow: {
    fontSize: 13,
    color: '#111',
    margin: 0,
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  label: { fontWeight: 700, color: '#6C3BFF', minWidth: 48 },
  merch: {
    marginTop: 16,
    padding: '14px 20px',
    backgroundColor: '#EAC9F8',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    color: '#111',
    textAlign: 'center',
    width: '100%',
  },
  poweredBy: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 'auto',
    paddingTop: 24,
  },
}
