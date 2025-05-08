import { useMemo, useState, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import { formatEther, formatUnits } from "viem";
import { PRESALE_ADDRESS } from "../../config/constants"; // Adjust path if needed
import { PRESALE_ABI } from "../../config/presaleAbi"; // Adjust path if needed
import UserDataDisplayStyleWrapper from "./UserDataDisplay.style";

// Define WEEK constant (must match contract's WEEK = 30 seconds for calculation)
const WEEK_SECONDS = 30n;

const UserDataDisplayClaim = () => {
  const { address, isConnected, chainId } = useAccount();
  const [pendingClaimIndex, setPendingClaimIndex] = useState(-1);
  // State for current timestamp (needed for claim eligibility check)
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  // State for stakes list visibility
  const [isStakesVisible, setIsStakesVisible] = useState(false);

  // Update current time periodically for eligibility checks
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // 1. Fetch BNB Balance
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: address,
    chainId: chainId, // Use the connected chainId
    query: {
      enabled: !!address, // Only fetch if address is available
    },
  });

  // 2. Fetch User Stakes
  const { data: userStakesData, isLoading: isStakesLoading } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "getUserStakes",
    args: [address],
    chainId: 56, // Ensure this matches your contract deployment chain
    query: {
      enabled: !!address, // Only fetch if address is available
      select: (data) => data || [], // Ensure result is always an array
    },
  });

  // 3. Prepare calls for calculating rewards for each stake
  const rewardCalculationContracts = useMemo(() => {
    if (!userStakesData || userStakesData.length === 0) {
      return [];
    }
    // Create a contract call config for each non-withdrawn stake
    return userStakesData
      .map((stake, index) =>
        !stake.withdrawn
          ? {
              address: PRESALE_ADDRESS,
              abi: PRESALE_ABI,
              functionName: "calculateRewards",
              args: [address, index],
              chainId: 56,
            }
          : null
      )
      .filter(Boolean); // Filter out null entries for withdrawn stakes
  }, [userStakesData, address]);

  // 4. Fetch Rewards for all stakes
  const { data: rewardsData, isLoading: isRewardsLoading } = useReadContracts({
    contracts: rewardCalculationContracts,
    query: {
      enabled: !!address && rewardCalculationContracts.length > 0,
    },
  });

  // 6. Fetch Direct Referrals Count
  const { data: directReferralsData, isLoading: isReferralsLoading } =
    useReadContract({
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "getStakingReferrals",
      args: [address],
      chainId: 56,
      query: {
        enabled: !!address,
        select: (data) => data || [], // Ensure result is always an array
      },
    });

  // 7. Fetch Claimable Referral Rewards
  const { data: claimableRefRewardsData, isLoading: isRefRewardsLoading } =
    useReadContract({
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "stakingReferralRewards",
      args: [address],
      chainId: 56,
      query: {
        enabled: !!address,
      },
    });

  // Add write hook for claiming individual stake rewards
  const { writeContractAsync: claimStakeReward, reset: resetStakeClaim } =
    useWriteContract();

  // 5. Process and Format Data
  const processedData = useMemo(() => {
    const bnbBalance = balanceData
      ? parseFloat(formatEther(balanceData.value)).toFixed(4)
      : "0";

    let totalStaked = 0n; // Use BigInt for summing amounts
    if (userStakesData) {
      userStakesData.forEach((stake) => {
        if (!stake.withdrawn) {
          // Consider only active stakes for total
          totalStaked += stake.amount;
        }
      });
    }
    const formattedTotalStaked = formatUnits(totalStaked, 18); // Assuming 18 decimals for staking token

    let totalRewards = 0n; // Use BigInt for summing rewards
    if (rewardsData) {
      rewardsData.forEach((rewardResult) => {
        if (rewardResult.status === "success") {
          totalRewards += rewardResult.result || 0n;
        }
      });
    }
    const formattedTotalRewards = formatEther(totalRewards); // Rewards are paid in BNB (wei)

    // Basic stake summary (can be expanded)
    const activeStakeCount =
      userStakesData?.filter((s) => !s.withdrawn).length || 0;

    const directReferralsCount = directReferralsData?.length || 0;

    const claimableRefRewardsBNB = claimableRefRewardsData
      ? formatEther(claimableRefRewardsData)
      : "0";

    return {
      bnbBalance,
      formattedTotalStaked,
      formattedTotalRewards,
      activeStakeCount,
      directReferralsCount,
      claimableRefRewardsBNB,
    };
  }, [
    balanceData,
    userStakesData,
    rewardsData,
    directReferralsData,
    claimableRefRewardsData,
  ]);

  // Handle loading state
  const isLoading =
    isBalanceLoading ||
    isStakesLoading ||
    isRewardsLoading ||
    isReferralsLoading ||
    isRefRewardsLoading;

  // Don't render anything if not connected
  if (!isConnected || !address) {
    return null;
  }

  // --- Handle Claiming Stake Reward ---
  const handleClaimStakeReward = async (stakeIndex) => {
    if (pendingClaimIndex !== -1) return; // Prevent multiple claims at once
    setPendingClaimIndex(stakeIndex);
    try {
      console.log(`Attempting to claim rewards for stake index: ${stakeIndex}`);
      await claimStakeReward({
        address: PRESALE_ADDRESS,
        abi: PRESALE_ABI,
        functionName: "claimRewards",
        args: [stakeIndex],
        chainId: 56,
      });
      console.log(`Claim transaction submitted for stake index: ${stakeIndex}`);
      // Note: rewardsData should update automatically if useReadContracts has defaults
      // or via a refetch mechanism if configured.
      resetStakeClaim(); // Reset hook state
    } catch (error) {
      console.error(
        `Failed to claim rewards for stake index ${stakeIndex}:`,
        error
      );
      // Add user feedback
      resetStakeClaim();
    } finally {
      setPendingClaimIndex(-1); // Always reset pending index
    }
  };

  // Helper to format timestamps (optional)
  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0n) return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  // --- Toggle Stakes Visibility ---
  const toggleStakesVisibility = () => {
    setIsStakesVisible((prev) => !prev);
  };

  return (
    <UserDataDisplayStyleWrapper isStakesVisible={isStakesVisible}>
      {/* <h4>Your Stats</h4> */}
      {isLoading ? (
        <p className="loading-text">Loading your data...</p>
      ) : (
        <>
          <div className="data-row">
            <span className="data-label">BNB Balance:</span>
            <span className="data-value">
              {processedData.bnbBalance} {balanceData?.symbol || ""}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">Total Staked:</span>
            <span className="data-value">
              {processedData.formattedTotalStaked} DIGI
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">Claimable Rewards:</span>
            <span className="data-value">
              {processedData.formattedTotalRewards}{" "}
              {balanceData?.symbol || "BNB"}
            </span>
          </div>
          {/* Add Direct Referrals Row */}
          <div className="data-row">
            <span className="data-label">Direct Referrals:</span>
            <span className="data-value">
              {processedData.directReferralsCount}
            </span>
          </div>
          {/* Add Claimable Referral Rewards Row */}
          <div className="data-row">
            <span className="data-label">Referral Rewards (BNB):</span>
            <span className="data-value">
              {processedData.claimableRefRewardsBNB}{" "}
              {balanceData?.symbol || "BNB"}
            </span>
          </div>
        </>
      )}

      {/* --- Individual Stakes Section (Collapsible) --- */}
      <h5
        className="stakes-title collapsible-trigger"
        onClick={toggleStakesVisibility}
      >
        Your Stakes
        <span className="collapse-icon">{/* Icon handled by CSS */}</span>
      </h5>

      {/* Conditionally render the list */}
      {isStakesVisible && (
        <>
          {isLoading ? (
            <p className="loading-text">Loading stakes...</p>
          ) : (
            <div className="stakes-list">
              {userStakesData && userStakesData.length > 0 ? (
                userStakesData.map((stake, index) => {
                  // Only display active (non-withdrawn) stakes
                  if (stake.withdrawn) return null;

                  // Get rewards for this specific stake (rewardsData corresponds to rewardCalculationContracts)
                  // Find the reward data index matching the stake index
                  const rewardContractIndex =
                    rewardCalculationContracts.findIndex(
                      (contract) =>
                        contract.functionName === "calculateRewards" &&
                        contract.args[1] === index
                    );
                  const stakeRewardResult = rewardsData?.[rewardContractIndex];
                  const claimableForStake =
                    stakeRewardResult?.status === "success" &&
                    stakeRewardResult.result
                      ? stakeRewardResult.result
                      : 0n;
                  const formattedClaimableForStake =
                    formatEther(claimableForStake);

                  // Eligibility checks based on contract logic
                  const canClaimWeekly =
                    BigInt(currentTime) >= stake.lastClaimTime + WEEK_SECONDS;
                  const isLockPeriodActive =
                    BigInt(currentTime) <=
                    stake.stakingStartTime + stake.lockPeriod;
                  const hasRewards = claimableForStake > 0n;
                  const isClaimable =
                    canClaimWeekly && isLockPeriodActive && hasRewards;

                  return (
                    <div key={index} className="stake-item">
                      <div className="stake-details">
                        <span>
                          Stake {index + 1}: {formatUnits(stake.amount, 18)}{" "}
                          DIGI
                        </span>
                        <span>
                          Ends:{" "}
                          {formatDate(
                            stake.stakingStartTime + stake.lockPeriod
                          )}
                        </span>
                        <span>Claimable: {formattedClaimableForStake} BNB</span>
                      </div>
                      <button
                        className="claim-button"
                        onClick={() => handleClaimStakeReward(index)}
                        disabled={
                          !isClaimable ||
                          pendingClaimIndex === index ||
                          pendingClaimIndex !== -1
                        }
                      >
                        {pendingClaimIndex === index ? "Claiming..." : "Claim"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="no-stakes-text">You have no active stakes yet.</p>
              )}
              {/* Show message if all stakes are withdrawn */}
              {userStakesData &&
                userStakesData.length > 0 &&
                userStakesData.every((s) => s.withdrawn) && (
                  <p className="no-stakes-text">
                    All your previous stakes have been withdrawn.
                  </p>
                )}
            </div>
          )}
        </>
      )}
    </UserDataDisplayStyleWrapper>
  );
};

export default UserDataDisplayClaim;
