contract PresaleStakingContract is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    IERC20Extended public stakingToken;

    // Presale variables
    uint256 public constant PRICE_INCREASE_INTERVAL = 2880 minutes; // Change to 172800 for production
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
    uint256 public minStakeAmount = 3000 * 10**18;
    uint256 public maxStakeAmount = 1000000 * 10**18;
    uint256 public minThreshold = 30000 * 10**18;
    uint256 public highThreshold = 300000 * 10**18;

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
    event ThresholdsUpdated(uint256 minThreshold, uint256 highThreshold);
    event MinStakeAmountUpdated(uint256 newMinStakeAmount);

    constructor(address _stakingToken, uint256 _baseTokenPrice, address initialOwner) Ownable(initialOwner) {
        stakingToken = IERC20Extended(_stakingToken);
        baseTokenPrice = _baseTokenPrice;
        startTime = block.timestamp;
    }

    function getCurrentTokenPrice() public view returns (uint256) {
    uint256 intervalsPassed = (block.timestamp - startTime) / PRICE_INCREASE_INTERVAL;
    // Linear increase: price = baseTokenPrice + (baseTokenPrice * intervalsPassed * PRICE_INCREASE_PERCENT / 100)
    uint256 priceIncrease = baseTokenPrice.mul(intervalsPassed).mul(PRICE_INCREASE_PERCENT).div(100);
    return baseTokenPrice.add(priceIncrease);
}

    function buyTokens(uint256 amount, uint8 lockOption, address referrer) external payable nonReentrant {
        require(amount >= minStakeAmount, "Minimum staking amount not met");
        require(amount <= maxStakeAmount, "Exceeds maximum stake amount");
        require(lockOption <= 2, "Invalid lock option");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(stakingToken.balanceOf(address(this)) >= amount, "Not enough tokens in contract");

        uint256 currentPrice = getCurrentTokenPrice();
        uint8 decimals = stakingToken.decimals();
        uint256 totalCost = currentPrice.mul(amount).div(10 ** decimals);
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
        else lockPeriod = twoYears;

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

        if (referrer != address(0)) {
            stakingReferrals[referrer].push(user);
            stakingReferrer[user] = referrer;
        }

        emit Staked(user, amount, lockPeriod, stakes[user].length - 1, referrer);
    }

    function calculateRewards(address user, uint256 stakeIndex) public view returns (uint256) {
        Stake memory userStake = stakes[user][stakeIndex];
        if (userStake.amount == 0 || userStake.withdrawn) return 0;

        if (block.timestamp >= userStake.stakingStartTime + userStake.lockPeriod) return 0;

        uint256 stakingDuration = block.timestamp - userStake.lastClaimTime;
        uint256 fullWeeks = stakingDuration / WEEK;
        if (fullWeeks == 0) return 0;

        uint256 apy = getAPY(userStake.amount);
        uint8 decimals = stakingToken.decimals();
        uint256 effectiveDuration = fullWeeks * WEEK;
        uint256 secondsInYear = oneYear;
        uint256 rewards = (userStake.amount * apy * effectiveDuration) / (secondsInYear * 10000 * 10**(18 - decimals));
        return rewards;
    }

    function claimRewards(uint256 stakeIndex) external nonReentrant {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");
        Stake storage userStake = stakes[msg.sender][stakeIndex];
        require(!userStake.withdrawn, "Stake already withdrawn");
        require(block.timestamp >= userStake.lastClaimTime + WEEK, "Can claim rewards weekly");
        require(block.timestamp <= userStake.stakingStartTime + userStake.lockPeriod, "Lock period ended");

        uint256 rewards = calculateRewards(msg.sender, stakeIndex);
        require(rewards > 0, "No rewards to claim");

        address currentReferrer = userStake.referrer;
        uint256 level = 0;
        uint256 totalReferralRewards = 0;

        while (currentReferrer != address(0) && level < 6) {
            uint256 referralReward = (rewards * stakingReferralPercentages[level]) / 100;
            stakingReferralRewards[currentReferrer] = stakingReferralRewards[currentReferrer].add(referralReward);
            totalReferralRewards = totalReferralRewards.add(referralReward);
            emit StakingReferralRewardsDistributed(currentReferrer, referralReward, level + 1);
            currentReferrer = stakingReferrer[currentReferrer];
            level++;
        }

        userStake.claimedRewards = userStake.claimedRewards.add(rewards);
        uint256 fullWeeks = (block.timestamp - userStake.lastClaimTime) / WEEK;
        userStake.lastClaimTime = userStake.lastClaimTime.add(fullWeeks * WEEK);

        uint256 totalAmount = rewards.add(totalReferralRewards);
        require(address(this).balance >= totalAmount, "Insufficient BNB balance");
        payable(msg.sender).transfer(rewards);
        emit RewardsClaimed(msg.sender, rewards, stakeIndex);
    }

    function withdrawStakingReferralRewards() external nonReentrant {
        uint256 rewards = stakingReferralRewards[msg.sender];
        require(rewards > 0, "No staking referral rewards");
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
        uint256 weeksPassed = timeSinceWithdrawalStart / WEEK + 1;
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

    function getAPY(uint256 amount) public view returns (uint256) {
        if (amount >= highThreshold) {
            return apyRanges[2];
        } else if (amount >= minThreshold) {
            return apyRanges[1];
        } else {
            return apyRanges[0];
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
        apyRanges = newAPYRanges;
        emit APYUpdated(newAPYRanges);
    }

    function updateLockPeriods(uint256 newSixMonths, uint256 newOneYear, uint256 newTwoYears) external onlyOwner {
        sixMonths = newSixMonths;
        oneYear = newOneYear;
        twoYears = newTwoYears;
        emit LockPeriodsUpdated(newSixMonths, newOneYear, newTwoYears);
    }

    function updateThresholds(uint256 newMinThreshold, uint256 newHighThreshold) external onlyOwner {
        minThreshold = newMinThreshold;
        highThreshold = newHighThreshold;
        emit ThresholdsUpdated(newMinThreshold, newHighThreshold);
    }

    function updateMinStakeAmount(uint256 newMinStakeAmount) external onlyOwner {
        minStakeAmount = newMinStakeAmount;
        emit MinStakeAmountUpdated(newMinStakeAmount);
    }

    function updateStakingToken(address _stakingToken) external onlyOwner {
        stakingToken = IERC20Extended(_stakingToken);
    }

    function emergencyWithdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    function emergencyWithdrawBNB(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }

    receive() external payable {}
}