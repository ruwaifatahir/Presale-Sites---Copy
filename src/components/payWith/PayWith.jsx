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
  {
    label: "Plan 1 - 80% APY, 6 Months (Min: 3000 )",
    shortLabel: "Plan 1 - 80% APY, 6M",
    value: 0,
  },
  {
    label: "Plan 2 - 100% APY, 12 Months (Min: 30,000 DGFL)",
    shortLabel: "Plan 2 - 100% APY, 12M",
    value: 1,
  },
  {
    label: "Plan 3 - 120% APY, 24 Months (Min: 300,000 DGFL)",
    shortLabel: "Plan 3 - 120% APY, 24M",
    value: 2,
  },
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
  const { writeContract, isPending: isWritePending } = useWriteContract();
  const { openConnectModal } = useConnectModal();

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
    chainId: 56,
    query: {
      enabled: !!address && selectedPaymentMethod === "USDT",
    },
  });

  // Get USDT decimals to use correct decimal places
  const { data: usdtDecimals } = useReadContract({
    address: USDT_ADDRESS,
    abi: IERC20_ABI,
    functionName: "decimals",
    chainId: 56,
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
      chainId: 56,
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
      chainId: 56,
    },
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "getBnbPrice",
      chainId: 56,
    },
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "stakePlans",
      args: [selectedStakePlan],
      chainId: 56,
    },
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "HARDCAP",
      chainId: 56,
    },
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "totalInvestedTokens",
      chainId: 56,
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
      // Validate input is a valid number string
      if (isNaN(parseFloat(input)) || parseFloat(input) <= 0) {
        return "0";
      }

      if (selectedPaymentMethod === "BNB") {
        if (!bnbPrice || bnbPrice === 0n) return "0";

        const bnbAmount = parseEther(input);
        const usdValue = (bnbAmount * bnbPrice) / 100000000n; // bnbPrice is in 8 decimals
        const tokens = (usdValue * parseEther("1")) / tokenPrice;
        return formatUnits(tokens, 18);
      } else {
        // USDT payment - validate input before parsing
        if (!usdtDecimals) return "0";

        const usdtAmount = parseUnits(input, usdtDecimals);
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

    // Early return if stake plan data is not loaded yet - handle array format
    if (
      !stakePlan ||
      !Array.isArray(stakePlan) ||
      stakePlan.length < 3 ||
      !stakePlan[0] ||
      !stakePlan[1] ||
      stakePlan[0] === 0n ||
      stakePlan[1] === 0n
    ) {
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

      // Get APY and lock duration from stake plan array format [apy, lockDuration, minStakeAmount]
      const apy = parseFloat(formatUnits(stakePlan[0], 18)); // stakePlan[0] is apy
      const lockDurationSeconds = Number(stakePlan[1]); // stakePlan[1] is lockDuration

      if (apy <= 0 || isNaN(apy) || lockDurationSeconds <= 0) {
        return { totalRewards: "0", weeklyRewards: "0" };
      }

      // Calculate rewards based on actual lock period
      const lockDurationDays = lockDurationSeconds / (24 * 60 * 60); // Convert seconds to days
      const annualRewards = (investAmountUSD * apy) / 100; // Full annual rewards based on APY
      const dailyRewards = annualRewards / 365; // Daily rewards
      const totalRewards = dailyRewards * lockDurationDays; // Total rewards for the lock period
      const weeklyRewards = dailyRewards * 7; // Weekly rewards

      // Ensure clean number formatting - use more robust approach
      let totalRewardsFormatted, weeklyRewardsFormatted;

      try {
        // Use parseFloat and toFixed for cleaner formatting
        const totalRewardsNum = Number.parseFloat(totalRewards);
        const weeklyRewardsNum = Number.parseFloat(weeklyRewards);

        if (isNaN(totalRewardsNum) || isNaN(weeklyRewardsNum)) {
          totalRewardsFormatted = "0.00";
          weeklyRewardsFormatted = "0.00";
        } else {
          totalRewardsFormatted = totalRewardsNum.toFixed(2);
          weeklyRewardsFormatted = weeklyRewardsNum.toFixed(2);
        }
      } catch (formatError) {
        console.error("Error formatting numbers:", formatError);
        totalRewardsFormatted = "0.00";
        weeklyRewardsFormatted = "0.00";
      }

      return {
        totalRewards: totalRewardsFormatted,
        weeklyRewards: weeklyRewardsFormatted,
      };
    } catch (error) {
      console.error("Error calculating rewards:", error);
      return {
        totalRewards: "0",
        weeklyRewards: "0",
      };
    }
  }, [input, stakePlan, bnbPrice, selectedPaymentMethod, selectedStakePlan]);

  // Create safe values for input fields to prevent any concatenation issues
  const safeTotalRewards = useMemo(() => {
    const value = rewardsCalculation?.totalRewards;
    if (!value || value === "0") return "0";
    // Ensure it's a clean string and not concatenated
    const cleanValue = String(value).trim();
    // Additional safeguard: if the value contains the same number twice, take only the first part
    if (cleanValue.includes(".") && cleanValue.split(".").length > 2) {
      // If there are multiple decimal points, something went wrong
      return "0";
    }
    // Check for obvious duplication patterns
    const parts = cleanValue.split(".");
    if (parts.length === 2 && parts[0] && parts[1] && cleanValue.length > 10) {
      // If it's suspiciously long, it might be duplicated
      const firstPart = parts[0];
      const secondPart = parts[1];
      if (
        cleanValue.includes(
          firstPart + "." + secondPart.substring(0, 2) + firstPart
        )
      ) {
        // Detected duplication pattern, return just the first valid number
        return firstPart + "." + secondPart.substring(0, 2);
      }
    }
    return cleanValue;
  }, [rewardsCalculation?.totalRewards]);

  const safeWeeklyRewards = useMemo(() => {
    const value = rewardsCalculation?.weeklyRewards;
    if (!value || value === "0") return "0";
    // Ensure it's a clean string and not concatenated
    const cleanValue = String(value).trim();
    // Additional safeguard: if the value contains the same number twice, take only the first part
    if (cleanValue.includes(".") && cleanValue.split(".").length > 2) {
      // If there are multiple decimal points, something went wrong
      return "0";
    }
    // Check for obvious duplication patterns
    const parts = cleanValue.split(".");
    if (parts.length === 2 && parts[0] && parts[1] && cleanValue.length > 10) {
      // If it's suspiciously long, it might be duplicated
      const firstPart = parts[0];
      const secondPart = parts[1];
      if (
        cleanValue.includes(
          firstPart + "." + secondPart.substring(0, 2) + firstPart
        )
      ) {
        // Detected duplication pattern, return just the first valid number
        return firstPart + "." + secondPart.substring(0, 2);
      }
    }
    return cleanValue;
  }, [rewardsCalculation?.weeklyRewards]);

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
    // Handle array format: stakePlan[2] is minStakeAmount
    const minStakeAmount = parseFloat(formatUnits(stakePlan?.[2] || 0n, 18));

    if (tokens < minStakeAmount) {
      setValidationMessage(`Minimum stake amount is ${minStakeAmount} DGFL`);
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

    // Check if investAmount is valid before using it
    if (isNaN(investAmount) || investAmount <= 0) {
      setValidationMessage("Invalid investment amount");
      return;
    }

    // Check if contract data is loaded before validating hardcap
    if (!totalInvested || !hardcap || totalInvested === 0n || hardcap === 0n) {
      // Skip hardcap validation if contract data is not loaded yet
      setValidationMessage("");
      return;
    }

    try {
      if (totalInvested + parseUnits(investAmount.toString(), 18) > hardcap) {
        setValidationMessage("Investment would exceed hardcap");
        return;
      }
    } catch (error) {
      console.error("Error validating hardcap:", error);
      setValidationMessage("Error validating investment amount");
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
        chainId: 56,
      });

      // Set the transaction hash for monitoring
      setApprovalTxHash(txHash);
    } catch (error) {
      console.error("Error in approval process:", error);
    }
  };

  const handleStake = async () => {
    if (!address) return;

    // Validate input before proceeding
    if (!input || isNaN(parseFloat(input)) || parseFloat(input) <= 0) {
      console.error("Invalid input value for staking");
      return;
    }

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
          chainId: 56,
        });
      } else {
        // Validate USDT decimals before parsing
        if (!usdtDecimals) {
          console.error("USDT decimals not loaded");
          return;
        }

        const usdtAmount = parseUnits(input, usdtDecimals);
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
          chainId: 56,
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
    usdtDecimals &&
    (!usdtAllowance || usdtAllowance < parseUnits("100000", usdtDecimals)); // Only check if decimals are loaded

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
          <div className="presale-item-inner ">
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
            <label>Get Amount (DGFL)</label>
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
              key={`total-rewards-${selectedStakePlan}-${input}`}
              type="text"
              placeholder="0"
              value={safeTotalRewards}
              disabled
            />
          </div>
        </div>

        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Est. Weekly Rewards (USDT)</label>
            <input
              key={`weekly-rewards-${selectedStakePlan}-${input}`}
              type="text"
              placeholder="0"
              value={safeWeeklyRewards}
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
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.6)",
                margin: "0",
                lineHeight: "1.4",
              }}
            >
              💡 <strong>Rewards Info:</strong> Based on{" "}
              {stakePlan?.[0] ? Number(formatUnits(stakePlan[0], 18)) : 80}%
              APY. Total rewards shown are the maximum you can earn if you stay
              staked for the full{" "}
              {stakePlan?.[1]
                ? Math.round(Number(stakePlan[1]) / (30 * 24 * 60 * 60))
                : 6}
              -month lock period. Rewards are distributed continuously over
              time.
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
                Note: Referrers must have staked at least 10,000 DGFL tokens to
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
