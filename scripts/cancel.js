const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const TOKEN_ID = 0;

const cancel = async () => {
    const nftMarketplace = await ethers.getContract("NftMarketplace");
    const basicNft = await ethers.getContract("BasicNFT");

    console.log("Cancelling...");
    const tx = await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID);
    await tx.wait(1);
    console.log("Canceled!");

    if (network.config.chainId == "31337") {
        await moveBlocks(2, 1000);
    }
};

cancel()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
