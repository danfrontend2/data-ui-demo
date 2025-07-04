import os
import json
from pathlib import Path
import openai
from typing import Optional
from dotenv import load_dotenv

class MacroGenerator:
    def __init__(self, model_name: str, api_key: Optional[str] = None):
        """Initialize the generator with a specific fine-tuned model."""
        # Load environment variables from .env file if it exists
        load_dotenv()
        
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set it as OPENAI_API_KEY environment variable or pass directly.")
        
        self.model_name = model_name
        openai.api_key = self.api_key

    def get_macro(self, prompt: str) -> dict:
        """Get macro JSON for the given prompt."""
        try:
            # Create chat completion with the fine-tuned model
            response = openai.ChatCompletion.create(
                model=self.model_name,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0  # Use 0 for more deterministic outputs
            )
            
            # Extract the response content
            macro_json = response.choices[0].message.content
            
            # Parse the response to ensure it's valid JSON
            return json.loads(macro_json)
            
        except json.JSONDecodeError:
            print("Error: Model response is not valid JSON")
            print("Raw response:", macro_json)
            return None
        except Exception as e:
            print(f"Error getting macro: {str(e)}")
            return None

def main():
    # Example prompts to test the model
    TEST_PROMPTS = [
        "create a table with data for ten countries, population, GDP, area",
        "show planets of solar system in a pie chart",
        "display mountain heights in a bar chart"
    ]
    
    # Replace with your fine-tuned model name (you'll get this after fine-tuning)
    MODEL_NAME = "ft:gpt-3.5-turbo-0125:personal::xyz123"  # Replace with your model name
    
    generator = MacroGenerator(MODEL_NAME)
    
    for prompt in TEST_PROMPTS:
        print("\nPrompt:", prompt)
        print("-" * 50)
        
        macro = generator.get_macro(prompt)
        if macro:
            # Pretty print the JSON response
            print(json.dumps(macro, indent=2, ensure_ascii=False))
        print("=" * 50)

if __name__ == '__main__':
    main() 