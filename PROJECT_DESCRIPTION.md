# Project Description

**Deployed Frontend URL:** sol-brawl-v1.vercel.app

**Solana Program ID:** 'EyMxoUu8So5nRVsAewjuWDZM16wVHJEKAzLSHs8kuEr9'

# SolBrawl 

> A decentralized, gas-free contest platform built on Solana

[![Anchor Version](https://img.shields.io/badge/Anchor-0.32.1-blue)](https://www.anchor-lang.com/)
[![Solana](https://img.shields.io/badge/Solana-Program-green)](https://solana.com/)
[![Deployed](https://img.shields.io/badge/Deployed-Devnet-orange)](https://explorer.solana.com/address/EyMxoUu8So5nRVsAewjuWDZM16wVHJEKAzLSHs8kuEr9?cluster=devnet)

## 🚀 Live Deployment

**Network:** Solana Devnet
**Program ID:** `EyMxoUu8So5nRVsAewjuWDZM16wVHJEKAzLSHs8kuEr9`
**Explorer:** [View on Solana Explorer](https://explorer.solana.com/address/EyMxoUu8So5nRVsAewjuWDZM16wVHJEKAzLSHs8kuEr9?cluster=devnet)
**Frontend:** Next.js 16 with App Router.

### Quick Access
- **RPC Endpoint:** `https://api.devnet.solana.com`
- **Program IDL:** Available in `target/idl/solarena.json`
- **Frontend App:** Located in `/app` directory

## Overview

SolArena is a decentralized contest and bounty platform that enables organizations to launch competitions with built-in escrow, multisig judging, and optional transaction fee sponsorship. Participants can submit entries without needing SOL for gas fees, removing barriers to entry.


## Core Features

### 🏆 SOL-Based Prizes
- Direct SOL prize amounts (no price oracles needed)
- Transparent prize pools held in escrow
- Prizes locked until winner consensus is reached

### 🔒 Built-in Escrow System
- Automatic fund locking using PDAs
- Trustless prize distribution
- Time-locked fund recovery (30 days after deadline)

### ⚖️ Multisig Judging
- Configurable judge panel (up to 5 judges)
- Customizable approval threshold (e.g., 2-of-3, 3-of-5)
- Independent voting with on-chain transparency
- Automatic prize distribution when consensus is reached

### ⛽ Gas Sponsorship (Optional)
- Contest creators can sponsor transaction fees
- Enables barrier-free participation (users don't need SOL)
- Separate gas pool per contest

### 📝 Submission Management
- URL-based submissions (GitHub repos, demos, portfolios, etc.)
- One submission per participant per contest
- Update capability before deadline
- Timestamp tracking for all submissions

## Contest Lifecycle

```
┌─────────────┐
│   Setup     │  Creator calls create_contest()
└──────┬──────┘
       │
       │ fund_contest()
       ▼
┌─────────────┐
│   Active    │  Accepting submissions
└──────┬──────┘
       │
       │ Deadline passes
       ▼
┌─────────────┐
│  Judging    │  Judges vote on winner
└──────┬──────┘
       │
       │ Consensus reached
       ▼
┌─────────────┐
│ Completed   │  Prize distributed
└─────────────┘
```



## Technical Architecture

### Account Structure

SolArena uses 5 types of Program Derived Addresses (PDAs):

```
Contest PDA
├── Seeds: ["contest", creator, contest_id]
├── Stores: metadata, prize amount, judges, status
│
├─── Escrow PDA
│    ├── Seeds: ["escrow", creator, contest_id]
│    └── Holds: Prize SOL (locked until distribution)
│
├─── Gas Pool PDA (optional)
│    ├── Seeds: ["gas_pool", contest]
│    └── Holds: SOL for sponsored transactions
│
├─── Submission PDAs (one per participant)
│    ├── Seeds: ["submission", contest, participant]
│    └── Stores: submission URL, timestamps
│
└─── Vote PDAs (one per judge)
     ├── Seeds: ["vote", contest, judge]
     └── Stores: winner selection, vote timestamp
```

### State Machine

```
Setup ──fund_contest()──> Active ──distribute_prizes()──> Completed
  │
  └──reclaim_funds()──> Cancelled
     (after 30 days)
```

## Program Instructions

| Instruction | Description | Signer |
|------------|-------------|--------|
| `create_contest` | Initialize new contest with metadata | Creator |
| `fund_contest` | Transfer SOL to escrow, activate contest | Creator |
| `enable_gas_sponsorship` | Fund gas pool for free participation | Creator |
| `submit_entry` | Participant submits entry URL | Participant |
| `update_submission` | Update entry before deadline | Participant |
| `judge_vote` | Judge votes for winner | Judge |
| `distribute_prizes` | Distribute funds when consensus reached | Anyone |
| `reclaim_funds` | Recover funds if contest expires | Creator |

## Key Anchor Concepts Demonstrated

### 1. PDAs (Program Derived Addresses)
- 5 different PDA types with various seed patterns
- Deterministic account addressing
- PDA signing for escrow transfers

### 2. Account Constraints
- `init` - Account initialization
- `has_one` - Relationship validation
- `seeds` + `bump` - PDA verification
- `mut` - Mutable accounts

### 3. Cross-Program Invocations (CPIs)
- CPI to System Program for SOL transfers
- Using CpiContext for structured CPIs

### 4. Space Calculation
- Using `InitSpace` macro for automatic sizing
- Proper sizing for String and Vec fields

### 5. Multisig Pattern
- Independent judge voting via PDAs
- Vote aggregation using `remaining_accounts`
- Consensus validation

### 6. State Management
- Enum-based contest lifecycle
- State transition validation
- Time-based access control

## Security Features

-  **Authorization**: `has_one` constraints + runtime checks
-  **PDA Security**: Only program can sign with PDAs
-  **Time Locks**: Deadline enforcement, 30-day reclaim period
-  **Integer Safety**: Saturating arithmetic for counters
-  **Input Validation**: String length, URL format, parameter ranges
-  **State Validation**: Proper state transition checks

## Use Cases

| Use Case | Description |
|----------|-------------|
| 🏗️ **Hackathons** | Organize coding competitions with prizes |
| 💰 **Bounty Programs** | Reward specific development work |
| 🎨 **Design Contests** | Logo, artwork, content creation |
| 🎮 **Community Challenges** | Engage community with rewards |
| 🐛 **Bug Bounties** | Incentivize security research |

## Project Structure

```
solana-contest-platform/
├── app/                        # Frontend (Next.js 16 + App Router)
│   ├── app/
│   │   ├── components/         # UI components (Nav, WalletButton)
│   │   ├── contests/           # Contest pages (list, create, details)
│   │   ├── lib/                # Program client, types, IDL
│   │   └── providers/          # Solana wallet provider
│   └── public/                 # Static assets
│
├── programs/solana-contest-platform/src/
│   ├── lib.rs                  # Program entry point
│   ├── errors.rs               # Custom error codes
│   ├── state/
│   │   ├── contest.rs          # Contest account + status enum
│   │   ├── submission.rs       # Submission account
│   │   └── vote.rs             # Judge vote account
│   └── instructions/
│       ├── create_contest.rs   # Initialize new contest
│       ├── fund_contest.rs     # Fund escrow + activate
│       ├── enable_gas_sponsorship.rs  # Enable fee sponsorship
│       ├── submit_entry.rs     # Submit entry URL
│       ├── update_submission.rs # Update entry before deadline
│       ├── judge_vote.rs       # Judge votes for winner
│       ├── distribute_prizes.rs # Distribute when consensus reached
│       └── reclaim_funds.rs    # Reclaim expired funds
│
├── tests/                      # Integration tests
├── migrations/                 # Deployment scripts
└── target/deploy/              # Compiled program + keypair
```



## Development

### Prerequisites

- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.32.1+
- Node.js 16+
- Yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/meowyx/solana-contest-platform
cd solana-contest-platform
```

2. **Install dependencies**
```bash
yarn install
```

3. **Build the program**
```bash
anchor build
```

4. **Run tests**
```bash
anchor test
```








