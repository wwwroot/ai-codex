# 04 — Domain Knowledge (Python Edition)

> Reference this file when working in specific Python domains. Load what is relevant to the current session.

---

## AI / Machine Learning Engineering

### PyTorch

```python
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

# Custom Dataset — always type the __getitem__ return
class TextDataset(Dataset):
    def __init__(self, texts: list[str], tokenizer) -> None:
        self.encodings = tokenizer(texts, truncation=True, padding=True)

    def __len__(self) -> int:
        return len(self.encodings["input_ids"])

    def __getitem__(self, idx: int) -> dict[str, torch.Tensor]:
        return {k: torch.tensor(v[idx]) for k, v in self.encodings.items()}

# Mixed precision training — always use for GPU training
from torch.amp import autocast, GradScaler
scaler = GradScaler()

with autocast(device_type="cuda"):
    output = model(input)
    loss = criterion(output, target)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

**Key rules:**
- `torch.compile()` for inference speedup in PyTorch 2.0+
- `model.eval()` + `torch.no_grad()` always during inference
- Move data to device explicitly — never assume GPU
- Monitor VRAM with `torch.cuda.memory_summary()`
- Use `torch.utils.checkpoint` for gradient checkpointing on large models

### Hugging Face

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import get_peft_model, LoraConfig, TaskType

# LoRA fine-tuning — memory efficient
config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
)
model = get_peft_model(base_model, config)
model.print_trainable_parameters()
```

**Key patterns:**
- Always set `device_map="auto"` for large models
- Use `BitsAndBytesConfig` for 4-bit/8-bit quantization
- Tokenizer padding side matters — `left` for generation, `right` for classification
- `pipeline()` for quick inference, direct model for production

### Model Optimization

| Technique | Use When | Tool |
|-----------|---------|------|
| 4-bit quantization | VRAM constrained | `bitsandbytes`, AWQ |
| ONNX export | Cross-platform inference | `torch.onnx.export` |
| TensorRT | Maximum NVIDIA GPU speed | `torch2trt` |
| `torch.compile` | General PyTorch 2.0+ speedup | built-in |
| Knowledge distillation | Smaller model, same task | custom training loop |

---

## Data Science & Analysis

### pandas Best Practices

```python
import pandas as pd

# WRONG — iterrows is always slow
for idx, row in df.iterrows():
    df.at[idx, "result"] = row["a"] + row["b"]

# RIGHT — vectorized
df["result"] = df["a"] + df["b"]

# WRONG — chained assignment
df[df["age"] > 18]["status"] = "adult"

# RIGHT — use .loc
df.loc[df["age"] > 18, "status"] = "adult"

# Use categorical for low-cardinality string columns
df["category"] = df["category"].astype("category")  # 10x memory reduction

# Read only needed columns
df = pd.read_csv("large_file.csv", usecols=["id", "value", "timestamp"])
```

### NumPy Performance Rules

```python
import numpy as np

# Broadcasting over loops — always
a = np.array([1, 2, 3])
b = np.array([[1], [2], [3]])
result = a + b  # 3x3 matrix — no loops

# Memory layout matters for cache performance
arr = np.zeros((1000, 1000), order="C")  # C-order row-major, fast for row ops

# Structured arrays for typed tabular data
dtype = np.dtype([("x", np.float32), ("y", np.float32), ("label", np.int32)])
points = np.zeros(1000, dtype=dtype)
```

---

## GUI & Desktop Applications

### Gradio (AI demos)

```python
import gradio as gr

def predict(text: str, temperature: float) -> str:
    return result

demo = gr.Interface(
    fn=predict,
    inputs=[
        gr.Textbox(label="Input", lines=3),
        gr.Slider(0.0, 1.0, value=0.7, label="Temperature"),
    ],
    outputs=gr.Textbox(label="Output"),
    title="Model Demo",
)

demo.launch(share=False, server_port=7860)
```

### PyQt6 / PySide6 (desktop apps)

```python
from PyQt6.QtCore import QThread, pyqtSignal

# Heavy work always in QThread — never block the main thread
class WorkerThread(QThread):
    result_ready = pyqtSignal(str)
    error_occurred = pyqtSignal(str)

    def run(self) -> None:
        try:
            result = self.do_heavy_work()
            self.result_ready.emit(result)
        except Exception as e:
            self.error_occurred.emit(str(e))
```

---

## Web & APIs

### FastAPI (production APIs)

```python
from fastapi import FastAPI, status
from pydantic import BaseModel

app = FastAPI()

class CreateItemRequest(BaseModel):
    name: str
    price: float

class ItemResponse(BaseModel):
    id: int
    name: str
    price: float

@app.post("/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(request: CreateItemRequest) -> ItemResponse:
    ...
```

**Rules:**
- Always use Pydantic v2 models for request/response — never raw dicts
- Dependency injection for database sessions, auth, config
- Use `lifespan` for startup/shutdown events
- Background tasks with `BackgroundTasks` or Celery for heavy work

---

## Performance Tooling

| Profile what | Tool | Command |
|-------------|------|---------|
| CPU hotspots | `cProfile` | `python -m cProfile -s cumtime script.py` |
| Line-by-line | `line_profiler` | `@profile` decorator + `kernprof` |
| Memory usage | `memray` | `python -m memray run script.py` |
| Async profiling | `py-spy` | `py-spy top --pid <PID>` |
| GPU memory | PyTorch | `torch.cuda.memory_summary()` |
