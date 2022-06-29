const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const TOKEN_ID = 1;

const buy = async () => {
    const nftMarketplace = await ethers.getContract("NftMarketplace");
    const basicNft = await ethers.getContract("BasicNFT");
    const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
    const price = listing.price.toString();

    console.log("Buying...");
    const tx = await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: price });
    await tx.wait(1);
    console.log("Bought!");

    if (network.config.chainId == "31337") {
        await moveBlocks(2, 1000);
    }
};

buy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
