# Language Standards & Code Quality — Solidity 0.8.26+

> Production-grade smart contract standards, storage slot packing, custom errors, and ERC-4626 vault architecture.

---

## 1. Target Versions & Toolchain

- **Solidity Version**: `^0.8.26` (targeting Ethereum Cancun EVM or higher)
- **Framework & Testing**: Foundry (`forge`, `cast`, `anvil`) with strict optimizer runs (`runs = 200` to `runs = 10000`)
- **Libraries**: OpenZeppelin Contracts v5.0+, Solmate / Solady for optimized math and low-level primitives
- **Static Analysis**: Slither (`slither . --checklist`), Aderyn, Echidna, Halmos

---

## 2. Idiomatic Solidity 0.8.26+ Standards

### 2.1. Custom Errors Over String Reverts
Custom errors are 4-byte selectors (`bytes4`) that dramatically reduce deployment bytecode size and runtime execution gas:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract VaultErrors {
    error UnauthorizedCaller(address caller);
    error InsufficientVaultLiquidity(uint256 requested, uint256 available);
    error DepositExceedsCap(uint256 amount, uint256 maxCap);
    error StaleOraclePrice(uint256 updatedAt, uint256 maxAllowedAge);
    error SlippageExceeded(uint256 expectedMin, uint256 actualAmount);
}
```

### 2.2. Storage Slot Packing & Variable Layout
Variables smaller than 32 bytes should be ordered contiguously so the compiler packs them into a single 32-byte storage slot:

```solidity
// BAD: Consumes 4 separate 32-byte storage slots (128 bytes total = 4 SLOADs/SSTOREs)
struct UnpackedPosition {
    uint256 id;        // Slot 0 (32 bytes)
    bool isActive;     // Slot 1 (1 byte, 31 bytes wasted)
    uint256 amount;    // Slot 2 (32 bytes)
    address owner;     // Slot 3 (20 bytes, 12 bytes wasted)
}

// GOOD: Perfectly packed into 2 storage slots (64 bytes total = 2 SLOADs/SSTOREs)
struct PackedPosition {
    uint128 amount;    // Slot 0 (16 bytes)
    address owner;     // Slot 0 (20 bytes) -> wait, 16 + 20 = 36 bytes! (spills into Slot 1)
}

// CORRECT: Slot 0 (32 bytes), Slot 1 (32 bytes)
struct PerfectlyPackedPosition {
    uint128 amount;    // Slot 0 (16 bytes) \
    uint96 shares;     // Slot 0 (12 bytes)  } Exactly 32 bytes (1 Slot)
    uint32 timestamp;  // Slot 0 (4 bytes)  /
    address owner;     // Slot 1 (20 bytes) \
    uint64 nonce;      // Slot 1 (8 bytes)   } Exactly 29 bytes (1 Slot)
    bool isActive;     // Slot 1 (1 byte)   /
}
```

### 2.3. Transient Storage Reentrancy Guard (Solidity 0.8.24+ / EIP-1153)
Transient storage (`TSTORE`/`TLOAD`) stores values for the duration of a single transaction for only **100 gas**, compared to **2,100 - 20,000 gas** for standard storage (`SSTORE`/`SLOAD`):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

abstract contract ReentrancyGuardTransient {
    // Keccak-256 hash of "reentrancy.guard.transient.slot"
    bytes32 private constant REENTRANCY_GUARD_SLOT = 
        0x8e94e3343360b0ff1fa73e0454378f4b00350325b141972f3e589255a6d36ef5;

    error ReentrancyGuardReentrantCall();

    modifier nonReentrant() {
        assembly {
            if tload(REENTRANCY_GUARD_SLOT) {
                // Revert with ReentrancyGuardReentrantCall()
                mstore(0x00, 0x3ee5c567)
                revert(0x1c, 0x04)
            }
            tstore(REENTRANCY_GUARD_SLOT, 1)
        }
        _;
        assembly {
            tstore(REENTRANCY_GUARD_SLOT, 0)
        }
    }
}
```

---

## 3. ERC-4626 Vault Inflation Attack Defense

Prevent first-deposit share inflation attacks by using **Virtual Shares and Virtual Assets** (internal decimal offset):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SecureYieldVault is ERC20 {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    uint8 private immutable _assetDecimals;
    
    // Decimal offset provides virtual shares to resist donation attacks
    uint8 private constant _DECIMAL_OFFSET = 3;

    constructor(IERC20 asset_, string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {
        asset = asset_;
        _assetDecimals = 18;
    }

    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        return (assets * (totalSupply() + 10 ** _DECIMAL_OFFSET)) / (totalAssets() + 1);
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        return (shares * (totalAssets() + 1)) / (totalSupply() + 10 ** _DECIMAL_OFFSET);
    }
}
```

---

## 4. Anti-Patterns & Pitfalls Table

| Anti-Pattern | Consequence | Correct Pattern |
| :--- | :--- | :--- |
| **State Mutation After External Call** | Attacker re-enters function during call and drains balance. | Always execute all state changes *before* making external calls (CEI). |
| **Unchecked Return on `transfer()`** | Tokens like USDT return `false` on failure instead of reverting ($\rightarrow$ free tokens). | Always use OpenZeppelin's `SafeERC20.safeTransfer` and `safeTransferFrom`. |
| **`tx.origin` Authorization** | User clicking malicious link in external contract is phished to authorize action. | Always use `msg.sender` for authentication and access control checks. |
| **Spot AMM Price Oracle** | Flash loan manipulator shifts AMM pool reserves, borrowing protocol funds undercollateralized. | Use Chainlink Decentralized Oracles with staleness checks or Uniswap v3 TWAP. |
| **Missing Unprotected `initialize()`** | Attacker calls `initialize()` on implementation contract to gain admin ownership. | Use `_disableInitializers()` in the constructor of upgradeable implementations. |
| **Unbounded Loops Over Dynamic Arrays** | Gas limit per block exceeded $\rightarrow$ contract state permanently frozen / DoS. | Use mapping lookups, pull-over-push payouts, or bounded pagination. |
