import PayWithStyleWrapper from "./PayWith.style";
import { useReadContract, useAccount, useWriteContract } from "wagmi";
import { PRESALE_ADDRESS } from "../../config/constants";
import { PRESALE_ABI } from "../../config/presaleAbi";
import PropTypes from "prop-types";

/**
 * Deploy staking token
 * Deploy presale contract (set staking token, deposit staking tokens, set base price, set owner)
 * Check getTokenPrice response
 */

const ClaimWith = ({ variant }) => {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending: isClaimPending } = useWriteContract();

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

  return (
    <PayWithStyleWrapper variant={variant}>
      <button
        className="presale-item-btn presale-item-btn--secondary"
        disabled={isClaimButtonDisabled}
        onClick={handleClaimReferrals}
        style={{ flex: 1, margin: 0 }}
      >
        {isClaimPending ? "Claiming..." : "Claim Referrals"}
      </button>
    </PayWithStyleWrapper>
  );
};

ClaimWith.propTypes = {
  variant: PropTypes.string,
};

export default ClaimWith;
