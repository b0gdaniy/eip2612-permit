import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MockProxy, Token } from "../typechain-types";

describe("Token", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function fixture() {
    const [user1, user2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("Token");
    const token: Token = await Factory.deploy();
    await token.deployed();

    const Proxy = await ethers.getContractFactory("MockProxy");
    const proxy: MockProxy = await Proxy.deploy();
    await proxy.deployed();

    return { user1, user2, token, proxy };
  }

  describe("Deployment", function () {
    it("Should permit", async function () {
      const { user1, user2, token, proxy } = await loadFixture(fixture);

      const tokenAddress = token.address;
      const owner = user1.address;
      const spender = user2.address;
      const amount = 100;
      const deadline = (await time.latest()) + 1000;
      const nonce = 0;

      const res = await signERC2612Permit(
        tokenAddress,
        owner,
        spender,
        amount,
        deadline,
        nonce,
        user1
      );

      console.log("RES: ", res);


      const tx = await proxy
        .connect(user2)
        .send(
          tokenAddress,
          owner,
          spender,
          amount,
          deadline,
          res.v,
          res.r,
          res.s
        );
      await tx.wait();

      console.log("Nonce", await token.nonces(owner));

      console.log("Allowance before", await token.allowance(owner, spender));

      const transfer = await token
        .connect(user2)
        .transferFrom(owner, spender, 100);
      await transfer.wait();

      await expect(transfer).to.changeTokenBalance(token, user2, 100);

      console.log("Allowance after", await token.allowance(owner, spender));
    });
  });
});

interface ERC2612PermitMessage {
  owner: string;
  spender: string;
  value: number | string;
  nonce: number | string;
  deadline: number | string;
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

function createTypedERC2612Data(message: ERC2612PermitMessage, domain: Domain) {
  return {
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    domain,
    message,
  };
}

function splitSignatureToRSV(signature: string): RSV {
  const r = "0x" + signature.substring(2).substring(0, 64);
  const s = "0x" + signature.substring(2).substring(64, 128);
  const v = parseInt(signature.substring(2).substring(128, 130), 16);

  return { r, s, v };
}

async function signERC2612Permit(
  token: string,
  owner: string,
  spender: string,
  value: string | number,
  deadline: number,
  nonce: number,
  signer: SignerWithAddress
): Promise<ERC2612PermitMessage & RSV> {
  const message: ERC2612PermitMessage = {
    owner,
    spender,
    value,
    nonce,
    deadline,
  };

  const domain: Domain = {
    name: "Token",
    version: "1",
    chainId: 1337,
    verifyingContract: token,
  };

  const typedData = createTypedERC2612Data(message, domain);

  console.log("Typed Data: ", typedData);

  const rawSignature = await signer._signTypedData(
    typedData.domain,
    typedData.types,
    typedData.message
  );

  const sig = splitSignatureToRSV(rawSignature);

  return { ...sig, ...message };
}
