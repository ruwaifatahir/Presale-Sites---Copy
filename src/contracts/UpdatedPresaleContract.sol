/**
 *Submitted for verification at testnet.bscscan.com on 2025-04-23
*/

// File: @openzeppelin/contracts/utils/Context.sol


// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// File: @openzeppelin/contracts/access/Ownable.sol


// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;


/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// File: @openzeppelin/contracts/utils/math/SafeMath.sol


// OpenZeppelin Contracts (last updated v4.9.0) (utils/math/SafeMath.sol)

pragma solidity ^0.8.0;

// CAUTION
// This version of SafeMath should only be used with Solidity 0.8 or later,
// because it relies on the compiler's built in overflow checks.

/**
 * @dev Wrappers over Solidity's arithmetic operations.
 *
 * NOTE: `SafeMath` is generally not needed starting with Solidity 0.8, since the compiler
 * now has built in overflow checking.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) return (true, 0);
            uint256 c = a * b;
            if (c / a != b) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator.
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}

// File: @openzeppelin/contracts/token/ERC20/IERC20.sol


// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// File: @openzeppelin/contracts/security/ReentrancyGuard.sol


// OpenZeppelin Contracts (last updated v4.9.0) (security/ReentrancyGuard.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}

// File: testingstake.sol


pragma solidity ^0.8.0;





interface IERC20Extended is IERC20 {
    function decimals() external view returns (uint8);
}

contract PresaleStakingContract is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    IERC20Extended public stakingToken;

    // Presale variables
    uint256 public constant PRICE_INCREASE_INTERVAL = 5 seconds;
    uint256 public constant PRICE_INCREASE_PERCENT = 1;
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

    uint256[3] public apyRanges = [1000, 2000, 3000]; // 10%, 20%, 30%
    uint256 public minStakeAmount = 100 * 10**18; // 100 tokens
    uint256 public maxStakeAmount = 10000 * 10**18; // 10,000 tokens
    uint256 public minThreshold = 1000 * 10**18; // 1,000 tokens
    uint256 public highThreshold = 5000 * 10**18; // 5,000 tokens

    uint256 public constant WEEK = 30 seconds;
    uint256 public sixMonths = 3 minutes;
    uint256 public oneYear = 6 minutes;
    uint256 public twoYears = 12 minutes;

    uint256[6] public stakingReferralPercentages = [10, 5, 3, 2, 1, 1];

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
        require(stakingToken.decimals() == 18, "Token must have 18 decimals");
        baseTokenPrice = _baseTokenPrice;
        startTime = block.timestamp;
    }

    function getCurrentTokenPrice() public view returns (uint256) {
        uint256 intervalsPassed = (block.timestamp - startTime) / PRICE_INCREASE_INTERVAL;
        if (intervalsPassed == 0) return baseTokenPrice;
        uint256 compoundedPrice = baseTokenPrice;
        for (uint256 i = 0; i < intervalsPassed; i++) {
            compoundedPrice = compoundedPrice.mul(100 + PRICE_INCREASE_PERCENT).div(100);
        }
        return compoundedPrice;
    }

    function buyTokens(uint256 amount, uint8 lockOption, address referrer) external payable nonReentrant {
    require(amount >= minStakeAmount, "Amount below minimum stake");
    require(amount <= maxStakeAmount, "Amount exceeds maximum stake");
    require(lockOption <= 2, "Invalid lock option");
    require(referrer != msg.sender, "Cannot refer yourself"); // Allow address(0) for first buyer
    require(stakingToken.balanceOf(address(this)) >= amount, "Insufficient contract token balance");

    uint256 currentPrice = getCurrentTokenPrice();
    uint8 decimals = stakingToken.decimals(); // Should be 18
    uint256 totalCost = currentPrice.mul(amount).div(10**decimals);
    require(msg.value >= totalCost, "Insufficient BNB: need at least totalCost");

    // Refund excess BNB
    if (msg.value > totalCost) {
        (bool sent, ) = payable(msg.sender).call{value: msg.value - totalCost}("");
        require(sent, "BNB refund failed");
    }

    // No need for user to hold or approve tokens; contract stakes tokens directly
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
        uint256 effectiveDuration = fullWeeks * WEEK;
        uint256 secondsInYear = 60 * 24 * 365; // Approx. 1 year in seconds for testing
        uint256 rewards = (userStake.amount * apy * effectiveDuration) / (secondsInYear * 10000);
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
        (bool sent, ) = payable(msg.sender).call{value: rewards}("");
        require(sent, "Reward transfer failed");
        emit RewardsClaimed(msg.sender, rewards, stakeIndex);
    }

    function withdrawStakingReferralRewards() external nonReentrant {
        uint256 rewards = stakingReferralRewards[msg.sender];
        require(rewards > 0, "No staking referral rewards");
        stakingReferralRewards[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: rewards}("");
        require(sent, "Referral reward transfer failed");
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
        require(stakingToken.decimals() == 18, "Token must have 18 decimals");
    }

    function emergencyWithdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    function emergencyWithdrawBNB(uint256 amount) external onlyOwner {
        (bool sent, ) = payable(owner()).call{value: amount}("");
        require(sent, "BNB withdrawal failed");
    }

    function fundContractBNB() external payable onlyOwner {
        require(msg.value > 0, "No BNB sent");
    }

    receive() external payable {}
}