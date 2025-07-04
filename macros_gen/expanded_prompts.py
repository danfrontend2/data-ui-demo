import csv
from pathlib import Path

def expand_prompts():
    input_file = Path('macros_gen/prompts_with_variations.csv')
    output_file = Path('macros_gen/all_prompts.csv')
    
    with open(input_file, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    expanded_rows = []
    for row in rows:
        # Add original prompt
        expanded_rows.append({
            'filename': row['filename'],
            'prompt': row['prompt']
        })
        # Add variations
        for i in range(1, 4):
            expanded_rows.append({
                'filename': row['filename'],
                'prompt': row[f'prompt_v{i}']
            })
    
    # Write expanded data
    with open(output_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['filename', 'prompt'])
        writer.writeheader()
        writer.writerows(expanded_rows)

if __name__ == '__main__':
    expand_prompts() 