import PayWithStyleWrapper from "./PayWith.style";
import {
  useReadContract,
  useReadContracts,
  useWriteContract,
  useAccount,
} from "wagmi";
import { PRESALE_ADDRESS } from "../../config/constants";
import { PRESALE_ABI } from "../../config/presaleAbi";
import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import {
  formatEther,
  parseEther,
  isAddress,
  formatUnits,
  parseUnits,
} from "viem";
import Dropdown from "./Dropdown/Dropdown"; // Import the refactored Dropdown

/**
 * Deploy staking token
 * Deploy presale contract (set staking token, deposit staking tokens, set base price, set owner)
 * Check getTokenPrice response
 */

// Define Zero Address
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const LOCK_PERIOD_OPTIONS = [
  { label: "3 Months Lock", value: 0 },
  { label: "6 Months Lock", value: 1 },
  { label: "12 Months Lock", value: 2 },
];

const PayWith = ({ variant }) => {
  const [input, setInput] = useState("");
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(
    LOCK_PERIOD_OPTIONS[0].value
  );
  // State to store the referral address from URL or ZERO_ADDRESS
  const [urlReferralAddress, setUrlReferralAddress] = useState(ZERO_ADDRESS);
  // State for copy button feedback
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  // State for validation messages
  const [validationMessage, setValidationMessage] = useState("");

  const { address, isConnected } = useAccount();
  // Separate write hook for claim, or manage pending state carefully if using one
  const {
    writeContract,
    isPending: isWritePending,
    reset: resetBuy,
  } = useWriteContract();
  const {
    writeContractAsync: claimRefRewards,
    isPending: isClaimWritePending,
    reset: resetClaim,
  } = useWriteContract();

  const { data: tokenPriceInWei, isLoading: isPriceLoading } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "getCurrentTokenPrice",
    chainId: 97,
    query: {
      enabled: true,
    },
  });

  // Fetch necessary contract data for reward calculation
  const { data: contractData, isLoading: isContractDataLoading } =
    useReadContracts({
      contracts: [
        // Fetch each APY range element individually using the auto-generated getter
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "apyRanges",
          args: [0],
          chainId: 97,
        }, // Index 0
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "apyRanges",
          args: [1],
          chainId: 97,
        }, // Index 1
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "apyRanges",
          args: [2],
          chainId: 97,
        }, // Index 2
        // Fetch thresholds and durations as before
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "minThreshold",
          chainId: 97,
        },
        {
          address: PRESALE_ADDRESS,
          abi: PRESALE_ABI,
          functionName: "highThreshold",
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
      },
    });

  // Fetch Min/Max Stake Amounts
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
        enabled: true, // Fetch immediately
      },
    });

  // Fetch Claimable Referral Rewards (needed for button state)
  const {
    data: claimableRefRewardsData,
    isLoading: isRefRewardsLoading,
    refetch: refetchRefRewards, // Add refetch function
  } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "stakingReferralRewards",
    args: [address],
    chainId: 97,
    query: {
      enabled: !!address,
      // Fetch periodically or after claim
      refetchInterval: 15000, // e.g., every 15 seconds
    },
  });

  // Process fetched contract data - adjust indices
  const {
    apyRanges,
    minThreshold,
    highThreshold,
    sixMonths,
    oneYear,
    twoYears,
  } = useMemo(() => {
    if (!contractData || contractData.length < 8) return {};

    const results = contractData.map((item) => item?.result);
    const statuses = contractData.map((item) => item?.status);

    if (statuses.some((status) => status !== "success")) {
      console.error("Failed to read some contract data:", contractData);
      return {};
    }

    const reconstructedApyRanges = [results[0], results[1], results[2]];

    return {
      apyRanges: reconstructedApyRanges,
      minThreshold: results[3],
      highThreshold: results[4],
      sixMonths: results[5],
      oneYear: results[6],
      twoYears: results[7],
    };
  }, [contractData]);

  // Process fetched stake limits
  const { minStakeAmount, maxStakeAmount } = useMemo(() => {
    if (!stakeLimitsData) return {};
    return {
      minStakeAmount: stakeLimitsData[0]?.result,
      maxStakeAmount: stakeLimitsData[1]?.result,
    };
  }, [stakeLimitsData]);

  const tokenPriceInBnb = useMemo(() => {
    if (!tokenPriceInWei) return 0;
    try {
      return Number(formatEther(tokenPriceInWei));
    } catch (e) {
      console.error("Error formatting token price:", e);
      return 0;
    }
  }, [tokenPriceInWei]);

  const tokensToGet = useMemo(() => {
    const inputAmount = Number(input);
    if (
      isPriceLoading ||
      !tokenPriceInBnb ||
      tokenPriceInBnb === 0 ||
      !input ||
      isNaN(inputAmount) ||
      inputAmount <= 0
    ) {
      return "0";
    }
    const tokens = inputAmount / tokenPriceInBnb;
    // Return the value without fixing decimals here, handle formatting later
    return tokens.toString(); // Keep as string for potential BigInt parsing
  }, [input, tokenPriceInBnb, isPriceLoading]);

  // Calculate estimated total rewards
  const estimatedTotalRewards = useMemo(() => {
    if (
      !apyRanges ||
      !minThreshold ||
      !highThreshold ||
      !sixMonths ||
      !oneYear ||
      !twoYears ||
      !tokensToGet ||
      tokensToGet === "0" ||
      isContractDataLoading
    ) {
      return "0"; // Return 0 if data is missing or tokensToGet is 0
    }

    try {
      // Parse tokensToGet (assuming 18 decimals for the token)
      const tokensToGetBigInt = parseEther(tokensToGet); // Converts string like "123.45" to BigInt

      // Determine APY based on thresholds
      let selectedApy = apyRanges[0]; // Default to lowest APY
      if (tokensToGetBigInt >= highThreshold) {
        selectedApy = apyRanges[2];
      } else if (tokensToGetBigInt >= minThreshold) {
        selectedApy = apyRanges[1];
      }

      // Determine lock duration based on selection
      let selectedDuration; // In seconds (BigInt)
      if (selectedLockPeriod === 0) selectedDuration = sixMonths;
      else if (selectedLockPeriod === 1) selectedDuration = oneYear;
      else selectedDuration = twoYears;

      // Constants for calculation
      const SECONDS_IN_YEAR = BigInt(31536000);
      const APY_SCALING_FACTOR = BigInt(10000); // APY is stored as value * 10000 (e.g., 1000 for 10%)

      // Calculate reward: (amount * apy * duration) / (secondsInYear * scalingFactor)
      const totalRewardBigInt =
        (tokensToGetBigInt * selectedApy * selectedDuration) /
        (SECONDS_IN_YEAR * APY_SCALING_FACTOR);

      // Format the reward (assuming reward is in the same token units - 18 decimals)
      const formattedReward = formatUnits(totalRewardBigInt, 18); // Format back to a readable string
      return formattedReward;
    } catch (error) {
      console.error("Error calculating estimated rewards:", error);
      return "Error"; // Indicate calculation error
    }
  }, [
    tokensToGet,
    selectedLockPeriod,
    apyRanges,
    minThreshold,
    highThreshold,
    sixMonths,
    oneYear,
    twoYears,
    isContractDataLoading,
  ]);

  // --- Validation Effect ---
  useEffect(() => {
    setValidationMessage(""); // Clear previous message
    if (
      !input ||
      isNaN(Number(input)) ||
      Number(input) <= 0 ||
      !tokensToGet ||
      tokensToGet === "0"
    ) {
      return; // No validation needed for empty/zero input
    }

    if (isLimitsLoading || isPriceLoading) {
      return; // Wait for limits and price to load
    }

    if (!minStakeAmount || !maxStakeAmount) {
      console.error("Stake limits not loaded correctly.");
      setValidationMessage("Could not verify stake limits.");
      return;
    }

    try {
      // Convert input DIGI amount string to BigInt (assuming 18 decimals)
      const tokensToGetBigInt = parseUnits(tokensToGet, 18);

      if (tokensToGetBigInt < minStakeAmount) {
        const minFormatted = formatUnits(minStakeAmount, 18);
        setValidationMessage(`Minimum stake amount is ${minFormatted} DIGI`);
      } else if (tokensToGetBigInt > maxStakeAmount) {
        const maxFormatted = formatUnits(maxStakeAmount, 18);
        setValidationMessage(`Maximum stake amount is ${maxFormatted} DIGI`);
      }
    } catch (e) {
      console.error("Error parsing/validating input amount:", e);
      setValidationMessage("Invalid amount entered.");
    }
  }, [
    input,
    tokensToGet,
    minStakeAmount,
    maxStakeAmount,
    isLimitsLoading,
    isPriceLoading,
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

  const handleBuyTokens = async () => {
    // Reset claim state in case it was pending
    resetClaim();
    const inputAmount = Number(input);
    if (!input || isNaN(inputAmount) || inputAmount <= 0) {
      console.error("Invalid input amount");
      return;
    }

    if (!tokenPriceInBnb) {
      console.error("Token price not available");
      return;
    }

    // Use the referral address derived from the URL
    const finalReferralAddress = urlReferralAddress;

    try {
      const valueToSend = parseEther(input);
      await writeContract({
        address: PRESALE_ADDRESS,
        abi: PRESALE_ABI,
        functionName: "buyTokens",
        // Pass the referral address from URL state
        args: [
          parseEther(tokensToGet),
          selectedLockPeriod,
          finalReferralAddress,
        ],
        chainId: 97,
        value: valueToSend,
      });
    } catch (error) {
      console.error("Error in handleBuyTokens catch block:", error);
    } finally {
      // Potentially reset buy state if needed, managed by useWriteContract's isPending
    }
  };

  // --- Handle Claim Referral Rewards ---
  const handleClaimReferralRewards = async () => {
    if (!claimableRefRewardsData || claimableRefRewardsData <= 0n) {
      console.log("No referral rewards to claim.");
      return;
    }
    // Reset buy state in case it was pending
    resetBuy();
    try {
      console.log("Attempting to claim referral rewards...");
      await claimRefRewards({
        address: PRESALE_ADDRESS,
        abi: PRESALE_ABI,
        functionName: "withdrawStakingReferralRewards",
        args: [], // No arguments
        chainId: 97,
      });
      console.log("Claim referral rewards transaction submitted.");
      setTimeout(() => refetchRefRewards(), 1000);
    } catch (error) {
      console.error("Failed to claim referral rewards:", error);
    } finally {
      // No need for setIsClaimPending(false);
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
    isPriceLoading ||
    isLimitsLoading || // Disable while limits loading
    !input ||
    Number(input) <= 0 ||
    !!validationMessage || // Disable if there's any validation message
    isWritePending ||
    !isConnected;

  const isClaimButtonDisabled =
    !isConnected ||
    !address ||
    isRefRewardsLoading ||
    !claimableRefRewardsData ||
    claimableRefRewardsData <= 0n || // No rewards to claim
    isClaimWritePending; // Claim transaction pending

  return (
    <PayWithStyleWrapper variant={variant}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Pay Amount (BNB)</label>
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
              value={isPriceLoading ? "Loading price..." : tokensToGet}
              disabled
            />
          </div>
        </div>

        {/* Display Estimated Rewards */}
        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label>Est. Total Rewards (BNB)</label>
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

      {/* Restore conditional render */}
      {isConnected && address && (
        <div className="presale-item presale-item--text-link mb-30">
          <a
            href="#"
            className={`referral-link-generator ${
              !isConnected || !address ? "disabled" : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              if (isConnected && address) handleGenerateLink();
            }}
            aria-disabled={!isConnected || !address}
          >
            {isLinkCopied ? "Link Copied!" : "Copy Referral Link"}
          </a>
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
        </div>
      </div>

      {/* Button Row */}
      <div
        className="button-row"
        style={{ display: "flex", gap: "15px", marginTop: "20px" }}
      >
        {/* Buy Now Button */}
        <button
          className="presale-item-btn"
          onClick={handleBuyTokens}
          disabled={isButtonDisabled}
          style={{ flex: 1, margin: 0 }} // Use flex: 1 to share space
        >
          {isPriceLoading
            ? "Loading Price..."
            : isWritePending
            ? "Check Wallet..."
            : !isConnected
            ? "Connect Wallet"
            : "Buy now"}
        </button>

        {/* Claim Referral Rewards Button */}
        <button
          className="presale-item-btn presale-item-btn--secondary" // Add a modifier class for styling
          onClick={handleClaimReferralRewards}
          disabled={isClaimButtonDisabled}
          style={{ flex: 1, margin: 0 }} // Use flex: 1 to share space
        >
          {isClaimWritePending ? "Claiming..." : "Claim Referrals"}
        </button>
      </div>

      {/* Display Validation Message - Below button row */}
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
