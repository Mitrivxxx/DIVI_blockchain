import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DocumentRegistry", function () {

  it("Should register a document and emit DocumentRegistered event", async function () {
    const [owner] = await ethers.getSigners();
    const registry = await ethers.deployContract(
      "DocumentRegistry",
      [],
      owner
    );

    const hash = ethers.keccak256(
      ethers.toUtf8Bytes("example-document")
    );

    const tx = await registry.register(hash);
    const receipt = await tx.wait();

    // BEZPIECZNE SPRAWDZENIE receipt i block
    if (!receipt || !receipt.blockNumber) {
      throw new Error("Transaction failed or has no block number");
    }

    const block = await ethers.provider.getBlock(receipt.blockNumber);
    if (!block) {
      throw new Error("Block not found");
    }

    await expect(tx)
      .to.emit(registry, "DocumentRegistered")
      .withArgs(
        hash,
        owner.address,
        block.timestamp
      );

    expect(await registry.exists(hash)).to.equal(true);
  });

  it("Should revert when registering the same document twice", async function () {
    const [owner] = await ethers.getSigners();
    const registry = await ethers.deployContract(
      "DocumentRegistry",
      [],
      owner
    );

    const hash = ethers.keccak256(
      ethers.toUtf8Bytes("duplicate-document")
    );

    await registry.register(hash);

    await expect(
      registry.register(hash)
    ).to.be.revertedWith("Already registered");
  });

  it("Should return correct issuer and timestamp via get()", async function () {
    const [owner] = await ethers.getSigners();
    const registry = await ethers.deployContract(
      "DocumentRegistry",
      [],
      owner
    );

    const hash = ethers.keccak256(
      ethers.toUtf8Bytes("read-test")
    );

    const tx = await registry.register(hash);
    const receipt = await tx.wait();

    if (!receipt || !receipt.blockNumber) {
      throw new Error("Transaction failed or has no block number");
    }

    const block = await ethers.provider.getBlock(receipt.blockNumber);
    if (!block) {
      throw new Error("Block not found");
    }

    const [issuer, timestamp] = await registry.get(hash);

    expect(issuer).to.equal(owner.address);
    expect(timestamp).to.equal(block.timestamp);
  });

  it("Should revert get() for non-existing document", async function () {
    const [owner] = await ethers.getSigners();
    const registry = await ethers.deployContract(
      "DocumentRegistry",
      [],
      owner
    );

    const fakeHash = ethers.keccak256(
      ethers.toUtf8Bytes("does-not-exist")
    );

    await expect(
      registry.get(fakeHash)
    ).to.be.revertedWith("Not found");
  });

  it("Should revert when registering zero hash", async function () {
    const [owner] = await ethers.getSigners();
    const registry = await ethers.deployContract(
      "DocumentRegistry",
      [],
      owner
    );

    await expect(
      registry.register(ethers.ZeroHash)
    ).to.be.revertedWith("Invalid hash");
  });

});
