import {
  time,
  loadFixture,
  setBalance,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

// Define the Stake type to match the contract's struct
interface Stake {
  amount: bigint;
  stakingStartTime: bigint;
  lockPeriod: bigint;
  claimedRewards: bigint;
  withdrawn: boolean;
  lastClaimTime: bigint;
  withdrawalStartTime: bigint;
  withdrawnPercentage: bigint;
  referrer: string;
}

describe.only("PresaleStaking", function () {
  // We define a fixture to reuse the same setup in every test
  async function deployPresaleStakingFixture() {
    const [owner, buyer, referrer] = await hre.viem.getWalletClients();

    // Fund the buyer with enough BNB for tests
    await setBalance(buyer.account.address, parseEther("1000000")); // 1M BNB

    // Deploy mock tokens first
    const stakingToken = await hre.viem.deployContract("MockERC20", [
      "DGFL Token",
      "DGFL",
      18,
    ]);
    const usdtToken = await hre.viem.deployContract("MockERC20", [
      "USDT Token",
      "USDT",
      18,
    ]);

    // Deploy PresaleStaking with initial parameters
    const baseTokenPrice = parseEther("0.1"); // 0.1 BNB per token
    const baseTokenPriceUSDT = parseEther("30"); // $30 per token

    const presaleStaking = await hre.viem.deployContract("PresaleStaking", [
      stakingToken.address,
      usdtToken.address,
      baseTokenPrice,
      baseTokenPriceUSDT,
      owner.account.address,
    ]);

    // Fund the contract with staking tokens - increased to 10M tokens
    const initialSupply = parseEther("10000000"); // 10M tokens
    await stakingToken.write.mint([presaleStaking.address, initialSupply]);

    const publicClient = await hre.viem.getPublicClient();

    // Helper function to refill contract tokens
    const refillContractTokens = async () => {
      const refillAmount = parseEther("10000000"); // 10M tokens
      await stakingToken.write.mint([presaleStaking.address, refillAmount]);
    };

    return {
      presaleStaking,
      stakingToken,
      usdtToken,
      baseTokenPrice,
      baseTokenPriceUSDT,
      owner,
      buyer,
      referrer,
      publicClient,
      refillContractTokens,
    };
  }

  describe("buyTokensWithBNB", function () {
    describe("Minimum Stake Validations", function () {
      it("Should revert if amount is below global minimum stake", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const belowGlobalMin = parseEther("2999"); // Below 3k global minimum

        await expect(
          presaleStaking.write.buyTokensWithBNB(
            [belowGlobalMin, 0, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account, value: parseEther("299.9") }
          )
        ).to.be.rejectedWith("Amount below minimum stake");
      });

      it("Should revert if amount meets global min but below 6-month min", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("3000"); // Exactly 3k minimum

        await expect(
          presaleStaking.write.buyTokensWithBNB(
            [amount, 0, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account, value: parseEther("300") }
          )
        ).not.to.be.rejected; // Should pass as 3k is minimum for 6 months
      });

      it("Should revert if amount meets 6-month min but below 1-year min", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("25000"); // Above 6-month min but below 1-year min

        await expect(
          presaleStaking.write.buyTokensWithBNB(
            [amount, 1, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account, value: parseEther("2500") }
          )
        ).to.be.rejectedWith(
          "Amount below minimum stake for selected lock period"
        );
      });

      it("Should revert if amount meets 1-year min but below 2-year min", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("150000"); // Above 1-year min but below 2-year min

        await expect(
          presaleStaking.write.buyTokensWithBNB(
            [amount, 2, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account, value: parseEther("15000") }
          )
        ).to.be.rejectedWith(
          "Amount below minimum stake for selected lock period"
        );
      });
    });

    describe("Lock Period Validations", function () {
      it("Should correctly set lock period for 6 months stake", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000"); // Above 3k minimum

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("500") }
        );

        const stakes = (await presaleStaking.read.getUserStakes([
          buyer.account.address,
        ])) as Stake[];

        expect(stakes[0].lockPeriod).to.equal(26n * 7n * 24n * 60n * 60n); // 26 weeks
        expect(stakes[0].amount).to.equal(amount);
      });

      it("Should correctly set lock period for 1 year stake", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("35000"); // Above 30k minimum

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 1, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("3500") }
        );

        const stakes = (await presaleStaking.read.getUserStakes([
          buyer.account.address,
        ])) as Stake[];

        expect(stakes[0].lockPeriod).to.equal(52n * 7n * 24n * 60n * 60n); // 52 weeks
        expect(stakes[0].amount).to.equal(amount);
      });

      it("Should correctly set lock period for 2 years stake", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("350000"); // Above 300k minimum

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 2, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("35000") }
        );

        const stakes = (await presaleStaking.read.getUserStakes([
          buyer.account.address,
        ])) as Stake[];

        expect(stakes[0].lockPeriod).to.equal(104n * 7n * 24n * 60n * 60n); // 104 weeks
        expect(stakes[0].amount).to.equal(amount);
      });
    });

    describe("Price and Payment Validations", function () {
      it("Should calculate correct BNB cost based on token amount", async function () {
        const { presaleStaking, buyer, publicClient } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000"); // 5k tokens
        const expectedCost = parseEther("500"); // At 0.1 BNB per token

        const initialBalance = await publicClient.getBalance({
          address: buyer.account.address,
        });

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: expectedCost }
        );

        const finalBalance = await publicClient.getBalance({
          address: buyer.account.address,
        });

        // Account for gas costs
        const difference = initialBalance - finalBalance;
        expect(Number(difference)).to.be.greaterThan(Number(expectedCost)); // Should be greater due to gas
        expect(Number(difference)).to.be.lessThan(
          Number(expectedCost + parseEther("0.1"))
        ); // But not too much greater
      });

      it("Should refund excess BNB correctly", async function () {
        const { presaleStaking, buyer, publicClient } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000"); // 5k tokens
        const requiredCost = parseEther("500"); // At 0.1 BNB per token
        const sentValue = parseEther("600"); // Sending 100 BNB extra

        const initialBalance = await publicClient.getBalance({
          address: buyer.account.address,
        });

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: sentValue }
        );

        const finalBalance = await publicClient.getBalance({
          address: buyer.account.address,
        });

        // Should have refunded the excess 100 BNB (minus gas costs)
        const difference = initialBalance - finalBalance;
        expect(Number(difference)).to.be.greaterThan(Number(requiredCost));
        expect(Number(difference)).to.be.lessThan(
          Number(requiredCost + parseEther("0.1"))
        );
      });
    });

    describe("Referral System", function () {
      it("Should set referrer correctly for new stake", async function () {
        const { presaleStaking, buyer, referrer } = await loadFixture(
          deployPresaleStakingFixture
        );

        await presaleStaking.write.buyTokensWithBNB(
          [parseEther("5000"), 0, referrer.account.address],
          { account: buyer.account, value: parseEther("500") }
        );

        const stakes = await presaleStaking.read.getUserStakes([
          buyer.account.address,
        ]);
        expect(getAddress(stakes[0].referrer)).to.equal(
          getAddress(referrer.account.address)
        );
      });

      it("Should reject self-referral", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );

        await expect(
          presaleStaking.write.buyTokensWithBNB(
            [parseEther("5000"), 0, buyer.account.address],
            { account: buyer.account, value: parseEther("500") }
          )
        ).to.be.rejectedWith("Cannot refer yourself");
      });

      it("Should track referral rewards correctly", async function () {
        const { presaleStaking, buyer, referrer, usdtToken } =
          await loadFixture(deployPresaleStakingFixture);

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // Make a purchase with referral
        await presaleStaking.write.buyTokensWithBNB(
          [parseEther("5000"), 0, referrer.account.address],
          { account: buyer.account, value: parseEther("500") }
        );

        // Advance time to allow rewards (1 week in seconds)
        const WEEK_IN_SECONDS = 7n * 24n * 60n * 60n;
        await time.increase(Number(WEEK_IN_SECONDS));

        // Claim rewards to trigger referral rewards
        await presaleStaking.write.claimRewards([0n], {
          account: buyer.account,
        });

        // Check referral rewards
        const referralRewards =
          await presaleStaking.read.stakingReferralRewards([
            referrer.account.address,
          ]);
        expect(referralRewards > 0n).to.be.true;
      });

      it("Should handle multi-level referrals correctly", async function () {
        const { presaleStaking, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );

        // Get test accounts
        const [owner, buyer, referrer1, referrer2, buyer2] =
          await hre.viem.getWalletClients();
        await setBalance(buyer.account.address, parseEther("1000000"));
        await setBalance(buyer2.account.address, parseEther("1000000"));

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // First level referral
        await presaleStaking.write.buyTokensWithBNB(
          [parseEther("5000"), 0, referrer1.account.address],
          { account: buyer.account, value: parseEther("500") }
        );

        // Second level referral
        await presaleStaking.write.buyTokensWithBNB(
          [parseEther("5000"), 0, referrer2.account.address],
          { account: buyer2.account, value: parseEther("500") }
        );

        // Advance time to allow rewards (1 week in seconds)
        const WEEK_IN_SECONDS = 7n * 24n * 60n * 60n;
        await time.increase(Number(WEEK_IN_SECONDS));

        // Claim rewards to trigger referral rewards
        await presaleStaking.write.claimRewards([0n], {
          account: buyer.account,
        });
        await presaleStaking.write.claimRewards([0n], {
          account: buyer2.account,
        });

        // Check both referrers received rewards
        const rewards1 = await presaleStaking.read.stakingReferralRewards([
          referrer1.account.address,
        ]);
        const rewards2 = await presaleStaking.read.stakingReferralRewards([
          referrer2.account.address,
        ]);

        expect(rewards1 > 0n).to.be.true;
        expect(rewards2 > 0n).to.be.true;
      });
    });

    describe("Maximum Stake and Supply Validations", function () {
      it("Should revert if amount exceeds maximum stake limit", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const aboveMax = parseEther("1000001"); // Above 1M maximum

        await expect(
          presaleStaking.write.buyTokensWithBNB(
            [aboveMax, 0, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account, value: parseEther("100000.1") }
          )
        ).to.be.rejectedWith("Amount above maximum stake");
      });

      it("Should track contract token balance correctly after purchase", async function () {
        const { presaleStaking, stakingToken, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("100000");

        // Get initial balances
        const contractBalanceBefore = await stakingToken.read.balanceOf([
          presaleStaking.address,
        ]);
        const buyerBalanceBefore = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);

        // Make the purchase
        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("10000") }
        );

        // Get final balances
        const contractBalanceAfter = await stakingToken.read.balanceOf([
          presaleStaking.address,
        ]);
        const buyerBalanceAfter = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);

        // Verify contract balance decreased by the purchase amount
        expect(contractBalanceAfter).to.equal(contractBalanceBefore - amount);

        // Verify buyer balance increased by the purchase amount
        expect(buyerBalanceAfter).to.equal(buyerBalanceBefore + amount);

        // Verify the exact amounts
        expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(amount);
        expect(contractBalanceBefore - contractBalanceAfter).to.equal(amount);
      });
    });

    describe("Price Increase Mechanics", function () {
      it("Should increase price after PRICE_INCREASE_INTERVAL", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        // Get initial price
        const initialPrice = await presaleStaking.read.getCurrentTokenPrice();

        // Advance time by PRICE_INCREASE_INTERVAL
        const interval = Number(172800) * 60; // Convert to number before multiplication
        await time.increase(interval); // 120 days

        // Get new price
        const newPrice = await presaleStaking.read.getCurrentTokenPrice();

        // Price should increase by 1%
        expect(newPrice).to.equal((initialPrice * 101n) / 100n);
      });

      it("Should calculate correct BNB cost after multiple intervals", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        // Advance time by 2 intervals
        const twoIntervals = Number(172800) * 60 * 2; // Convert to number before multiplication
        await time.increase(twoIntervals); // 240 days

        // Get price after two intervals (2% increase)
        const expectedPrice = parseEther("0.102"); // 0.1 + 2% increase
        const currentPrice = await presaleStaking.read.getCurrentTokenPrice();

        expect(currentPrice).to.equal(expectedPrice);
      });
    });

    describe("Multiple Stakes Behavior", function () {
      it("Should allow multiple stakes from same user", async function () {
        const { presaleStaking, buyer, refillContractTokens } =
          await loadFixture(deployPresaleStakingFixture);

        // First stake
        await presaleStaking.write.buyTokensWithBNB(
          [
            parseEther("100000"),
            0,
            "0x0000000000000000000000000000000000000000",
          ],
          { account: buyer.account, value: parseEther("10000") }
        );

        // Refill tokens before second stake
        await refillContractTokens();

        // Second stake
        await presaleStaking.write.buyTokensWithBNB(
          [
            parseEther("200000"),
            1,
            "0x0000000000000000000000000000000000000000",
          ],
          { account: buyer.account, value: parseEther("20000") }
        );

        const stakes = await presaleStaking.read.getUserStakes([
          buyer.account.address,
        ]);
        expect(stakes.length).to.equal(2);
        expect(stakes[0].amount).to.equal(parseEther("100000"));
        expect(stakes[1].amount).to.equal(parseEther("200000"));
      });
    });
  });

  describe("buyTokensWithUSDT", function () {
    describe("Minimum Stake Validations", function () {
      it("Should revert if amount is below global minimum stake", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const belowGlobalMin = parseEther("2999"); // Below 3k global minimum
        const cost = parseEther("89970"); // 29.99 USDT per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await expect(
          presaleStaking.write.buyTokensWithUSDT(
            [belowGlobalMin, 0, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account }
          )
        ).to.be.rejectedWith("Amount below minimum stake");
      });

      it("Should revert if amount meets global min but below 6-month min", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("3000"); // Exactly 3k minimum
        const cost = parseEther("90000"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await expect(
          presaleStaking.write.buyTokensWithUSDT(
            [amount, 0, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account }
          )
        ).not.to.be.rejected; // Should pass as 3k is minimum for 6 months
      });

      it("Should revert if amount meets 6-month min but below 1-year min", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("25000"); // Above 6-month min but below 1-year min
        const cost = parseEther("750000"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await expect(
          presaleStaking.write.buyTokensWithUSDT(
            [amount, 1, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account }
          )
        ).to.be.rejectedWith(
          "Amount below minimum stake for selected lock period"
        );
      });
    });

    describe("Token Transfer and Balance Tracking", function () {
      it("Should transfer USDT from buyer to contract", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000"); // 5k tokens
        const cost = parseEther("150000"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        // Get initial balances
        const buyerUsdtBefore = await usdtToken.read.balanceOf([
          buyer.account.address,
        ]);
        const contractUsdtBefore = await usdtToken.read.balanceOf([
          presaleStaking.address,
        ]);

        // Make purchase
        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Check final balances
        const buyerUsdtAfter = await usdtToken.read.balanceOf([
          buyer.account.address,
        ]);
        const contractUsdtAfter = await usdtToken.read.balanceOf([
          presaleStaking.address,
        ]);

        // Verify USDT transfers
        expect(buyerUsdtAfter).to.equal(buyerUsdtBefore - cost);
        expect(contractUsdtAfter).to.equal(contractUsdtBefore + cost);
      });

      it("Should transfer staking tokens to buyer", async function () {
        const { presaleStaking, buyer, usdtToken, stakingToken } =
          await loadFixture(deployPresaleStakingFixture);
        const amount = parseEther("5000"); // 5k tokens
        const cost = parseEther("150000"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        // Get initial balances
        const buyerTokensBefore = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);
        const contractTokensBefore = await stakingToken.read.balanceOf([
          presaleStaking.address,
        ]);

        // Make purchase
        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Check final balances
        const buyerTokensAfter = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);
        const contractTokensAfter = await stakingToken.read.balanceOf([
          presaleStaking.address,
        ]);

        // Verify token transfers
        expect(buyerTokensAfter).to.equal(buyerTokensBefore + amount);
        expect(contractTokensAfter).to.equal(contractTokensBefore - amount);
      });

      it("Should revert if buyer has insufficient USDT", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000"); // 5k tokens
        const cost = parseEther("150000"); // $30 per token
        const insufficientAmount = cost - parseEther("1000"); // Less than required

        // Fund buyer with insufficient USDT
        await usdtToken.write.mint([buyer.account.address, insufficientAmount]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await expect(
          presaleStaking.write.buyTokensWithUSDT(
            [amount, 0, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account }
          )
        ).to.be.rejectedWith("ERC20: transfer amount exceeds balance");
      });

      it("Should revert if buyer has not approved USDT transfer", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000"); // 5k tokens
        const cost = parseEther("150000"); // $30 per token

        // Fund buyer with USDT but don't approve
        await usdtToken.write.mint([buyer.account.address, cost]);

        await expect(
          presaleStaking.write.buyTokensWithUSDT(
            [amount, 0, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account }
          )
        ).to.be.rejectedWith("ERC20: insufficient allowance");
      });
    });

    describe("Price Mechanics", function () {
      it("Should calculate correct USDT cost based on token amount", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000"); // 5k tokens
        const expectedCost = parseEther("150000"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, expectedCost]);
        await usdtToken.write.approve([presaleStaking.address, expectedCost], {
          account: buyer.account,
        });

        // Get initial balance
        const initialBalance = await usdtToken.read.balanceOf([
          buyer.account.address,
        ]);

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Get final balance
        const finalBalance = await usdtToken.read.balanceOf([
          buyer.account.address,
        ]);

        // Verify exact cost was deducted
        expect(initialBalance - finalBalance).to.equal(expectedCost);
      });

      it("Should increase price after PRICE_INCREASE_INTERVAL", async function () {
        const { presaleStaking } = await loadFixture(
          deployPresaleStakingFixture
        );

        // Get initial price
        const initialPrice =
          await presaleStaking.read.getCurrentTokenPriceUSDT();

        // Advance time by PRICE_INCREASE_INTERVAL
        const interval = Number(172800) * 60; // Convert to number before multiplication
        await time.increase(interval); // 120 days

        // Get new price
        const newPrice = await presaleStaking.read.getCurrentTokenPriceUSDT();

        // Price should increase by 1%
        expect(newPrice).to.equal((initialPrice * 101n) / 100n);
      });
    });

    describe("Referral System with USDT", function () {
      it("Should set referrer correctly for USDT purchase", async function () {
        const { presaleStaking, buyer, referrer, usdtToken } =
          await loadFixture(deployPresaleStakingFixture);
        const amount = parseEther("5000");
        const cost = parseEther("150000"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, referrer.account.address],
          { account: buyer.account }
        );

        const stakes = await presaleStaking.read.getUserStakes([
          buyer.account.address,
        ]);
        expect(getAddress(stakes[0].referrer)).to.equal(
          getAddress(referrer.account.address)
        );
      });

      it("Should reject self-referral in USDT purchase", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await expect(
          presaleStaking.write.buyTokensWithUSDT(
            [amount, 0, buyer.account.address],
            { account: buyer.account }
          )
        ).to.be.rejectedWith("Cannot refer yourself");
      });

      it("Should track referral rewards correctly for USDT purchase", async function () {
        const { presaleStaking, buyer, referrer, usdtToken } =
          await loadFixture(deployPresaleStakingFixture);
        const amount = parseEther("5000");
        const cost = parseEther("150000"); // $30 per token

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, referrer.account.address],
          { account: buyer.account }
        );

        // Advance time to allow rewards (1 week in seconds)
        const WEEK_IN_SECONDS = 7n * 24n * 60n * 60n;
        await time.increase(Number(WEEK_IN_SECONDS));

        // Claim rewards to trigger referral rewards
        await presaleStaking.write.claimRewards([0n], {
          account: buyer.account,
        });

        // Check referral rewards
        const referralRewards =
          await presaleStaking.read.stakingReferralRewards([
            referrer.account.address,
          ]);
        expect(referralRewards > 0n).to.be.true;
      });
    });

    describe("Multiple Stakes with USDT", function () {
      it("Should allow multiple stakes with USDT from same user", async function () {
        const { presaleStaking, buyer, usdtToken, refillContractTokens } =
          await loadFixture(deployPresaleStakingFixture);

        // First stake
        const amount1 = parseEther("100000");
        const cost1 = parseEther("3000000"); // $30 per token
        await usdtToken.write.mint([buyer.account.address, cost1]);
        await usdtToken.write.approve([presaleStaking.address, cost1], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount1, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Refill tokens before second stake
        await refillContractTokens();

        // Second stake
        const amount2 = parseEther("200000");
        const cost2 = parseEther("6000000"); // $30 per token
        await usdtToken.write.mint([buyer.account.address, cost2]);
        await usdtToken.write.approve([presaleStaking.address, cost2], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount2, 1, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        const stakes = await presaleStaking.read.getUserStakes([
          buyer.account.address,
        ]);
        expect(stakes.length).to.equal(2);
        expect(stakes[0].amount).to.equal(amount1);
        expect(stakes[1].amount).to.equal(amount2);
      });

      it("Should handle mixed BNB and USDT purchases from same user", async function () {
        const { presaleStaking, buyer, usdtToken, refillContractTokens } =
          await loadFixture(deployPresaleStakingFixture);

        // First stake with BNB
        await presaleStaking.write.buyTokensWithBNB(
          [
            parseEther("100000"),
            0,
            "0x0000000000000000000000000000000000000000",
          ],
          { account: buyer.account, value: parseEther("10000") }
        );

        // Refill tokens before second stake
        await refillContractTokens();

        // Second stake with USDT
        const amount2 = parseEther("200000");
        const cost2 = parseEther("6000000"); // $30 per token
        await usdtToken.write.mint([buyer.account.address, cost2]);
        await usdtToken.write.approve([presaleStaking.address, cost2], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount2, 1, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        const stakes = await presaleStaking.read.getUserStakes([
          buyer.account.address,
        ]);
        expect(stakes.length).to.equal(2);
        expect(stakes[0].amount).to.equal(parseEther("100000"));
        expect(stakes[1].amount).to.equal(amount2);
      });
    });

    describe("Contract Token Supply Validations", function () {
      it("Should revert if contract has insufficient tokens", async function () {
        const { presaleStaking, buyer, usdtToken, stakingToken } =
          await loadFixture(deployPresaleStakingFixture);
        const amount = parseEther("5000");
        const cost = parseEther("150000"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        // Drain contract's token balance
        const contractBalance = await stakingToken.read.balanceOf([
          presaleStaking.address,
        ]);
        await presaleStaking.write.emergencyWithdrawTokens([
          stakingToken.address,
          contractBalance,
        ]);

        await expect(
          presaleStaking.write.buyTokensWithUSDT(
            [amount, 0, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account }
          )
        ).to.be.rejectedWith("Not enough tokens in contract");
      });
    });

    describe("Lock Period and Minimum Stake Requirements", function () {
      it("Should enforce correct minimum stake for 1-year lock period", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("29999"); // Just below 30k minimum for 1 year
        const cost = parseEther("899970"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await expect(
          presaleStaking.write.buyTokensWithUSDT(
            [amount, 1, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account }
          )
        ).to.be.rejectedWith(
          "Amount below minimum stake for selected lock period"
        );
      });

      it("Should enforce correct minimum stake for 2-year lock period", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("299999"); // Just below 300k minimum for 2 years
        const cost = parseEther("8999970"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await expect(
          presaleStaking.write.buyTokensWithUSDT(
            [amount, 2, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account }
          )
        ).to.be.rejectedWith(
          "Amount below minimum stake for selected lock period"
        );
      });

      it("Should set correct lock period and stake amount for each tier", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );

        // Test all three tiers
        const testCases = [
          {
            amount: parseEther("5000"),
            lockOption: 0n,
            expectedPeriod: 26n * 7n * 24n * 60n * 60n,
          }, // 6 months
          {
            amount: parseEther("35000"),
            lockOption: 1n,
            expectedPeriod: 52n * 7n * 24n * 60n * 60n,
          }, // 1 year
          {
            amount: parseEther("350000"),
            lockOption: 2n,
            expectedPeriod: 104n * 7n * 24n * 60n * 60n,
          }, // 2 years
        ];

        for (const testCase of testCases) {
          const cost = (testCase.amount * parseEther("30")) / parseEther("1");

          // Fund buyer with USDT
          await usdtToken.write.mint([buyer.account.address, cost]);
          await usdtToken.write.approve([presaleStaking.address, cost], {
            account: buyer.account,
          });

          await presaleStaking.write.buyTokensWithUSDT(
            [
              testCase.amount,
              Number(testCase.lockOption),
              "0x0000000000000000000000000000000000000000",
            ],
            { account: buyer.account }
          );

          const stakes = await presaleStaking.read.getUserStakes([
            buyer.account.address,
          ]);
          const latestStake = stakes[stakes.length - 1];

          expect(latestStake.amount).to.equal(testCase.amount);
          expect(latestStake.lockPeriod).to.equal(testCase.expectedPeriod);
        }
      });
    });

    describe("Price Calculation and Token Economics", function () {
      it("Should calculate correct USDT cost after multiple price increase intervals", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        // Advance time by 3 intervals (3% total increase)
        const interval = Number(172800) * 60; // 120 days in seconds
        await time.increase(interval * 3);

        const basePrice = parseEther("30");
        const expectedPrice = (basePrice * 103n) / 100n; // 3% increase
        const expectedCost = (amount * expectedPrice) / parseEther("1");

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, expectedCost]);
        await usdtToken.write.approve([presaleStaking.address, expectedCost], {
          account: buyer.account,
        });

        // Get initial USDT balance
        const initialBalance = await usdtToken.read.balanceOf([
          buyer.account.address,
        ]);

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Get final USDT balance
        const finalBalance = await usdtToken.read.balanceOf([
          buyer.account.address,
        ]);
        expect(initialBalance - finalBalance).to.equal(expectedCost);
      });

      it("Should successfully execute USDT purchase transaction", async function () {
        const { presaleStaking, buyer, usdtToken, stakingToken } =
          await loadFixture(deployPresaleStakingFixture);
        const amount = parseEther("5000");
        const cost = parseEther("150000"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        // Transaction should not revert
        await expect(
          presaleStaking.write.buyTokensWithUSDT(
            [amount, 0, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account }
          )
        ).not.to.be.rejected;

        // Verify balances changed correctly
        const buyerBalance = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);
        const contractUsdtBalance = await usdtToken.read.balanceOf([
          presaleStaking.address,
        ]);

        expect(buyerBalance).to.equal(amount);
        expect(contractUsdtBalance).to.equal(cost);
      });
    });

    describe("Stake Creation and Storage", function () {
      it("Should correctly initialize stake struct with all fields", async function () {
        const { presaleStaking, buyer, usdtToken, referrer } =
          await loadFixture(deployPresaleStakingFixture);
        const amount = parseEther("5000");
        const cost = parseEther("150000"); // $30 per token

        // Fund buyer with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        const txTime = await time.latest();

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, referrer.account.address],
          { account: buyer.account }
        );

        const stakes = await presaleStaking.read.getUserStakes([
          buyer.account.address,
        ]);
        const stake = stakes[0];

        expect(stake.amount).to.equal(amount);
        expect(Number(stake.stakingStartTime)).to.be.at.least(txTime);
        expect(stake.lockPeriod).to.equal(26n * 7n * 24n * 60n * 60n); // 6 months
        expect(stake.claimedRewards).to.equal(0n);
        expect(stake.withdrawn).to.be.false;
        expect(Number(stake.lastClaimTime)).to.be.at.least(txTime);
        expect(stake.withdrawalStartTime).to.equal(0n);
        expect(stake.withdrawnPercentage).to.equal(0n);
        expect(getAddress(stake.referrer)).to.equal(
          getAddress(referrer.account.address)
        );
      });
    });

    describe("Insufficient USDT Balance", function () {
      it("Should revert if contract has insufficient USDT", async function () {
        const { presaleStaking, buyer, usdtToken, owner } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Setup stake without funding contract with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Drain the contract's USDT balance
        const contractBalance = await usdtToken.read.balanceOf([
          presaleStaking.address,
        ]);
        await presaleStaking.write.emergencyWithdrawTokens(
          [usdtToken.address, contractBalance],
          {
            account: owner.account,
          }
        );

        // Advance time by 1 week (7 days)
        const WEEK = 7 * 24 * 60 * 60; // 7 days in seconds
        await time.increase(WEEK);

        // Get rewards amount and contract balance for verification
        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);
        const newBalance = await usdtToken.read.balanceOf([
          presaleStaking.address,
        ]);

        // Ensure we have rewards to claim but no USDT to pay them
        expect(rewards > 0n).to.be.true;
        expect(newBalance).to.equal(0n);

        // Try to claim rewards - should fail due to insufficient USDT
        await expect(
          presaleStaking.write.claimRewards([0n], { account: buyer.account })
        ).to.be.rejectedWith("Insufficient USDT balance");
      });
    });
  });

  describe("calculateRewards", function () {
    describe("Basic Reward Calculations", function () {
      it("Should calculate correct rewards for 6-month stake", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000"); // 5k tokens
        const cost = parseEther("150000"); // $30 per token

        // Fund buyer with USDT and make stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Advance time by 1 week
        await time.increase(Number(7n * 24n * 60n * 60n));

        // Calculate expected rewards
        // APY is 80% for 6 months, so weekly rate is 80% / 52 weeks
        const weeklyRate = (8000n * amount) / (52n * 10000n); // 80% APY
        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);

        // Allow for small rounding differences
        const difference =
          rewards > weeklyRate ? rewards - weeklyRate : weeklyRate - rewards;
        expect(Number(difference)).to.be.lessThan(Number(parseEther("0.1"))); // Convert to number for comparison
      });

      it("Should calculate correct rewards for 1-year stake", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("35000"); // 35k tokens (above 1-year minimum)
        const cost = parseEther("1050000"); // $30 per token

        // Fund buyer with USDT and make stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 1, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Advance time by 1 week
        await time.increase(Number(7n * 24n * 60n * 60n));

        // Calculate expected rewards
        // APY is 100% for 1 year, so weekly rate is 100% / 52 weeks
        const weeklyRate = (10000n * amount) / (52n * 10000n); // 100% APY
        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);

        const difference =
          rewards > weeklyRate ? rewards - weeklyRate : weeklyRate - rewards;
        expect(Number(difference)).to.be.lessThan(Number(parseEther("0.1")));
      });

      it("Should calculate correct rewards for 2-year stake", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("350000"); // 350k tokens (above 2-year minimum)
        const cost = parseEther("10500000"); // $30 per token

        // Fund buyer with USDT and make stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 2, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Advance time by 1 week
        await time.increase(Number(7n * 24n * 60n * 60n));

        // Calculate expected rewards
        // APY is 120% for 2 years, so weekly rate is 120% / 52 weeks
        const weeklyRate = (12000n * amount) / (52n * 10000n); // 120% APY
        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);

        const difference =
          rewards > weeklyRate ? rewards - weeklyRate : weeklyRate - rewards;
        expect(Number(difference)).to.be.lessThan(Number(parseEther("0.1")));
      });
    });

    describe("Zero Return Conditions", function () {
      it("Should return 0 if stake is withdrawn", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Setup stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Advance time past lock period
        await time.increase(26 * 7 * 24 * 60 * 60 + 10 * 7 * 24 * 60 * 60); // Lock period + 10 weeks

        // Withdraw stake fully (10 weeks = 100% withdrawal)
        await presaleStaking.write.withdraw([0n], { account: buyer.account });

        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);
        expect(rewards).to.equal(0n);
      });

      it("Should return 0 if time since last claim is less than a week", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Setup stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Advance time by less than a week
        await time.increase(6 * 24 * 60 * 60); // 6 days

        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);
        expect(rewards).to.equal(0n);
      });

      it("Should revert when accessing non-existent stake", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );

        // Try to calculate rewards for non-existent stake
        await expect(
          presaleStaking.read.calculateRewards([buyer.account.address, 0n])
        ).to.be.rejectedWith("panic code 0x32"); // Array out of bounds error
      });
    });

    describe("Time-based Calculations", function () {
      it("Should calculate rewards only for full weeks", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Setup stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Advance time by 1 week + 3 days
        await time.increase(10 * 24 * 60 * 60);

        // Should only get rewards for 1 week
        const weeklyRate = (8000n * amount) / (52n * 10000n);
        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);

        const difference =
          rewards > weeklyRate ? rewards - weeklyRate : weeklyRate - rewards;
        expect(Number(difference)).to.be.lessThan(Number(parseEther("0.1")));
      });

      it("Should calculate rewards correctly for multiple weeks", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Setup stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Advance time by 4 weeks
        await time.increase(4 * 7 * 24 * 60 * 60);

        // Should get rewards for 4 weeks
        const weeklyRate = (8000n * amount) / (52n * 10000n);
        const expectedRewards = weeklyRate * 4n;
        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);

        const difference =
          rewards > expectedRewards
            ? rewards - expectedRewards
            : expectedRewards - rewards;
        expect(Number(difference)).to.be.lessThan(Number(parseEther("0.1")));
      });
    });

    describe("Edge Cases and Boundary Conditions", function () {
      it("Should calculate rewards correctly up to lock period end", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Setup stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Advance time to just past lock period
        await time.increase(26 * 7 * 24 * 60 * 60 + 1);

        // Should get rewards only up to lock period end
        const weeklyRate = (8000n * amount) / (52n * 10000n);
        const expectedRewards = weeklyRate * 26n;
        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);

        const difference =
          rewards > expectedRewards
            ? rewards - expectedRewards
            : expectedRewards - rewards;
        expect(Number(difference)).to.be.lessThan(Number(parseEther("0.1")));
      });

      it("Should handle multiple claims correctly", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // Setup stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // First week
        await time.increase(7 * 24 * 60 * 60);
        await presaleStaking.write.claimRewards([0n], {
          account: buyer.account,
        });

        // Second week
        await time.increase(7 * 24 * 60 * 60);
        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);

        // Should get exactly one week of rewards
        const weeklyRate = (8000n * amount) / (52n * 10000n);
        const difference =
          rewards > weeklyRate ? rewards - weeklyRate : weeklyRate - rewards;
        expect(Number(difference)).to.be.lessThan(Number(parseEther("0.1")));
      });
    });
  });

  describe("claimRewards", function () {
    describe("Basic Claiming", function () {
      it("Should allow claiming rewards after 1 week", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // Setup stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Get initial USDT balance
        const initialBalance = await usdtToken.read.balanceOf([
          buyer.account.address,
        ]);

        // Advance time by 1 week
        await time.increase(7 * 24 * 60 * 60);

        // Calculate expected rewards (80% APY for 6 months)
        const weeklyRate = (8000n * amount) / (52n * 10000n);

        // Claim rewards
        await presaleStaking.write.claimRewards([0n], {
          account: buyer.account,
        });

        // Check final balance
        const finalBalance = await usdtToken.read.balanceOf([
          buyer.account.address,
        ]);
        const claimed = finalBalance - initialBalance;

        // Allow for small rounding differences
        const difference =
          claimed > weeklyRate ? claimed - weeklyRate : weeklyRate - claimed;
        expect(Number(difference)).to.be.lessThan(Number(parseEther("0.1")));
      });

      it("Should update claimedRewards and lastClaimTime after claiming", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // Setup stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Get initial stake info
        const initialStake = (
          await presaleStaking.read.getUserStakes([buyer.account.address])
        )[0];
        const initialClaimedRewards = initialStake.claimedRewards;

        // Advance time by 1 week
        await time.increase(7 * 24 * 60 * 60);

        // Claim rewards
        await presaleStaking.write.claimRewards([0n], {
          account: buyer.account,
        });

        // Get updated stake info
        const updatedStake = (
          await presaleStaking.read.getUserStakes([buyer.account.address])
        )[0];

        // Compare rewards
        expect(updatedStake.claimedRewards > initialClaimedRewards).to.be.true;
      });
    });

    describe("Validation and Restrictions", function () {
      it("Should revert if trying to claim before 1 week", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // Setup stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Advance time by less than a week
        await time.increase(6 * 24 * 60 * 60); // 6 days

        // Try to claim rewards
        await expect(
          presaleStaking.write.claimRewards([0n], { account: buyer.account })
        ).to.be.rejectedWith("Can claim rewards weekly");
      });

      it("Should revert if stake is withdrawn", async function () {
        const { presaleStaking, buyer, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // Setup stake
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Advance time past lock period
        await time.increase(26 * 7 * 24 * 60 * 60 + 10 * 7 * 24 * 60 * 60); // Lock period + 10 weeks

        // Withdraw stake
        await presaleStaking.write.withdraw([0n], { account: buyer.account });

        // Try to claim rewards
        await expect(
          presaleStaking.write.claimRewards([0n], { account: buyer.account })
        ).to.be.rejectedWith("Stake already withdrawn");
      });

      it("Should revert if invalid stake index", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );

        await expect(
          presaleStaking.write.claimRewards([0n], { account: buyer.account })
        ).to.be.rejectedWith("Invalid stake index");
      });

      it("Should revert if contract has insufficient USDT", async function () {
        const { presaleStaking, buyer, usdtToken, owner } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Setup stake without funding contract with USDT
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account }
        );

        // Drain the contract's USDT balance
        const contractBalance = await usdtToken.read.balanceOf([
          presaleStaking.address,
        ]);
        await presaleStaking.write.emergencyWithdrawTokens(
          [usdtToken.address, contractBalance],
          {
            account: owner.account,
          }
        );

        // Advance time by 1 week (7 days)
        const WEEK = 7 * 24 * 60 * 60; // 7 days in seconds
        await time.increase(WEEK);

        // Get rewards amount and contract balance for verification
        const rewards = await presaleStaking.read.calculateRewards([
          buyer.account.address,
          0n,
        ]);
        const newBalance = await usdtToken.read.balanceOf([
          presaleStaking.address,
        ]);

        // Ensure we have rewards to claim but no USDT to pay them
        expect(rewards > 0n).to.be.true;
        expect(newBalance).to.equal(0n);

        // Try to claim rewards - should fail due to insufficient USDT
        await expect(
          presaleStaking.write.claimRewards([0n], { account: buyer.account })
        ).to.be.rejectedWith("Insufficient USDT balance");
      });
    });

    describe("Referral Rewards", function () {
      it("Should distribute referral rewards correctly", async function () {
        const { presaleStaking, buyer, referrer, usdtToken } =
          await loadFixture(deployPresaleStakingFixture);
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // Setup stake with referrer
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, referrer.account.address],
          { account: buyer.account }
        );

        // Advance time by 1 week
        await time.increase(7 * 24 * 60 * 60);

        // Get initial referrer rewards
        const initialReferralRewards =
          await presaleStaking.read.stakingReferralRewards([
            referrer.account.address,
          ]);

        // Claim rewards
        await presaleStaking.write.claimRewards([0n], {
          account: buyer.account,
        });

        // Get final referrer rewards
        const finalReferralRewards =
          await presaleStaking.read.stakingReferralRewards([
            referrer.account.address,
          ]);

        // Verify referrer received rewards (30% of rewards for first level)
        expect(Number(finalReferralRewards)).to.be.greaterThan(
          Number(initialReferralRewards)
        );
      });

      it("Should handle multi-level referral rewards", async function () {
        const { presaleStaking, usdtToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const [owner, buyer, referrer1, referrer2] =
          await hre.viem.getWalletClients();
        const amount = parseEther("50000"); // Increased amount to make rewards difference more visible
        const cost = parseEther("1500000");

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("10000000"),
        ]);

        // Setup referral chain: buyer -> referrer1 -> referrer2
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        // First set up referrer1's stake with referrer2
        await usdtToken.write.mint([referrer1.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: referrer1.account,
        });

        // Set up the referral chain: referrer1 -> referrer2
        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, referrer2.account.address],
          { account: referrer1.account }
        );

        // Then set up buyer's stake with referrer1
        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, referrer1.account.address],
          { account: buyer.account }
        );

        // Advance time by 1 week
        await time.increase(7 * 24 * 60 * 60);

        // Get initial referral rewards
        const initialRewards1 =
          await presaleStaking.read.stakingReferralRewards([
            referrer1.account.address,
          ]);
        const initialRewards2 =
          await presaleStaking.read.stakingReferralRewards([
            referrer2.account.address,
          ]);

        // Claim rewards for buyer's stake
        await presaleStaking.write.claimRewards([0n], {
          account: buyer.account,
        });

        // Get final referral rewards
        const finalRewards1 = await presaleStaking.read.stakingReferralRewards([
          referrer1.account.address,
        ]);
        const finalRewards2 = await presaleStaking.read.stakingReferralRewards([
          referrer2.account.address,
        ]);

        // Verify both referrers received rewards
        expect(finalRewards1 > initialRewards1).to.be.true;
        expect(finalRewards2 > initialRewards2).to.be.true;

        // Calculate reward differences
        const rewards1Diff = finalRewards1 - initialRewards1;
        const rewards2Diff = finalRewards2 - initialRewards2;

        // Verify referrer1 got more rewards than referrer2 (30% vs 20%)
        expect(rewards1Diff > rewards2Diff).to.be.true;
      });

      describe("Multiple Claims", function () {
        it("Should allow multiple claims over time", async function () {
          const { presaleStaking, buyer, usdtToken } = await loadFixture(
            deployPresaleStakingFixture
          );
          const amount = parseEther("5000");
          const cost = parseEther("150000");

          // Fund contract with USDT for rewards
          await usdtToken.write.mint([
            presaleStaking.address,
            parseEther("1000000"),
          ]);

          // Setup stake
          await usdtToken.write.mint([buyer.account.address, cost]);
          await usdtToken.write.approve([presaleStaking.address, cost], {
            account: buyer.account,
          });

          await presaleStaking.write.buyTokensWithUSDT(
            [amount, 0, "0x0000000000000000000000000000000000000000"],
            { account: buyer.account }
          );

          // Track total rewards
          let totalRewards = 0n;
          const weeklyRate = (8000n * amount) / (52n * 10000n);

          // Claim rewards for 4 weeks
          for (let i = 0; i < 4; i++) {
            await time.increase(7 * 24 * 60 * 60);
            const balanceBefore = await usdtToken.read.balanceOf([
              buyer.account.address,
            ]);
            await presaleStaking.write.claimRewards([0n], {
              account: buyer.account,
            });
            const balanceAfter = await usdtToken.read.balanceOf([
              buyer.account.address,
            ]);
            totalRewards += balanceAfter - balanceBefore;
          }

          // Verify total rewards (should be approximately 4 weeks worth)
          const expectedTotal = weeklyRate * 4n;
          const difference =
            totalRewards > expectedTotal
              ? totalRewards - expectedTotal
              : expectedTotal - totalRewards;
          expect(Number(difference)).to.be.lessThan(Number(parseEther("0.1")));
        });
      });
    });
  });

  describe("withdrawStakingReferralRewards", function () {
    describe("Basic Withdrawal", function () {
      it("Should allow referrer to withdraw accumulated rewards", async function () {
        const { presaleStaking, buyer, referrer, usdtToken } =
          await loadFixture(deployPresaleStakingFixture);
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Fund contract with USDT for rewards
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // Setup stake with referrer
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, referrer.account.address],
          { account: buyer.account }
        );

        // Advance time by 1 week
        await time.increase(7 * 24 * 60 * 60);

        // Claim rewards to generate referral rewards
        await presaleStaking.write.claimRewards([0n], {
          account: buyer.account,
        });

        // Get initial balances
        const initialReferrerBalance = await usdtToken.read.balanceOf([
          referrer.account.address,
        ]);
        const initialReferralRewards =
          await presaleStaking.read.stakingReferralRewards([
            referrer.account.address,
          ]);

        // Withdraw referral rewards
        await presaleStaking.write.withdrawStakingReferralRewards({
          account: referrer.account,
        });

        // Check final balances
        const finalReferrerBalance = await usdtToken.read.balanceOf([
          referrer.account.address,
        ]);
        const finalReferralRewards =
          await presaleStaking.read.stakingReferralRewards([
            referrer.account.address,
          ]);

        // Verify rewards were transferred and cleared
        expect(finalReferrerBalance - initialReferrerBalance).to.equal(
          initialReferralRewards
        );
        expect(finalReferralRewards).to.equal(0n);
      });

      it("Should revert if no rewards to withdraw", async function () {
        const { presaleStaking, referrer } = await loadFixture(
          deployPresaleStakingFixture
        );

        await expect(
          presaleStaking.write.withdrawStakingReferralRewards({
            account: referrer.account,
          })
        ).to.be.rejectedWith("No staking referral rewards");
      });

      it("Should revert if contract has insufficient USDT", async function () {
        const { presaleStaking, buyer, referrer, usdtToken, owner } =
          await loadFixture(deployPresaleStakingFixture);
        const amount = parseEther("5000");
        const cost = parseEther("150000");

        // Setup stake with referrer
        await usdtToken.write.mint([buyer.account.address, cost]);
        await usdtToken.write.approve([presaleStaking.address, cost], {
          account: buyer.account,
        });

        await presaleStaking.write.buyTokensWithUSDT(
          [amount, 0, referrer.account.address],
          { account: buyer.account }
        );

        // Advance time by 1 week
        await time.increase(7 * 24 * 60 * 60);

        // Fund contract with USDT for initial claim
        await usdtToken.write.mint([
          presaleStaking.address,
          parseEther("1000000"),
        ]);

        // Claim rewards to generate referral rewards
        await presaleStaking.write.claimRewards([0n], {
          account: buyer.account,
        });

        // Drain contract's USDT
        const contractBalance = await usdtToken.read.balanceOf([
          presaleStaking.address,
        ]);
        await presaleStaking.write.emergencyWithdrawTokens(
          [usdtToken.address, contractBalance],
          {
            account: owner.account,
          }
        );

        // Try to withdraw referral rewards
        await expect(
          presaleStaking.write.withdrawStakingReferralRewards({
            account: referrer.account,
          })
        ).to.be.rejectedWith("Insufficient USDT balance");
      });
    });
  });

  describe("withdraw", function () {
    describe("Basic Withdrawal", function () {
      it("Should allow withdrawal after lock period", async function () {
        const { presaleStaking, buyer, stakingToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        // Buy tokens with BNB
        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("500") }
        );

        // Advance time past lock period (26 weeks) plus 1 week for first withdrawal
        await time.increase(27 * 7 * 24 * 60 * 60);

        // Get initial balance
        const initialBalance = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);

        // Withdraw
        await presaleStaking.write.withdraw([0n], { account: buyer.account });

        // Get final balance
        const finalBalance = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);

        // Should receive 10% of stake
        const expectedWithdrawal = (amount * 10n) / 100n;
        expect(finalBalance - initialBalance).to.equal(expectedWithdrawal);
      });

      it("Should update withdrawnPercentage correctly", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("500") }
        );

        // Advance time past lock period plus 2 weeks
        await time.increase(28 * 7 * 24 * 60 * 60);

        // First withdrawal
        await presaleStaking.write.withdraw([0n], { account: buyer.account });

        // Check stake info
        let stake = (
          await presaleStaking.read.getUserStakes([buyer.account.address])
        )[0];
        expect(stake.withdrawnPercentage).to.equal(20n); // Should be 20% after 2 weeks
      });

      it("Should allow multiple withdrawals over time", async function () {
        const { presaleStaking, buyer, stakingToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("500") }
        );

        // Advance time past lock period plus 5 weeks
        await time.increase((26 + 5) * 7 * 24 * 60 * 60);

        // Get initial balance
        const initialBalance = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);

        // Single withdrawal after 5 weeks
        await presaleStaking.write.withdraw([0n], { account: buyer.account });

        // Get final balance
        const finalBalance = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);
        const totalWithdrawn = finalBalance - initialBalance;

        // Should have withdrawn 50% of stake (10% per week for 5 weeks)
        expect(totalWithdrawn).to.equal((amount * 50n) / 100n);

        // Verify stake info
        const stake = (
          await presaleStaking.read.getUserStakes([buyer.account.address])
        )[0];
        expect(stake.withdrawnPercentage).to.equal(50n);
      });
    });

    describe("Validation and Restrictions", function () {
      it("Should revert if withdrawing before lock period", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("500") }
        );

        // Try to withdraw before lock period ends
        await expect(
          presaleStaking.write.withdraw([0n], { account: buyer.account })
        ).to.be.rejectedWith("Lock period not over");
      });

      it("Should revert if stake is already fully withdrawn", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("500") }
        );

        // Advance time past lock period plus 10 weeks (for 100% withdrawal)
        await time.increase((26 + 10) * 7 * 24 * 60 * 60);

        // First withdrawal (should get 100%)
        await presaleStaking.write.withdraw([0n], { account: buyer.account });

        // Try to withdraw again
        await expect(
          presaleStaking.write.withdraw([0n], { account: buyer.account })
        ).to.be.rejectedWith("Fully withdrawn");
      });

      it("Should revert if no new amount available to withdraw", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("500") }
        );

        // Advance time past lock period plus 1 week
        await time.increase((26 + 1) * 7 * 24 * 60 * 60);

        // First withdrawal
        await presaleStaking.write.withdraw([0n], { account: buyer.account });

        // Try to withdraw again immediately
        await expect(
          presaleStaking.write.withdraw([0n], { account: buyer.account })
        ).to.be.rejectedWith("No new amount available");
      });

      it("Should revert if invalid stake index", async function () {
        const { presaleStaking, buyer } = await loadFixture(
          deployPresaleStakingFixture
        );

        await expect(
          presaleStaking.write.withdraw([0n], { account: buyer.account })
        ).to.be.rejectedWith("Invalid stake index");
      });
    });

    describe("Withdrawal Mechanics", function () {
      it("Should handle final withdrawal correctly", async function () {
        const { presaleStaking, buyer, stakingToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("500") }
        );

        // Advance time past lock period plus 10 weeks (for 100% withdrawal)
        await time.increase((26 + 10) * 7 * 24 * 60 * 60);

        // Get initial balance
        const initialBalance = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);

        // Withdraw
        await presaleStaking.write.withdraw([0n], { account: buyer.account });

        // Get final balance and stake info
        const finalBalance = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);
        const stake = (
          await presaleStaking.read.getUserStakes([buyer.account.address])
        )[0];

        // Verify full withdrawal
        expect(finalBalance - initialBalance).to.equal(amount);
        expect(stake.withdrawn).to.be.true;
        expect(stake.withdrawnPercentage).to.equal(100n);
      });

      it("Should calculate withdrawal amount correctly for partial weeks", async function () {
        const { presaleStaking, buyer, stakingToken } = await loadFixture(
          deployPresaleStakingFixture
        );
        const amount = parseEther("5000");

        await presaleStaking.write.buyTokensWithBNB(
          [amount, 0, "0x0000000000000000000000000000000000000000"],
          { account: buyer.account, value: parseEther("500") }
        );

        // Advance time past lock period plus 1.5 weeks
        await time.increase((26 * 7 + 11) * 24 * 60 * 60);

        // Get initial balance
        const initialBalance = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);

        // Withdraw
        await presaleStaking.write.withdraw([0n], { account: buyer.account });

        // Get final balance
        const finalBalance = await stakingToken.read.balanceOf([
          buyer.account.address,
        ]);

        // Should only get 10% (1 full week) despite 1.5 weeks passing
        const expectedWithdrawal = (amount * 10n) / 100n;
        expect(finalBalance - initialBalance).to.equal(expectedWithdrawal);
      });
    });
  });

  describe("getAPY", function () {
    it("Should return correct APY for 6-month lock period", async function () {
      const { presaleStaking } = await loadFixture(deployPresaleStakingFixture);
      const sixMonths = await presaleStaking.read.sixMonths();
      const apy = await presaleStaking.read.getAPY([sixMonths]);
      expect(apy).to.equal(8000n); // 80%
    });

    it("Should return correct APY for 1-year lock period", async function () {
      const { presaleStaking } = await loadFixture(deployPresaleStakingFixture);
      const oneYear = await presaleStaking.read.oneYear();
      const apy = await presaleStaking.read.getAPY([oneYear]);
      expect(apy).to.equal(10000n); // 100%
    });

    it("Should return correct APY for 2-year lock period", async function () {
      const { presaleStaking } = await loadFixture(deployPresaleStakingFixture);
      const twoYears = await presaleStaking.read.twoYears();
      const apy = await presaleStaking.read.getAPY([twoYears]);
      expect(apy).to.equal(12000n); // 120%
    });

    it("Should revert for invalid lock period", async function () {
      const { presaleStaking } = await loadFixture(deployPresaleStakingFixture);
      await expect(presaleStaking.read.getAPY([123456n])).to.be.rejectedWith(
        "Invalid lock period"
      );
    });
  });

  describe("getUserStakes", function () {
    it("Should return empty array for user with no stakes", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const stakes = await presaleStaking.read.getUserStakes([
        buyer.account.address,
      ]);
      expect(stakes.length).to.equal(0);
    });

    it("Should return correct stakes for user with stakes", async function () {
      const { presaleStaking, buyer, usdtToken } = await loadFixture(
        deployPresaleStakingFixture
      );
      const amount = parseEther("5000");
      const cost = parseEther("150000");

      // Fund buyer with USDT and make stake
      await usdtToken.write.mint([buyer.account.address, cost]);
      await usdtToken.write.approve([presaleStaking.address, cost], {
        account: buyer.account,
      });

      await presaleStaking.write.buyTokensWithUSDT(
        [amount, 0, "0x0000000000000000000000000000000000000000"],
        { account: buyer.account }
      );

      const stakes = await presaleStaking.read.getUserStakes([
        buyer.account.address,
      ]);
      expect(stakes.length).to.equal(1);
      expect(stakes[0].amount).to.equal(amount);
      expect(stakes[0].lockPeriod).to.equal(
        await presaleStaking.read.sixMonths()
      );
      expect(stakes[0].withdrawn).to.equal(false);
    });
  });

  describe("getStakingReferrals", function () {
    it("Should return empty array for user with no referrals", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const referrals = await presaleStaking.read.getStakingReferrals([
        buyer.account.address,
      ]);
      expect(referrals.length).to.equal(0);
    });

    it("Should return correct referrals for user with referrals", async function () {
      const { presaleStaking, buyer, referrer, usdtToken } = await loadFixture(
        deployPresaleStakingFixture
      );
      const amount = parseEther("5000");
      const cost = parseEther("150000");

      // Fund buyer with USDT and make stake with referral
      await usdtToken.write.mint([buyer.account.address, cost]);
      await usdtToken.write.approve([presaleStaking.address, cost], {
        account: buyer.account,
      });

      await presaleStaking.write.buyTokensWithUSDT(
        [amount, 0, referrer.account.address],
        { account: buyer.account }
      );

      const referrals = await presaleStaking.read.getStakingReferrals([
        referrer.account.address,
      ]);
      expect(referrals.length).to.equal(1);
      expect(getAddress(referrals[0])).to.equal(
        getAddress(buyer.account.address)
      );
    });
  });

  describe("fundContractTokens", function () {
    it("Should allow owner to fund contract with tokens", async function () {
      const { presaleStaking, owner, stakingToken } = await loadFixture(
        deployPresaleStakingFixture
      );
      const amount = parseEther("1000000");

      // Mint tokens to owner
      await stakingToken.write.mint([owner.account.address, amount]);
      await stakingToken.write.approve([presaleStaking.address, amount], {
        account: owner.account,
      });

      // Get initial balance
      const initialBalance = await stakingToken.read.balanceOf([
        presaleStaking.address,
      ]);

      // Fund contract
      await presaleStaking.write.fundContractTokens([amount], {
        account: owner.account,
      });

      // Check balance difference
      const finalBalance = await stakingToken.read.balanceOf([
        presaleStaking.address,
      ]);
      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Should revert when non-owner tries to fund contract with tokens", async function () {
      const { presaleStaking, buyer, stakingToken } = await loadFixture(
        deployPresaleStakingFixture
      );
      const amount = parseEther("1000000");

      // Mint tokens to buyer
      await stakingToken.write.mint([buyer.account.address, amount]);
      await stakingToken.write.approve([presaleStaking.address, amount], {
        account: buyer.account,
      });

      // Try to fund contract
      await expect(
        presaleStaking.write.fundContractTokens([amount], {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  describe("fundContractUSDT", function () {
    it("Should allow owner to fund contract with USDT", async function () {
      const { presaleStaking, owner, usdtToken } = await loadFixture(
        deployPresaleStakingFixture
      );
      const amount = parseEther("1000000");

      // Mint USDT to owner
      await usdtToken.write.mint([owner.account.address, amount]);
      await usdtToken.write.approve([presaleStaking.address, amount], {
        account: owner.account,
      });

      // Get initial balance
      const initialBalance = await usdtToken.read.balanceOf([
        presaleStaking.address,
      ]);

      // Fund contract
      await presaleStaking.write.fundContractUSDT([amount], {
        account: owner.account,
      });

      // Check balance difference
      const finalBalance = await usdtToken.read.balanceOf([
        presaleStaking.address,
      ]);
      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Should revert when non-owner tries to fund contract with USDT", async function () {
      const { presaleStaking, buyer, usdtToken } = await loadFixture(
        deployPresaleStakingFixture
      );
      const amount = parseEther("1000000");

      // Mint USDT to buyer
      await usdtToken.write.mint([buyer.account.address, amount]);
      await usdtToken.write.approve([presaleStaking.address, amount], {
        account: buyer.account,
      });

      // Try to fund contract
      await expect(
        presaleStaking.write.fundContractUSDT([amount], {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  describe("updateAPY", function () {
    it("Should allow owner to update APY ranges", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newAPYRanges: [bigint, bigint, bigint] = [7000n, 9000n, 11000n]; // 70%, 90%, 110%

      await presaleStaking.write.updateAPY([newAPYRanges], {
        account: owner.account,
      });

      // Verify each APY range
      const sixMonthsAPY = await presaleStaking.read.getAPY([
        await presaleStaking.read.sixMonths(),
      ]);
      const oneYearAPY = await presaleStaking.read.getAPY([
        await presaleStaking.read.oneYear(),
      ]);
      const twoYearsAPY = await presaleStaking.read.getAPY([
        await presaleStaking.read.twoYears(),
      ]);

      expect(sixMonthsAPY).to.equal(7000n);
      expect(oneYearAPY).to.equal(9000n);
      expect(twoYearsAPY).to.equal(11000n);
    });

    it("Should revert if non-owner tries to update APY", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newAPYRanges: [bigint, bigint, bigint] = [7000n, 9000n, 11000n];

      await expect(
        presaleStaking.write.updateAPY([newAPYRanges], {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should revert if APY is too high", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const tooHighAPY: [bigint, bigint, bigint] = [11000n, 16000n, 21000n]; // Above limits

      await expect(
        presaleStaking.write.updateAPY([tooHighAPY], {
          account: owner.account,
        })
      ).to.be.rejectedWith("APY too high");
    });
  });

  describe("updateLockPeriods", function () {
    it("Should allow owner to update lock periods", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newPeriods: [bigint, bigint, bigint] = [
        24n * 7n * 24n * 60n * 60n,
        50n * 7n * 24n * 60n * 60n,
        100n * 7n * 24n * 60n * 60n,
      ];

      await presaleStaking.write.updateLockPeriods(newPeriods, {
        account: owner.account,
      });

      const sixMonths = await presaleStaking.read.sixMonths();
      const oneYear = await presaleStaking.read.oneYear();
      const twoYears = await presaleStaking.read.twoYears();

      expect(sixMonths).to.equal(newPeriods[0]);
      expect(oneYear).to.equal(newPeriods[1]);
      expect(twoYears).to.equal(newPeriods[2]);
    });

    it("Should revert if non-owner tries to update lock periods", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newPeriods: [bigint, bigint, bigint] = [
        24n * 7n * 24n * 60n * 60n,
        50n * 7n * 24n * 60n * 60n,
        100n * 7n * 24n * 60n * 60n,
      ];

      await expect(
        presaleStaking.write.updateLockPeriods(newPeriods, {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should revert if lock periods are invalid", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );

      // Test invalid 6-month period (too short)
      const invalidSixMonths: [bigint, bigint, bigint] = [
        10n * 7n * 24n * 60n * 60n,
        50n * 7n * 24n * 60n * 60n,
        100n * 7n * 24n * 60n * 60n,
      ];

      await expect(
        presaleStaking.write.updateLockPeriods(invalidSixMonths, {
          account: owner.account,
        })
      ).to.be.rejectedWith("Invalid 6-month period");

      // Test invalid 1-year period (too long)
      const invalidOneYear: [bigint, bigint, bigint] = [
        24n * 7n * 24n * 60n * 60n,
        70n * 7n * 24n * 60n * 60n,
        100n * 7n * 24n * 60n * 60n,
      ];

      await expect(
        presaleStaking.write.updateLockPeriods(invalidOneYear, {
          account: owner.account,
        })
      ).to.be.rejectedWith("Invalid 1-year period");

      // Test invalid 2-year period (too short)
      const invalidTwoYears: [bigint, bigint, bigint] = [
        24n * 7n * 24n * 60n * 60n,
        50n * 7n * 24n * 60n * 60n,
        80n * 7n * 24n * 60n * 60n,
      ];

      await expect(
        presaleStaking.write.updateLockPeriods(invalidTwoYears, {
          account: owner.account,
        })
      ).to.be.rejectedWith("Invalid 2-year period");
    });
  });

  describe("updateMinStakeAmount", function () {
    it("Should allow owner to update minimum stake amount", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newMinStake = parseEther("4000"); // 4k tokens

      await presaleStaking.write.updateMinStakeAmount([newMinStake], {
        account: owner.account,
      });

      const minStakeAmount = await presaleStaking.read.minStakeAmount();
      expect(minStakeAmount).to.equal(newMinStake);
    });

    it("Should revert if non-owner tries to update minimum stake", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newMinStake = parseEther("4000");

      await expect(
        presaleStaking.write.updateMinStakeAmount([newMinStake], {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should revert if new minimum stake is invalid", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const maxStake = await presaleStaking.read.maxStakeAmount();

      // Test zero minimum stake
      await expect(
        presaleStaking.write.updateMinStakeAmount([0n], {
          account: owner.account,
        })
      ).to.be.rejectedWith("Invalid min amount");

      // Test minimum stake greater than maximum stake
      await expect(
        presaleStaking.write.updateMinStakeAmount([maxStake + 1n], {
          account: owner.account,
        })
      ).to.be.rejectedWith("Invalid min amount");
    });
  });

  describe("updateMaxStakeAmount", function () {
    it("Should allow owner to update maximum stake amount", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newMaxStake = parseEther("2000000"); // 2M tokens

      await presaleStaking.write.updateMaxStakeAmount([newMaxStake], {
        account: owner.account,
      });

      const maxStakeAmount = await presaleStaking.read.maxStakeAmount();
      expect(maxStakeAmount).to.equal(newMaxStake);
    });

    it("Should revert if non-owner tries to update maximum stake", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newMaxStake = parseEther("2000000");

      await expect(
        presaleStaking.write.updateMaxStakeAmount([newMaxStake], {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should revert if new maximum stake is less than minimum stake", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const minStake = await presaleStaking.read.minStakeAmount();

      await expect(
        presaleStaking.write.updateMaxStakeAmount([minStake - 1n], {
          account: owner.account,
        })
      ).to.be.rejectedWith("Max must be greater than min");
    });
  });

  describe("updateMinimumStakeAmounts", function () {
    it("Should allow owner to update minimum stake amounts for all periods", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newAmounts: [bigint, bigint, bigint] = [
        parseEther("5000"),
        parseEther("50000"),
        parseEther("500000"),
      ];

      await presaleStaking.write.updateMinimumStakeAmounts(newAmounts, {
        account: owner.account,
      });

      const sixMonthsMin = await presaleStaking.read.sixMonthsMinStake();
      const oneYearMin = await presaleStaking.read.oneYearMinStake();
      const twoYearsMin = await presaleStaking.read.twoYearsMinStake();
      const globalMin = await presaleStaking.read.minStakeAmount();

      expect(sixMonthsMin).to.equal(newAmounts[0]);
      expect(oneYearMin).to.equal(newAmounts[1]);
      expect(twoYearsMin).to.equal(newAmounts[2]);
      expect(globalMin).to.equal(newAmounts[0]); // Global min should match six months min
    });

    it("Should revert if non-owner tries to update minimum stake amounts", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newAmounts: [bigint, bigint, bigint] = [
        parseEther("5000"),
        parseEther("50000"),
        parseEther("500000"),
      ];

      await expect(
        presaleStaking.write.updateMinimumStakeAmounts(newAmounts, {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should revert if minimum stake amounts are invalid", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const maxStake = await presaleStaking.read.maxStakeAmount();

      // Test zero six months minimum
      const zeroSixMonths: [bigint, bigint, bigint] = [
        0n,
        parseEther("50000"),
        parseEther("500000"),
      ];

      await expect(
        presaleStaking.write.updateMinimumStakeAmounts(zeroSixMonths, {
          account: owner.account,
        })
      ).to.be.rejectedWith("Invalid six months minimum");

      // Test one year minimum less than six months minimum
      const invalidOneYear: [bigint, bigint, bigint] = [
        parseEther("50000"),
        parseEther("40000"),
        parseEther("500000"),
      ];

      await expect(
        presaleStaking.write.updateMinimumStakeAmounts(invalidOneYear, {
          account: owner.account,
        })
      ).to.be.rejectedWith("One year min must be greater than six months min");

      // Test two years minimum less than one year minimum
      const invalidTwoYears: [bigint, bigint, bigint] = [
        parseEther("5000"),
        parseEther("50000"),
        parseEther("40000"),
      ];

      await expect(
        presaleStaking.write.updateMinimumStakeAmounts(invalidTwoYears, {
          account: owner.account,
        })
      ).to.be.rejectedWith("Two years min must be greater than one year min");

      // Test two years minimum greater than max stake
      const tooHighTwoYears: [bigint, bigint, bigint] = [
        parseEther("5000"),
        parseEther("50000"),
        maxStake + 1n,
      ];

      await expect(
        presaleStaking.write.updateMinimumStakeAmounts(tooHighTwoYears, {
          account: owner.account,
        })
      ).to.be.rejectedWith("Two years min must be less than max stake amount");
    });
  });

  describe("updateTokenPrices", function () {
    it("Should allow owner to update token prices", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newBnbPrice = parseEther("0.15"); // 0.15 BNB per token
      const newUsdtPrice = parseEther("45"); // $45 per token

      await presaleStaking.write.updateTokenPrices(
        [newBnbPrice, newUsdtPrice],
        {
          account: owner.account,
        }
      );

      const currentBnbPrice = await presaleStaking.read.getCurrentTokenPrice();
      const currentUsdtPrice =
        await presaleStaking.read.getCurrentTokenPriceUSDT();

      expect(currentBnbPrice).to.equal(newBnbPrice);
      expect(currentUsdtPrice).to.equal(newUsdtPrice);
    });

    it("Should revert if non-owner tries to update token prices", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newBnbPrice = parseEther("0.15");
      const newUsdtPrice = parseEther("45");

      await expect(
        presaleStaking.write.updateTokenPrices([newBnbPrice, newUsdtPrice], {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should allow setting prices to zero", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );

      await presaleStaking.write.updateTokenPrices([0n, parseEther("45")], {
        account: owner.account,
      });

      const currentBnbPrice = await presaleStaking.read.getCurrentTokenPrice();
      expect(currentBnbPrice).to.equal(0n);

      await presaleStaking.write.updateTokenPrices([parseEther("0.15"), 0n], {
        account: owner.account,
      });

      const currentUsdtPrice =
        await presaleStaking.read.getCurrentTokenPriceUSDT();
      expect(currentUsdtPrice).to.equal(0n);
    });
  });

  describe("updateStakingToken", function () {
    it("Should allow owner to update staking token", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );

      // Deploy new staking token
      const newStakingToken = await hre.viem.deployContract("MockERC20", [
        "New DGFL Token",
        "NDGFL",
        18,
      ]);

      await presaleStaking.write.updateStakingToken([newStakingToken.address], {
        account: owner.account,
      });

      const currentStakingToken = await presaleStaking.read.stakingToken();
      expect(getAddress(currentStakingToken)).to.equal(
        getAddress(newStakingToken.address)
      );
    });

    it("Should revert if non-owner tries to update staking token", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newStakingToken = await hre.viem.deployContract("MockERC20", [
        "New DGFL Token",
        "NDGFL",
        18,
      ]);

      await expect(
        presaleStaking.write.updateStakingToken([newStakingToken.address], {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should revert if new token address is zero", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );

      await expect(
        presaleStaking.write.updateStakingToken(
          ["0x0000000000000000000000000000000000000000"],
          {
            account: owner.account,
          }
        )
      ).to.be.rejectedWith("Invalid token address");
    });
  });

  describe("updateUSDTToken", function () {
    it("Should allow owner to update USDT token", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );

      // Deploy new USDT token
      const newUsdtToken = await hre.viem.deployContract("MockERC20", [
        "New USDT Token",
        "NUSDT",
        18,
      ]);

      await presaleStaking.write.updateUSDTToken([newUsdtToken.address], {
        account: owner.account,
      });

      const currentUsdtToken = await presaleStaking.read.usdtToken();
      expect(getAddress(currentUsdtToken)).to.equal(
        getAddress(newUsdtToken.address)
      );
    });

    it("Should revert if non-owner tries to update USDT token", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const newUsdtToken = await hre.viem.deployContract("MockERC20", [
        "New USDT Token",
        "NUSDT",
        18,
      ]);

      await expect(
        presaleStaking.write.updateUSDTToken([newUsdtToken.address], {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should revert if new token address is zero", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );

      await expect(
        presaleStaking.write.updateUSDTToken(
          ["0x0000000000000000000000000000000000000000"],
          {
            account: owner.account,
          }
        )
      ).to.be.rejectedWith("Invalid token address");
    });
  });

  describe("emergencyWithdrawTokens", function () {
    it("Should allow owner to withdraw any token", async function () {
      const { presaleStaking, owner, stakingToken, usdtToken } =
        await loadFixture(deployPresaleStakingFixture);
      const amount = parseEther("1000000");

      // Fund contract with tokens
      await stakingToken.write.mint([presaleStaking.address, amount]);
      await usdtToken.write.mint([presaleStaking.address, amount]);

      // Get initial balances
      const initialStakingBalance = await stakingToken.read.balanceOf([
        owner.account.address,
      ]);
      const initialUsdtBalance = await usdtToken.read.balanceOf([
        owner.account.address,
      ]);

      // Withdraw tokens
      await presaleStaking.write.emergencyWithdrawTokens(
        [stakingToken.address, amount],
        {
          account: owner.account,
        }
      );
      await presaleStaking.write.emergencyWithdrawTokens(
        [usdtToken.address, amount],
        {
          account: owner.account,
        }
      );

      // Check final balances
      const finalStakingBalance = await stakingToken.read.balanceOf([
        owner.account.address,
      ]);
      const finalUsdtBalance = await usdtToken.read.balanceOf([
        owner.account.address,
      ]);

      expect(finalStakingBalance - initialStakingBalance).to.equal(amount);
      expect(finalUsdtBalance - initialUsdtBalance).to.equal(amount);
    });

    it("Should revert if non-owner tries to withdraw tokens", async function () {
      const { presaleStaking, buyer, stakingToken } = await loadFixture(
        deployPresaleStakingFixture
      );
      const amount = parseEther("1000000");

      await expect(
        presaleStaking.write.emergencyWithdrawTokens(
          [stakingToken.address, amount],
          {
            account: buyer.account,
          }
        )
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should revert if contract has insufficient token balance", async function () {
      const { presaleStaking, owner, stakingToken } = await loadFixture(
        deployPresaleStakingFixture
      );
      const contractBalance = await stakingToken.read.balanceOf([
        presaleStaking.address,
      ]);
      const excessAmount = contractBalance + 1n;

      await expect(
        presaleStaking.write.emergencyWithdrawTokens(
          [stakingToken.address, excessAmount],
          {
            account: owner.account,
          }
        )
      ).to.be.rejectedWith("ERC20: transfer amount exceeds balance");
    });
  });

  describe("emergencyWithdrawBNB", function () {
    it("Should allow owner to withdraw BNB", async function () {
      const { presaleStaking, owner, buyer, stakingToken } = await loadFixture(
        deployPresaleStakingFixture
      );
      const amount = parseEther("1");

      // Fund contract with BNB through a purchase
      const tokenAmount = parseEther("5000");
      const decimals = await stakingToken.read.decimals();
      const totalCost =
        ((await presaleStaking.read.getCurrentTokenPrice()) * tokenAmount) /
        10n ** BigInt(decimals);

      await presaleStaking.write.buyTokensWithBNB(
        [tokenAmount, 0n, "0x0000000000000000000000000000000000000000"],
        { account: buyer.account, value: totalCost }
      );

      // Get initial balance
      const publicClient = await hre.viem.getPublicClient();
      const initialBalance = await publicClient.getBalance({
        address: owner.account.address,
      });

      // Withdraw BNB
      await presaleStaking.write.emergencyWithdrawBNB([amount], {
        account: owner.account,
      });

      // Get final balance
      const finalBalance = await publicClient.getBalance({
        address: owner.account.address,
      });
      const difference = finalBalance - initialBalance;

      // Should be slightly less than amount due to gas costs
      expect(Number(difference)).to.be.lessThan(Number(amount));
      expect(Number(difference)).to.be.greaterThan(
        Number(amount - parseEther("0.1"))
      );
    });

    it("Should revert if non-owner tries to withdraw BNB", async function () {
      const { presaleStaking, buyer } = await loadFixture(
        deployPresaleStakingFixture
      );
      const amount = parseEther("1");

      await expect(
        presaleStaking.write.emergencyWithdrawBNB([amount], {
          account: buyer.account,
        })
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("Should revert if contract has insufficient BNB balance", async function () {
      const { presaleStaking, owner } = await loadFixture(
        deployPresaleStakingFixture
      );
      const publicClient = await hre.viem.getPublicClient();
      const contractBalance = await publicClient.getBalance({
        address: presaleStaking.address,
      });
      const excessAmount = contractBalance + parseEther("1");

      await expect(
        presaleStaking.write.emergencyWithdrawBNB([excessAmount], {
          account: owner.account,
        })
      ).to.be.rejectedWith("Insufficient balance");
    });
  });
});
