# 02 — Language Standards (Python Edition)

> Reference this file when writing, reviewing, or refactoring Python code.

---

## Version Target

**Python 3.12+ by default.** Use modern features intentionally:

- `match` / `case` for structural pattern matching — when it genuinely improves clarity
- `@dataclass(slots=True)` for memory-efficient, fast data classes
- `tomllib` for config file parsing (stdlib, no dependency)
- `ExceptionGroup` and `except*` for async exception handling
- `Self` type, `TypeVarTuple`, `ParamSpec` for advanced generic typing
- `typing.Never` and `typing.assert_never` for exhaustive matching
- `type` statement (PEP 695) for clean type aliases and generics

---

## Code Standards

### Always

```python
# Full type annotations on all functions
def process(data: list[str], limit: int = 100) -> dict[str, int]: ...

# pathlib.Path over os.path
from pathlib import Path
config = Path("config.toml").read_text()

# dataclasses with slots for data models
@dataclass(slots=True, frozen=True)
class Vector3:
    x: float
    y: float
    z: float

# Context managers for ALL resource usage
with open(path, "rb") as f:
    data = f.read()

# f-strings for all string formatting
name = "Aji"
message = f"Hello, {name}!"

# enumerate() and zip() over index-based loops
for i, item in enumerate(items):
    ...

# Explicit None checks
if value is None:
    raise ValueError("value must not be None")

# Lazy imports for heavy dependencies
def get_torch():
    import torch
    return torch
```

### Never

```python
# Bare except — always name the exception
try:
    ...
except:          # WRONG
    pass

except Exception as e:  # RIGHT — or more specific

# Mutable default arguments
def append(item, lst=[]):   # WRONG — shared state bug
    lst.append(item)

def append(item, lst=None): # RIGHT
    if lst is None:
        lst = []

# import * — pollutes namespace
from module import *  # WRONG

# print() for logging
print("Starting process...")  # WRONG
logger.info("Starting process...")  # RIGHT

# assert for runtime validation
assert user_id > 0  # WRONG — stripped in optimized mode
if user_id <= 0:    # RIGHT
    raise ValueError(f"Invalid user_id: {user_id}")
```

---

## Type System

### Strict Mode Required

Always configure `mypy` or `pyright` in strict mode:

```toml
# pyproject.toml
[tool.mypy]
strict = true
python_version = "3.12"

[tool.pyright]
typeCheckingMode = "strict"
pythonVersion = "3.12"
```

### Key Typing Patterns

```python
from typing import Protocol, TypeAlias, Self, Never
from collections.abc import Callable, Generator, AsyncGenerator

# Protocol for structural typing (preferred over ABC)
class Serializable(Protocol):
    def to_bytes(self) -> bytes: ...
    def from_bytes(cls, data: bytes) -> Self: ...

# TypeAlias for complex types
Vector: TypeAlias = list[float]
Matrix: TypeAlias = list[list[float]]

# Discriminated unions for state machines
type Result[T] = Ok[T] | Err

@dataclass
class Ok[T]:
    value: T

@dataclass
class Err:
    message: str
    code: int

# Runtime validation at boundaries with Pydantic v2
from pydantic import BaseModel, field_validator

class APIRequest(BaseModel):
    user_id: int
    query: str

    @field_validator("query")
    @classmethod
    def query_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("query cannot be empty")
        return v
```

---

## Architecture Principles

- **Flat over nested** — maximum 2 levels of nesting in any function. Extract early.
- **Composition over inheritance** — use `Protocol` and mixins, not deep class hierarchies
- **Explicit dependency injection** — pass dependencies as arguments, do not reach for globals
- **Single responsibility** — one function does one thing. If you need "and" to describe it, split it
- **Fail fast and loudly** — validate inputs at the boundary, raise specific exceptions immediately
- **Immutable data where possible** — `@dataclass(frozen=True)`, `tuple` over `list`, `frozenset` over `set`
- **Module structure mirrors domain** — file names and package layout should reflect the problem domain

---

## Project Tooling Standards

| Tool | Purpose | Config |
|------|---------|--------|
| `uv` | Package & env management | `pyproject.toml` |
| `ruff` | Linting + formatting | replaces flake8, isort, black |
| `mypy` or `pyright` | Static type checking | strict mode always |
| `pytest` | Testing framework | `pytest.ini` or `pyproject.toml` |
| `pytest-asyncio` | Async test support | mode = "auto" |
| `pydantic v2` | Data validation | runtime boundary checks |

```toml
# pyproject.toml
[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "UP", "ANN", "B", "SIM"]

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["ANN"]
```
