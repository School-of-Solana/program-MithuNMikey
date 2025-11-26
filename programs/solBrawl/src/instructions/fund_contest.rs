use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::*;
use crate::errors::ErrorCode;

/// Funds the contest escrow with SOL
///
/// # Anchor Concepts Demonstrated:
/// 1. **Cross-Program Invocation (CPI)** - Calling System Program's transfer instruction
/// 2. **CpiContext** - Wrapper for CPIs that handles account info conversion
/// 3. **State Validation** - Checking contest status before allowing operations
/// 4. **has_one constraint** - Validates creator field matches signer
/// 5. **PDA as receiving account** - Escrow PDA receives funds without private key
pub fn fund_contest(ctx: Context<FundContest>) -> Result<()> {
    let contest = &mut ctx.accounts.contest;

    // Validate contest state - must be in Setup and not already funded
    require!(
        contest.status == ContestStatus::Setup,
        ErrorCode::InvalidContestState
    );
    require!(!contest.funded, ErrorCode::AlreadyFunded);

    let prize_amount = contest.prize_amount;

    // Transfer SOL from creator to escrow using Cross-Program Invocation (CPI)
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.creator.to_account_info(),
            to: ctx.accounts.escrow.to_account_info(),
        },
    );
    transfer(cpi_context, prize_amount)?;

    // Update contest state - mark as funded and activate
    contest.funded = true;
    contest.status = ContestStatus::Active;

    msg!(
        "Contest funded with {} lamports ({} SOL)",
        prize_amount,
        prize_amount as f64 / 1_000_000_000.0
    );

    Ok(())
}

#[derive(Accounts)]
pub struct FundContest<'info> {
    #[account(
        mut,
        has_one = creator @ ErrorCode::UnauthorizedCreator,
    )]
    pub contest: Account<'info, Contest>,

    #[account(
        mut,
        seeds = [b"escrow", creator.key().as_ref(), &contest.contest_id.to_le_bytes()],
        bump
    )]
    /// CHECK: This is safe because we only transfer SOL to this PDA
    pub escrow: AccountInfo<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}
