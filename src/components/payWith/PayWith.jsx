import PayWithStyleWrapper from "./PayWith.style";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useAccount,
} from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { PRESALE_ADDRESS, USDT_ADDRESS } from "../../config/constants";
import { PRESALE_ABI } from "../../config/presaleAbi";
import { IERC20_ABI } from "../../config/erc20Abi";
import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import { formatUnits, parseEther, isAddress, parseUnits } from "viem";
import Dropdown from "./Dropdown/Dropdown"; // Import the refactored Dropdown

/**
 * Deploy staking token
 * Deploy presale contract (set staking token, deposit staking tokens, set base price, set owner)
 * Check getTokenPrice response
 */

// Define Zero Address
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Add this constant at the top with other constants
const LARGE_APPROVAL_AMOUNT = parseEther("10000000000"); // 10 billion USDT (with 6 decimals)

const LOCK_PERIOD_OPTIONS = [
  { label: "6 Months Lock (Min: 3,000 DIGI)", value: 0 },
  { label: "12 Months Lock (Min: 30,000 DIGI)", value: 1 },
  { label: "24 Months Lock (Min: 300,000 DIGI)", value: 2 },
];

const PAYMENT_OPTIONS = [
  { label: "Pay with BNB", value: "BNB" },
  { label: "Pay with USDT", value: "USDT" },
];

const PayWith = ({ variant }) => {
  const [input, setInput] = useState("");
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(
    LOCK_PERIOD_OPTIONS[0].value
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    PAYMENT_OPTIONS[0].value
  );
  const [urlReferralAddress, setUrlReferralAddress] = useState(ZERO_ADDRESS);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [contractError, setContractError] = useState("");

  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const { openConnectModal } = useConnectModal();

  // Get USDT allowance with refetch enabled
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

  // 1. First get staking token address
  const { data: stakingTokenAddress } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "stakingToken",
    chainId: 97,
  });

  // 2. Then get decimals from staking token
  const { data: tokenDecimalsRaw } = useReadContract({
    address: stakingTokenAddress,
    abi: [
      {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "decimals",
    chainId: 97,
    query: { enabled: !!stakingTokenAddress },
  });

  // 3. Set digiDecimals
  const digiDecimals = useMemo(() => {
    return typeof tokenDecimalsRaw === "number" ? tokenDecimalsRaw : 18;
  }, [tokenDecimalsRaw]);

  // Debug log for contract configuration and chain connection
  useEffect(() => {
    console.log("Contract configuration:", {
      PRESALE_ADDRESS,
      USDT_ADDRESS,
      stakingTokenAddress: stakingTokenAddress?.toString(),
      chainId: 97,
    });

    // Verify price functions in ABI
    const priceFunctions = PRESALE_ABI.filter(
      (item) =>
        item.name === "getCurrentTokenPrice" ||
        item.name === "getCurrentTokenPriceUSDT"
    );
    console.log("Price functions in ABI:", priceFunctions);

    // Log contract read configuration
    console.log("Contract read configuration:", {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI.length + " functions",
      chainId: 97,
      enabled: true,
    });
  }, [stakingTokenAddress]);

  // 4. Get token prices with more detailed error handling
  const { data: tokenPriceInWei, isLoading: isPriceLoading } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "getCurrentTokenPrice",
    chainId: 97,
    query: {
      enabled: true,
      retry: 3,
      onError: (error) => {
        console.error("Error fetching BNB price:", error);
        console.error("Error details:", {
          error: error.message,
          cause: error.cause,
          name: error.name,
        });
        setContractError(
          "Failed to fetch BNB price. Please check your connection."
        );
      },
      onSuccess: (data) => {
        console.log("Successfully fetched BNB price:", data?.toString());
      },
    },
  });

  const { data: tokenPriceInUSDT, isLoading: isUsdtPriceLoading } =
    useReadContract({
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "getCurrentTokenPriceUSDT",
      chainId: 97,
      query: {
        enabled: true,
        retry: 3,
        onError: (error) => {
          console.error("Error fetching USDT price:", error);
          console.error("Error details:", {
            error: error.message,
            cause: error.cause,
            name: error.name,
          });
          setContractError(
            "Failed to fetch USDT price. Please check your connection."
          );
        },
        onSuccess: (data) => {
          console.log("Successfully fetched USDT price:", data?.toString());
        },
      },
    });

  // Debug log for price fetching
  useEffect(() => {
    console.log("Price fetch status:", {
      tokenPriceInWei: tokenPriceInWei?.toString(),
      tokenPriceInUSDT: tokenPriceInUSDT?.toString(),
      isPriceLoading,
      isUsdtPriceLoading,
    });
  }, [tokenPriceInWei, tokenPriceInUSDT, isPriceLoading, isUsdtPriceLoading]);

  const tokenPrice = useMemo(() => {
    if (selectedPaymentMethod === "BNB") {
      if (!tokenPriceInWei) {
        console.log("No BNB price available");
        return 0n;
      }
      try {
        console.log("Using BNB Price:", tokenPriceInWei.toString());
        return tokenPriceInWei;
      } catch (e) {
        console.error("Error with BNB price:", e);
        return 0n;
      }
    } else {
      if (!tokenPriceInUSDT) {
        console.log("No USDT price available");
        return 0n;
      }
      try {
        console.log("Using USDT Price:", tokenPriceInUSDT.toString());
        return tokenPriceInUSDT;
      } catch (e) {
        console.error("Error with USDT price:", e);
        return 0n;
      }
    }
  }, [tokenPriceInWei, tokenPriceInUSDT, selectedPaymentMethod]);

  const tokensToGet = useMemo(() => {
    console.log("Calculating tokens with:", {
      input,
      selectedPaymentMethod,
      tokenPrice: tokenPrice?.toString(),
      digiDecimals,
      isPriceLoading,
      isUsdtPriceLoading,
    });

    const inputAmount = Number(input);
    if (
      (selectedPaymentMethod === "BNB" && isPriceLoading) ||
      (selectedPaymentMethod === "USDT" && isUsdtPriceLoading) ||
      !tokenPrice ||
      tokenPrice === 0n ||
      !input ||
      isNaN(inputAmount) ||
      inputAmount <= 0 ||
      !digiDecimals
    ) {
      console.log("Returning 0 due to validation");
      return "0";
    }

    try {
      // Convert input amount to proper decimals based on payment method
      const inputInWei =
        selectedPaymentMethod === "BNB"
          ? parseEther(input) // 18 decimals for BNB
          : parseUnits(input, 6); // 6 decimals for USDT

      console.log("Input in Wei:", inputInWei.toString());
      console.log("Token price:", tokenPrice.toString());
      console.log("Token decimals:", digiDecimals);

      // Calculate tokens based on contract logic
      let tokens;
      if (selectedPaymentMethod === "BNB") {
        // For BNB: (input * 10^digiDecimals) / price
        // input is in 18 decimals, price is in 18 decimals
        tokens = (inputInWei * 10n ** BigInt(digiDecimals)) / tokenPrice;
      } else {
        // For USDT: (input * 10^(digiDecimals + 12)) / price
        // input is in 6 decimals, price is in 18 decimals
        // We need to adjust input to match price decimals
        const decimalAdjustment = 10n ** BigInt(digiDecimals + 12); // Add 12 to bridge the gap between USDT (6) and price (18) decimals
        tokens = (inputInWei * decimalAdjustment) / tokenPrice;
      }

      console.log("Raw calculated tokens:", tokens.toString());

      // Format to human-readable number with proper decimals
      const formattedTokens = formatUnits(tokens, digiDecimals);
      console.log("Formatted tokens:", formattedTokens);

      return formattedTokens;
    } catch (e) {
      console.error("Error calculating tokens:", e);
      return "0";
    }
  }, [
    input,
    tokenPrice,
    selectedPaymentMethod,
    isPriceLoading,
    isUsdtPriceLoading,
    digiDecimals,
  ]);

  // Fetch necessary contract data for reward calculation with better error handling
  const { data: contractData, isLoading: isContractDataLoading } =
    useReadContracts({
      contracts: [
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "apyRanges",
          args: [0],
          chainId: 97,
        },
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "apyRanges",
          args: [1],
          chainId: 97,
        },
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "apyRanges",
          args: [2],
          chainId: 97,
        },
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "sixMonths",
          chainId: 97,
        },
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "oneYear",
          chainId: 97,
        },
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "twoYears",
          chainId: 97,
        },
      ],
      query: {
        enabled: true,
        retry: 3,
        onError: (error) => {
          console.error("Error fetching contract data:", error);
          setContractError(
            "Failed to fetch contract data. Please check your connection."
          );
        },
      },
    });

  // Fetch Min/Max Stake Amounts with better error handling
  const { data: stakeLimitsData, isLoading: isLimitsLoading } =
    useReadContracts({
      contracts: [
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "minStakeAmount",
          chainId: 97,
        },
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "maxStakeAmount",
          chainId: 97,
        },
      ],
      query: {
        enabled: true,
        retry: 3,
        onError: (error) => {
          console.error("Error fetching stake limits:", error);
          setContractError(
            "Failed to fetch stake limits. Please check your connection."
          );
        },
      },
    });

  // Process fetched contract data with better error handling
  const { apyRanges, sixMonths, oneYear, twoYears } = useMemo(() => {
    if (!contractData || contractData.length < 6) {
      console.warn("Contract data not available:", contractData);
      return {
        apyRanges: [8000n, 10000n, 12000n], // Default values
        sixMonths: 26n * 7n * 24n * 60n * 60n, // 26 weeks in seconds
        oneYear: 52n * 7n * 24n * 60n * 60n, // 52 weeks in seconds
        twoYears: 104n * 7n * 24n * 60n * 60n, // 104 weeks in seconds
      };
    }

    const results = contractData.map((item) => item?.result);
    const statuses = contractData.map((item) => item?.status);

    if (statuses.some((status) => status !== "success")) {
      console.error("Failed to read some contract data:", contractData);
      return {
        apyRanges: [8000n, 10000n, 12000n], // Default values
        sixMonths: 26n * 7n * 24n * 60n * 60n,
        oneYear: 52n * 7n * 24n * 60n * 60n,
        twoYears: 104n * 7n * 24n * 60n * 60n,
      };
    }

    return {
      apyRanges: [results[0], results[1], results[2]],
      sixMonths: results[3],
      oneYear: results[4],
      twoYears: results[5],
    };
  }, [contractData]);

  // Process fetched stake limits
  const { minStakeAmount, maxStakeAmount } = useMemo(() => {
    if (
      !stakeLimitsData ||
      !stakeLimitsData[0]?.result ||
      !stakeLimitsData[1]?.result
    ) {
      console.log("Stake limits data not available:", stakeLimitsData);
      return { minStakeAmount: 0n, maxStakeAmount: 0n };
    }

    console.log("Raw min stake amount:", stakeLimitsData[0].result.toString());
    console.log("Raw max stake amount:", stakeLimitsData[1].result.toString());

    return {
      minStakeAmount: stakeLimitsData[0].result,
      maxStakeAmount: stakeLimitsData[1].result,
    };
  }, [stakeLimitsData]);

  // Calculate estimated total rewards
  const estimatedTotalRewards = useMemo(() => {
    // First check if all the required data is available
    if (!apyRanges || !sixMonths || !oneYear || !twoYears) {
      console.warn("Missing contract data for reward calculation", {
        apyRanges: apyRanges?.map((a) => a?.toString()),
        sixMonths: sixMonths?.toString(),
        oneYear: oneYear?.toString(),
        twoYears: twoYears?.toString(),
      });
      return "0";
    }

    // Then check if input is valid
    if (!input || Number(input) <= 0 || isContractDataLoading) {
      return "0";
    }

    try {
      // Get the input amount in proper decimals based on payment method
      const inputAmount =
        selectedPaymentMethod === "BNB"
          ? parseEther(input) // 18 decimals
          : parseUnits(input, 6); // 6 decimals for USDT

      // Log inputs for debugging
      console.log("Reward calc - Amount:", input);
      console.log("Reward calc - Selected lock period:", selectedLockPeriod);
      console.log(
        "Reward calc - APY ranges:",
        apyRanges?.map((a) => a?.toString())
      );

      // Determine APY based on lock period selection
      let selectedApy;
      let selectedDuration;

      if (selectedLockPeriod === 0) {
        selectedApy = apyRanges[0]; // 6 months APY (80%)
        selectedDuration = sixMonths;
      } else if (selectedLockPeriod === 1) {
        selectedApy = apyRanges[1]; // 1 year APY (100%)
        selectedDuration = oneYear;
      } else {
        selectedApy = apyRanges[2]; // 2 years APY (120%)
        selectedDuration = twoYears;
      }

      console.log("Reward calc - Selected APY:", selectedApy?.toString());
      console.log(
        "Reward calc - Selected duration:",
        selectedDuration?.toString()
      );

      // Constants for calculation
      const APY_SCALING_FACTOR = BigInt(10000); // APY is stored in basis points (e.g., 8000 for 80%)

      // Adjust input amount if using BNB (convert from 18 decimals to 6 decimals for USDT)
      const adjustedInputAmount =
        selectedPaymentMethod === "BNB"
          ? inputAmount / 10n ** 12n // Convert from 18 to 6 decimals
          : inputAmount;

      // Calculate total rewards: (adjustedInputAmount * APY * lockPeriod) / (oneYear * APY_SCALING_FACTOR)
      const totalRewardBigInt =
        (adjustedInputAmount * selectedApy * selectedDuration) /
        (oneYear * APY_SCALING_FACTOR);

      console.log(
        "Reward calc - Total reward BigInt:",
        totalRewardBigInt?.toString()
      );

      // Format with 6 decimals for USDT
      const formattedReward = formatUnits(totalRewardBigInt, 6);
      console.log("Reward calc - Formatted reward:", formattedReward);

      // Return with fixed decimal places for better readability
      return Number(formattedReward).toFixed(6);
    } catch (error) {
      console.error("Error calculating estimated rewards:", error);
      return "Error"; // Indicate calculation error
    }
  }, [
    input,
    selectedPaymentMethod,
    selectedLockPeriod,
    apyRanges,
    sixMonths,
    oneYear,
    twoYears,
    isContractDataLoading,
  ]);

  // Calculate estimated weekly rewards
  const estimatedWeeklyRewards = useMemo(() => {
    // Basic input validation
    if (!apyRanges || !oneYear) {
      console.warn("Missing contract data for weekly reward calculation");
      return "0";
    }

    if (!input || Number(input) <= 0 || isContractDataLoading) {
      return "0";
    }

    try {
      // Get the input amount in proper decimals based on payment method
      const inputAmount =
        selectedPaymentMethod === "BNB"
          ? parseEther(input) // 18 decimals
          : parseUnits(input, 6); // 6 decimals for USDT

      // Determine APY based on lock period selection
      let selectedApy;

      if (selectedLockPeriod === 0) {
        selectedApy = apyRanges[0]; // 6 months APY (80%)
      } else if (selectedLockPeriod === 1) {
        selectedApy = apyRanges[1]; // 1 year APY (100%)
      } else {
        selectedApy = apyRanges[2]; // 2 years APY (120%)
      }

      // Log key values for debugging
      console.log("Weekly reward calc - Amount:", input);
      console.log(
        "Weekly reward calc - Selected APY:",
        selectedApy?.toString()
      );

      // Constants for calculation
      const WEEK_DURATION = BigInt(604800); // 1 week in seconds
      const APY_SCALING_FACTOR = BigInt(10000); // APY is stored in basis points

      // Adjust input amount if using BNB (convert from 18 decimals to 6 decimals for USDT)
      const adjustedInputAmount =
        selectedPaymentMethod === "BNB"
          ? inputAmount / 10n ** 12n // Convert from 18 to 6 decimals
          : inputAmount;

      // Calculate weekly reward: (adjustedInputAmount * apy * WEEK_DURATION) / (oneYear * scalingFactor)
      const weeklyRewardBigInt =
        (adjustedInputAmount * selectedApy * WEEK_DURATION) /
        (oneYear * APY_SCALING_FACTOR);

      console.log(
        "Weekly reward calc - Result BigInt:",
        weeklyRewardBigInt?.toString()
      );

      // Format with 6 decimals for USDT
      const formattedReward = formatUnits(weeklyRewardBigInt, 6);
      console.log("Weekly reward calc - Formatted reward:", formattedReward);

      // Return with fixed decimal places for better readability
      return Number(formattedReward).toFixed(6);
    } catch (error) {
      console.error("Error calculating estimated weekly rewards:", error);
      return "Error"; // Indicate calculation error
    }
  }, [
    input,
    selectedPaymentMethod,
    selectedLockPeriod,
    apyRanges,
    oneYear,
    isContractDataLoading,
  ]);

  // --- Validation Effect ---
  useEffect(() => {
    setValidationMessage(""); // Clear previous message
    if (!input || isNaN(Number(input)) || Number(input) <= 0) {
      return; // No validation needed for empty/zero input
    }

    if (isLimitsLoading || isPriceLoading || isUsdtPriceLoading) {
      return; // Wait for limits and prices to load
    }

    // Simple guard against missing data
    if (
      !minStakeAmount ||
      !maxStakeAmount ||
      minStakeAmount === 0n ||
      maxStakeAmount === 0n
    ) {
      return;
    }

    try {
      const tokensToGetBigInt = parseUnits(tokensToGet, digiDecimals);
      const maxFormatted = formatUnits(maxStakeAmount, digiDecimals);

      // Get the minimum amount for the selected lock period
      let requiredMinAmount;
      if (selectedLockPeriod === 0) {
        requiredMinAmount = 3000n * 10n ** BigInt(digiDecimals); // 3k tokens
      } else if (selectedLockPeriod === 1) {
        requiredMinAmount = 30000n * 10n ** BigInt(digiDecimals); // 30k tokens
      } else {
        requiredMinAmount = 300000n * 10n ** BigInt(digiDecimals); // 300k tokens
      }

      if (tokensToGetBigInt < requiredMinAmount) {
        const readableMin = Number(requiredMinAmount).toLocaleString(
          undefined,
          {
            maximumFractionDigits: 2,
          }
        );
        setValidationMessage(
          `Minimum stake amount for ${
            selectedLockPeriod === 0
              ? "6 months"
              : selectedLockPeriod === 1
              ? "12 months"
              : "24 months"
          } is ${readableMin} DIGI`
        );
      } else if (tokensToGetBigInt > maxStakeAmount) {
        const readableMax = Number(maxFormatted).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        });
        setValidationMessage(`Maximum stake amount is ${readableMax} DIGI`);
      }
    } catch (e) {
      console.error("Error in validation:", e);
    }
  }, [
    input,
    tokensToGet,
    minStakeAmount,
    maxStakeAmount,
    isLimitsLoading,
    isPriceLoading,
    isUsdtPriceLoading,
    digiDecimals,
    selectedLockPeriod,
  ]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setInput(value);
    }
  };

  // Read referral address from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refAddress = params.get("ref");
    if (refAddress && isAddress(refAddress)) {
      setUrlReferralAddress(refAddress);
    } else {
      setUrlReferralAddress(ZERO_ADDRESS);
    }
  }, []);

  const handleApproveUSDT = async () => {
    if (!address) return;

    try {
      const tx = await writeContract({
        address: USDT_ADDRESS,
        abi: IERC20_ABI,
        functionName: "approve",
        args: [PRESALE_ADDRESS, LARGE_APPROVAL_AMOUNT],
        chainId: 97,
      });

      // Wait for transaction confirmation
      await tx.wait();
      // Refetch allowance after approval
      await refetchAllowance();
    } catch (error) {
      console.error("Error in approval process:", error);
      // setValidationMessage("Failed to approve USDT");
    }
  };

  // Get user stakes data with refetch enabled
  const { refetch: refetchUserStakes } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "getUserStakes",
    args: [address],
    chainId: 97,
    query: {
      enabled: !!address,
    },
  });

  const handleBuyTokens = async () => {
    if (!address) return;

    try {
      const tokenAmount = tokensToGet;
      if (!tokenAmount || tokenAmount === "0") {
        setValidationMessage("Invalid token amount");
        return;
      }

      const inputAmount = parseUnits(tokenAmount, digiDecimals);

      if (selectedPaymentMethod === "BNB") {
        const bnbAmount = parseEther(input);
        const tx = await writeContract({
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "buyTokensWithBNB",
          args: [inputAmount, selectedLockPeriod, urlReferralAddress],
          value: bnbAmount,
          chainId: 97,
        });
        // Wait for transaction confirmation
        await tx.wait();
        // Refetch user stakes data
        await refetchUserStakes();
      } else {
        const tx = await writeContract({
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "buyTokensWithUSDT",
          args: [inputAmount, selectedLockPeriod, urlReferralAddress],
          chainId: 97,
        });
        // Wait for transaction confirmation
        await tx.wait();
        // Refetch user stakes data
        await refetchUserStakes();
      }
    } catch (error) {
      console.error("Error buying tokens:", error);
      // setValidationMessage("Failed to buy tokens");
    }
  };

  // Function to generate and copy referral link
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

  // --- Button Disabled Logic ---
  const isButtonDisabled =
    isPriceLoading || // Conditions relevant ONLY when buying
    isLimitsLoading ||
    !input ||
    Number(input) <= 0 ||
    !!validationMessage;

  return (
    <PayWithStyleWrapper variant={variant}>
      {contractError && (
        <div
          className="error-message"
          style={{
            color: "red",
            padding: "10px",
            marginBottom: "15px",
            backgroundColor: "rgba(255, 0, 0, 0.1)",
            borderRadius: "4px",
            textAlign: "center",
          }}
        >
          {contractError}
        </div>
      )}
      <form onSubmit={(e) => e.preventDefault()}>
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
              value={
                selectedPaymentMethod === "BNB"
                  ? isPriceLoading
                    ? "Loading price..."
                    : tokensToGet
                  : isUsdtPriceLoading
                  ? "Loading price..."
                  : tokensToGet
              }
              disabled
            />
          </div>
        </div>

        {/* Display Estimated Weekly Rewards */}
        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Est. Weekly Rewards (USDT)</label>
            <input
              type="text"
              placeholder="0"
              value={
                isContractDataLoading || isPriceLoading
                  ? "Calculating..."
                  : estimatedWeeklyRewards === "Error"
                  ? "Error"
                  : Number(input) > 0
                  ? estimatedWeeklyRewards
                  : "0"
              }
              disabled // This field is display-only
            />
          </div>
        </div>

        {/* Display Estimated Rewards */}
        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Est. Total Rewards (USDT)</label>
            <input
              type="text"
              placeholder="0"
              // Display calculated rewards, handle loading/error states
              value={
                isContractDataLoading || isPriceLoading
                  ? "Calculating..."
                  : estimatedTotalRewards === "Error"
                  ? "Error"
                  : Number(input) > 0
                  ? estimatedTotalRewards
                  : "0"
              }
              disabled // This field is display-only
            />
          </div>
        </div>
      </form>

      {/* Updated Referral Link UI */}
      {isConnected && address && (
        <div className="presale-item mb-30">
          {/* Outer container afor label + input/button group */}
          <div className="presale-item-inner">
            <label>Your Referral Link</label>
            {/* Flex container for input and button */}
            <div
              className="referral-link-container"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
              }}
            >
              <input
                type="text"
                value={`${window.location.origin}${window.location.pathname}?ref=${address}`}
                disabled
                style={{
                  flexGrow: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                readOnly
                className="referral-link-input"
              />
              <button
                onClick={handleGenerateLink} // Reuse the copy logic handler
                className="presale-item-btn copy-button" // Use the button style, keep copy-button for potential specific tweaks
                type="button" // Prevent form submission if accidentally nested
                style={{ width: "30%" }} // Set fixed width to 40%
              >
                {isLinkCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            {/* Referral Info Text */}
            <p
              className="referral-info-text"
              style={{
                fontSize: "13px",
                color: "rgba(255, 255, 255, 0.7)", // Slightly transparent white
                marginTop: "10px",
                marginBottom: "0",
                textAlign: "left",
                lineHeight: "1.4",
              }}
            >
              Share your link! Earn up to 30% BNB rewards from the staking
              rewards claimed by your referrals across 6 levels (30%, 20%, 10%,
              5%, 5%, 5%).
            </p>
          </div>
        </div>
      )}

      <div className="presale-item mb-30">
        <div className="presale-item-inner">
          <label>Select Lock Period</label>
          <Dropdown
            options={LOCK_PERIOD_OPTIONS}
            selectedValue={selectedLockPeriod}
            onSelect={(value) => setSelectedLockPeriod(value)}
            placeholder="Select Lock Period"
          />
          <p
            className="helper-text"
            style={{
              fontSize: "13px",
              color: "rgba(255, 255, 255, 0.7)",
              marginTop: "8px",
              marginBottom: "0",
            }}
          >
            {selectedLockPeriod === 0
              ? "Minimum stake: 3,000 DIGI"
              : selectedLockPeriod === 1
              ? "Minimum stake: 30,000 DIGI"
              : "Minimum stake: 300,000 DIGI"}
          </p>
        </div>
      </div>

      {/* Button Row */}
      <div
        className="button-row"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        {!isConnected ? (
          <button className="presale-item-btn" onClick={openConnectModal}>
            Connect Wallet
          </button>
        ) : selectedPaymentMethod === "USDT" ? (
          // Check if we need approval for USDT
          !usdtAllowance ||
          (input && usdtAllowance < parseEther("10000000")) ? (
            <button
              className="presale-item-btn"
              onClick={handleApproveUSDT}
              disabled={isButtonDisabled}
            >
              Approve USDT
            </button>
          ) : (
            <button
              className="presale-item-btn"
              onClick={handleBuyTokens}
              disabled={isButtonDisabled}
            >
              Buy with USDT
            </button>
          )
        ) : (
          <button
            className="presale-item-btn"
            onClick={handleBuyTokens}
            disabled={isButtonDisabled}
          >
            Buy with BNB
          </button>
        )}
      </div>

      {validationMessage && (
        <p
          className="validation-message"
          style={{
            color: "red",
            textAlign: "left",
            marginTop: "15px",
            marginBottom: "0",
            fontSize: "14px",
          }}
        >
          {validationMessage}
        </p>
      )}
    </PayWithStyleWrapper>
  );
};

PayWith.propTypes = {
  variant: PropTypes.string,
};

export default PayWith;
