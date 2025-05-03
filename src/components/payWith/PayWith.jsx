import PayWithStyleWrapper from "./PayWith.style";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { PRESALE_ADDRESS } from "../../config/constants";
import { PRESALE_ABI } from "../../config/presaleAbi";
import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { formatEther, parseEther, isAddress } from "viem";
import Dropdown from "./Dropdown/Dropdown"; // Import the refactored Dropdown

/**
 * Deploy staking token
 * Deploy presale contract (set staking token, deposit staking tokens, set base price, set owner)
 * Check getTokenPrice response
 */

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
  const [referralAddressInput, setReferralAddressInput] = useState("");

  const { address, isConnected, chainId: connectedChainId } = useAccount();

  const {
    writeContract,
    isPending: isWritePending,
    error: writeError,
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

  console.log(tokenPriceInWei);


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
    return tokens.toFixed(4);
  }, [input, tokenPriceInBnb, isPriceLoading]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setInput(value);
    }
  };

  const handleBuyTokens = async () => {
    const inputAmount = Number(input);
    if (!input || isNaN(inputAmount) || inputAmount <= 0) {
      console.error("Invalid input amount");
      return;
    }

    if (!tokenPriceInBnb) {
      console.error("Token price not available");
      return;
    }

    // Referral address is now mandatory, validation happens in isButtonDisabled
    const finalReferralAddress = referralAddressInput;

    try {
      const valueToSend = parseEther(input);
      console.log(`Attempting to buy with ${input} BNB (${valueToSend} wei)`);
      console.log(
        `Wallet connected: ${isConnected}, Address: ${address}, Chain ID: ${connectedChainId}`
      );
      console.log(
        `Write hook state before call: isPending=${isWritePending}, error=${writeError}`
      );
      console.log(`Using referral address: ${finalReferralAddress}`);

      await writeContract({
        address: PRESALE_ADDRESS,
        abi: PRESALE_ABI,
        functionName: "buyTokens",
        // Pass the mandatory referral address directly
        args: [
          parseEther(tokensToGet),
          selectedLockPeriod,
          finalReferralAddress,
        ],
        chainId: 97,
        value: valueToSend,
      });

      console.log("Transaction submitted to wallet provider");
      console.log(
        `Write hook state after call attempt: isPending=${isWritePending}, error=${writeError}`
      );
    } catch (error) {
      console.error("Error in handleBuyTokens catch block:", error);
      console.log(
        `Write hook state in catch block: isPending=${isWritePending}, error=${writeError}`
      );
    }
  };

  // Button disabled if referral address is empty or invalid
  const isReferralInvalidOrEmpty =
    !referralAddressInput || !isAddress(referralAddressInput);

  const isButtonDisabled =
    isPriceLoading ||
    !input ||
    Number(input) <= 0 ||
    isWritePending ||
    !isConnected ||
    isReferralInvalidOrEmpty; // Use the updated check

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

        <div className="presale-item mb-30">
          <div className="presale-item-inner">
            <label htmlFor="referral-address">Referral Address</label>
            <input
              id="referral-address"
              type="text"
              placeholder="Enter referral address (0x...)"
              value={referralAddressInput}
              onChange={(e) => setReferralAddressInput(e.target.value)}
              required
            />
          </div>
        </div>
      </form>

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

      <button
        className="presale-item-btn"
        onClick={handleBuyTokens}
        disabled={isButtonDisabled}
      >
        {isPriceLoading
          ? "Loading Price..."
          : isWritePending
          ? "Check Wallet..."
          : !isConnected
          ? "Connect Wallet"
          : "Buy now"}
      </button>
    </PayWithStyleWrapper>
  );
};

PayWith.propTypes = {
  variant: PropTypes.string,
};

export default PayWith;
