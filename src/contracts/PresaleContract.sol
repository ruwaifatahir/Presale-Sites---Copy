
/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (utils/Address.sol)

pragma solidity ^0.8.1;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [////IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     *
     * Furthermore, `isContract` will also return true if the target contract within
     * the same transaction is already scheduled for destruction by `SELFDESTRUCT`,
     * which only has an effect at the end of a transaction.
     * ====
     *
     * [IMPORTANT]
     * ====
     * You shouldn't rely on `isContract` to protect against flash loan attacks!
     *
     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
     * constructor.
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * ////IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.8.0/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata, errorMessage);
    }

    /**
     * @dev Tool to verify that a low level call to smart-contract was successful, and revert (either by bubbling
     * the revert reason or using the provided one) in case of unsuccessful call or if target was not a contract.
     *
     * _Available since v4.8._
     */
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        if (success) {
            if (returndata.length == 0) {
                // only check isContract if the call was successful and the return data is empty
                // otherwise we already know that it was a contract
                require(isContract(target), "Address: call to non-contract");
            }
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    /**
     * @dev Tool to verify that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason or using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            _revert(returndata, errorMessage);
        }
    }

    function _revert(bytes memory returndata, string memory errorMessage) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert(errorMessage);
        }
    }
}




/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
// OpenZeppelin Contracts (last updated v4.9.4) (token/ERC20/extensions/IERC20Permit.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
 * https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].
 *
 * Adds the {permit} method, which can be used to change an account's ERC20 allowance (see {IERC20-allowance}) by
 * presenting a message signed by the account. By not relying on {IERC20-approve}, the token holder account doesn't
 * need to send a transaction, and thus is not required to hold Ether at all.
 *
 * ==== Security Considerations
 *
 * There are two ////important considerations concerning the use of `permit`. The first is that a valid permit signature
 * expresses an allowance, and it should not be assumed to convey additional meaning. In particular, it should not be
 * considered as an intention to spend the allowance in any specific way. The second is that because permits have
 * built-in replay protection and can be submitted by anyone, they can be frontrun. A protocol that uses permits should
 * take this into consideration and allow a `permit` call to fail. Combining these two aspects, a pattern that may be
 * generally recommended is:
 *
 * ```solidity
 * function doThingWithPermit(..., uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public {
 *     try token.permit(msg.sender, address(this), value, deadline, v, r, s) {} catch {}
 *     doThing(..., value);
 * }
 *
 * function doThing(..., uint256 value) public {
 *     token.safeTransferFrom(msg.sender, address(this), value);
 *     ...
 * }
 * ```
 *
 * Observe that: 1) `msg.sender` is used as the owner, leaving no ambiguity as to the signer intent, and 2) the use of
 * `try/catch` allows the permit to fail and makes the code tolerant to frontrunning. (See also
 * {SafeERC20-safeTransferFrom}).
 *
 * Additionally, note that smart contract wallets (such as Argent or Safe) are not able to produce permit signatures, so
 * contracts should have entry points that don't rely on permit.
 */
interface IERC20Permit {
    /**
     * @dev Sets `value` as the allowance of `spender` over ``owner``'s tokens,
     * given ``owner``'s signed approval.
     *
     * ////IMPORTANT: The same issues {IERC20-approve} has related to transaction
     * ordering also apply here.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `deadline` must be a timestamp in the future.
     * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`
     * over the EIP712-formatted function arguments.
     * - the signature must use ``owner``'s current nonce (see {nonces}).
     *
     * For more information on the signature format, see the
     * https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP
     * section].
     *
     * CAUTION: See Security Considerations above.
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @dev Returns the current nonce for `owner`. This value must be
     * included whenever a signature is generated for {permit}.
     *
     * Every successful call to {permit} increases ``owner``'s nonce by one. This
     * prevents a signature from being used multiple times.
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * @dev Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}




/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.0;

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
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * ////IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}




/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (utils/structs/EnumerableSet.sol)
// This file was procedurally generated from scripts/generate/templates/EnumerableSet.js.

pragma solidity ^0.8.0;

/**
 * @dev Library for managing
 * https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive
 * types.
 *
 * Sets have the following properties:
 *
 * - Elements are added, removed, and checked for existence in constant time
 * (O(1)).
 * - Elements are enumerated in O(n). No guarantees are made on the ordering.
 *
 * ```solidity
 * contract Example {
 *     // Add the library methods
 *     using EnumerableSet for EnumerableSet.AddressSet;
 *
 *     // Declare a set state variable
 *     EnumerableSet.AddressSet private mySet;
 * }
 * ```
 *
 * As of v3.3.0, sets of type `bytes32` (`Bytes32Set`), `address` (`AddressSet`)
 * and `uint256` (`UintSet`) are supported.
 *
 * [WARNING]
 * ====
 * Trying to delete such a structure from storage will likely result in data corruption, rendering the structure
 * unusable.
 * See https://github.com/ethereum/solidity/pull/11843[ethereum/solidity#11843] for more info.
 *
 * In order to clean an EnumerableSet, you can either remove all elements one by one or create a fresh instance using an
 * array of EnumerableSet.
 * ====
 */
library EnumerableSet {
    // To implement this library for multiple types with as little code
    // repetition as possible, we write it in terms of a generic Set type with
    // bytes32 values.
    // The Set implementation uses private functions, and user-facing
    // implementations (such as AddressSet) are just wrappers around the
    // underlying Set.
    // This means that we can only create new EnumerableSets for types that fit
    // in bytes32.

    struct Set {
        // Storage of set values
        bytes32[] _values;
        // Position of the value in the `values` array, plus 1 because index 0
        // means a value is not in the set.
        mapping(bytes32 => uint256) _indexes;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function _add(Set storage set, bytes32 value) private returns (bool) {
        if (!_contains(set, value)) {
            set._values.push(value);
            // The value is stored at length-1, but we add 1 to all indexes
            // and use 0 as a sentinel value
            set._indexes[value] = set._values.length;
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function _remove(Set storage set, bytes32 value) private returns (bool) {
        // We read and store the value's index to prevent multiple reads from the same storage slot
        uint256 valueIndex = set._indexes[value];

        if (valueIndex != 0) {
            // Equivalent to contains(set, value)
            // To delete an element from the _values array in O(1), we swap the element to delete with the last one in
            // the array, and then remove the last element (sometimes called as 'swap and pop').
            // This modifies the order of the array, as noted in {at}.

            uint256 toDeleteIndex = valueIndex - 1;
            uint256 lastIndex = set._values.length - 1;

            if (lastIndex != toDeleteIndex) {
                bytes32 lastValue = set._values[lastIndex];

                // Move the last value to the index where the value to delete is
                set._values[toDeleteIndex] = lastValue;
                // Update the index for the moved value
                set._indexes[lastValue] = valueIndex; // Replace lastValue's index to valueIndex
            }

            // Delete the slot where the moved value was stored
            set._values.pop();

            // Delete the index for the deleted slot
            delete set._indexes[value];

            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function _contains(Set storage set, bytes32 value) private view returns (bool) {
        return set._indexes[value] != 0;
    }

    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function _length(Set storage set) private view returns (uint256) {
        return set._values.length;
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function _at(Set storage set, uint256 index) private view returns (bytes32) {
        return set._values[index];
    }

    /**
     * @dev Return the entire set in an array
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function _values(Set storage set) private view returns (bytes32[] memory) {
        return set._values;
    }

    // Bytes32Set

    struct Bytes32Set {
        Set _inner;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(Bytes32Set storage set, bytes32 value) internal returns (bool) {
        return _add(set._inner, value);
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(Bytes32Set storage set, bytes32 value) internal returns (bool) {
        return _remove(set._inner, value);
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(Bytes32Set storage set, bytes32 value) internal view returns (bool) {
        return _contains(set._inner, value);
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(Bytes32Set storage set) internal view returns (uint256) {
        return _length(set._inner);
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function at(Bytes32Set storage set, uint256 index) internal view returns (bytes32) {
        return _at(set._inner, index);
    }

    /**
     * @dev Return the entire set in an array
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function values(Bytes32Set storage set) internal view returns (bytes32[] memory) {
        bytes32[] memory store = _values(set._inner);
        bytes32[] memory result;

        /// @solidity memory-safe-assembly
        assembly {
            result := store
        }

        return result;
    }

    // AddressSet

    struct AddressSet {
        Set _inner;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(AddressSet storage set, address value) internal returns (bool) {
        return _add(set._inner, bytes32(uint256(uint160(value))));
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(AddressSet storage set, address value) internal returns (bool) {
        return _remove(set._inner, bytes32(uint256(uint160(value))));
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(AddressSet storage set, address value) internal view returns (bool) {
        return _contains(set._inner, bytes32(uint256(uint160(value))));
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(AddressSet storage set) internal view returns (uint256) {
        return _length(set._inner);
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function at(AddressSet storage set, uint256 index) internal view returns (address) {
        return address(uint160(uint256(_at(set._inner, index))));
    }

    /**
     * @dev Return the entire set in an array
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function values(AddressSet storage set) internal view returns (address[] memory) {
        bytes32[] memory store = _values(set._inner);
        address[] memory result;

        /// @solidity memory-safe-assembly
        assembly {
            result := store
        }

        return result;
    }

    // UintSet

    struct UintSet {
        Set _inner;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(UintSet storage set, uint256 value) internal returns (bool) {
        return _add(set._inner, bytes32(value));
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(UintSet storage set, uint256 value) internal returns (bool) {
        return _remove(set._inner, bytes32(value));
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(UintSet storage set, uint256 value) internal view returns (bool) {
        return _contains(set._inner, bytes32(value));
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(UintSet storage set) internal view returns (uint256) {
        return _length(set._inner);
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function at(UintSet storage set, uint256 index) internal view returns (uint256) {
        return uint256(_at(set._inner, index));
    }

    /**
     * @dev Return the entire set in an array
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function values(UintSet storage set) internal view returns (uint256[] memory) {
        bytes32[] memory store = _values(set._inner);
        uint256[] memory result;

        /// @solidity memory-safe-assembly
        assembly {
            result := store
        }

        return result;
    }
}




/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
pragma solidity ^0.8.0;

// solhint-disable-next-line interface-starts-with-i
interface AggregatorV3Interface {
  function decimals() external view returns (uint8);

  function description() external view returns (string memory);

  function version() external view returns (uint256);

  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}




/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
// OpenZeppelin Contracts (last updated v4.9.3) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.0;

////import "../IERC20.sol";
////import "../extensions/IERC20Permit.sol";
////import "../../../utils/Address.sol";

/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    using Address for address;

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    /**
     * @dev Deprecated. This function has issues similar to the ones found in
     * {IERC20-approve}, and its usage is discouraged.
     *
     * Whenever possible, use {safeIncreaseAllowance} and
     * {safeDecreaseAllowance} instead.
     */
    function safeApprove(IERC20 token, address spender, uint256 value) internal {
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero. To increase and decrease it, use
        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, oldAllowance + value));
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        unchecked {
            uint256 oldAllowance = token.allowance(address(this), spender);
            require(oldAllowance >= value, "SafeERC20: decreased allowance below zero");
            _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, oldAllowance - value));
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeWithSelector(token.approve.selector, spender, value);

        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, 0));
            _callOptionalReturn(token, approvalCall);
        }
    }

    /**
     * @dev Use a ERC-2612 signature to set the `owner` approval toward `spender` on `token`.
     * Revert on invalid signature.
     */
    function safePermit(
        IERC20Permit token,
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        uint256 nonceBefore = token.nonces(owner);
        token.permit(owner, spender, value, deadline, v, r, s);
        uint256 nonceAfter = token.nonces(owner);
        require(nonceAfter == nonceBefore + 1, "SafeERC20: permit did not succeed");
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We use {Address-functionCall} to perform this call, which verifies that
        // the target address contains contract code and also asserts for success in the low-level call.

        bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
        require(returndata.length == 0 || abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturn} that silents catches all reverts and returns a bool instead.
     */
    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We cannot use {Address-functionCall} here since this should return false
        // and not revert is the subcall reverts.

        (bool success, bytes memory returndata) = address(token).call(data);
        return
            success && (returndata.length == 0 || abi.decode(returndata, (bool))) && Address.isContract(address(token));
    }
}




/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
// OpenZeppelin Contracts (last updated v4.9.4) (utils/Context.sol)

pragma solidity ^0.8.0;

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




/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: UNLICENSED
pragma solidity 0.8.29;

////import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
////import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
////import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract PresaleStakingStorage {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Stake {
        uint256 stakedAmount;
        uint256 investedAmount;
        uint256 stakeTime;
        uint256 lastClaimTime;
        uint256 lastWithdrawalTime;
        uint256 totalWithdrawnAmount;
    }

    struct Staker {
        address referrer;
        uint256 totalStakedAmount;
        uint256 totalInvestedAmount;
        Stake[3] stakes;
    }

    struct StakePlan {
        uint256 apy; // Annual Percentage Yield in 18 decimals (e.g., 80e18 = 80%)
        uint256 lockDuration;
        uint256 minStakeAmount;
    }

    // ============ CONSTANTS ============
    uint256 public constant PRICE_INCREASE_INTERVAL = 172800 minutes;
    uint256 public constant PRICE_INCREASE_PERCENT = 1; // 1%
    uint256 public constant HARDCAP = 5_000_000e18; // 5 million usdt
    uint256[6] public REFERRER_REWARDS_PERCENT = [30, 20, 10, 5, 5, 5];

    IERC20 public immutable investToken;
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;
    AggregatorV3Interface public immutable bnbPriceFeed;

    // ============ STATE VARIABLES ============
    uint256 public collectedInvestTokens;
    uint256 public depositedStakingTokens;
    uint256 public totalInvestedTokens;

    uint256 public baseTokenPrice;
    uint256 public startTime;

    // ============ MAPPINGS ============
    mapping(address => Staker) public stakers;
    address[] public stakersArray;

    StakePlan[3] public stakePlans;

    // ============ CUSTOM ERRORS ============
    error INVALID_ADDRESS_ERROR();

    error INVALID_BASE_TOKEN_PRICE_ERROR();
    error INVALID_STAKE_PLAN_INDEX_ERROR();
    error NOT_STARTED_ERROR();
    error CIRCULAR_REFERRAL_ERROR();
    error HARDCAP_REACHED_ERROR();
    error MIN_STAKE_AMOUNT_ERROR();
    error ALREADY_STAKE_ERROR();
    error REFERER_NOT_QUALIFIED_ERROR();

    error ALREADY_WITHDRAWN_ERROR();
    error WITHDRAW_LOCKED_ERROR();
    error NO_AMOUNT_TO_WITHDRAW_ERROR();
    error NOT_ENOUGH_DEPOSITED_TOKENS_ERROR();

    error NO_INVEST_TOKENS_ERROR();
    error NO_STAKING_TOKENS_ERROR();

    // ============ EVENTS ============

    event Staked(
        address indexed user,
        uint256 stakedAmount,
        uint256 investedAmount,
        uint8 stakePlanIndex
    );

    event Withdrawn(address indexed user, uint256 withdrawnAmount);

    event InvestTokensWithdrawn(uint256 withdrawnAmount);

    event StakingTokensDeposited(uint256 depositedAmount);

    event StakingTokensWithdrawn(uint256 withdrawnAmount);

    event StakePlanUpdated(uint8 stakePlanIndex, StakePlan stakePlan);

    event StakerAdded(address indexed staker, uint256 index);

    // ============ VIEW FUNCTIONS FOR ENUMERABLE STAKERS ============

    /**
     * @notice Returns the total number of unique stakers
     * @return count Total number of stakers in the stakersArray
     */
    function getStakersCount() external view returns (uint256) {
        return stakersArray.length;
    }

}




/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (security/Pausable.sol)

pragma solidity ^0.8.0;

////import "../utils/Context.sol";

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        require(!paused(), "Pausable: paused");
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        require(paused(), "Pausable: not paused");
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}




/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable.sol)

pragma solidity ^0.8.0;

////import "../utils/Context.sol";

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
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
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
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
        require(newOwner != address(0), "Ownable: new owner is the zero address");
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




/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/
            
////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
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


/** 
 *  SourceUnit: c:\Work\Taufeeq\dgfl-contracts\contracts\PresaleStaking.sol
*/

////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: UNLICENSED
pragma solidity 0.8.29;

////import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

////import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
////import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
////import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
////import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
////import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

////import {PresaleStakingStorage} from "./PresaleStakingStorage.sol";

contract PresaleStaking is
    PresaleStakingStorage,
    ReentrancyGuard,
    Ownable,
    Pausable
{
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    constructor(
        address _investToken,
        address _stakingToken,
        address _rewardToken,
        address _bnbPriceFeed,
        uint256 _baseTokenPrice // Should be in 18 decimals
    ) {
        if (_investToken == address(0)) revert INVALID_ADDRESS_ERROR();
        if (_stakingToken == address(0)) revert INVALID_ADDRESS_ERROR();
        if (_rewardToken == address(0)) revert INVALID_ADDRESS_ERROR();
        if (_bnbPriceFeed == address(0)) revert INVALID_ADDRESS_ERROR();
        if (_baseTokenPrice == 0) revert INVALID_BASE_TOKEN_PRICE_ERROR();

        investToken = IERC20(_investToken);
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        bnbPriceFeed = AggregatorV3Interface(_bnbPriceFeed);
        baseTokenPrice = _baseTokenPrice;
        startTime = block.timestamp;

        stakePlans[0] = StakePlan({
            apy: 80e18, // 80% APY
            lockDuration: 1 weeks, // 1 week lock period
            minStakeAmount: 100e18 // Minimum 100 tokens
        });

        stakePlans[1] = StakePlan({
            apy: 80e18,
            lockDuration: 1 weeks,
            minStakeAmount: 100e18
        });

        stakePlans[2] = StakePlan({
            apy: 80e18,
            lockDuration: 1 weeks,
            minStakeAmount: 100e18
        });
    }

    // ============ MODIFIERS ============

    modifier isValidStakePlanIndex(uint8 _stakePlanIndex) {
        if (_stakePlanIndex > 2) revert INVALID_STAKE_PLAN_INDEX_ERROR();
        _;
    }

    modifier isSaleStarted() {
        if (block.timestamp < startTime) revert NOT_STARTED_ERROR();
        _;
    }

    modifier isNotAlreadyStaked(uint8 _stakePlanIndex) {
        if (stakers[msg.sender].stakes[_stakePlanIndex].stakedAmount > 0)
            revert ALREADY_STAKE_ERROR();
        _;
    }

    modifier isNotCircularReferral(address _referrer) {
        if (_referrer == msg.sender) revert CIRCULAR_REFERRAL_ERROR();
        _;
    }

    modifier isReferrerQualified(address _referrer) {
        if (
            _referrer != address(0) &&
            stakers[_referrer].totalStakedAmount < 10_000e18
        ) revert REFERER_NOT_QUALIFIED_ERROR();
        _;
    }

    // ============ STAKING FUNCTIONS ============

    function stake(
        uint8 _stakePlanIndex,
        address _referrer
    )
        external
        payable
        nonReentrant
        whenNotPaused
        isSaleStarted
        isValidStakePlanIndex(_stakePlanIndex)
        isNotAlreadyStaked(_stakePlanIndex)
        isNotCircularReferral(_referrer)
        isReferrerQualified(_referrer)
        returns (bool)
    {
        uint256 bnbPrice = getBnbPrice();

        // msg.value (18 decimals) * bnbPrice (8 decimals) / 1e8 = USD value (18 decimals)
        uint256 usdValue = (msg.value * bnbPrice) / 1e8;

        if (totalInvestedTokens + usdValue > HARDCAP)
            revert HARDCAP_REACHED_ERROR();

        uint256 tokenPrice = getTokenPrice();
        uint256 tokensToStake = (usdValue * 1e18) / tokenPrice;

        if (tokensToStake < stakePlans[_stakePlanIndex].minStakeAmount)
            revert MIN_STAKE_AMOUNT_ERROR();

        _stake(tokensToStake, usdValue, _stakePlanIndex, _referrer);

        return true;
    }

    function stake(
        uint256 _amount,
        uint8 _stakePlanIndex,
        address _referrer
    )
        external
        nonReentrant
        whenNotPaused
        isSaleStarted
        isValidStakePlanIndex(_stakePlanIndex)
        isNotAlreadyStaked(_stakePlanIndex)
        isNotCircularReferral(_referrer)
        isReferrerQualified(_referrer)
        returns (bool)
    {
        if (totalInvestedTokens + _amount > HARDCAP)
            revert HARDCAP_REACHED_ERROR();

        uint256 tokenPrice = getTokenPrice();
        uint256 tokensToStake = (_amount * 1e18) / tokenPrice;

        if (tokensToStake < stakePlans[_stakePlanIndex].minStakeAmount)
            revert MIN_STAKE_AMOUNT_ERROR();

        investToken.safeTransferFrom(msg.sender, address(this), _amount);

        _stake(tokensToStake, _amount, _stakePlanIndex, _referrer);

        return true;
    }

    function withdraw(
        uint8 _stakePlanIndex
    )
        external
        nonReentrant
        whenNotPaused
        isValidStakePlanIndex(_stakePlanIndex)
        returns (bool)
    {
        Stake storage userStake = stakers[msg.sender].stakes[_stakePlanIndex];

        if (userStake.stakedAmount == 0) revert NO_AMOUNT_TO_WITHDRAW_ERROR();

        if (
            block.timestamp <
            userStake.stakeTime + stakePlans[_stakePlanIndex].lockDuration
        ) revert WITHDRAW_LOCKED_ERROR();

        if (block.timestamp - userStake.lastWithdrawalTime < 1 weeks)
            revert WITHDRAW_LOCKED_ERROR();

        uint256 amountCanWithdraw = userStake.stakedAmount -
            userStake.totalWithdrawnAmount;
        if (amountCanWithdraw == 0) revert NO_AMOUNT_TO_WITHDRAW_ERROR();

        uint256 withdrawalAmount = (userStake.stakedAmount * 10_000) / 100_000;
        if (withdrawalAmount > amountCanWithdraw) {
            withdrawalAmount = amountCanWithdraw;
        }

        if (depositedStakingTokens < withdrawalAmount)
            revert NOT_ENOUGH_DEPOSITED_TOKENS_ERROR();

        userStake.totalWithdrawnAmount += withdrawalAmount;
        userStake.lastWithdrawalTime = block.timestamp;

        depositedStakingTokens -= withdrawalAmount;

        stakingToken.safeTransfer(msg.sender, withdrawalAmount);

        emit Withdrawn(msg.sender, withdrawalAmount);

        return true;
    }

    function distributeRewards(
        uint256 _offset,
        uint256 _limit
    ) external onlyOwner returns (bool success, uint256 processedCount) {
        uint256 totalStakers = stakersArray.length;

        // Check if offset is within bounds
        if (_offset >= totalStakers) {
            return (true, 0);
        }

        // Calculate the actual end index
        uint256 endIndex = _offset + _limit;
        if (endIndex > totalStakers) {
            endIndex = totalStakers;
        }

        processedCount = endIndex - _offset;

        for (uint256 i = _offset; i < endIndex; i++) {
            address _staker = stakersArray[i];
            Stake[3] storage _userStakes = stakers[_staker].stakes;

            for (uint256 j; j < _userStakes.length; j++) {
                Stake storage _userStake = _userStakes[j];
                StakePlan memory _stakePlan = stakePlans[j];

                if (_userStake.investedAmount == 0) continue;
                if (
                    _userStake.stakeTime + _stakePlan.lockDuration <
                    block.timestamp
                ) continue;

                uint256 timeElapsed = block.timestamp -
                    _userStake.lastClaimTime;

                uint256 annualRewards = (_userStake.investedAmount *
                    stakePlans[j].apy) / 100e18;

                uint256 rewards = (annualRewards * timeElapsed) / 365 days;

                if (rewards > 0) {
                    _userStake.lastClaimTime = block.timestamp;

                    rewardToken.safeTransferFrom(msg.sender, _staker, rewards);

                    address _referrer = stakers[_staker].referrer;
                    for (uint256 k = 0; k < 6 && _referrer != address(0); k++) {
                        uint256 _referrerReward = (rewards *
                            REFERRER_REWARDS_PERCENT[k]) / 100;

                        rewardToken.safeTransferFrom(
                            msg.sender,
                            _referrer,
                            _referrerReward
                        );

                        _referrer = stakers[_referrer].referrer;
                    }
                }
            }
        }

        return (true, processedCount);
    }

    // ============ OWNER FUNCTIONS ============

    function setStakePlan(
        uint8 _stakePlanIndex,
        StakePlan memory _stakePlan
    ) external onlyOwner {
        if (_stakePlanIndex > 2) revert INVALID_STAKE_PLAN_INDEX_ERROR();
        stakePlans[_stakePlanIndex] = _stakePlan;

        emit StakePlanUpdated(_stakePlanIndex, _stakePlan);
    }

    function withdrawInvestTokens() external onlyOwner {
        if (collectedInvestTokens == 0) revert NO_INVEST_TOKENS_ERROR();
        uint256 amountToWithdraw = collectedInvestTokens;
        investToken.safeTransfer(msg.sender, amountToWithdraw);
        collectedInvestTokens = 0;
        emit InvestTokensWithdrawn(amountToWithdraw);
    }

    function depositStakingTokens(uint256 _amount) external onlyOwner {
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);
        depositedStakingTokens += _amount;
        emit StakingTokensDeposited(_amount);
    }

    function withdrawStakingTokens() external onlyOwner {
        if (depositedStakingTokens == 0) revert NO_STAKING_TOKENS_ERROR();
        stakingToken.safeTransfer(msg.sender, depositedStakingTokens);
        emit StakingTokensWithdrawn(depositedStakingTokens);
        depositedStakingTokens = 0;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getStakerInfo(
        address _staker
    )
        external
        view
        returns (
            address referrer,
            uint256 totalStakedAmount,
            uint256 totalInvestedAmount,
            Stake[3] memory stakes
        )
    {
        Staker storage staker = stakers[_staker];
        return (
            staker.referrer,
            staker.totalStakedAmount,
            staker.totalInvestedAmount,
            staker.stakes
        );
    }

    function getStakeInfo(
        address _staker,
        uint8 _stakePlanIndex
    )
        external
        view
        returns (
            uint256 stakedAmount,
            uint256 investedAmount,
            uint256 stakeTime,
            uint256 lastClaimTime,
            uint256 lastWithdrawalTime,
            uint256 totalWithdrawnAmount
        )
    {
        if (_stakePlanIndex > 2) revert INVALID_STAKE_PLAN_INDEX_ERROR();
        Stake storage userStake = stakers[_staker].stakes[_stakePlanIndex];
        return (
            userStake.stakedAmount,
            userStake.investedAmount,
            userStake.stakeTime,
            userStake.lastClaimTime,
            userStake.lastWithdrawalTime,
            userStake.totalWithdrawnAmount
        );
    }

    function getTokenPrice() public view returns (uint256) {
        uint256 intervalsPassed = (block.timestamp - startTime) /
            PRICE_INCREASE_INTERVAL;

        uint256 priceIncrease = (baseTokenPrice *
            intervalsPassed *
            PRICE_INCREASE_PERCENT) / 100;

        return baseTokenPrice + priceIncrease;
    }

    function getBnbPrice() public view virtual returns (uint256) {
        (, int256 price, , , ) = bnbPriceFeed.latestRoundData();

        return uint256(price); //price is in 8 decimals
    }

    function getStakerStats()
        external
        view
        returns (
            uint256 totalStakers,
            uint256 totalInvested,
            uint256 totalCollected
        )
    {
        return (
            stakersArray.length,
            totalInvestedTokens,
            collectedInvestTokens
        );
    }

    function _stake(
        uint256 _stakeAmount,
        uint256 _investAmount,
        uint8 _stakePlanIndex,
        address _referrer
    ) private {
        Staker storage staker = stakers[msg.sender];

        if (staker.totalStakedAmount == 0) stakersArray.push(msg.sender);

        if (staker.referrer == address(0))
            stakers[msg.sender].referrer = _referrer;

        Stake storage userStake = staker.stakes[_stakePlanIndex];

        userStake.stakedAmount = _stakeAmount;
        userStake.investedAmount = _investAmount;

        userStake.stakeTime = block.timestamp;
        userStake.lastWithdrawalTime = block.timestamp;
        userStake.lastClaimTime = block.timestamp;

        staker.totalStakedAmount += _stakeAmount;
        staker.totalInvestedAmount += _investAmount;

        collectedInvestTokens += _investAmount;
        totalInvestedTokens += _investAmount;

        emit Staked(msg.sender, _stakeAmount, _investAmount, _stakePlanIndex);
    }
}

