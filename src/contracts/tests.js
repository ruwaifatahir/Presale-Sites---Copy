import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe.only("PresaleStaking.sol", () => {
  // We define a fixture to reuse the same setup in every test.
  async function deployPresaleStakingFixture() {
    const INITIAL_TOKEN_PRICE = hre.ethers.parseEther("1"); // 0.0025 USD per token (in 18 decimals)
    const BNB_PRICE_USD = 60000000000; // $600 USD in 8 decimals (Chainlink format)
    const INITIAL_SUPPLY = hre.ethers.parseEther("1000000000"); // 1B tokens

    // Contracts are deployed using the first signer/account by default
    const [owner, user1, user2, referrer] = await hre.ethers.getSigners();

    // Deploy Mock ERC20 Token for investment
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const investToken = await MockERC20.deploy(
      "Invest Token",
      "INVEST",
      INITIAL_SUPPLY
    );

    // Deploy Mock ERC20 Token for staking
    const stakingToken = await MockERC20.deploy(
      "Staking Token",
      "STK",
      INITIAL_SUPPLY
    );

    // Deploy Mock ERC20 Token for rewards
    const rewardToken = await MockERC20.deploy(
      "Reward Token",
      "RWD",
      INITIAL_SUPPLY
    );

    // Deploy Mock Price Feed
    const MockAggregatorV3 = await hre.ethers.getContractFactory(
      "MockAggregatorV3"
    );
    const bnbPriceFeed = await MockAggregatorV3.deploy(BNB_PRICE_USD);

    // Deploy PresaleStaking contract
    const PresaleStaking = await hre.ethers.getContractFactory(
      "PresaleStaking"
    );
    const presaleStaking = await PresaleStaking.deploy(
      await investToken.getAddress(),
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      await bnbPriceFeed.getAddress(),
      INITIAL_TOKEN_PRICE
    );

    // Transfer some tokens to users for testing
    await investToken.transfer(user1.address, hre.ethers.parseEther("10000"));
    // await stakingToken.transfer(user1.address, hre.ethers.parseEther("10000"));

    // Transfer some reward tokens to the owner for distribution
    await rewardToken.transfer(
      owner.address,
      hre.ethers.parseEther("500000000")
    ); // 500M for testing

    // Approve presale staking contract to spend user tokens
    await investToken
      .connect(user1)
      .approve(
        await presaleStaking.getAddress(),
        hre.ethers.parseEther("10000")
      );

    return {
      presaleStaking,
      investToken,
      stakingToken,
      rewardToken,
      bnbPriceFeed,
      initialTokenPrice: INITIAL_TOKEN_PRICE,
      bnbPriceUsd: BNB_PRICE_USD,
      owner,
      user1,
      user2,
      referrer,
    };
  }

  it("should stake in 1 month plan using usdt and rewards every week for 1 month after that it should be able to withdraw its stakings by 10% every week with no referrer", async function () {
    // Arrange - Setup the test environment
    const {
      presaleStaking,
      stakingToken,
      rewardToken,
      investToken,
      user1,
      owner,
    } = await loadFixture(deployPresaleStakingFixture);

    // Configure a 6-month staking plan (using plan index 0)
    const oneMonthPlan = {
      apy: hre.ethers.parseEther("80"), // 80% APY
      lockDuration: 1 * 30 * 24 * 60 * 60, // 6 months (180 days)
      minStakeAmount: hre.ethers.parseEther("100"), // 100 tokens minimum
    };

    await presaleStaking.connect(owner).setStakePlan(0, oneMonthPlan);

    // Stake amount
    const investAmount = hre.ethers.parseEther("1000"); // 1000 USDT

    // Owner deposits staking tokens for withdrawals
    const depositAmount = hre.ethers.parseEther("1000000"); // Large amount for withdrawals
    await stakingToken
      .connect(owner)
      .approve(await presaleStaking.getAddress(), depositAmount);
    await presaleStaking.connect(owner).depositStakingTokens(depositAmount);

    // Owner approves reward tokens for distribution
    const rewardAmount = hre.ethers.parseEther("10000000"); // 10M tokens
    await rewardToken
      .connect(owner)
      .approve(await presaleStaking.getAddress(), rewardAmount);

    await investToken
      .connect(user1)
      .approve(await presaleStaking.getAddress(), investAmount);

    // Act 1 - User stakes in the 6-month plan with no referrer
    await presaleStaking
      .connect(user1)
      ["stake(uint256,uint8,address)"](investAmount, 0, hre.ethers.ZeroAddress);

    // Verify stake was created
    const tokenPrice = await presaleStaking.getTokenPrice();

    const stakeAmount =
      (investAmount * hre.ethers.parseEther("1")) / tokenPrice;
    const staker = await presaleStaking.getStakerInfo(user1.address);
    const stake = staker.stakes[0];

    expect(staker.referrer).to.be.eq(hre.ethers.ZeroAddress);
    expect(staker.totalStakedAmount).to.be.eq(stakeAmount);
    expect(staker.totalInvestedAmount).to.be.eq(investAmount);

    expect(stake.stakedAmount).to.be.eq(stakeAmount);
    expect(stake.investedAmount).to.be.eq(investAmount);
    expect(stake.stakeTime).to.be.eq(await time.latest());
    expect(stake.lastClaimTime).to.be.eq(await time.latest());
    expect(stake.lastWithdrawalTime).to.be.eq(await time.latest());
    expect(stake.totalWithdrawnAmount).to.be.eq(0);

    //Act 2 - Claim rewards after a week
    const apy = (await presaleStaking.stakePlans(0)).apy;

    const totalRewards = (investAmount * apy) / hre.ethers.parseEther("100");

    const weeklyRewards = totalRewards / 52n;

    //Distribute rewards for 6 months
    for (let i = 0; i < 4; i++) {
      console.log(`Week ${i + 1}`);
      await time.increase(7 * 24 * 60 * 60); // 1 week

      await presaleStaking.connect(owner).distributeRewards(0, 1);

      const userRewards = await rewardToken.balanceOf(user1.address);

      console.log("weeklyRewards", hre.ethers.formatEther(weeklyRewards));
      console.log("userRewards", hre.ethers.formatEther(userRewards));

      expect(weeklyRewards).to.be.gt(userRewards);

      //Empty the wallet of the user
      await rewardToken.connect(user1).transfer(owner.address, userRewards);
    }

    await time.increase(2 * 24 * 60 * 60);

    //Act 3 - Withdraw 10% every week
    for (let i = 0; i < 10; i++) {
      await presaleStaking.connect(user1).withdraw(0);

      const userStakingBalance = await stakingToken.balanceOf(user1.address);

      console.log(
        "userStakingBalance",
        hre.ethers.formatEther(userStakingBalance)
      );

      await time.increase(7 * 24 * 60 * 60); // 1 week
    }
  });
});
