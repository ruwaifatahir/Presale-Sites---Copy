import { useMemo, useEffect, useState } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { formatEther, formatUnits } from "viem";
import { PRESALE_ADDRESS, USDT_ADDRESS } from "../../config/constants";
import { PRESALE_ABI } from "../../config/presaleAbi";
import { IERC20_ABI } from "../../config/erc20Abi";
import UserDataDisplayStyleWrapper from "./UserDataDisplay.style";

const UserDataDisplay = () => {
  const { address, isConnected, chainId } = useAccount();

  // 1. Fetch BNB Balance
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
    chainId: chainId,
    query: {
      enabled: !!address,
    },
  });

  // 2. Fetch USDT Balance
  const { data: usdtBalance, refetch: refetchUsdtBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: IERC20_ABI,
    functionName: "balanceOf",
    args: [address || "0x0000000000000000000000000000000000000000"],
    chainId: 56,
    query: {
      enabled: !!address,
    },
  });

  // 3. Fetch USDT Decimals
  const { data: usdtDecimals } = useReadContract({
    address: USDT_ADDRESS,
    abi: IERC20_ABI,
    functionName: "decimals",
    chainId: 56,
    query: {
      enabled: true,
    },
  });

  // 4. Fetch User Staker Info
  const { data: stakerInfo, refetch: refetchUserStakeInfo } = useReadContract({
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

  // Auto-refetch user stake info every 10 seconds when connected
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      refetchUserStakeInfo();
      refetchBalance();
      refetchUsdtBalance();
    }, 10000); // Refetch every 10 seconds

    return () => clearInterval(interval);
  }, [
    isConnected,
    address,
    refetchUserStakeInfo,
    refetchBalance,
    refetchUsdtBalance,
  ]);

  // Listen for stake confirmation events to trigger immediate refresh
  useEffect(() => {
    const handleStakeConfirmed = (event) => {
      console.log(
        "UserDataDisplay - Received stakeConfirmed event:",
        event.detail
      );
      // Trigger immediate refresh of all user data
      refetchUserStakeInfo();
      refetchBalance();
      refetchUsdtBalance();
    };

    window.addEventListener("stakeConfirmed", handleStakeConfirmed);

    return () => {
      window.removeEventListener("stakeConfirmed", handleStakeConfirmed);
    };
  }, [refetchUserStakeInfo, refetchBalance, refetchUsdtBalance]);

  // 5. Process and Format Data
  const processedData = useMemo(() => {
    const bnbBalance = balanceData
      ? parseFloat(formatEther(balanceData.value)).toFixed(4)
      : "0";

    const usdtBalanceFormatted =
      usdtBalance && usdtDecimals
        ? parseFloat(formatUnits(usdtBalance, usdtDecimals)).toFixed(2)
        : "0";

    // Format staker data - handle array format from contract
    // stakerInfo is returned as [referrer, totalStakedAmount, totalInvestedAmount, stakes]
    const totalStakedAmount = stakerInfo?.[1] || 0n;
    const totalInvestedAmount = stakerInfo?.[2] || 0n;

    const totalStaked = totalStakedAmount
      ? formatUnits(totalStakedAmount, 18)
      : "0";

    const totalInvested = totalInvestedAmount
      ? formatUnits(totalInvestedAmount, 18)
      : "0";

    return {
      bnbBalance,
      usdtBalance: usdtBalanceFormatted,
      totalStaked,
      totalInvested,
      hasReferrer:
        stakerInfo?.[0] !== "0x0000000000000000000000000000000000000000",
    };
  }, [balanceData, usdtBalance, usdtDecimals, stakerInfo]);

  // Don't render anything if not connected
  if (!isConnected || !address) {
    return null;
  }

  return (
    <UserDataDisplayStyleWrapper>
      <div className="data-row">
        <span className="data-label">BNB Balance:</span>
        <span className="data-value">
          {processedData.bnbBalance} {balanceData?.symbol || ""}
        </span>
      </div>
      <div className="data-row">
        <span className="data-label">USDT Balance:</span>
        <span className="data-value">{processedData.usdtBalance} USDT</span>
      </div>
      <div className="data-row">
        <span className="data-label">Total Staked:</span>
        <span className="data-value">{processedData.totalStaked} DGFL</span>
      </div>
      <div className="data-row">
        <span className="data-label">Total Invested:</span>
        <span className="data-value">{processedData.totalInvested} USD</span>
      </div>
    </UserDataDisplayStyleWrapper>
  );
};

export default UserDataDisplay;
