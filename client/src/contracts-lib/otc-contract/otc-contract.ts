import { web3, Provider, Program, BN } from '@project-serum/anchor'
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionSignature } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Wallet } from '../types'
import { IDL, OtcIdl } from './idl'

export type EscrowStateInfo = {
  makerLockedTokens: { pubkey: PublicKey, amount: BN }[]
  makerTokensRequest: { pubkey: PublicKey, amount: BN }[],
  maker: PublicKey,
  taker: PublicKey | null,
  makerLamportsOffer: BN,
  makerLamportsRequest: BN,
}

export class OtcContract {
  static defaultProgramId = new PublicKey('6yBt5s2MMBanRq2k9kCorgnXRjwQG5gRmboKPQ2SnjTd')

  private readonly provider: Provider
  program: Program<OtcIdl>

  constructor(
    connection: web3.Connection,
    private readonly wallet: Wallet,
    public readonly programId = OtcContract.defaultProgramId,
  ) {
    this.provider = new Provider(connection, wallet, Provider.defaultOptions())
    this.program = new Program(IDL, programId, this.provider)
  }

  public async getEscrowState(escrowState: PublicKey): Promise<EscrowStateInfo> {
    const escrowStateInfo = (
      await this.program.account.escrowAccount.fetch(escrowState)
    )

    return escrowStateInfo as EscrowStateInfo
  }

  /**
   * Called by maker
   *
   * @param makerOffer
   * @param makerRequest
   * @param taker
   */
  public async initDeal(
    makerOffer: {
      lamports: BN,
      tokens: [{
        mint: PublicKey,
        amount: BN,
        accountFrom: PublicKey
      }]
    },
    makerRequest: {
      lamports: BN,
      tokens: [{
        amount: BN,
        accountTo: PublicKey
      }]
    },
    taker: PublicKey | null,
  ): Promise<{
    hash: TransactionSignature,
    escrowState: PublicKey
  }> {
    const escrowState = new Keypair()
    const maker = this.wallet.publicKey

    const pdaAccounts = await Promise.all(makerOffer.tokens.map(
      (t) => this.getPdaAccount(t.mint, escrowState.publicKey),
    ))

    const hash = await this.program.rpc.initializeDeal(
      makerOffer.lamports,
      makerRequest.lamports,
      makerOffer.tokens.map(t => t.amount),
      makerRequest.tokens.map(t => t.amount),
      taker,
      {
        accounts: {
          maker,
          systemProgram: SystemProgram.programId,
          escrow: escrowState.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [escrowState],
        remainingAccounts: [
          ...makerOffer.tokens.map(t => ({ pubkey: t.accountFrom, isSigner: false, isWritable: true })),
          ...makerRequest.tokens.map(t => ({ pubkey: t.accountTo, isSigner: false, isWritable: false })),
          ...pdaAccounts.map(pda => ({ pubkey: pda, isSigner: false, isWritable: true })),
          ...makerOffer.tokens.map(t => ({ pubkey: t.accountFrom, isSigner: false, isWritable: false })),
        ],
      },
    )

    return { hash, escrowState: escrowState.publicKey }
  }

  /**
   * Called by taker
   *
   * @param escrowState pubkey of escrow state (see this.initDeal return value)
   * @param takerAccountsFrom from which accounts transfer tokens
   *  should be ordered by mint as makerTokensRequest in escrow state info
   * @param takerAccountsTo to which accounts transfer tokens
   *  should be ordered by mint as makerLockedTokens in escrow state info
   * @returns hash of tx
   */
  public async acceptDeal(
    escrowState: PublicKey,
    takerAccountsFrom: PublicKey[],
    takerAccountsTo: PublicKey[],
  ): Promise<TransactionSignature> {
    const escrowStateInfo = (
      await this.getEscrowState(escrowState)
    )

    if (takerAccountsFrom.length !== escrowStateInfo.makerTokensRequest.length) {
      throw new Error('Not enough takerAccountsFrom')
    }

    if (takerAccountsTo.length !== escrowStateInfo.makerLockedTokens.length) {
      throw new Error('Not enough takerAccountsTo')
    }

    const hash = await this.program.rpc.exchange({
      accounts: {
        maker: escrowStateInfo.maker,
        taker: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        escrow: escrowState,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      remainingAccounts: [
        ...takerAccountsFrom.flatMap(((takerAccountFrom, i) => [
          {
            pubkey: takerAccountFrom,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: escrowStateInfo.makerTokensRequest[i].pubkey,
            isSigner: false,
            isWritable: true,
          },
        ])),
        ...takerAccountsTo.flatMap(((takerAccountTo, i) => [
          {
            pubkey: takerAccountTo,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: escrowStateInfo.makerLockedTokens[i].pubkey,
            isSigner: false,
            isWritable: true,
          },
        ])),
      ],
    })

    return hash
  }

  private async getPdaAccount(mint: PublicKey, escrowState: PublicKey): Promise<PublicKey> {
    const maker = this.wallet.publicKey

    const [pdaAccount] = await PublicKey.findProgramAddress(
      [
        maker.toBuffer(),
        mint.toBuffer(),
        escrowState.toBuffer(),
      ],
      this.programId,
    )

    return pdaAccount
  }
}