import os
import json
import time
from pathlib import Path
import openai
from typing import Optional

class ChatGPTFineTuner:
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the fine-tuner with OpenAI API key."""
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set it as OPENAI_API_KEY environment variable or pass directly.")
        
        openai.api_key = self.api_key
        self.training_file_id = None
        self.fine_tuning_job_id = None
        self.fine_tuned_model = None
        
        # Default model for fine-tuning
        self.default_model = "gpt-4-0125-preview"

    def validate_training_data(self, file_path: str) -> tuple[bool, str]:
        """Validate the training data format."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            for i, line in enumerate(lines, 1):
                try:
                    data = json.loads(line)
                    # Validate required fields
                    if 'messages' not in data:
                        return False, f"Line {i}: Missing 'messages' field"
                    if not isinstance(data['messages'], list):
                        return False, f"Line {i}: 'messages' must be an array"
                    if len(data['messages']) < 2:
                        return False, f"Line {i}: Each example must have at least 2 messages"
                    
                    for msg in data['messages']:
                        if 'role' not in msg or 'content' not in msg:
                            return False, f"Line {i}: Each message must have 'role' and 'content'"
                        if msg['role'] not in ['user', 'assistant']:
                            return False, f"Line {i}: Invalid role. Must be 'user' or 'assistant'"
                
                except json.JSONDecodeError:
                    return False, f"Line {i}: Invalid JSON format"
            
            return True, f"Successfully validated {len(lines)} training examples"
            
        except Exception as e:
            return False, f"Error reading file: {str(e)}"

    def upload_training_file(self, file_path: str) -> str:
        """Upload the training file to OpenAI."""
        print("Uploading training file...")
        with open(file_path, 'rb') as f:
            response = openai.File.create(
                file=f,
                purpose='fine-tune'
            )
        self.training_file_id = response.id
        print(f"File uploaded successfully. File ID: {self.training_file_id}")
        return self.training_file_id

    def create_fine_tuning_job(self, model: Optional[str] = None) -> str:
        """Create a fine-tuning job."""
        if not self.training_file_id:
            raise ValueError("No training file uploaded yet")
        
        model = model or self.default_model
        print(f"Creating fine-tuning job with model {model}...")
        print("Note: GPT-4 fine-tuning might take longer and cost more than GPT-3.5")
        
        response = openai.FineTuningJob.create(
            training_file=self.training_file_id,
            model=model
        )
        self.fine_tuning_job_id = response.id
        print(f"Fine-tuning job created. Job ID: {self.fine_tuning_job_id}")
        return self.fine_tuning_job_id

    def save_model_name(self, model_name: str) -> None:
        """Save the fine-tuned model name to a file."""
        model_file = Path('fine_tune_chat_gpt/fine_tuned_model.txt')
        with open(model_file, 'w') as f:
            f.write(model_name)
        print(f"\nModel name saved to: {model_file}")

    def monitor_fine_tuning_progress(self, interval: int = 60) -> None:
        """Monitor the progress of the fine-tuning job."""
        if not self.fine_tuning_job_id:
            raise ValueError("No fine-tuning job created yet")
        
        print("Monitoring fine-tuning progress...")
        print("Note: GPT-4 fine-tuning typically takes several hours to complete")
        
        while True:
            job = openai.FineTuningJob.retrieve(self.fine_tuning_job_id)
            status = job.status
            
            print(f"\nStatus: {status}")
            if hasattr(job, 'trained_tokens'):
                print(f"Trained tokens: {job.trained_tokens}")
            
            if status == 'succeeded':
                self.fine_tuned_model = job.fine_tuned_model
                print("\n" + "=" * 50)
                print("🎉 Fine-tuning completed successfully!")
                print("=" * 50)
                print(f"Your fine-tuned model name: {self.fine_tuned_model}")
                print("=" * 50)
                print("\nUse this model name in get_response.py to generate macros")
                
                # Save model name to file
                self.save_model_name(self.fine_tuned_model)
                break
            elif status == 'failed':
                print("\nFine-tuning failed!")
                if hasattr(job, 'error'):
                    print(f"Error: {job.error}")
                break
            
            print(f"Checking again in {interval} seconds...")
            time.sleep(interval)

    def run_fine_tuning(self, training_file: str, model: Optional[str] = None) -> None:
        """Run the complete fine-tuning process."""
        # Validate training data
        print("Validating training data...")
        is_valid, message = self.validate_training_data(training_file)
        if not is_valid:
            raise ValueError(f"Invalid training data: {message}")
        print(message)
        
        # Upload file
        self.upload_training_file(training_file)
        
        # Create and monitor fine-tuning job
        self.create_fine_tuning_job(model)
        self.monitor_fine_tuning_progress()

def main():
    # Path to your training data
    training_file = Path('fine_tune_chat_gpt/training_data.jsonl')
    
    # Initialize fine-tuner (will use OPENAI_API_KEY environment variable)
    tuner = ChatGPTFineTuner()
    
    try:
        # Run fine-tuning process with GPT-4
        tuner.run_fine_tuning(str(training_file))
    except Exception as e:
        print(f"Error during fine-tuning: {str(e)}")

if __name__ == '__main__':
    main() 