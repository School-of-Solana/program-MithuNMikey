use anchor_lang::prelude::*;

/// Custom error messages for better debugging
///
/// # Anchor Concepts:
/// - #[error_code] macro generates error types
/// - Each error has a unique code (starting at 6000)
/// - #[msg("...")] provides user-friendly error message
///
/// Reference: https://www.anchor-lang.com/docs/errors

#[error_code]
pub enum ErrorCode {
    #[msg("Title must be 100 characters or less")]
    TitleTooLong,

    #[msg("Description must be 500 characters or less")]
    DescriptionTooLong,

    #[msg("Maximum 5 judges allowed")]
    TooManyJudges,

    #[msg("At least one judge required")]
    NoJudges,

    #[msg("Approval threshold cannot exceed number of judges")]
    InvalidThreshold,

    #[msg("Prize must be at least 0.01 SOL (10,000,000 lamports)")]
    PrizeTooLow,

    #[msg("Deadline must be in the future")]
    InvalidDeadline,

    #[msg("Contest is not in the correct state for this operation")]
    InvalidContestState,

    #[msg("Contest already funded")]
    AlreadyFunded,

    #[msg("Calculation overflow occurred")]
    CalculationOverflow,

    #[msg("URL must be 200 characters or less")]
    UrlTooLong,

    #[msg("URL must start with https://")]
    InvalidUrl,

    #[msg("Submission deadline has passed")]
    SubmissionDeadlinePassed,

    #[msg("Only the original participant can update this submission")]
    UnauthorizedParticipant,

    #[msg("Only the contest creator can perform this action")]
    UnauthorizedCreator,

    #[msg("Only authorized judges can vote")]
    UnauthorizedJudge,

    #[msg("Submission period has not ended yet")]
    SubmissionPeriodNotEnded,

    #[msg("Contest has not been funded")]
    ContestNotFunded,

    #[msg("Required consensus threshold not reached")]
    ConsensusNotReached,

    #[msg("Contest already completed")]
    ContestAlreadyCompleted,

    #[msg("Reclaim period not yet reached")]
    ReclaimPeriodNotReached,
}
