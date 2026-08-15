# 03 — First Principles Thinking (Python Edition)

> Reference this file when exploring new ideas, designing systems, or solving hard problems in Python.

---

## The Core Question

Before writing any Python code, ask:

> **"What is the simplest, most correct model of this problem?"**

Not the fastest to implement. Not the most familiar pattern. The most *correct* model — the one that reflects the true structure of the problem.

---

## Decomposition Method

Break every problem into three layers:

### 1. What is the data?

Define the data model before writing any logic. Use types to make the domain explicit:

```python
# Bad — data is implicit in function arguments
def process(name, age, scores, active):
    ...

# Good — data model is explicit and typed
@dataclass(slots=True)
class Student:
    name: str
    age: int
    scores: list[float]
    active: bool

    @property
    def average_score(self) -> float:
        return sum(self.scores) / len(self.scores) if self.scores else 0.0
```

### 2. What are the transformations?

Pure functions that transform data — no side effects, no I/O, fully testable:

```python
# Pure transformation — easy to test, easy to reason about
def filter_passing(students: list[Student], threshold: float) -> list[Student]:
    return [s for s in students if s.average_score >= threshold]
```

### 3. What are the effects?

I/O, network, database, filesystem — isolated at the edges of the system:

```python
# Effects at the boundary — not mixed with logic
async def load_students(path: Path) -> list[Student]:
    raw = json.loads(await path.read_text())
    return [Student(**item) for item in raw]
```

---

## Mathematical Thinking in Python

Python is a powerful mathematical prototyping language. Use it to express ideas formally before implementing them.

### Expressing algorithms mathematically

```python
import numpy as np

# Cosine similarity — express the formula first
# cos(theta) = (A dot B) / (||A|| * ||B||)
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    dot = np.dot(a, b)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    if norm == 0:
        return 0.0
    return float(dot / norm)

# Softmax — numerical stability matters
# softmax(x_i) = exp(x_i - max(x)) / sum(exp(x_j - max(x)))
def softmax(x: np.ndarray) -> np.ndarray:
    x_stable = x - np.max(x)  # subtract max for numerical stability
    exp_x = np.exp(x_stable)
    return exp_x / exp_x.sum()
```

### Signal and probability thinking

When building AI or data systems, think in probability distributions, not just values:

- Does this model output a probability or a score? They are different.
- What is the distribution of input data? Outliers will break naive implementations.
- What does "confidence" mean in this context? Is it calibrated?

---

## Invention Checklist for New Python Systems

When starting something that does not exist yet:

1. **Name the problem precisely** — write one sentence describing exactly what this system does
2. **Define inputs and outputs** — as Python types, before writing any logic
3. **Find the mathematical core** — what equation or algorithm is at the heart of this?
4. **Write the simplest possible version first** — 50 lines that prove the idea works
5. **Identify what will break at scale** — GIL, memory, I/O, serialization?
6. **Design the abstraction boundary** — what does the caller need to know vs. what is hidden?
7. **Write tests before optimization** — you need a correctness baseline before you can safely optimize

---

## Questions That Drive Invention

When exploring a new idea, always ask:

- What does this look like as a data transformation pipeline?
- What is the theoretical minimum latency / memory for this operation?
- Is there a vectorized form of this algorithm that avoids Python loops entirely?
- What would this look like as a mathematical function — pure, stateless, deterministic?
- Where is the information entropy in this system — and can it be reduced?
- If Python is the bottleneck, what is the minimal C extension surface needed?
