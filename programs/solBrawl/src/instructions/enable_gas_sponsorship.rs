use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::state::*;
use crate::errors::ErrorCode;

/// Enables gas sponsorship for the contest
///
/// # Anchor Concepts Demonstrated:
/// 1. **Multiple PDA pattern** - Gas pool is separate PDA derived from contest
/// 2. **Optional features** - Gas sponsorship is an optional enhancement
/// 3. **State transitions** - Contest must be Active before enabling sponsorship
pub fn enable_gas_sponsorship(
    ctx: Context<EnableGasSponsorship>,
    gas_budget: u64,
) -> Result<()> {
    let contest = &mut ctx.accounts.contest;

    require!(
        contest.status == ContestStatus::Active,
        ErrorCode::InvalidContestState
    );

    // Transfer gas budget to separate gas pool PDA
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        Transfer {
            from: ctx.accounts.creator.to_account_info(),
            to: ctx.accounts.gas_pool.to_account_info(),
        },
    );
    transfer(cpi_context, gas_budget)?;

    contest.gas_sponsorship_enabled = true;

    msg!("Gas sponsorship enabled with budget: {} lamports", gas_budget);
    Ok(())
}

#[derive(Accounts)]
pub struct EnableGasSponsorship<'info> {
    #[account(
        mut,
        has_one = creator @ ErrorCode::UnauthorizedCreator,
    )]
    pub contest: Account<'info, Contest>,

    #[account(
        mut,
        seeds = [b"gas_pool", contest.key().as_ref()],
        bump
    )]
    /// CHECK: Gas pool PDA - holds SOL for sponsored transactions
    pub gas_pool: AccountInfo<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}
