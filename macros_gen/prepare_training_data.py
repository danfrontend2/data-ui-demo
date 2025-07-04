import json
import os
from pathlib import Path

def prepare_training_data():
    macros_dir = Path('macros_gen')
    output_file = Path('fine_tune_chat_gpt/training_data.jsonl')
    
    # Get all JSON files that start with 'macro_'
    json_files = list(macros_dir.glob('macro_*.json'))
    
    # Create output directory if it doesn't exist
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Open output file in write mode
    with open(output_file, 'w', encoding='utf-8') as out_f:
        for file_path in json_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'prompt' in data:
                        # Create training example in ChatGPT format
                        training_example = {
                            "messages": [
                                {
                                    "role": "user",
                                    "content": data['prompt']
                                },
                                {
                                    "role": "assistant",
                                    "content": json.dumps(data, ensure_ascii=False, indent=2)
                                }
                            ]
                        }
                        # Write to JSONL file (one JSON per line)
                        out_f.write(json.dumps(training_example, ensure_ascii=False) + '\n')
            except json.JSONDecodeError:
                print(f"Error reading {file_path}")
                continue
            except Exception as e:
                print(f"Error processing {file_path}: {str(e)}")
                continue

if __name__ == '__main__':
    prepare_training_data() 