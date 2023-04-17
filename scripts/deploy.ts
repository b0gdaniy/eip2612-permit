import { ethers } from "hardhat";

async function main() {
  const Factory = await ethers.getContractFactory("Token");
  const contract = await Factory.deploy();
  await contract.deployed();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
