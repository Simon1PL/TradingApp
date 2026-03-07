# Qwen-2.5B-VL Classification Project

This project uses the Qwen-2.5B-VL model from Hugging Face for text classification tasks.

## Prerequisites

- Python 3.8 or higher
- CUDA-capable GPU (recommended for optimal performance)
- CUDA Toolkit installed

## Installation

1. **Create a virtual environment (recommended)**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install dependencies**:
   ```powershell
   pip install torch transformers accelerate bitsandbytes
   ```
   
   Or use the requirements file:
   ```powershell
   pip install -r requirements.txt
   ```

## Usage

Run the classification script:
```powershell
python qwen_classifier.py
```

## How It Works

The script:
1. Loads the Qwen-2.5B-VL model and tokenizer from Hugging Face
2. Uses GPU acceleration with FP16 precision for efficiency
3. Takes a classification prompt and generates a response
4. Example: Classifies 'Alice' into categories: Person, Animal, Object

## Customization

You can modify the `prompt` variable in `qwen_classifier.py` to test different classification tasks:

```python
prompt = "Your custom classification prompt here"
```

## System Requirements

- **RAM**: 8GB+ recommended
- **GPU**: NVIDIA GPU with 4GB+ VRAM
- **Storage**: ~5GB for model weights

## Troubleshooting

- **CUDA not available**: If you don't have a CUDA GPU, change `device_map="auto"` to `device_map="cpu"` and remove `.to("cuda")` from the inputs line
- **Out of memory**: Try using a smaller model or reduce the `max_new_tokens` parameter
- **Model download issues**: Ensure you have a stable internet connection; first run will download ~5GB of model weights

## License

This project uses the Qwen model from Alibaba Cloud. Please refer to the model's license on Hugging Face for usage terms.
