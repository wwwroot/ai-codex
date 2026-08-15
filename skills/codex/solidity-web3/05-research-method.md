# Research Method & Security Auditing — Solidity & Web3

> Foundry invariant testing, fuzzing protocols, Slither static analysis, and formal verification.

---

## 1. Foundry Invariant & Stateful Fuzz Testing

Stateful invariant testing subjects contracts to thousands of random, multi-step transaction sequences to prove that mathematical invariants can never be broken:

```solidity
// test/invariants/VaultHandler.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {SecureYieldVault} from "../../src/SecureYieldVault.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract VaultHandler is Test {
    SecureYieldVault public vault;
    MockERC20 public asset;

    uint256 public totalDeposited;
    uint256 public totalWithdrawn;

    constructor(SecureYieldVault vault_, MockERC20 asset_) {
        vault = vault_;
        asset = asset_;
    }

    function deposit(uint256 amount, uint256 actorSeed) public {
        amount = bound(amount, 1 ether, 1_000_000 ether);
        address actor = address(uint160(bound(actorSeed, 1, 10)));

        asset.mint(actor, amount);
        vm.prank(actor);
        asset.approve(address(vault), amount);

        vm.prank(actor);
        vault.deposit(amount, actor);
        totalDeposited += amount;
    }
}
```

```solidity
// test/invariants/VaultInvariants.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {VaultHandler} from "./VaultHandler.sol";
import {SecureYieldVault} from "../../src/SecureYieldVault.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract VaultInvariantsTest is StdInvariant, Test {
    SecureYieldVault public vault;
    MockERC20 public asset;
    VaultHandler public handler;

    function setUp() public {
        asset = new MockERC20("Underlying Asset", "ASSET");
        vault = new SecureYieldVault(asset, "Vault Shares", "vASSET");
        handler = new VaultHandler(vault, asset);

        targetContract(address(handler));
    }

    /// @notice Invariant: Solvency Guarantee (Total vault assets must always be >= backing reserves)
    function invariant_solvencyGuaranteed() public view {
        assertGe(vault.totalAssets(), asset.balanceOf(address(vault)));
    }
}
```

---

## 2. Static Analysis with Slither

Run automated static analysis before every commit to catch common vulnerability classes:

```bash
slither . --checklist --exclude-dependencies --filter-paths "test|mocks"
```

---

## 3. Gas Profiling with `forge snapshot`

Track gas regression across every pull request:

```bash
# Generate baseline snapshot
forge snapshot --check

# Compare diff with master
forge snapshot --diff
```

---

## 4. Pre-Audit Smart Contract Security Checklist

- [ ] **Checks-Effects-Interactions (CEI)**: Verified all internal state updates precede external token/ETH transfers.
- [ ] **Reentrancy Locks**: Added `nonReentrant` modifier on all external state-modifying functions.
- [ ] **Oracle Staleness**: Validated `updatedAt`, `roundId`, and `price > 0` on Chainlink feeds.
- [ ] **Share Inflation Protection**: Verified ERC-4626 vault includes virtual share offset.
- [ ] **Safe ERC-20 Usage**: Replaced all raw `IERC20.transfer` calls with `SafeERC20.safeTransfer`.
- [ ] **Access Control**: Ensured sensitive administration functions are guarded with `onlyOwner` or AccessControl roles.
- [ ] **Foundry Invariant Depth**: Ran stateful invariant testing for $\ge 50,000$ runs and $128$ depth without invariant breakage.
