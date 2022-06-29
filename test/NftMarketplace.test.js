const { developmentChains } = require("../helper-hardhat-config");
const { network, getNamedAccounts, ethers, deployments } = require("hardhat");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT Marketplace Unit Tests", function () {
          let basicNft, deployer, user, nftMarketplace;
          let PRICE = ethers.utils.parseEther("0.1");
          let UPDATE_PRICE = ethers.utils.parseEther("0.11");
          let TOKEN_ID = 0;

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              user = (await getNamedAccounts()).user;
              await deployments.fixture(["all"]);
              basicNft = await ethers.getContract("BasicNFT", deployer);
              basicNftUser = await ethers.getContract("BasicNFT", user);
              nftMarketplace = await ethers.getContract("NftMarketplace", deployer);
              nftMarketplaceUser = await ethers.getContract("NftMarketplace", user);
              await basicNft.mintNft();
              await basicNft.approve(nftMarketplace.address, TOKEN_ID);
          });

          describe("listItem", function () {
              it("emits an event after listing an item", async function () {
                  await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      nftMarketplace,
                      "ItemListed"
                  );
              });

              it("reverts if price is 0", async function () {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero");
              });

              it("doesn't allow to list already listed items", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await expect(
                      nftMarketplaceUser.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__AlreadyListed");
              });

              it("only allows owner to list", async function () {
                  await expect(
                      nftMarketplaceUser.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotOwner");
              });

              it("lists the item correctly", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
                  assert.equal(listing.price.toString(), PRICE.toString());
                  assert.equal(listing.seller, deployer);
              });
          });

          describe("buyItem", async function () {
              it("emits an event after item bought", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await expect(
                      nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  ).to.emit(nftMarketplace, "ItemBought");
              });

              it("reverts if item is not listed", async function () {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  ).to.be.revertedWith("NftMarketplace__NotListed");
              });

              it("reverts if value too low", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await expect(
                      nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__PriceNotMet");
              });

              it("correctly updates earnings of seller", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID, { value: PRICE });
                  const sellerEarning = await nftMarketplace.getEarnings(deployer);
                  assert.equal(sellerEarning.toString(), PRICE.toString());
              });

              it("correctly tranfers NFT to the buyer", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID, { value: PRICE });
                  const newNFTOwner = await basicNft.ownerOf(TOKEN_ID);
                  assert.equal(newNFTOwner, user);
              });

              it("deletes listing after someone buys corresponding NFT", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID, { value: PRICE });
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
                  assert.equal(listing.price.toString(), "0");
                  assert.equal(listing.seller, "0x0000000000000000000000000000000000000000");
              });
          });

          describe("cancelListing", async function () {
              it("emits an event after listing canceled", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await expect(nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      nftMarketplace,
                      "ItemCanceled"
                  );
              });

              it("only allows owner to cancel", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await expect(
                      nftMarketplaceUser.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotOwner");
              });

              it("reverts if iten not listed", async function () {
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed");
              });

              it("correctly cancels the listing", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID);
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
                  assert.equal(listing.price.toString(), "0");
                  assert.equal(listing.seller, "0x0000000000000000000000000000000000000000");
              });
          });

          describe("updateListing", async function () {
              it("emits an event after listing updated", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, UPDATE_PRICE)
                  ).to.emit(nftMarketplace, "ItemListed");
              });

              it("only allows owner to update", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await expect(
                      nftMarketplaceUser.updateListing(basicNft.address, TOKEN_ID, UPDATE_PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotOwner");
              });

              it("reverts if item not listed", async function () {
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, UPDATE_PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotListed");
              });

              it("correctly updates the listing", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, UPDATE_PRICE);
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
                  assert.equal(listing.price.toString(), UPDATE_PRICE.toString());
              });
          });

          describe("withdrawEarnings", function () {
              it("reverts if no earnings", async function () {
                  await expect(nftMarketplace.withdrawEarnings()).to.be.revertedWith(
                      "NftMarketplace__NoEarnings"
                  );
              });

              it("enables to withdraw earning corectly", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE);
                  await nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID, { value: PRICE });

                  const deployerEarningsBefore = await nftMarketplace.getEarnings(deployer);
                  const deployerBalanceBefore = await ethers.provider.getBalance(deployer);
                  const txResponse = await nftMarketplace.withdrawEarnings();
                  const txReceipt = await txResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = txReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const deployerBalanceAfter = await ethers.provider.getBalance(deployer);

                  assert.equal(
                      deployerBalanceAfter.add(gasCost).toString(),
                      deployerBalanceBefore.add(deployerEarningsBefore).toString()
                  );
              });
          });
      });
