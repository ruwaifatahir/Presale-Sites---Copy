import { useMemo, useState, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther, formatUnits } from "viem";
import { PRESALE_ADDRESS } from "../../config/constants";
import { PRESALE_ABI } from "../../config/presaleAbi";
import UserDataDisplayStyleWrapper from "./UserDataDisplay.style";

const UserDataDisplayClaim = () => {
  const { address, isConnected, chainId } = useAccount();
  const [pendingWithdrawIndex, setPendingWithdrawIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [isStakesVisible, setIsStakesVisible] = useState(false);
  const [withdrawalTxHash, setWithdrawalTxHash] = useState(null);

  // Update current time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 1. Fetch BNB Balance
  const { data: balanceData } = useBalance({
    address: address,
    chainId: chainId,
    query: {
      enabled: !!address,
    },
  });

  // 2. Fetch User Staker Info
  const { data: stakerInfo, refetch: refetchStakerInfo } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "getStakerInfo",
    args: [address || "0x0000000000000000000000000000000000000000"],
    chainId: 56,
    query: {
      enabled: !!address,
      select: (data) =>
        data || {
          referrer: "0x0000000000000000000000000000000000000000",
          totalStakedAmount: 0n,
          totalInvestedAmount: 0n,
          stakes: [],
        },
    },
  });

  // 3. Fetch Stake Plans for all 3 plans
  const stakePlanCalls = [
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "stakePlans",
      args: [0],
      chainId: 56,
    },
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "stakePlans",
      args: [1],
      chainId: 56,
    },
    {
      address: PRESALE_ADDRESS,
      abi: PRESALE_ABI,
      functionName: "stakePlans",
      args: [2],
      chainId: 56,
    },
  ];

  const { data: stakePlansData } = useReadContracts({
    contracts: stakePlanCalls,
    query: {
      enabled: true,
    },
  });

  // Add write hook for withdrawing
  const { writeContract, isPending: isWithdrawPending } = useWriteContract();

  // Auto-refetch staker info every 10 seconds when connected
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      refetchStakerInfo();
    }, 10000); // Refetch every 10 seconds

    return () => clearInterval(interval);
  }, [isConnected, address, refetchStakerInfo]);

  // Listen for withdrawal confirmation events to trigger immediate refresh
  useEffect(() => {
    const handleWithdrawalConfirmed = (event) => {
      console.log(
        "UserDataDisplayClaim - Received withdrawalConfirmed event:",
        event.detail
      );
      // Trigger immediate refresh of staker data
      refetchStakerInfo();
    };

    window.addEventListener("withdrawalConfirmed", handleWithdrawalConfirmed);

    return () => {
      window.removeEventListener(
        "withdrawalConfirmed",
        handleWithdrawalConfirmed
      );
    };
  }, [refetchStakerInfo]);

  // Wait for withdrawal transaction confirmation
  const {
    isLoading: isWithdrawalConfirming,
    isSuccess: isWithdrawalConfirmed,
  } = useWaitForTransactionReceipt({
    hash: withdrawalTxHash,
  });

  // Handle withdrawal confirmation
  useEffect(() => {
    if (isWithdrawalConfirmed) {
      setWithdrawalTxHash(null);
      setPendingWithdrawIndex(-1);

      // Refetch user data immediately
      refetchStakerInfo();

      // Emit custom event for other components to refresh
      window.dispatchEvent(
        new CustomEvent("withdrawalConfirmed", {
          detail: { address },
        })
      );

      console.log("Withdrawal confirmed - triggering data refresh");
    }
  }, [isWithdrawalConfirmed, refetchStakerInfo, address]);

  // 4. Process and Format Data
  const processedData = useMemo(() => {
    const bnbBalance = balanceData
      ? parseFloat(formatEther(balanceData.value)).toFixed(4)
      : "0";

    // Format staker data - handle array format from contract
    // stakerInfo is returned as [referrer, totalStakedAmount, totalInvestedAmount, stakes]
    const totalStakedAmount = stakerInfo?.[1] || 0n;
    const totalInvestedAmount = stakerInfo?.[2] || 0n;
    const stakes = stakerInfo?.[3] || [];

    const totalStaked = totalStakedAmount
      ? formatUnits(totalStakedAmount, 18)
      : "0";

    const totalInvested = totalInvestedAmount
      ? formatUnits(totalInvestedAmount, 18)
      : "0";

    // Count active stakes
    const activeStakes =
      stakes?.filter((stake) => stake.stakedAmount > 0n).length || 0;

    // Calculate total withdrawable amount across all stakes
    let totalWithdrawable = 0n;
    let totalWithdrawn = 0n;

    if (stakes) {
      stakes.forEach((stake) => {
        if (stake.stakedAmount > 0n) {
          const remainingAmount =
            stake.stakedAmount - stake.totalWithdrawnAmount;
          const weeklyWithdrawable = (stake.stakedAmount * 10000n) / 100000n; // 10%
          const actualWithdrawable =
            weeklyWithdrawable > remainingAmount
              ? remainingAmount
              : weeklyWithdrawable;
          totalWithdrawable += actualWithdrawable;
          totalWithdrawn += stake.totalWithdrawnAmount;
        }
      });
    }

    const formattedWithdrawable = formatUnits(totalWithdrawable, 18);
    const formattedWithdrawn = formatUnits(totalWithdrawn, 18);

    return {
      bnbBalance,
      totalStaked,
      totalInvested,
      activeStakes,
      formattedWithdrawable,
      formattedWithdrawn,
      stakes,
      hasReferrer:
        stakerInfo?.[0] !== "0x0000000000000000000000000000000000000000",
    };
  }, [balanceData, stakerInfo]);

  // Don't render anything if not connected
  if (!isConnected || !address) {
    return null;
  }

  // --- Handle Withdrawing Stake ---
  const handleWithdrawStake = async (stakeIndex) => {
    if (pendingWithdrawIndex !== -1) return; // Prevent multiple withdrawals at once
    setPendingWithdrawIndex(stakeIndex);
    try {
      console.log(`Attempting to withdraw from stake index: ${stakeIndex}`);
      const txHash = await writeContract({
        address: PRESALE_ADDRESS,
        abi: PRESALE_ABI,
        functionName: "withdraw",
        args: [stakeIndex],
        chainId: 56,
      });

      // Set the transaction hash for monitoring
      setWithdrawalTxHash(txHash);
      console.log(
        `Withdrawal transaction submitted for stake index: ${stakeIndex}`
      );
    } catch (error) {
      console.error(`Error withdrawing from stake ${stakeIndex}:`, error);
      setPendingWithdrawIndex(-1);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const calculateWithdrawablePercentage = (stake) => {
    if (!stake || stake.stakedAmount === 0n) return 0;

    const totalWithdrawn = stake.totalWithdrawnAmount;
    const totalStaked = stake.stakedAmount;
    const percentage = (Number(totalWithdrawn) / Number(totalStaked)) * 100;

    return Math.min(percentage, 100);
  };

  const canWithdrawFromStake = (stake, stakePlan) => {
    if (!stake || !stakePlan || stake.stakedAmount === 0n) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    const lockEndTime =
      Number(stake.stakeTime) + Number(stakePlan.lockDuration);
    const lastWithdrawTime = Number(stake.lastWithdrawalTime);
    const weekInSeconds = 7 * 24 * 60 * 60;

    const lockEnded = currentTime >= lockEndTime;
    const weekPassed = currentTime >= lastWithdrawTime + weekInSeconds;
    const hasRemainingAmount = stake.stakedAmount > stake.totalWithdrawnAmount;

    return lockEnded && weekPassed && hasRemainingAmount;
  };

  const toggleStakesVisibility = () => {
    setIsStakesVisible(!isStakesVisible);
  };

  return (
    <UserDataDisplayStyleWrapper>
      <div className="data-row">
        <span className="data-label">BNB Balance:</span>
        <span className="data-value">
          {processedData.bnbBalance} {balanceData?.symbol || ""}
        </span>
      </div>
      <div className="data-row">
        <span className="data-label">Total Staked:</span>
        <span className="data-value">{processedData.totalStaked} DIGI</span>
      </div>
      <div className="data-row">
        <span className="data-label">Total Invested:</span>
        <span className="data-value">{processedData.totalInvested} USD</span>
      </div>
      <div className="data-row">
        <span className="data-label">Active Stakes:</span>
        <span className="data-value">{processedData.activeStakes} plans</span>
      </div>
      <div className="data-row">
        <span className="data-label">Withdrawable:</span>
        <span className="data-value">
          {processedData.formattedWithdrawable} DIGI
        </span>
      </div>
      <div className="data-row">
        <span className="data-label">Total Withdrawn:</span>
        <span className="data-value">
          {processedData.formattedWithdrawn} DIGI
        </span>
      </div>

      {/* Toggle button for stakes list */}
      <div className="stakes-toggle" style={{ marginTop: "20px" }}>
        <button
          onClick={toggleStakesVisibility}
          className="toggle-button"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            width: "100%",
          }}
        >
          {isStakesVisible ? "Hide Stakes Details" : "Show Stakes Details"} (
          {processedData.activeStakes})
        </button>
      </div>

      {/* Stakes list */}
      {isStakesVisible && processedData.stakes && (
        <div className="stakes-list" style={{ marginTop: "15px" }}>
          {processedData.stakes.map((stake, index) => {
            if (stake.stakedAmount === 0n) return null;

            const stakePlan = stakePlansData?.[index]?.result;
            const canWithdraw = canWithdrawFromStake(stake, stakePlan);
            const withdrawnPercentage = calculateWithdrawablePercentage(stake);
            const remainingAmount =
              stake.stakedAmount - stake.totalWithdrawnAmount;
            const weeklyWithdrawable = (stake.stakedAmount * 10000n) / 100000n; // 10%
            const actualWithdrawable =
              weeklyWithdrawable > remainingAmount
                ? remainingAmount
                : weeklyWithdrawable;

            return (
              <div
                key={index}
                className="stake-item"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "15px",
                  marginBottom: "10px",
                }}
              >
                <div className="stake-header" style={{ marginBottom: "10px" }}>
                  <h4
                    style={{
                      margin: "0 0 5px 0",
                      color: "#fff",
                      fontSize: "16px",
                    }}
                  >
                    Plan {index + 1} -{" "}
                    {stakePlan ? Number(formatUnits(stakePlan.apy, 18)) : 80}%
                    APY
                  </h4>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    Staked: {formatDate(stake.stakeTime)}
                  </div>
                </div>

                <div className="stake-details">
                  <div
                    className="detail-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>Staked Amount:</span>
                    <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                      {formatUnits(stake.stakedAmount, 18)} DIGI
                    </span>
                  </div>
                  <div
                    className="detail-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>Invested Amount:</span>
                    <span style={{ fontSize: "14px" }}>
                      {formatUnits(stake.investedAmount, 18)} USD
                    </span>
                  </div>
                  <div
                    className="detail-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>Withdrawn:</span>
                    <span style={{ fontSize: "14px" }}>
                      {formatUnits(stake.totalWithdrawnAmount, 18)} DIGI (
                      {withdrawnPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    className="detail-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>Withdrawable Now:</span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: canWithdraw ? "#00ff00" : "#ff6b6b",
                      }}
                    >
                      {formatUnits(actualWithdrawable, 18)} DIGI
                    </span>
                  </div>

                  {/* Withdrawal Progress Bar */}
                  <div
                    className="progress-container"
                    style={{ marginBottom: "10px" }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        marginBottom: "5px",
                        color: "rgba(255, 255, 255, 0.7)",
                      }}
                    >
                      Withdrawal Progress: {withdrawnPercentage.toFixed(1)}%
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${withdrawnPercentage}%`,
                          height: "100%",
                          backgroundColor:
                            withdrawnPercentage >= 100 ? "#00ff00" : "#007bff",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Withdraw Button */}
                  <button
                    onClick={() => handleWithdrawStake(index)}
                    disabled={
                      !canWithdraw ||
                      pendingWithdrawIndex === index ||
                      (withdrawalTxHash && isWithdrawalConfirming)
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      backgroundColor: canWithdraw ? "#007bff" : "#6c757d",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: canWithdraw ? "pointer" : "not-allowed",
                      fontSize: "14px",
                      opacity: canWithdraw ? 1 : 0.6,
                    }}
                  >
                    {pendingWithdrawIndex === index &&
                    withdrawalTxHash &&
                    isWithdrawalConfirming
                      ? "Confirming..."
                      : pendingWithdrawIndex === index
                      ? "Withdrawing..."
                      : canWithdraw
                      ? `Withdraw ${formatUnits(actualWithdrawable, 18)} DIGI`
                      : "Cannot Withdraw Yet"}
                  </button>

                  {/* Status message */}
                  {!canWithdraw && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#ff6b6b",
                        marginTop: "5px",
                        textAlign: "center",
                      }}
                    >
                      {stake.stakedAmount <= stake.totalWithdrawnAmount
                        ? "✅ Fully withdrawn"
                        : currentTime <
                          Number(stake.stakeTime) +
                            Number(stakePlan?.lockDuration || 0)
                        ? "⏳ Lock period active"
                        : "⏰ Weekly limit (wait 7 days)"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </UserDataDisplayStyleWrapper>
  );
};

export default UserDataDisplayClaim;
