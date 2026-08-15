# 05 — Research & Invention Method (Python Edition)

> Reference this file when exploring a new idea, prototyping an algorithm, or building something that does not exist yet.

---

## The Invention Loop

Every new idea follows the same loop. Do not skip steps.

```
IDEA → MODEL → PROTOTYPE → MEASURE → REFINE → PRODUCTIONIZE
```

### Step 1: Model the Idea

Before writing code, express the idea as clearly as possible:

- Write a one-paragraph description of what this system does
- Define input and output in Python types
- Identify the mathematical or algorithmic core
- Name the key unknowns — what do you not know yet?

### Step 2: Minimal Prototype

Write the smallest possible version that tests the core hypothesis:

```python
# Good prototype philosophy:
# - No error handling yet (find the happy path first)
# - No optimization yet (prove correctness first)
# - No abstraction yet (understand before you generalize)
# - Hardcoded inputs are fine (validate the algorithm, not the pipeline)

def prototype_idea(data: list[float]) -> float:
    # Minimum code to test whether the core idea works
    ...
```

### Step 3: Measure Before Optimizing

Never guess where the bottleneck is:

```python
import cProfile
import pstats
from io import StringIO

profiler = cProfile.Profile()
profiler.enable()

result = prototype_idea(test_data)

profiler.disable()
stream = StringIO()
stats = pstats.Stats(profiler, stream=stream).sort_stats("cumulative")
stats.print_stats(20)
print(stream.getvalue())
```

### Step 4: Identify the Real Bottleneck

| Bottleneck Type | Signature | Solution |
|----------------|-----------|----------|
| Python loop overhead | High call count in pure Python | NumPy vectorization or Cython |
| Memory allocation | Many small allocations | Pre-allocate arrays, use pools |
| I/O bound | Waiting on disk/network | asyncio, concurrent.futures |
| CPU bound (parallelizable) | Single-threaded CPU saturation | multiprocessing, ProcessPoolExecutor |
| Algorithm complexity | O(n²) or worse | Better algorithm first |
| GIL contention | Threads not scaling | multiprocessing or native extension |

### Step 5: Refine With Constraints

Once the prototype works, apply engineering constraints:

1. **Add type annotations** — make the interface explicit
2. **Add input validation** — what inputs should this reject?
3. **Add error handling** — what can go wrong and how should it fail?
4. **Write tests** — at minimum: happy path, edge cases, failure cases
5. **Measure again** — did refactoring change performance?

---

## Prototyping Patterns

### Algorithm Prototyping

```python
import numpy as np
from typing import NamedTuple

class AttentionOutput(NamedTuple):
    output: np.ndarray
    weights: np.ndarray

def scaled_dot_product_attention(
    Q: np.ndarray,
    K: np.ndarray,
    V: np.ndarray,
) -> AttentionOutput:
    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)
    weights = softmax(scores)
    output = weights @ V
    return AttentionOutput(output=output, weights=weights)
```

### Hypothesis Testing Pattern

```python
HYPOTHESIS = "Sorting before grouping reduces cache misses by > 20%"

import time
import numpy as np

def benchmark(fn, *args, runs: int = 100) -> float:
    times = []
    for _ in range(runs):
        start = time.perf_counter()
        fn(*args)
        times.append(time.perf_counter() - start)
    return float(np.median(times))

baseline = benchmark(naive_implementation, test_data)
optimized = benchmark(sorted_implementation, test_data)

improvement = (baseline - optimized) / baseline
print(f"Improvement: {improvement:.1%}")
```

### Incremental Complexity Pattern

```python
# Start with the simplest correct implementation
def v1_linear_search(items: list[int], target: int) -> int:
    for i, item in enumerate(items):
        if item == target:
            return i
    return -1

# Only optimize when v1 is proven correct and measured slow
def v2_binary_search(items: list[int], target: int) -> int:
    lo, hi = 0, len(items) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if items[mid] == target:
            return mid
        elif items[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

---

## Questions for Every New Idea

Before writing a single line of Python for a new invention:

1. **What problem does this solve that nothing else does?**
2. **What is the core algorithm — can I express it in 5 lines of math?**
3. **What is the theoretical best possible performance for this operation?**
4. **What breaks when input size grows by 100x?**
5. **Is there a Python library that already does 80% of this?** (Use it, build the 20%)
6. **What would make this idea wrong?** (Test that hypothesis first)
7. **Who is this for?** (The user, the system, another developer calling this API?)
