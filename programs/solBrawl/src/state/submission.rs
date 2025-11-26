use anchor_lang::prelude::*;

/// Submission account stores participant entry data
#[account]
#[derive(InitSpace)]
pub struct Submission {
    pub participant: Pubkey,          // 32 bytes - who submitted
    pub contest: Pubkey,              // 32 bytes - which contest
    #[max_len(200)]
    pub submission_url: String,       // 4 + 200 bytes - GitHub/demo link
    pub submitted_at: i64,            // 8 bytes - submission time
    pub last_modified: i64,           // 8 bytes - last update time
    pub bump: u8,                     // 1 byte - PDA bump
}
