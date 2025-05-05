import PayWithStyleWrapper from "./PayWith.style";
import { useReadContract, useAccount, useWriteContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
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
      <PayWithStyleWrapper variant={variant}>
        <h5
          className="  fw-600 text-white text-uppercase text-center"
          style={{ paddingBottom: "20px" }}
        >
          ⚡ Buy early to get the best rate!
        </h5>
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
            : "Claim Referrals"}
        </button>
      </PayWithStyleWrapper>
    </div>
  );
};

ClaimWith.propTypes = {
  variant: PropTypes.string,
};

export default ClaimWith;
