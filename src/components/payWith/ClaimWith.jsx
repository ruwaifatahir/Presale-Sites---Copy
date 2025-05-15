import PayWithStyleWrapper from "./PayWith.style";
import { useReadContract, useAccount, useWriteContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { PRESALE_ADDRESS } from "../../config/constants";
import { PRESALE_ABI } from "../../config/presaleAbi";
import PropTypes from "prop-types";
import { formatUnits } from "viem";

/**
 * Component for claiming referral rewards from the staking system
 */

const ClaimWith = ({ variant }) => {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending: isClaimPending } = useWriteContract();
  const { openConnectModal } = useConnectModal();

  // Fetch Claimable Referral Rewards (needed for button state)
  const { data: claimableRefRewardsData, isLoading: isRefRewardsLoading } =
    useReadContract({
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "stakingReferralRewards",
      args: [address],
      chainId: 97,
      query: {
        enabled: !!address,
        refetchInterval: 15000, // e.g., every 15 seconds
      },
    });

  // Format claimable rewards to display on button (USDT has 6 decimals)
  const formattedClaimableRewards = claimableRefRewardsData
    ? formatUnits(claimableRefRewardsData, 6)
    : "0";

  const isClaimButtonDisabled =
    !isConnected ||
    !address ||
    isRefRewardsLoading ||
    isClaimPending ||
    !claimableRefRewardsData ||
    claimableRefRewardsData <= 0n;

  const handleClaimReferrals = () => {
    if (!isClaimButtonDisabled) {
      writeContract({
        address: PRESALE_ADDRESS,
        abi: PRESALE_ABI,
        functionName: "withdrawStakingReferralRewards",
        args: [],
        chainId: 97,
      });
    }
  };

  const handleClaimButtonClick = () => {
    if (!isConnected) {
      openConnectModal?.();
    } else {
      handleClaimReferrals();
    }
  };

  return (
    <div>
      {/* <h5
          className="  fw-600 text-white text-uppercase text-center"
          style={{ paddingBottom: "20px" }}
        >
          ⚡ Buy early to get the best rate!
        </h5> */}
      <PayWithStyleWrapper variant={variant}>
        <div className="referral-claim-info">
          <p
            className="referral-info-text"
            style={{ marginBottom: "10px", fontSize: "14px" }}
          >
            Your referral rewards across 6 levels (30%, 20%, 10%, 5%, 5%, 5%)
          </p>
        </div>
        <button
          className="presale-item-btn presale-item-btn--secondary"
          disabled={isConnected ? isClaimButtonDisabled : false}
          onClick={handleClaimButtonClick}
          style={{ flex: 1, margin: 0 }}
        >
          {!isConnected
            ? "Connect Wallet"
            : isClaimPending
            ? "Claiming..."
            : `Claim ${Number(formattedClaimableRewards).toFixed(
                6
              )} USDT Referrals`}
        </button>
      </PayWithStyleWrapper>
    </div>
  );
};

ClaimWith.propTypes = {
  variant: PropTypes.string,
};

export default ClaimWith;
