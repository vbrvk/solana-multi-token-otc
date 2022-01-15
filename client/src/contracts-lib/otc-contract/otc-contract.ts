import { web3, Provider, Program, BN } from '@project-serum/anchor'
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, TransactionSignature } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { Wallet } from '../types'
import { IDL, OtcIdl } from './idl'

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