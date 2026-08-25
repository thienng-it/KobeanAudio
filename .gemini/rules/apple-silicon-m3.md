# 🍎 Apple Silicon M3 Optimization Guidelines

KobeanAudio is developed and optimized for **MacBook Pro M3 with 18GB Unified Memory**.

---

## 1. Hardware Budget Allocation (18GB Unified RAM)

```
Total Memory: 18 GB
├── macOS System & Background Tasks:  ~4.5 GB
├── KobeanAudio Studio UI & API:       ~0.8 GB
└── Available for TTS Inference:       ~12.5 GB
```

### Model Footprints:
- **Kokoro (82M)**: ~0.5 GB RAM (Runs 14x real-time on CPU/MLX/ANE)
- **Orpheus (3B GGUF Q4)**: ~3.5 GB RAM (Runs 2-4x real-time on Metal GPU)
- **Chatterbox**: ~2.5 GB RAM (PyTorch MPS backend)
- **Qwen3-TTS (0.6B/1.7B)**: ~2.0-3.5 GB RAM (MLX native)
- **Piper**: ~0.1 GB RAM (Instant CPU draft)
- **Google AI Studio**: 0 GB Local RAM (Cloud API)

---

## 2. Framework Prioritization

1. **MLX / CoreML**: First choice for native Apple Neural Engine & Metal GPU inference.
2. **llama.cpp with Metal (`-ngl 99`)**: Used for Orpheus 3B GGUF Speech-LLM.
3. **PyTorch MPS (`torch.backends.mps.is_available()`)**: Used for Chatterbox voice cloning.
4. **Never require NVIDIA CUDA**: Always detect and map CUDA dependencies to `mps` or `cpu`.
