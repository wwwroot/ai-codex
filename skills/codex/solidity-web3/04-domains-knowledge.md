# Domain Knowledge & Web3 Systems Engineering

> Architecture patterns for DeFi AMMs, Chainlink oracles, ERC-4337 Account Abstraction, and Layer 2 rollups.

---

## 1. DeFi AMM Constant Product Architecture

The constant product invariant guarantees liquidity across all price points:

$$(x + \Delta x \cdot (1 - \phi)) \cdot (y - \Delta y) = k$$
*(where $\phi$ is the swap fee, e.g., $0.003$ for $0.3\%$)*

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ConstantProductAMM {
    using SafeERC20 for IERC20;

    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint112 public reserve0;
    uint112 public reserve1;
    uint32 public blockTimestampLast;

    error InsufficientOutputAmount();
    error InsufficientLiquidity();
    error InvalidKInvariant();

    constructor(IERC20 token0_, IERC20 token1_) {
        token0 = token0_;
        token1 = token1_;
    }

    function swap(uint256 amount0Out, uint256 amount1Out, address to) external {
        if (amount0Out == 0 && amount1Out == 0) revert InsufficientOutputAmount();
        (uint112 _reserve0, uint112 _reserve1) = (reserve0, reserve1);
        if (amount0Out >= _reserve0 || amount1Out >= _reserve1) revert InsufficientLiquidity();

        if (amount0Out > 0) token0.safeTransfer(to, amount0Out);
        if (amount1Out > 0) token1.safeTransfer(to, amount1Out);

        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));

        uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;

        // Invariant check with 0.3% fee (997/1000)
        uint256 balance0Adjusted = (balance0 * 1000) - (amount0In * 3);
        uint256 balance1Adjusted = (balance1 * 1000) - (amount1In * 3);

        if (balance0Adjusted * balance1Adjusted < uint256(_reserve0) * _reserve1 * (1000 ** 2)) {
            revert InvalidKInvariant();
        }

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
    }
}
```

---

## 2. Chainlink Price Oracle with Staleness & Sanity Checks

Never trust raw oracle output without checking timestamp staleness, round completeness, and min/max circuit breaker bounds:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

library OracleValidator {
    error OracleStalePrice(uint256 updatedAt, uint256 maxAge);
    error OracleInvalidPrice(int256 price);
    error OracleIncompleteRound();

    function getValidatedPrice(
        AggregatorV3Interface feed,
        uint256 maxStalenessSeconds,
        int256 minPriceBound,
        int256 maxPriceBound
    ) internal view returns (uint256) {
        (
            uint80 roundId,
            int256 price,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = feed.latestRoundData();

        if (price <= 0 || price < minPriceBound || price > maxPriceBound) {
            revert OracleInvalidPrice(price);
        }
        if (updatedAt == 0 || block.timestamp - updatedAt > maxStalenessSeconds) {
            revert OracleStalePrice(updatedAt, maxStalenessSeconds);
        }
        if (answeredInRound < roundId) {
            revert OracleIncompleteRound();
        }

        return uint256(price);
    }
}
```

---

## 3. Account Abstraction (ERC-4337)

ERC-4337 enables smart contract wallets with programmable validation rules without consensus layer changes:

```
┌──────────────┐      ┌───────────────┐      ┌───────────────┐      ┌──────────────┐
│ User Wallet  │ ───► │  Alt Mempool  │ ───► │   Bundler     │ ───► │  EntryPoint  │
│ (UserOp msg) │      │ (UserOps)     │      │ (Executes tx) │      │  Contract    │
└──────────────┘      └───────────────┘      └───────────────┘      └──────┬───────┘
                                                                           │
                                                                           ▼
                                                                  [ Smart Account ]
                                                                  (Validates & Runs)
```
