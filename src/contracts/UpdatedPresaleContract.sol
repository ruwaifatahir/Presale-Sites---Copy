contract PresaleStakingContract is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    IERC20Extended public stakingToken;

    // Presale variables
    uint256 public constant PRICE_INCREASE_INTERVAL = 172800 minutes; // 120 days for production
    uint256 public constant PRICE_INCREASE_PERCENT = 1; // 1%
    uint256 public startTime;
    uint256 public baseTokenPrice;

    // Staking variables
    struct Stake {
        uint256 amount;
        uint256 stakingStartTime;
        uint256 lockPeriod;
        uint256 claimedRewards;
        bool withdrawn;
        uint256 lastClaimTime;
        uint256 withdrawalStartTime;
        uint256 withdrawnPercentage;
        address referrer;
    }

    mapping(address => Stake[]) public stakes;
    mapping(address => address[]) public stakingReferrals;
    mapping(address => uint256) public stakingReferralRewards;
    mapping(address => address) public stakingReferrer;

    uint256[3] public apyRanges = [8000, 10000, 12000]; // 80%, 100%, 120% in basis points
    uint256 public minStakeAmount;
    uint256 public maxStakeAmount;

    uint256 public constant WEEK = 1 weeks;
    uint256 public sixMonths = 26 weeks;
    uint256 public oneYear = 52 weeks;
    uint256 public twoYears = 104 weeks;

    uint256[6] public stakingReferralPercentages = [30, 20, 10, 5, 5, 5];

    event Staked(address indexed user, uint256 amount, uint256 lockPeriod, uint256 stakeIndex, address referrer);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 stakeIndex);
    event StakingReferralRewardsDistributed(address indexed referrer, uint256 amount, uint256 level);
    event Withdrawn(address indexed user, uint256 amount, uint256 stakeIndex);
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 totalCost);
    event APYUpdated(uint256[3] newAPYRanges);
    event LockPeriodsUpdated(uint256 sixMonths, uint256 oneYear, uint256 twoYears);
    event MinStakeAmountUpdated(uint256 newMinStakeAmount);
    event MaxStakeAmountUpdated(uint256 newMaxStakeAmount);

    constructor(address _stakingToken, uint256 _baseTokenPrice, address initialOwner) Ownable(initialOwner) {
        stakingToken = IERC20Extended(_stakingToken);
        baseTokenPrice = _baseTokenPrice;
        startTime = block.timestamp;

        uint8 decimals = stakingToken.decimals();
        minStakeAmount = 3000 * (10 ** decimals);
        maxStakeAmount = 1000000 * (10 ** decimals); // 1M tokens max
    }

    function getCurrentTokenPrice() public view returns (uint256) {
        uint256 intervalsPassed = (block.timestamp - startTime) / PRICE_INCREASE_INTERVAL;
        uint256 priceIncrease = baseTokenPrice.mul(intervalsPassed).mul(PRICE_INCREASE_PERCENT).div(100);
        return baseTokenPrice.add(priceIncrease);
    }

    function buyTokens(uint256 amount, uint8 lockOption, address referrer) external payable nonReentrant {
        require(amount >= minStakeAmount, "Amount below minimum stake");
        require(amount <= maxStakeAmount, "Amount above maximum stake");
        require(lockOption <= 2, "Invalid lock option");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(stakingToken.balanceOf(address(this)) >= amount, "Not enough tokens in contract");

        uint256 currentPrice = getCurrentTokenPrice();
        uint8 decimals = stakingToken.decimals();
        uint256 totalCost = currentPrice.mul(amount).div(10**decimals);
        require(msg.value >= totalCost, "Insufficient BNB sent");

        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        _stake(msg.sender, amount, lockOption, referrer);
        emit TokensPurchased(msg.sender, amount, totalCost);
    }

    function _stake(address user, uint256 amount, uint8 lockOption, address referrer) internal {
        uint256 lockPeriod;
        if (lockOption == 0) lockPeriod = sixMonths;
        else if (lockOption == 1) lockPeriod = oneYear;
        else if (lockOption == 2) lockPeriod = twoYears;
        else revert("Invalid lock option");

        stakes[user].push(Stake({
            amount: amount,
            stakingStartTime: block.timestamp,
            lockPeriod: lockPeriod,
            claimedRewards: 0,
            withdrawn: false,
            lastClaimTime: block.timestamp,
            withdrawalStartTime: 0,
            withdrawnPercentage: 0,
            referrer: referrer
        }));

        if (referrer != address(0) && stakingReferrer[user] == address(0)) {
            stakingReferrals[referrer].push(user);
            stakingReferrer[user] = referrer;
        }

        emit Staked(user, amount, lockPeriod, stakes[user].length - 1, referrer);
    }

    function calculateRewards(address user, uint256 stakeIndex) public view returns (uint256) {
    Stake memory userStake = stakes[user][stakeIndex];
    if (userStake.amount == 0 || userStake.withdrawn) return 0;

    uint256 endTime = userStake.stakingStartTime.add(userStake.lockPeriod);
    uint256 calculationTime = block.timestamp > endTime ? endTime : block.timestamp;
    
    if (calculationTime <= userStake.lastClaimTime) return 0;

    uint256 stakingDuration = calculationTime.sub(userStake.lastClaimTime);
    uint256 fullWeeks = stakingDuration.div(WEEK);
    if (fullWeeks == 0) return 0;

    uint256 apy = getAPY(userStake.lockPeriod);
    uint256 effectiveDuration = fullWeeks.mul(WEEK);
    uint256 secondsInYear = oneYear;
    uint256 rewards = userStake.amount
        .mul(apy)
        .mul(effectiveDuration)
        .div(secondsInYear.mul(10000));
    
    // Ensure at least 1 wei reward per full week to prevent dust
    return rewards > 0 ? rewards : fullWeeks;
}

    function claimRewards(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        Stake storage userStake = stakes[msg.sender][stakeIndex];
        require(!userStake.withdrawn, "Stake already withdrawn");
        require(block.timestamp >= userStake.lastClaimTime + WEEK, "Can claim rewards weekly");

        uint256 rewards = calculateRewards(msg.sender, stakeIndex);
        require(rewards > 0, "No rewards to claim");
        require(address(this).balance >= rewards, "Insufficient contract BNB balance");

        address currentReferrer = userStake.referrer;
        uint256 level = 0;
        uint256 totalReferralRewards = 0;

        while (currentReferrer != address(0) && level < 6) {
            uint256 referralReward = (rewards * stakingReferralPercentages[level]) / 100;
            if (referralReward > 0) {
                stakingReferralRewards[currentReferrer] = stakingReferralRewards[currentReferrer].add(referralReward);
                totalReferralRewards = totalReferralRewards.add(referralReward);
                emit StakingReferralRewardsDistributed(currentReferrer, referralReward, level + 1);
            }
            currentReferrer = stakingReferrer[currentReferrer];
            level++;
        }

        userStake.claimedRewards = userStake.claimedRewards.add(rewards);
        uint256 fullWeeks = (block.timestamp - userStake.lastClaimTime) / WEEK;
        userStake.lastClaimTime = userStake.lastClaimTime.add(fullWeeks * WEEK);

        // Transfer rewards after all state changes
        payable(msg.sender).transfer(rewards);
        emit RewardsClaimed(msg.sender, rewards, stakeIndex);
    }

    function withdrawStakingReferralRewards() external nonReentrant {
        uint256 rewards = stakingReferralRewards[msg.sender];
        require(rewards > 0, "No staking referral rewards");
        require(address(this).balance >= rewards, "Insufficient contract BNB balance");
        
        stakingReferralRewards[msg.sender] = 0;
        payable(msg.sender).transfer(rewards);
    }

    function withdraw(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        Stake storage userStake = stakes[msg.sender][stakeIndex];
        require(!userStake.withdrawn, "Fully withdrawn");
        require(block.timestamp >= userStake.stakingStartTime + userStake.lockPeriod, "Lock period not over");

        if (userStake.withdrawalStartTime == 0) {
            userStake.withdrawalStartTime = userStake.stakingStartTime + userStake.lockPeriod;
        }

        uint256 timeSinceWithdrawalStart = block.timestamp - userStake.withdrawalStartTime;
        uint256 weeksPassed = timeSinceWithdrawalStart / WEEK;
        uint256 allowedPercentage = weeksPassed * 10;

        if (allowedPercentage > 100) {
            allowedPercentage = 100;
        }

        require(allowedPercentage > userStake.withdrawnPercentage, "No new amount available");

        uint256 withdrawablePercentage = allowedPercentage - userStake.withdrawnPercentage;
        uint256 amountToWithdraw = (userStake.amount * withdrawablePercentage) / 100;

        userStake.amount = userStake.amount.sub(amountToWithdraw);
        userStake.withdrawnPercentage = allowedPercentage;

        if (userStake.withdrawnPercentage >= 100) {
            userStake.withdrawn = true;
        }

        require(stakingToken.balanceOf(address(this)) >= amountToWithdraw, "Insufficient token balance");
        require(stakingToken.transfer(msg.sender, amountToWithdraw), "Transfer failed");
        emit Withdrawn(msg.sender, amountToWithdraw, stakeIndex);
    }

    function getAPY(uint256 lockPeriod) public view returns (uint256) {
        if (lockPeriod == twoYears) {
            return apyRanges[2]; // 120% for 2 years
        } else if (lockPeriod == oneYear) {
            return apyRanges[1]; // 100% for 1 year
        } else if (lockPeriod == sixMonths) {
            return apyRanges[0]; // 80% for 6 months
        } else {
            revert("Invalid lock period");
        }
    }

    function getUserStakes(address user) external view returns (Stake[] memory) {
        return stakes[user];
    }

    function getStakingReferrals(address user) external view returns (address[] memory) {
        return stakingReferrals[user];
    }

    function fundContractTokens(uint256 amount) external onlyOwner {
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    function updateAPY(uint256[3] calldata newAPYRanges) external onlyOwner {
        require(newAPYRanges[0] <= 10000 && newAPYRanges[1] <= 15000 && newAPYRanges[2] <= 20000, "APY too high");
        apyRanges = newAPYRanges;
        emit APYUpdated(newAPYRanges);
    }

    function updateLockPeriods(uint256 newSixMonths, uint256 newOneYear, uint256 newTwoYears) external onlyOwner {
        require(newSixMonths >= 12 weeks && newSixMonths <= 30 weeks, "Invalid 6-month period");
        require(newOneYear >= 40 weeks && newOneYear <= 60 weeks, "Invalid 1-year period");
        require(newTwoYears >= 90 weeks && newTwoYears <= 120 weeks, "Invalid 2-year period");
        
        sixMonths = newSixMonths;
        oneYear = newOneYear;
        twoYears = newTwoYears;
        emit LockPeriodsUpdated(newSixMonths, newOneYear, newTwoYears);
    }

    function updateMinStakeAmount(uint256 newMinStakeAmount) external onlyOwner {
        require(newMinStakeAmount > 0 && newMinStakeAmount < maxStakeAmount, "Invalid min amount");
        minStakeAmount = newMinStakeAmount;
        emit MinStakeAmountUpdated(newMinStakeAmount);
    }

    function updateMaxStakeAmount(uint256 newMaxStakeAmount) external onlyOwner {
        require(newMaxStakeAmount > minStakeAmount, "Max must be greater than min");
        maxStakeAmount = newMaxStakeAmount;
        emit MaxStakeAmountUpdated(newMaxStakeAmount);
    }

    function updateStakingToken(address _stakingToken) external onlyOwner {
        require(_stakingToken != address(0), "Invalid token address");
        stakingToken = IERC20Extended(_stakingToken);
    }

    function emergencyWithdrawTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(stakingToken) || stakes[msg.sender].length == 0, "Cannot withdraw staking token while staking");
        IERC20(token).transfer(owner(), amount);
    }

    function emergencyWithdrawBNB(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    receive() external payable {}
}