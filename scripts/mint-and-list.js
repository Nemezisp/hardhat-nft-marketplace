const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const PRICE = ethers.utils.parseEther("0.1");

const mintAndList = async () => {
    const nftMarketplace = await ethers.getContract("NftMarketplace");
    const basicNft = await ethers.getContract("BasicNFT");

    console.log("Minting...");
    const minttx = await basicNft.mintNft();
    const mintTxReceipt = await minttx.wait(1);
    const tokenId = mintTxReceipt.events[0].args.tokenId;

    console.log("Approving NFT...");
    const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId);
    await approvalTx.wait(1);

    console.log("Listing NFT...");
    const listingTx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE);
    await listingTx.wait(1);

    console.log("Listed!");

    if (network.config.chainId == "31337") {
        await moveBlocks(2, 1000);
    }
};

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
