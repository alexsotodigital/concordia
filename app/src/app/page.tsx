'use client'

import { useState } from 'react'
import {
  useAccount,
  useConnect,
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

export default function Home() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const [scores, setScores] = useState<(number | null)[]>(Array(5).fill(null))
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const { data: isValidator } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'selectedValidators',
    args: [address!],
    query: { enabled: !!address },
  })

  const { data: alreadySubmitted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasSubmitted',
    args: [address!],
    query: { enabled: !!address },
  })

  const { writeContractAsync, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
  })

  const allSelected = scores.every((s) => s !== null)

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
    } catch (e) {
      console.error(e)
    }
  }

  // ─── Confirmation screen ───────────────────────────────────────────────────
  if (isSuccess && txHash) {
    const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
    const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-6)}`
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
          <h1 style={{ ...styles.title, marginBottom: 4 }}>Tu señal fue registrada</h1>
          <p style={styles.subtitle}>Formas parte del veredicto colectivo.</p>

          <div style={styles.infoBox}>
            <p style={styles.infoRow}><span style={styles.label}>Wallet</span> {shortAddr}</p>
            <p style={styles.infoRow}><span style={styles.label}>Timestamp</span> {new Date().toLocaleString('es-MX')}</p>
            <p style={styles.infoRow}>
              <span style={styles.label}>Tx Hash</span>
              <a
                href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#6C3BFF', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                {shortHash} ↗
              </a>
            </p>
          </div>

          <div style={styles.merch}>
            🎁 Muestra esta pantalla para recoger merch
          </div>
        </div>
      </main>
    )
  }

  // ─── Connect wallet ────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <h1 style={styles.title}>Concordia</h1>
          <p style={styles.subtitle}>Validación colectiva</p>
          <button
            style={styles.cta}
            onClick={() => connect({ connector: connectors[0] })}
          >
            Conectar wallet
          </button>
        </div>
      </main>
    )
  }

  // ─── Not a validator ──────────────────────────────────────────────────────
  if (isValidator === false) {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={{ fontSize: 36 }}>🔒</div>
          <h1 style={styles.title}>Concordia</h1>
          <p style={styles.subtitle}>No fuiste seleccionado en esta ronda</p>
          <p style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </div>
      </main>
    )
  }

  // ─── Already submitted ────────────────────────────────────────────────────
  if (alreadySubmitted) {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={{ fontSize: 36 }}>✅</div>
          <h1 style={styles.title}>Ya enviaste tu validación</h1>
          <p style={styles.subtitle}>Tu señal ya está registrada onchain.</p>
        </div>
      </main>
    )
  }

  // ─── Form ─────────────────────────────────────────────────────────────────
  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>Concordia</h1>
        <p style={styles.subtitle}>¿Este evento merecería financiamiento otra vez?</p>

        <div style={{ width: '100%', marginTop: 24 }}>
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

        <p style={{ color: '#999', fontSize: 12, marginTop: 12 }}>
          {address?.slice(0, 6)}...{address?.slice(-4)} · Monad Testnet
        </p>
      </div>
    </main>
  )
}

// ─── Inline styles ─────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: '24px 16px',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#111111',
    margin: 0,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    margin: '8px 0 0',
    textAlign: 'center',
  },
  criterionBlock: {
    marginBottom: 20,
  },
  criterionLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111',
    marginBottom: 8,
  },
  btnGroup: {
    display: 'flex',
    gap: 8,
  },
  scoreBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 12,
    border: '2px solid',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  cta: {
    marginTop: 24,
    width: '100%',
    padding: '16px',
    backgroundColor: '#6C3BFF',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  infoBox: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#F9F9FF',
    borderRadius: 12,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  infoRow: {
    fontSize: 14,
    color: '#111',
    margin: 0,
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: 700,
    color: '#6C3BFF',
  },
  merch: {
    marginTop: 24,
    padding: '14px 20px',
    backgroundColor: '#EAC9F8',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    color: '#111',
    textAlign: 'center',
    width: '100%',
  },
}
