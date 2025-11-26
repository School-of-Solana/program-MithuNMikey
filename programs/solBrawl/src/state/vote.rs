use anchor_lang::prelude::*;

/// Judge vote account for multisig consensus
///
/// # Multisig Pattern:
/// Instead of a complex multisig contract, we use simple PDAs:
/// - Each judge creates their own vote PDA
/// - distribute_prizes counts matching votes
/// - Threshold determines consensus
#[account]
#[derive(InitSpace)]
pub struct JudgeVoteAccount {
    pub judge: Pubkey,                // 32 bytes - who voted
    pub contest: Pubkey,              // 32 bytes - which contest
    pub winner: Pubkey,               // 32 bytes - their winner choice
    pub voted_at: i64,                // 8 bytes - vote timestamp
    pub bump: u8,                     // 1 byte - PDA bump
}
