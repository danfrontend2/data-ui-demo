import json
import csv
from pathlib import Path
import uuid

def generate_unique_suffix():
    """Generate a short unique suffix for filenames."""
    return str(uuid.uuid4())[:8]

def generate_variations():
    # Setup paths
    macros_en = Path('macros_en')
    macros_gen = Path('macros_gen')
    all_prompts_file = macros_gen / 'all_prompts.csv'
    
    # Read all prompts
    with open(all_prompts_file, 'r') as f:
        reader = csv.DictReader(f)
        variations = list(reader)
    
    # Process each variation
    for var in variations:
        source_file = macros_en / var['filename']
        
        # Read original file
        try:
            with open(source_file, 'r') as f:
                data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"Error reading {source_file}: {e}")
            continue
        
        # Modify only the prompt
        data['prompt'] = var['prompt']
        
        # Generate unique target filename
        base_name = source_file.stem
        suffix = generate_unique_suffix()
        target_file = macros_gen / f"{base_name}_{suffix}.json"
        
        # Write new file
        try:
            with open(target_file, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Created {target_file}")
        except Exception as e:
            print(f"Error writing {target_file}: {e}")

if __name__ == '__main__':
    generate_variations() 