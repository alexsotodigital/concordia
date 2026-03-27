// Pega aquí la dirección del contrato después de deployar
export const CONTRACT_ADDRESS = '0xB4B0793AcdA9517EC5e566b0e623AaCf5a4c8863' as `0x${string}`

export const CONTRACT_ABI = [
  {
    inputs: [{ name: 'demoValidator', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    name: 'ValidationSubmitted',
    type: 'event',
    inputs: [
      { indexed: false, name: 'validator', type: 'address' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    name: 'submitValidation',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'scores', type: 'uint8[5]' }],
    outputs: [],
  },
  {
    name: 'selectedValidators',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'hasSubmitted',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'addValidator',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'validator', type: 'address' }],
    outputs: [],
  },
] as const
