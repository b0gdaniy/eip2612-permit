import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Token", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function fixture() {
    const [deployer, user] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("Token");
    const contract = await Factory.deploy();
    await contract.deployed();

    const Proxy = await ethers.getContractFactory("MockProxy");
    const proxy = await Proxy.deploy();
    await proxy.deployed();

    return { deployer, user, contract, proxy };
  }

  describe("Deployment", function () {
    it("Should permit", async function () {
      const { deployer, user, contract, proxy } = await loadFixture(fixture);

      const token = contract.address;
      const owner = deployer.address;
      const spender = user.address;
      const amount = 10;
      const deadline = (await time.latest()) + 1000;
      const nonce = 0;

      const res = await signERC2612Permit(
        token,
        owner,
        spender,
        amount,
        deadline,
        nonce,
        deployer
      );

      console.log("RES: ", res);

      await (await proxy.connect(user).send(token, owner, spender, amount, deadline, res.v, res.r, res.s)).wait;

      console.log("Nonce", await contract.nonces(owner));

      console.log("Allowance before", await contract.allowance(owner, spender));

      const transfer = await contract.connect(user).transferFrom(owner, spender, 100)
      await transfer.wait();

      await expect(transfer).to.changeTokenBalance(contract, user, 100);

      console.log("Allowance after", await contract.allowance(owner, spender));
    });
  });
});

interface ERC2612PermitMessage {
  owner: string;
  spender: string;
  amount: number;
  nonce: number;
  deadline: number;
}

interface RSV {
  r: string;
  s: string;
  v: number;
}

interface Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

function createTypedERC2612Data(msg: ERC2612PermitMessage, domain: Domain) {
  return {
    types: {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ]
    },
    primaryType: "Permit",
    domain,
    msg
  }
}

function splitSignatureToRSV(signature: string): RSV {
  const r = '0x' + signature.substring(2).substring(0, 64);
  const s = '0x' + signature.substring(2).substring(64, 128);
  const v = parseInt(signature.substring(2).substring(128, 130), 16);
  return { r, s, v }
}

async function signERC2612Permit(
  token: string,
  owner: string,
  spender: string,
  amount: number,
  deadline: number,
  nonce: number,
  deployer: SignerWithAddress
): Promise<ERC2612PermitMessage & RSV> {
  const msg: ERC2612PermitMessage = {
    owner,
    spender,
    amount,
    nonce,
    deadline,
  };

  const domain: Domain = {
    name: "Token",
    version: "1",
    chainId: 1337,
    verifyingContract: token,
  };

  const typedData = createTypedERC2612Data(msg, domain);

  console.log("Typed Data: ", typedData);

  const rawSignature = await deployer._signTypedData(
    typedData.domain,
    typedData.types,
    typedData.msg
  )

  const sig = splitSignatureToRSV(rawSignature);

  return { ...sig, ...msg };
}
