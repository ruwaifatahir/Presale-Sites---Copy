export const PRESALE_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_investToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_stakingToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_rewardToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_bnbPriceFeed",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_baseTokenPrice",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ALREADY_STAKE_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "ALREADY_WITHDRAWN_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "CIRCULAR_REFERRAL_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "HARDCAP_REACHED_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "INVALID_ADDRESS_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "INVALID_BASE_TOKEN_PRICE_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "INVALID_STAKE_PLAN_INDEX_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "MIN_STAKE_AMOUNT_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "NOT_ENOUGH_DEPOSITED_TOKENS_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "NOT_STARTED_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "NO_AMOUNT_TO_WITHDRAW_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "NO_INVEST_TOKENS_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "NO_STAKING_TOKENS_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "REFERER_NOT_QUALIFIED_ERROR",
    type: "error",
  },
  {
    inputs: [],
    name: "WITHDRAW_LOCKED_ERROR",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "withdrawnAmount",
        type: "uint256",
      },
    ],
    name: "InvestTokensWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint8",
        name: "stakePlanIndex",
        type: "uint8",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "apy",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lockDuration",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minStakeAmount",
            type: "uint256",
          },
        ],
        indexed: false,
        internalType: "struct PresaleStakingStorage.StakePlan",
        name: "stakePlan",
        type: "tuple",
      },
    ],
    name: "StakePlanUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "stakedAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "investedAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "stakePlanIndex",
        type: "uint8",
      },
    ],
    name: "Staked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "staker",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "StakerAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "depositedAmount",
        type: "uint256",
      },
    ],
    name: "StakingTokensDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "withdrawnAmount",
        type: "uint256",
      },
    ],
    name: "StakingTokensWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "withdrawnAmount",
        type: "uint256",
      },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    inputs: [],
    name: "HARDCAP",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PRICE_INCREASE_INTERVAL",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PRICE_INCREASE_PERCENT",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "REFERRER_REWARDS_PERCENT",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "baseTokenPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bnbPriceFeed",
    outputs: [
      {
        internalType: "contract AggregatorV3Interface",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "collectedInvestTokens",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "depositStakingTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "depositedStakingTokens",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_offset",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_limit",
        type: "uint256",
      },
    ],
    name: "distributeRewards",
    outputs: [
      {
        internalType: "bool",
        name: "success",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "processedCount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getBnbPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_staker",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "_stakePlanIndex",
        type: "uint8",
      },
    ],
    name: "getStakeInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "stakedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "investedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "stakeTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastClaimTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastWithdrawalTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalWithdrawnAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_staker",
        type: "address",
      },
    ],
    name: "getStakerInfo",
    outputs: [
      {
        internalType: "address",
        name: "referrer",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "totalStakedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalInvestedAmount",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "stakedAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "investedAmount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "stakeTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lastClaimTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lastWithdrawalTime",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalWithdrawnAmount",
            type: "uint256",
          },
        ],
        internalType: "struct PresaleStakingStorage.Stake[3]",
        name: "stakes",
        type: "tuple[3]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStakerStats",
    outputs: [
      {
        internalType: "uint256",
        name: "totalStakers",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalInvested",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalCollected",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStakersCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokenPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "investToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "rewardToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_stakePlanIndex",
        type: "uint8",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "apy",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "lockDuration",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minStakeAmount",
            type: "uint256",
          },
        ],
        internalType: "struct PresaleStakingStorage.StakePlan",
        name: "_stakePlan",
        type: "tuple",
      },
    ],
    name: "setStakePlan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "_stakePlanIndex",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "_referrer",
        type: "address",
      },
    ],
    name: "stake",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_stakePlanIndex",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "_referrer",
        type: "address",
      },
    ],
    name: "stake",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "stakePlans",
    outputs: [
      {
        internalType: "uint256",
        name: "apy",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lockDuration",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minStakeAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "stakers",
    outputs: [
      {
        internalType: "address",
        name: "referrer",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "totalStakedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalInvestedAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "stakersArray",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "stakingToken",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "startTime",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalInvestedTokens",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "_stakePlanIndex",
        type: "uint8",
      },
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawInvestTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawStakingTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
