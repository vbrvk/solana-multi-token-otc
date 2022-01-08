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

// Return meta information for given tokenAddress (symbol,name, website...) from solscan.io
async function solscanGetTokenMetaInfo(tokenAddress) {
  console.log(tokenAddress)
  let url = `https://public-api.solscan.io/token/meta?tokenAddress=${tokenAddress}`
  const response = await getRequest(url)
  return response
}

// Return price and volume for given tokenAddress from solscan.io (which get it from coingecko.com)
async function solscanGetTokenMarketInfo(tokenAddress) {
  console.log(tokenAddress)
  let url = `https://public-api.solscan.io/market/token/${tokenAddress}`
  const response = await getRequest(url)
  return response
}

// Return NFT meta and price information for given walletAddress from solanart.io (ONLY if NFT is listed on solanart.io)
async function solanartGetWalletNFT(walletAddress) {
  console.log(walletAddress)
  let url = `https://qzlsklfacc.medianetwork.cloud/infos_wallet_for_sale?address=${walletAddress}`
  const response = await getRequest(url)
  return response
}

// To test on "devnet" need to change "mainnet-beta" in node_modules/@nfteyez/sol-rayz/dist/utils.js on line:
// if (clusterApi === void 0) { clusterApi = (0, web3_js_1.clusterApiUrl)("mainnet-beta"); }
// to "devnet"
// Return NFT information for given walletAddress
async function getWalletNFT(walletAddress) {
  const tokenList = await moduleSolRayz.getParsedNftAccountsByOwner({'publicAddress':walletAddress});
  return tokenList
}

module.exports = {solanartGetWalletNFT, solscanGetTokenMarketInfo, solscanGetTokenMetaInfo, getWalletNFT}