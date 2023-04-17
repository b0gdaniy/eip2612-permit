import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {


    return {};
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {

    });

    it("Should set the right owner", async function () {

    });

    it("Should receive and store the funds to lock", async function () {

    });

    it("Should fail if the unlockTime is not in the future", async function () {

    });
  });


});
