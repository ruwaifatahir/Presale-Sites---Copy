# PresaleStaking Contract - Frontend Integration Guide

## Contract Overview

A presale staking contract with 3 stake plans, referral system, and dual payment methods (BNB/USDT).

## Key Contract Details

- **Stake Plans**: 3 plans (index 0-2), all with 80% APY, 1-week lock, 100 token minimum
- **Payment Methods**: BNB (native) or USDT/investToken
- **Referral System**: 6-level deep with rewards [30%, 20%, 10%, 5%, 5%, 5%]
- **Withdrawal**: 10% weekly after lock period ends

## Essential Read Functions

### 1. Get Current Token Price

```javascript
const tokenPrice = await contract.getTokenPrice();
// Returns: uint256 (18 decimals)
```

### 2. Get BNB Price (USD)

```javascript
const bnbPrice = await contract.getBnbPrice();
// Returns: uint256 (8 decimals)
```

### 3. Get Stake Plans

```javascript
const stakePlan = await contract.stakePlans(planIndex); // 0, 1, or 2
// Returns: { apy, lockDuration, minStakeAmount }
```

### 4. Get User Staking Info

```javascript
const stakerInfo = await contract.getStakerInfo(userAddress);
// Returns: { referrer, totalStakedAmount, totalInvestedAmount, stakes[3] }

const stakeInfo = await contract.getStakeInfo(userAddress, planIndex);
// Returns: { stakedAmount, investedAmount, stakeTime, lastClaimTime, lastWithdrawalTime, totalWithdrawnAmount }
```

### 5. Get Contract Stats

```javascript
const stats = await contract.getStakerStats();
// Returns: { totalStakers, totalInvested, totalCollected }
```

### 6. Check Contract State

```javascript
const startTime = await contract.startTime();
const paused = await contract.paused();
const hardcap = await contract.HARDCAP(); // 5,000,000 USDT
```

## Write Functions

### 1. Stake with BNB

```javascript
// Calculate tokens user will receive
const bnbPrice = await contract.getBnbPrice();
const tokenPrice = await contract.getTokenPrice();
const usdValue = (bnbAmount * bnbPrice) / 1e8;
const tokensToReceive = (usdValue * 1e18) / tokenPrice;

// Execute stake
await contract.stake(
  planIndex, // uint8: 0, 1, or 2
  referrerAddress, // address: referrer or 0x0
  { value: bnbAmount }
);
```

### 2. Stake with USDT/InvestToken

```javascript
// First approve the contract
await investToken.approve(contractAddress, amount);

// Then stake
await contract.stake(
  amount, // uint256: USDT amount (18 decimals)
  planIndex, // uint8: 0, 1, or 2
  referrerAddress // address: referrer or 0x0
);
```

### 3. Withdraw Staked Tokens

```javascript
await contract.withdraw(planIndex); // uint8: 0, 1, or 2
```

## Important Events to Listen For

```javascript
// Staking event
contract.on("Staked", (user, stakedAmount, investedAmount, stakePlanIndex) => {
  console.log(
    `User ${user} staked ${stakedAmount} tokens in plan ${stakePlanIndex}`
  );
});

// Withdrawal event
contract.on("Withdrawn", (user, withdrawnAmount) => {
  console.log(`User ${user} withdrew ${withdrawnAmount} tokens`);
});
```

## Frontend Validation Checklist

### Before Staking:

1. **Contract not paused**: `!await contract.paused()`
2. **Sale started**: `block.timestamp >= await contract.startTime()`
3. **Valid plan index**: `planIndex <= 2`
4. **Not already staked**: Check `getStakeInfo()` for existing stake
5. **Minimum amount**: Tokens to receive >= plan's `minStakeAmount`
6. **Hardcap check**: `totalInvested + newAmount <= HARDCAP`
7. **Referrer qualified**: If referrer provided, check their `totalStakedAmount >= 10,000e18`
8. **No circular referral**: `referrer !== userAddress`

### Before Withdrawal:

1. **Has staked amount**: `stakedAmount > 0`
2. **Lock period ended**: `block.timestamp >= stakeTime + lockDuration`
3. **Weekly withdrawal limit**: `block.timestamp >= lastWithdrawalTime + 1 week`
4. **Available to withdraw**: `stakedAmount > totalWithdrawnAmount`

## Error Handling

```javascript
const errorMessages = {
  INVALID_STAKE_PLAN_INDEX_ERROR: "Invalid stake plan. Use 0, 1, or 2.",
  NOT_STARTED_ERROR: "Presale has not started yet.",
  ALREADY_STAKE_ERROR: "Already staked in this plan.",
  CIRCULAR_REFERRAL_ERROR: "Cannot refer yourself.",
  HARDCAP_REACHED_ERROR: "Investment hardcap reached.",
  MIN_STAKE_AMOUNT_ERROR: "Below minimum stake amount.",
  REFERER_NOT_QUALIFIED_ERROR:
    "Referrer must have staked at least 10,000 tokens.",
  WITHDRAW_LOCKED_ERROR: "Withdrawal is locked.",
  NO_AMOUNT_TO_WITHDRAW_ERROR: "No amount available to withdraw.",
};
```

## Utility Functions

### Calculate Tokens from BNB

```javascript
async function calculateTokensFromBNB(bnbAmount) {
  const bnbPrice = await contract.getBnbPrice();
  const tokenPrice = await contract.getTokenPrice();
  const usdValue = (bnbAmount * bnbPrice) / 1e8;
  return (usdValue * 1e18) / tokenPrice;
}
```

### Calculate Tokens from USDT

```javascript
async function calculateTokensFromUSDT(usdtAmount) {
  const tokenPrice = await contract.getTokenPrice();
  return (usdtAmount * 1e18) / tokenPrice;
}
```

### Check Withdrawal Eligibility

```javascript
async function canWithdraw(userAddress, planIndex) {
  const stakeInfo = await contract.getStakeInfo(userAddress, planIndex);
  const stakePlan = await contract.stakePlans(planIndex);

  if (stakeInfo.stakedAmount === 0) return false;

  const lockEnded =
    Date.now() / 1000 >= stakeInfo.stakeTime + stakePlan.lockDuration;
  const weeklyLimitPassed =
    Date.now() / 1000 >= stakeInfo.lastWithdrawalTime + 7 * 24 * 60 * 60;
  const hasAmountToWithdraw =
    stakeInfo.stakedAmount > stakeInfo.totalWithdrawnAmount;

  return lockEnded && weeklyLimitPassed && hasAmountToWithdraw;
}
```

## Constants

- **HARDCAP**: 5,000,000 USDT
- **PRICE_INCREASE_INTERVAL**: 172,800 minutes
- **PRICE_INCREASE_PERCENT**: 1%
- **REFERRER_REWARDS**: [30%, 20%, 10%, 5%, 5%, 5%]
- **WEEKLY_WITHDRAWAL_PERCENT**: 10%
