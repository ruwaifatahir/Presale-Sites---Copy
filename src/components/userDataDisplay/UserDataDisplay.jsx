import React, { useMemo } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { formatEther, formatUnits } from "viem";
import { PRESALE_ADDRESS } from "../../config/constants"; // Adjust path if needed
import { PRESALE_ABI } from "../../config/presaleAbi"; // Adjust path if needed
import UserDataDisplayStyleWrapper from "./UserDataDisplay.style";

const UserDataDisplay = () => {
  const { address, isConnected, chainId } = useAccount();

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
    chainId: 97, // Ensure this matches your contract deployment chain
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
              chainId: 97,
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

    return {
      bnbBalance,
      formattedTotalStaked,
      formattedTotalRewards,
      activeStakeCount,
    };
  }, [balanceData, userStakesData, rewardsData]);

  // Handle loading state
  const isLoading = isBalanceLoading || isStakesLoading || isRewardsLoading;

  // Don't render anything if not connected
  if (!isConnected || !address) {
    return null;
  }

  return (
    <UserDataDisplayStyleWrapper>
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
          {/* Optional: Add more details about individual stakes here if needed */}
          {processedData.activeStakeCount === 0 && userStakesData && (
            <p className="no-stakes-text">You have no active stakes yet.</p>
          )}
        </>
      )}
    </UserDataDisplayStyleWrapper>
  );
};

export default UserDataDisplay;
