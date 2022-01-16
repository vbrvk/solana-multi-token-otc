import { MetadataKey } from '@nfteyez/sol-rayz/dist/config/metaplex'

export interface ITokenTag {
  name: string
  description: string
}

export interface ITokenExtensions {
  address?: string | null
  assetContract?: string | null
  bridgeContract?: string | null
  coingeckoId?: string | null
  description?: string | null
  discord?: string | null
  twitter?: string | null
  website?: string | null
  facebook?: string | null
  instagram?: string | null
  medium?: string | null
  reddit?: string | null
  telegram?: string | null
  serumV3Usdc?: string | null
  coinmarketcap?: string | null
  blog?: string | null
  github?: string | null
  serumV3Usdt?: string | null
  waterfallbot?: string | null
  telegramAnnouncements?: string | null
  imageUrl?: string | null
  animationUrl?: string | null
  dexWebsite?: string | null
  twitch?: string | null
  linkedin?: string | null
  solanium?: string | null
  whitepaper?: string | null
  youtube?: string | null
  vault?: string | null
  vaultPubkey?: string | null
}

export interface ITokensVersion {
  major: number
  minor: number
  patch: number
}

export interface IToken {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI: string
  tags?: string[] | null
  extensions?: ITokenExtensions | null
}

export interface ITokens {
  name: string
  logoURI: string
  keywords?: string[] | null
  tags: ITokenTag[]
  timestamp: string
  tokens?: IToken[] | null
  version: ITokensVersion
}

export interface INFTMeta {
  description: string
  image: string
  name: string
  seller_fee_basis_points: number
  symbol: string
  properties?: unknown[]
}

export interface INFT {
  mint: string;
  updateAuthority: string;
  data: {
    creators: unknown[];
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
  };
  key: MetadataKey;
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: number;
  masterEdition?: string;
  edition?: string;
  meta?: INFTMeta
}
