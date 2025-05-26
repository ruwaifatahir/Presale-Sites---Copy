import PayWithStyleWrapper from "./PayWith.style";
import {
  useReadContract,
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { PRESALE_ADDRESS } from "../../config/constants";
import { PRESALE_ABI } from "../../config/presaleAbi";
import PropTypes from "prop-types";
import { formatUnits } from "viem";
import { useState, useMemo, useEffect } from "react";
import Dropdown from "./Dropdown/Dropdown";

/**
 * Component for withdrawing staked tokens from the staking system
 */

const WITHDRAW_PLAN_OPTIONS = [
  { label: "Plan 1 - 80% APY, 6 Months", value: 0 },
  { label: "Plan 2 - 100% APY, 12 Months", value: 1 },
  { label: "Plan 3 - 120% APY, 24 Months", value: 2 },
];

const WithdrawWith = ({ variant }) => {
  const { address, isConnected } = useAccount();
  const {
    writeContract,
    isPending: isWithdrawPending,
    data: hash,
  } = useWriteContract();
  const { openConnectModal } = useConnectModal();
  const [selectedPlan, setSelectedPlan] = useState(
    WITHDRAW_PLAN_OPTIONS[0].value
  );

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Get user staker info
  const {
    data: stakerInfo,
    isLoading: isStakerLoading,
    refetch: refetchStakerInfo,
  } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "getStakerInfo",
    args: [address || "0x0000000000000000000000000000000000000000"],
    chainId: 56,
    query: {
      enabled: !!address,
      refetchInterval: 15000,
    },
  });

  // Handle withdrawal confirmation
  useEffect(() => {
    if (isConfirmed) {
      // Refetch user data immediately
      refetchStakerInfo();

      // Emit custom event for other components to refresh
      window.dispatchEvent(
        new CustomEvent("withdrawalConfirmed", {
          detail: { address, planIndex: selectedPlan },
        })
      );

      console.log("Withdrawal confirmed - triggering data refresh");
    }
  }, [isConfirmed, refetchStakerInfo, address, selectedPlan]);

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
    const handleWithdrawConfirmed = (event) => {
      console.log(
        "WithdrawWith - Received withdrawalConfirmed event:",
        event.detail
      );
      // Trigger immediate refresh of staker data
      refetchStakerInfo();
    };

    window.addEventListener("withdrawalConfirmed", handleWithdrawConfirmed);

    return () => {
      window.removeEventListener(
        "withdrawalConfirmed",
        handleWithdrawConfirmed
      );
    };
  }, [refetchStakerInfo]);

  // Get stake plans
  const { data: stakePlans, isLoading: isPlansLoading } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PRESALE_ABI,
    functionName: "stakePlans",
    args: [selectedPlan],
    chainId: 56,
    query: {
      enabled: true,
    },
  });

  // Calculate withdrawal eligibility and amounts
  const withdrawalInfo = useMemo(() => {
    if (!stakerInfo || !stakePlans) {
      return {
        canWithdraw: false,
        withdrawableAmount: "0",
        nextWithdrawTime: null,
      };
    }

    // stakerInfo is returned as [referrer, totalStakedAmount, totalInvestedAmount, stakes]
    const stakes = stakerInfo[3] || [];
    const stake = stakes[selectedPlan];
    if (!stake || stake.stakedAmount === 0n) {
      return {
        canWithdraw: false,
        withdrawableAmount: "0",
        nextWithdrawTime: null,
      };
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const lockEndTime =
      Number(stake.stakeTime) + Number(stakePlans.lockDuration);
    const lastWithdrawTime = Number(stake.lastWithdrawalTime);
    const weekInSeconds = 7 * 24 * 60 * 60;

    // Check if lock period has ended
    const lockEnded = currentTime >= lockEndTime;

    // Check if a week has passed since last withdrawal
    const weekPassed = currentTime >= lastWithdrawTime + weekInSeconds;

    // Calculate withdrawable amount (10% of staked amount)
    const withdrawableAmount = (stake.stakedAmount * 10000n) / 100000n; // 10%
    const remainingAmount = stake.stakedAmount - stake.totalWithdrawnAmount;
    const actualWithdrawable =
      withdrawableAmount > remainingAmount
        ? remainingAmount
        : withdrawableAmount;

    const canWithdraw = lockEnded && weekPassed && actualWithdrawable > 0n;

    let nextWithdrawTime = null;
    if (!weekPassed && lockEnded) {
      nextWithdrawTime = new Date((lastWithdrawTime + weekInSeconds) * 1000);
    } else if (!lockEnded) {
      nextWithdrawTime = new Date(lockEndTime * 1000);
    }

    return {
      canWithdraw,
      withdrawableAmount: formatUnits(actualWithdrawable, 18),
      nextWithdrawTime,
      lockEnded,
      weekPassed,
      totalStaked: formatUnits(stake.stakedAmount, 18),
      totalWithdrawn: formatUnits(stake.totalWithdrawnAmount, 18),
      remainingAmount: formatUnits(remainingAmount, 18),
    };
  }, [stakerInfo, stakePlans, selectedPlan]);

  const handleWithdraw = async () => {
    if (!withdrawalInfo.canWithdraw) return;

    try {
      await writeContract({
        address: PRESALE_ADDRESS,
        abi: PRESALE_ABI,
        functionName: "withdraw",
        args: [selectedPlan],
        chainId: 56,
      });
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  const handleWithdrawButtonClick = () => {
    if (!isConnected) {
      openConnectModal?.();
    } else {
      handleWithdraw();
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    return date.toLocaleString();
  };

  const isLoading = isStakerLoading || isPlansLoading;

  return (
    <div>
      <PayWithStyleWrapper variant={variant}>
        <form onSubmit={(e) => e.preventDefault()}>
          {/* Plan Selection */}
          <div className="presale-item mb-30">
            <div className="presale-item-inner">
              <label>Select Stake Plan to Withdraw From</label>
              <Dropdown
                options={WITHDRAW_PLAN_OPTIONS}
                selectedValue={selectedPlan}
                onSelect={(value) => setSelectedPlan(value)}
                placeholder="Select Stake Plan"
              />
            </div>
          </div>

          {/* Withdrawal Information */}
          {isConnected && !isLoading && (
            <div className="withdrawal-info" style={{ marginBottom: "20px" }}>
              {withdrawalInfo.totalStaked === "0.0" ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    backgroundColor: "rgba(255, 107, 107, 0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 107, 107, 0.3)",
                  }}
                >
                  <p
                    style={{
                      color: "#ff6b6b",
                      fontSize: "16px",
                      margin: "0 0 10px 0",
                    }}
                  >
                    📭 No Stakes Found
                  </p>
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "14px",
                      margin: "0",
                    }}
                  >
                    You haven't staked any tokens in Plan {selectedPlan + 1}{" "}
                    yet.
                    <br />
                    Go to the staking page to start earning rewards!
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="info-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span>Total Staked:</span>
                    <span>{withdrawalInfo.totalStaked} DIGI</span>
                  </div>
                  <div
                    className="info-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span>Total Withdrawn:</span>
                    <span>{withdrawalInfo.totalWithdrawn} DIGI</span>
                  </div>
                  <div
                    className="info-row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span>Remaining:</span>
                    <span>{withdrawalInfo.remainingAmount} DIGI</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Withdraw Button */}
          <div className="presale-item">
            <button
              className="presale-item-btn"
              disabled={
                isConnected
                  ? withdrawalInfo.totalStaked === "0.0" ||
                    !withdrawalInfo.canWithdraw ||
                    isWithdrawPending ||
                    isConfirming
                  : false
              }
              onClick={handleWithdrawButtonClick}
              type="button"
            >
              {!isConnected
                ? "Connect Wallet"
                : isLoading
                ? "Loading..."
                : isWithdrawPending
                ? "Withdrawing..."
                : isConfirming
                ? "Confirming Withdrawal..."
                : withdrawalInfo.totalStaked === "0.0"
                ? "No Stakes to Withdraw"
                : withdrawalInfo.canWithdraw
                ? `Withdraw ${Number(withdrawalInfo.withdrawableAmount).toFixed(
                    4
                  )} DIGI`
                : "Cannot Withdraw Yet"}
            </button>
          </div>
        </form>
      </PayWithStyleWrapper>
    </div>
  );
};

WithdrawWith.propTypes = {
  variant: PropTypes.string,
};

export default WithdrawWith;
