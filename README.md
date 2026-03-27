# Concordia — Validación colectiva

Concordia es una web app mobile-first que permite a validadores elegibles emitir una señal onchain sobre si un evento cumplió con sus compromisos. La señal no depende del organizador — depende de participantes reales.

## El problema

Los eventos reciben fondos basados en promesas. No hay forma verificable de saber si cumplieron lo que dijeron. Concordia cambia eso.

## Cómo funciona

1. Conectas tu wallet
2. Si fuiste seleccionado como validador, llenas el formulario con 5 criterios
3. Envías tu validación → queda registrada onchain en Monad
4. El registro es permanente, público y verificable por cualquiera

## Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, wagmi, viem
- **Smart Contract**: Solidity 0.8.28 (Foundry)
- **Red**: Monad Testnet (Chain ID: 10143)
- **Deploy**: Vercel

## Contrato en Monad Testnet

```
Address: 0x796deb10427C3C104A7f3E765faBaeF8860bB337
Deploy Tx: 0x05bcc9503baa31ad6110ad29d327070420ccbf23058bc39dad09499406f2075a
Explorer: https://testnet.monadscan.com/address/0x796deb10427C3C104A7f3E765faBaeF8860bB337
```

## Cómo correr el proyecto

```bash
cd app
npm install
npm run dev
```

## Criterios de evaluación

1. Internet funcionó
2. Espacio de trabajo adecuado
3. Comida y bebidas
4. Valor para participantes
5. ¿Lo financiarías otra vez?

## Equipo

Monad Blitz CDMX — Marzo 2026
