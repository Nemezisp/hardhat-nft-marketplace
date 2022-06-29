const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const mint = async () => {
    const basicNft = await ethers.getContract("BasicNFT");

    console.log("Minting...");
    const minttx = await basicNft.mintNft();
    const mintTxReceipt = await minttx.wait(1);
    const tokenId = mintTxReceipt.events[0].args.tokenId;
    console.log(`Got TokenID: ${tokenId}`);
    console.log(`NFT Address: ${basicNft.address}`);

    if (network.config.chainId == "31337") {
        await moveBlocks(2, 1000);
    }
};

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
