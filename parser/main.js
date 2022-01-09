const { solscanGetTokenMetaInfo, solscanGetTokenMarketInfo, solanartGetWalletNFT, getWalletNFT} = require("./requester.js");

async function main() {
    const tokenAddress = "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt";
    const data = await solscanGetTokenMetaInfo(tokenAddress);
    console.log(data);
    const dataMarket = await solscanGetTokenMarketInfo(tokenAddress);
    console.log(dataMarket);
    const walletAddress = "6agJ1fgnCUpH1s1yEEPQvqKrqK4CA2cGd14h2MjTN5x9";//"8jt1mZPoEwnkexDhaz4MMJyFBJMrYNDNcxWQAGkmh172";//
    const dataNFT = await solanartGetWalletNFT(walletAddress);
    console.log(dataNFT);
    const tokenList = await getWalletNFT(walletAddress);
    console.log(tokenList);
  }

main();