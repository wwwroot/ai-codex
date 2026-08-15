# First Principles — EVM Execution Mechanics & Bytecode Security

> Deep dive into EVM memory models, gas scheduling, Yul assembly, upgradeable proxy slots, and EIP-712 cryptography.

---

## 1. The EVM Execution Environment

```
┌────────────────────────────────────────────────────────────────────────┐
│                                EVM CORE                                │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │   Stack (1024 max)    │  │ Memory (Byte Array, Ephemeral)         │ │
│  │   256-bit words       │  │ Quadratic Expansion Gas: O(N^2)        │ │
│  └───────────────────────┘  └────────────────────────────────────────┘ │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ Calldata (Read-Only)  │  │ Transient Storage (EIP-1153) (Tx Scope)│ │
│  │ 16 gas/byte non-zero  │  │ TSTORE / TLOAD (100 gas flat)          │ │
│  └───────────────────────┘  └────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Permanent Storage (2^256 Slots, Persistent across Transactions)   │ │
│  │ Cold SLOAD: 2,100 gas | Warm SLOAD: 100 gas                       │ │
│  │ Cold SSTORE (0 -> Non-Zero): 20,000 gas | Warm SSTORE: 2,900 gas  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Memory Allocation & Quadratic Gas Expansion

Memory in the EVM is contiguous and linearly byte-addressed. When allocating beyond current memory boundaries, a quadratic expansion penalty applies:

$$\text{Memory Gas Cost} = 3 \times a + \left\lfloor \frac{a^2}{512} \right\rfloor$$
*(where $a$ is the number of 32-byte words allocated)*

**Rule of Thumb**: Avoid allocating huge dynamic in-memory arrays within loops. Re-use scratch space or stream data directly from `calldata`.

---

## 3. Storage Slot Mathematics

1. **State Variables**: Numbered sequentially starting at slot `0`.
2. **Dynamic Mappings**: Stored at `keccak256(h(k) . p)` where `p` is the slot number of the mapping and `k` is the key.
3. **Dynamic Arrays**: Array length stored at slot `p`. Array elements start at `keccak256(p) + index * element_size`.

```solidity
// Understanding Mapping Slot Location in Assembly
function getMappingSlot(address key, uint256 mappingSlot) pure returns (bytes32) {
    return keccak256(abi.encode(key, mappingSlot));
}
```

---

## 4. ERC-1967 Upgradeable Proxy Storage Slots

To prevent storage slot collisions between the proxy contract and the logic implementation, OpenZeppelin standardizes deterministic storage slots:

- **Implementation Slot**: `bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)`
  $\rightarrow$ `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`
- **Admin Slot**: `bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)`
  $\rightarrow$ `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`

---

## 5. EIP-712 Typed Structured Data Cryptography

Never sign arbitrary hashes; use EIP-712 to ensure users sign human-readable, domain-separated messages with replay protection:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract SecurePermitVault is EIP712 {
    using ECDSA for bytes32;

    bytes32 private constant PERMIT_TYPEHASH = 
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    mapping(address => uint256) public nonces;

    error SignatureExpired();
    error InvalidSigner();

    constructor() EIP712("SecurePermitVault", "1") {}

    function verifyPermit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        bytes calldata signature
    ) public returns (bool) {
        if (block.timestamp > deadline) revert SignatureExpired();

        bytes32 structHash = keccak256(
            abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline)
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);

        if (signer != owner) revert InvalidSigner();
        return true;
    }
}
```
