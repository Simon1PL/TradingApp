from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

def main():
    # Model configuration
    model_name = "Qwen/Qwen-2.5B-VL"
    
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    print("Loading model...")
    model = AutoModelForCausalLM.from_pretrained(
        model_name, 
        device_map="auto", 
        torch_dtype=torch.float16
    )
    
    # Example classification prompt
    prompt = "Classify 'Alice' into categories: Person, Animal, Object"
    
    print(f"\nPrompt: {prompt}")
    print("Generating response...")
    
    # Tokenize and generate
    inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
    outputs = model.generate(**inputs, max_new_tokens=50)
    
    # Decode and print result
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"\nResult:\n{result}")

if __name__ == "__main__":
    main()
