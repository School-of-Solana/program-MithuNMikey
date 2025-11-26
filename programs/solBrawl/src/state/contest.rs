use anchor_lang::prelude::*;

/// Contest account stores all contest metadata and state
///
/// # Space Calculation:
/// - Discriminator: 8 bytes (added by #[account])
/// - Pubkey fields: 32 bytes each
/// - u64/i64: 8 bytes each
/// - String: 4 bytes (length) + max_len
/// - Vec<Pubkey>: 4 bytes (length) + (max_len * 32)
/// - bool: 1 byte
/// - u8: 1 byte
///
/// Total: ~853 bytes (calculated automatically by InitSpace)
#[account]
#[derive(InitSpace)]
pub struct Contest {
    pub creator: Pubkey,              // 32 bytes - who created the contest
    pub contest_id: u64,              // 8 bytes - unique identifier
    #[max_len(100)]
    pub title: String,                // 4 + 100 bytes - contest title
    #[max_len(500)]
    pub description: String,          // 4 + 500 bytes - contest description
    pub prize_amount: u64,            // 8 bytes - prize in lamports
    pub submission_deadline: i64,     // 8 bytes - Unix timestamp
    #[max_len(5)]
    pub judges: Vec<Pubkey>,          // 4 + (5 * 32) bytes - authorized judges
    pub approval_threshold: u8,       // 1 byte - votes needed (e.g., 2 of 3)
    pub status: ContestStatus,        // 1 byte - contest lifecycle state
    pub submission_count: u32,        // 4 bytes - number of entries
    pub created_at: i64,              // 8 bytes - creation timestamp
    pub gas_sponsorship_enabled: bool, // 1 byte - gas subsidy enabled?
    pub funded: bool,                 // 1 byte - escrow funded?
    pub bump: u8,                     // 1 byte - PDA bump seed (stored for efficiency)
}

/// Contest lifecycle states
///
/// # State Machine:
/// Setup → (fund_contest) → Active → (distribute_prizes) → Completed
///   ↓
/// Cancelled (via reclaim_funds after 30 days)
///
/// # Anchor Concept: InitSpace for Enums
/// InitSpace automatically calculates enum size as 1 byte (for up to 256 variants)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum ContestStatus {
    Setup,      // Contest created, awaiting funding
    Active,     // Funded and accepting submissions
    Judging,    // (Future use) Formal judging period
    Completed,  // Winner selected, prizes distributed
    Cancelled,  // Contest cancelled, funds reclaimed
}
