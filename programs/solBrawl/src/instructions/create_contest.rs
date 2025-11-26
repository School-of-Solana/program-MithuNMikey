use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

/// Creates a new contest with SOL prizes
///
/// # Anchor Concepts Demonstrated:
/// 1. **PDA Derivation with Seeds** - Contest account is a PDA derived from creator + contest_id
/// 2. **Account Initialization with `init` constraint** - Automatically creates and initializes account
/// 3. **Space Calculation with `InitSpace`** - Automatically calculates account size
/// 4. **Input Validation with `require!` macro** - Validates all inputs before processing
/// 5. **Clock Sysvar** - Access blockchain time for deadline validation
pub fn create_contest(
    ctx: Context<CreateContest>,
    contest_id: u64,
    title: String,
    description: String,
    prize_amount: u64, // Prize amount in lamports (1 SOL = 1_000_000_000 lamports)
    submission_deadline: i64,
    judges: Vec<Pubkey>,
    approval_threshold: u8,
) -> Result<()> {
    let contest = &mut ctx.accounts.contest;
    let clock = Clock::get()?;

    // Validate input parameters using require! macro
    require!(title.len() <= 100, ErrorCode::TitleTooLong);
    require!(description.len() <= 500, ErrorCode::DescriptionTooLong);
    require!(judges.len() <= 5, ErrorCode::TooManyJudges);
    require!(judges.len() > 0, ErrorCode::NoJudges);
    require!(
        approval_threshold as usize <= judges.len(),
        ErrorCode::InvalidThreshold
    );
    require!(prize_amount >= 10_000_000, ErrorCode::PrizeTooLow); // Minimum 0.01 SOL
    require!(
        submission_deadline > clock.unix_timestamp,
        ErrorCode::InvalidDeadline
    );

    // Initialize contest account fields
    contest.creator = ctx.accounts.creator.key();
    contest.contest_id = contest_id;
    contest.title = title;
    contest.description = description;
    contest.prize_amount = prize_amount;
    contest.submission_deadline = submission_deadline;
    contest.judges = judges;
    contest.approval_threshold = approval_threshold;
    contest.status = ContestStatus::Setup;
    contest.submission_count = 0;
    contest.created_at = clock.unix_timestamp;
    contest.gas_sponsorship_enabled = false;
    contest.funded = false;
    contest.bump = ctx.bumps.contest;

    msg!("Contest created with ID: {}", contest_id);
    Ok(())
}

#[derive(Accounts)]
#[instruction(contest_id: u64)]
pub struct CreateContest<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Contest::INIT_SPACE,
        seeds = [b"contest", creator.key().as_ref(), &contest_id.to_le_bytes()],
        bump
    )]
    pub contest: Account<'info, Contest>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}
