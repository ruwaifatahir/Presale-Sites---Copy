import PayWithStyleWrapper from "./PayWith.style";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { PRESALE_ADDRESS, USDT_ADDRESS } from "../../config/constants";
import { PRESALE_ABI } from "../../config/presaleAbi";
import { IERC20_ABI } from "../../config/erc20Abi";
import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { formatUnits, parseEther, isAddress, parseUnits } from "viem";
import Dropdown from "./Dropdown/Dropdown";

/**
 * Deploy staking token
 * Deploy presale contract (set staking token, deposit staking tokens, set base price, set owner)
 * Check getTokenPrice response
 */

// Define Zero Address
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const STAKE_PLAN_OPTIONS = [
  { label: "Plan 1 - 80% APY (Min: 100 DIGI)", value: 0 },
  { label: "Plan 2 - 80% APY (Min: 100 DIGI)", value: 1 },
  { label: "Plan 3 - 80% APY (Min: 100 DIGI)", value: 2 },
];

const PAYMENT_OPTIONS = [
  { label: "Pay with BNB", value: "BNB" },
  { label: "Pay with USDT", value: "USDT" },
];

const PayWith = ({ variant }) => {
  const [input, setInput] = useState("");
  const [selectedStakePlan, setSelectedStakePlan] = useState(
    STAKE_PLAN_OPTIONS[0].value
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    PAYMENT_OPTIONS[0].value
  );
  const [urlReferralAddress, setUrlReferralAddress] = useState(ZERO_ADDRESS);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const { address, isConnected } = useAccount();
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
  } = useWriteContract();
  const { openConnectModal } = useConnectModal();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Track transaction states
  const [approvalTxHash, setApprovalTxHash] = useState(null);
  const [stakeTxHash, setStakeTxHash] = useState(null);

  // Wait for approval transaction
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({
      hash: approvalTxHash,
    });

  // Wait for stake transaction
  const { isLoading: isStakeConfirming, isSuccess: isStakeConfirmed } =
    useWaitForTransactionReceipt({
      hash: stakeTxHash,
    });

  // Get USDT allowance
  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: IERC20_ABI,
    functionName: "allowance",
    args: [address || ZERO_ADDRESS, PRESALE_ADDRESS],
    chainId: 97,
    query: {
      enabled: !!address && selectedPaymentMethod === "USDT",
    },
  });

  // Get USDT decimals to use correct decimal places
  const { data: usdtDecimals } = useReadContract({
    address: USDT_ADDRESS,
    abi: IERC20_ABI,
    functionName: "decimals",
    chainId: 97,
    query: {
      enabled: selectedPaymentMethod === "USDT",
    },
  });

  // Auto-refetch allowance when approval is confirmed
  useEffect(() => {
    if (isApprovalConfirmed) {
      refetchAllowance();
      setApprovalTxHash(null);
    }
  }, [isApprovalConfirmed, refetchAllowance]);

  // Check if user already staked in selected plan
  const { data: userStakeInfo, refetch: refetchUserStakeInfo } =
    useReadContract({
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "getStakeInfo",
      args: [address || ZERO_ADDRESS, selectedStakePlan],
      chainId: 97,
      query: {
        enabled: !!address,
      },
    });

  // Reset stake transaction hash when confirmed - moved here after refetchUserStakeInfo is declared
  useEffect(() => {
    if (isStakeConfirmed) {
      setStakeTxHash(null);
      setInput(""); // Clear input after successful stake

      // Refetch user stake info immediately
      refetchUserStakeInfo();

      // Emit custom event for other components to refresh
      window.dispatchEvent(
        new CustomEvent("stakeConfirmed", {
          detail: { address, stakePlan: selectedStakePlan },
        })
      );

      console.log("Stake confirmed - triggering data refresh");
    }
  }, [isStakeConfirmed, refetchUserStakeInfo, address, selectedStakePlan]);

  // Get contract data
  const contractCalls = [
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "getTokenPrice",
      chainId: 97,
    },
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "getBnbPrice",
      chainId: 97,
    },
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "stakePlans",
      args: [selectedStakePlan],
      chainId: 97,
    },
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "HARDCAP",
      chainId: 97,
    },
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "totalInvestedTokens",
      chainId: 97,
    },
  ];

  const { data: contractData, isLoading: isContractDataLoading } =
    useReadContracts({
      contracts: contractCalls,
      query: {
        enabled: true,
        retry: 3,
      },
    });

  // Extract contract data
  const tokenPrice = contractData?.[0]?.result || 0n;
  const bnbPrice = contractData?.[1]?.result || 0n;
  const stakePlanRaw = contractData?.[2]?.result || {
    apy: 0n,
    lockDuration: 0n,
    minStakeAmount: 0n,
  };
  const hardcap = contractData?.[3]?.result || 0n;
  const totalInvested = contractData?.[4]?.result || 0n;

  // Memoize stakePlan to prevent dependency issues
  const stakePlan = useMemo(() => stakePlanRaw, [stakePlanRaw]);

  // Calculate tokens to get
  const tokensToGet = useMemo(() => {
    if (!input || !tokenPrice || tokenPrice === 0n) return "0";

    try {
      if (selectedPaymentMethod === "BNB") {
        if (!bnbPrice || bnbPrice === 0n) return "0";

        const bnbAmount = parseEther(input);
        const usdValue = (bnbAmount * bnbPrice) / 100000000n; // bnbPrice is in 8 decimals
        const tokens = (usdValue * parseEther("1")) / tokenPrice;
        return formatUnits(tokens, 18);
      } else {
        // USDT payment
        const usdtAmount = parseUnits(input, usdtDecimals || 18);
        // Convert USDT to 18 decimals for the contract if needed
        const usdtAmountIn18Decimals =
          usdtDecimals === 6
            ? usdtAmount * 1000000000000n // multiply by 10^12 to convert from 6 to 18 decimals
            : usdtAmount; // already in 18 decimals
        const usdValue = usdtAmountIn18Decimals; // USDT is already in 18 decimals
        const tokens = (usdValue * parseEther("1")) / tokenPrice;
        return formatUnits(tokens, 18);
      }
    } catch (error) {
      console.error("Error calculating tokens:", error);
      return "0";
    }
  }, [input, tokenPrice, bnbPrice, selectedPaymentMethod, usdtDecimals]);

  // Calculate estimated rewards
  const rewardsCalculation = useMemo(() => {
    // Early return if no input
    if (!input || Number(input) <= 0) {
      return {
        totalRewards: "0",
        weeklyRewards: "0",
      };
    }

    try {
      // Calculate the USD investment amount
      let investAmountUSD = 0;

      if (selectedPaymentMethod === "BNB") {
        // For BNB: input amount * BNB price in USD
        if (!bnbPrice || bnbPrice === 0n) {
          return { totalRewards: "0", weeklyRewards: "0" };
        }
        investAmountUSD =
          parseFloat(input) * parseFloat(formatUnits(bnbPrice, 8));
      } else {
        // For USDT: input amount is already in USD (since USDT ≈ $1)
        investAmountUSD = parseFloat(input);
      }

      // Validate investment amount
      if (investAmountUSD <= 0 || isNaN(investAmountUSD)) {
        return { totalRewards: "0", weeklyRewards: "0" };
      }

      // Get APY and lock duration from stake plan
      let apy = 80; // Default 80% APY as fallback
      let lockDurationSeconds = 7 * 24 * 60 * 60; // Default 1 week in seconds

      if (stakePlan?.apy && stakePlan.apy > 0n) {
        apy = parseFloat(formatUnits(stakePlan.apy, 18));
      }

      if (stakePlan?.lockDuration && stakePlan.lockDuration > 0n) {
        lockDurationSeconds = Number(stakePlan.lockDuration);
      }

      if (apy <= 0 || isNaN(apy)) {
        return { totalRewards: "0", weeklyRewards: "0" };
      }

      // Calculate rewards based on actual lock period
      const lockDurationWeeks = lockDurationSeconds / (7 * 24 * 60 * 60); // Convert seconds to weeks
      const annualRewards = (investAmountUSD * apy) / 100;
      const weeklyRewards = annualRewards / 52; // Weekly rewards based on APY
      const totalRewards = weeklyRewards * lockDurationWeeks; // Total rewards for the lock period

      return {
        totalRewards: totalRewards.toFixed(4),
        weeklyRewards: weeklyRewards.toFixed(4),
      };
    } catch (error) {
      console.error("Error calculating rewards:", error);
      return {
        totalRewards: "0",
        weeklyRewards: "0",
      };
    }
  }, [
    input,
    stakePlan,
    bnbPrice,
    selectedPaymentMethod,
    isContractDataLoading,
  ]);

  // Get referral address from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get("ref");
    if (refParam && isAddress(refParam)) {
      setUrlReferralAddress(refParam);
    }
  }, []);

  // Validation
  useEffect(() => {
    if (!input || Number(input) <= 0) {
      setValidationMessage("");
      return;
    }

    const tokens = parseFloat(tokensToGet);
    const minStakeAmount = parseFloat(
      formatUnits(stakePlan?.minStakeAmount || 0n, 18)
    );

    if (tokens < minStakeAmount) {
      setValidationMessage(`Minimum stake amount is ${minStakeAmount} DIGI`);
      return;
    }

    if (userStakeInfo && userStakeInfo.stakedAmount > 0n) {
      setValidationMessage("You have already staked in this plan");
      return;
    }

    const investAmount =
      selectedPaymentMethod === "BNB"
        ? parseFloat(input) * parseFloat(formatUnits(bnbPrice || 0n, 8))
        : parseFloat(input);

    if (totalInvested + parseUnits(investAmount.toString(), 18) > hardcap) {
      setValidationMessage("Investment would exceed hardcap");
      return;
    }

    setValidationMessage("");
  }, [
    input,
    tokensToGet,
    stakePlan,
    userStakeInfo,
    totalInvested,
    hardcap,
    bnbPrice,
    selectedPaymentMethod,
  ]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInput(value);
    }
  };

  const handleApproveUSDT = async () => {
    if (!address) return;

    try {
      // Calculate approval amount using actual USDT decimals
      const approvalAmount = parseUnits("100000000000", usdtDecimals || 18); // 100 billion USDT

      const txHash = await writeContract({
        address: USDT_ADDRESS,
        abi: IERC20_ABI,
        functionName: "approve",
        args: [PRESALE_ADDRESS, approvalAmount],
        chainId: 97,
      });

      // Set the transaction hash for monitoring
      setApprovalTxHash(txHash);
    } catch (error) {
      console.error("Error in approval process:", error);
    }
  };

  const handleStake = async () => {
    if (!address) return;

    try {
      let txHash;
      if (selectedPaymentMethod === "BNB") {
        const bnbAmount = parseEther(input);
        txHash = await writeContract({
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "stake",
          args: [selectedStakePlan, urlReferralAddress],
          value: bnbAmount,
          chainId: 97,
        });
      } else {
        const usdtAmount = parseUnits(input, usdtDecimals || 18);
        // Convert USDT to 18 decimals for the contract if needed
        const usdtAmountIn18Decimals =
          usdtDecimals === 6
            ? usdtAmount * 1000000000000n // multiply by 10^12 to convert from 6 to 18 decimals
            : usdtAmount; // already in 18 decimals
        txHash = await writeContract({
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "stake",
          args: [usdtAmountIn18Decimals, selectedStakePlan, urlReferralAddress],
          chainId: 97,
        });
      }

      // Set the transaction hash for monitoring
      setStakeTxHash(txHash);
    } catch (error) {
      console.error("Error staking tokens:", error);
    }
  };

  const handleGenerateLink = async () => {
    if (!address) {
      console.error("Wallet not connected, cannot generate referral link.");
      return;
    }
    const referralLink = `${window.location.origin}${window.location.pathname}?ref=${address}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy referral link: ", err);
    }
  };

  // Check if USDT needs approval
  const needsApproval =
    selectedPaymentMethod === "USDT" &&
    (!usdtAllowance ||
      usdtAllowance < parseUnits("100000", usdtDecimals || 18)); // Use actual decimals, fallback to 18

  // Button disabled logic - different for approval vs staking
  const isButtonDisabled = (() => {
    // Common disabled conditions
    const commonDisabled =
      isContractDataLoading ||
      isWritePending ||
      isApprovalConfirming ||
      isStakeConfirming;

    if (needsApproval) {
      // For approval, we don't need input validation
      return commonDisabled;
    } else {
      // For staking, we need input validation
      return (
        commonDisabled || !input || Number(input) <= 0 || !!validationMessage
      );
    }
  })();

  // Button text and loading states
  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";

    if (needsApproval) {
      if (isWritePending && !stakeTxHash) return "Approving...";
      if (isApprovalConfirming) return "Confirming Approval...";
      return "Approve USDT";
    }

    if (isWritePending && stakeTxHash) return "Staking...";
    if (isStakeConfirming) return "Confirming Stake...";
    return "Stake Tokens";
  };

  return (
    <PayWithStyleWrapper variant={variant}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Select Stake Plan</label>
            <Dropdown
              options={STAKE_PLAN_OPTIONS}
              selectedValue={selectedStakePlan}
              onSelect={(value) => setSelectedStakePlan(value)}
              placeholder="Select Stake Plan"
            />
          </div>
        </div>

        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Select Payment Method</label>
            <Dropdown
              options={PAYMENT_OPTIONS}
              selectedValue={selectedPaymentMethod}
              onSelect={(value) => setSelectedPaymentMethod(value)}
              placeholder="Select Payment Method"
            />
          </div>
        </div>

        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Pay Amount ({selectedPaymentMethod})</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={input}
              onChange={handleInputChange}
            />
          </div>
          <div className="presale-item-inner">
            <label>Get Amount (DIGI)</label>
            <input
              type="text"
              placeholder="0"
              value={isContractDataLoading ? "Loading..." : tokensToGet}
              disabled
            />
          </div>
        </div>

        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Est. Total Rewards (Lock Period - USDT)</label>
            <input
              type="text"
              placeholder="0"
              value={rewardsCalculation.totalRewards}
              disabled
            />
          </div>
        </div>

        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Est. Weekly Rewards (USDT)</label>
            <input
              type="text"
              placeholder="0"
              value={rewardsCalculation.weeklyRewards}
              disabled
            />
          </div>
        </div>

        {/* Rewards Explanation */}
        {input && Number(input) > 0 && (
          <div
            className="rewards-explanation"
            style={{
              marginBottom: "20px",
              padding: "12px",
              backgroundColor: "rgba(0, 123, 255, 0.1)",
              borderRadius: "6px",
              border: "1px solid rgba(0, 123, 255, 0.2)",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                color: "rgba(255, 255, 255, 0.8)",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              💡 <strong>Rewards Info:</strong> Based on 80% APY. Total rewards
              shown are for the 1-week lock period. Weekly rewards continue as
              long as you remain staked.
            </p>
          </div>
        )}

        {validationMessage && (
          <div
            className="validation-message"
            style={{ color: "red", marginBottom: "15px" }}
          >
            {validationMessage}
          </div>
        )}

        <div className="presale-item">
          <button
            className="presale-item-btn"
            onClick={
              !isConnected
                ? openConnectModal
                : needsApproval
                ? handleApproveUSDT
                : handleStake
            }
            disabled={isConnected && isButtonDisabled}
            type="button"
          >
            {getButtonText()}
          </button>
        </div>
      </form>

      {/* Referral Link Section */}
      {isConnected && address && (
        <div className="referral-section" style={{ marginTop: "30px" }}>
          {/* Referral Info Header */}
          <div className="referral-header" style={{ marginBottom: "15px" }}>
            <h4
              style={{
                color: "#fff",
                fontSize: "16px",
                margin: "0 0 8px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              🎁 Earn Referral Rewards
            </h4>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(255, 255, 255, 0.7)",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              Share your referral link and earn from 6 levels:{" "}
              <strong>30%, 20%, 10%, 5%, 5%, 5%</strong>
              <br />
              <span
                style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}
              >
                Note: Referrers must have staked at least 10,000 DIGI tokens to
                qualify
              </span>
            </p>
          </div>

          {/* Referral Link Input */}
          <div className="presale-item mb-30">
            <div className="presale-item-inner">
              <label style={{ fontSize: "14px", fontWeight: "500" }}>
                Your Referral Link
              </label>
              <div
                className="referral-link-container"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "8px",
                  width: "100%",
                }}
              >
                <input
                  type="text"
                  value={`${window.location.origin}${window.location.pathname}?ref=${address}`}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "#fff",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={handleGenerateLink}
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    fontSize: "14px",
                    fontWeight: "500",
                    borderRadius: "6px",
                    border: "none",
                    background: isLinkCopied
                      ? "linear-gradient(135deg, #28a745, #20c997)"
                      : "linear-gradient(135deg, #007bff, #0056b3)",
                    color: "#fff",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxSizing: "border-box",
                  }}
                  onMouseOver={(e) => {
                    if (!isLinkCopied) {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow =
                        "0 4px 12px rgba(0, 123, 255, 0.3)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  {isLinkCopied ? <>✓ Copied!</> : <>📋 Copy Link</>}
                </button>
              </div>
            </div>
          </div>

          {/* Referral Benefits */}
          <div
            className="referral-benefits"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 123, 255, 0.1), rgba(40, 167, 69, 0.1))",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "15px",
              marginTop: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontSize: "16px" }}>💰</span>
              <span
                style={{ fontSize: "14px", fontWeight: "500", color: "#fff" }}
              >
                Referral Reward Structure
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "8px",
              }}
            >
              {[
                { level: "Level 1", reward: "30%" },
                { level: "Level 2", reward: "20%" },
                { level: "Level 3", reward: "10%" },
                { level: "Level 4", reward: "5%" },
                { level: "Level 5", reward: "5%" },
                { level: "Level 6", reward: "5%" },
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "8px",
                    borderRadius: "4px",
                    textAlign: "center",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    {item.level}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#fff",
                    }}
                  >
                    {item.reward}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PayWithStyleWrapper>
  );
};

PayWith.propTypes = {
  variant: PropTypes.string,
};

export default PayWith;
