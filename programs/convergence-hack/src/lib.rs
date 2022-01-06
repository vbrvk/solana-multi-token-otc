use std::mem::size_of;

use anchor_lang::prelude::*;
use anchor_spl::token;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod convergence_hack {
    use super::*;
    pub fn initialize_deal(
        ctx: Context<InitializeDealParams>,
        maker_amounts: Vec<u64>,
        taker_amounts: Vec<u64>,
        taker_key: Option<Pubkey>,
    ) -> Result<()> {
        // Validate incoming data

        if taker_amounts.len() > EscrowAccount::MAX_TOKENS {
            return Err(ErrorCode::TooMuchTakerTokens.into());
        }

        if maker_amounts.len() > EscrowAccount::MAX_TOKENS {
            return Err(ErrorCode::TooMuchMakerTokens.into());
        }

        if taker_amounts.is_empty() {
            return Err(ErrorCode::NoTakerTokens.into());
        }

        if maker_amounts.is_empty() {
            return Err(ErrorCode::NoMakerTokens.into());
        }

        // Init escrow account

        let mut token_accounts = ctx.remaining_accounts.iter();

        for taker_amount in taker_amounts {
            let token_account = token_accounts.next();

            if token_account.is_none() {
                return Err(ErrorCode::NotEnoughTakerTokenAccounts.into());
            }

            let token_account = token_account.unwrap();

            if *token_account.owner != token::ID {
                return Err(ErrorCode::BadTokenAccount.into());
            }

            ctx.accounts.escrow.taker_tokens.push(TokenInfo {
                account_key: *token_account.key,
                amount: taker_amount,
            })
        }

        for maker_amount in maker_amounts {
            let token_account = token_accounts.next();

            if token_account.is_none() {
                return Err(ErrorCode::NotEnoughMakerTokenAccounts.into());
            }

            let token_account = token_account.unwrap();

            if *token_account.owner != token::ID {
                return Err(ErrorCode::BadTokenAccount.into());
            }

            ctx.accounts.escrow.maker_tokens.push(TokenInfo {
                account_key: *token_account.key,
                amount: maker_amount,
            })
        }

        ctx.accounts.escrow.taker_key = taker_key;
        ctx.accounts.escrow.maker_key = *ctx.accounts.maker.key;

        //

        Ok(())
    }
}

// token accounts should be passed through `remaining_accounts`
#[derive(Accounts)]
pub struct InitializeDealParams<'info> {
    #[account()]
    maker: Signer<'info>,
    #[account(init, payer = maker, space = 8 + EscrowAccount::LEN)]
    escrow: Account<'info, EscrowAccount>,
    // Programs
    system_program: Program<'info, System>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Default, Clone, Copy)]
pub struct TokenInfo {
    account_key: Pubkey,
    amount: u64,
}

#[account]
#[derive(Default)]
pub struct EscrowAccount {
    maker_key: Pubkey,            // 32
    taker_key: Option<Pubkey>,    // 32
    maker_tokens: Vec<TokenInfo>, // 40 * MAX_TOKENS
    taker_tokens: Vec<TokenInfo>, // 40 * MAX_TOKENS
}

impl EscrowAccount {
    pub const MAX_TOKENS: usize = 20;
    pub const LEN: usize = 32 + 32 + size_of::<TokenInfo>() * EscrowAccount::MAX_TOKENS * 2;
}

#[error]
pub enum ErrorCode {
    #[msg(format!("Maximum {} taker different tokens supported", EscrowAccount::LEN))]
    TooMuchTakerTokens,
    #[msg(format!("Maximum {} maker different tokens supported", EscrowAccount::LEN))]
    TooMuchMakerTokens,
    #[msg("No taker tokens was provided")]
    NoTakerTokens,
    #[msg("No maker tokens was provided")]
    NoMakerTokens,
    #[msg("Bad token account")]
    BadTokenAccount,
    #[msg("Not enough taker token accounts was provided")]
    NotEnoughTakerTokenAccounts,
    #[msg("Not enough maker token accounts was provided")]
    NotEnoughMakerTokenAccounts,
}
