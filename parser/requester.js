const axios = require('axios').default;
const moduleSolRayz = require("@nfteyez/sol-rayz");

async function getRequest(url) {
  try{
    const response = await axios.get(url)
    return response.data
  }
  catch(error){
    return error.response.data.error
  }
}

// Returns meta information for a given tokenAddress (symbol,name, website...) from solscan.io
async function solscanGetTokenMetaInfo(tokenAddress) {
  let url = `https://public-api.solscan.io/token/meta?tokenAddress=${tokenAddress}`
  const response = await getRequest(url)
  return response
}

// Returns price and volume for a given tokenAddress from solscan.io (which in turn gets it from coingecko.com)
async function solscanGetTokenMarketInfo(tokenAddress) {
  let url = `https://public-api.solscan.io/market/token/${tokenAddress}`
  const response = await getRequest(url)
  return response
}

// Returns NFT meta and price information for a given walletAddress from solanart.io (ONLY if NFT is listed on solanart.io)
async function solanartGetWalletNFT(walletAddress) {
  let url = `https://qzlsklfacc.medianetwork.cloud/infos_wallet_for_sale?address=${walletAddress}`
  const response = await getRequest(url)
  return response
}

// To test on "devnet" need to change "mainnet-beta" in node_modules/@nfteyez/sol-rayz/dist/utils.js on line:
// if (clusterApi === void 0) { clusterApi = (0, web3_js_1.clusterApiUrl)("mainnet-beta"); }
// to "devnet"
// Returns information about solana NFTS in a given walletAddress.
async function getWalletNFT(walletAddress) {
  const tokenList = await moduleSolRayz.getParsedNftAccountsByOwner({'publicAddress':walletAddress});
  for (var i = 0; i < tokenList.length; i++) {
    let url =  tokenList[i].data.uri
    tokenList[i]['metaData'] = await getRequest(url)
   }
  return tokenList
}

module.exports = {solanartGetWalletNFT, solscanGetTokenMarketInfo, solscanGetTokenMetaInfo, getWalletNFT}