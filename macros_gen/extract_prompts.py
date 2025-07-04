import json
import os
import csv
from pathlib import Path

def create_prompt_variations(prompt):
    """Create three variations of the prompt while maintaining the meaning and context."""
    # Common replacements for variety while keeping the meaning
    viz_terms = {
        'show': ['display', 'visualize', 'create'],
        'give': ['provide', 'create', 'display'],
        'create': ['make', 'generate', 'build'],
        'need': ['want', 'require', 'create'],
        'chart': ['visualization', 'diagram', 'graph'],
        'data': ['information', 'stats', 'metrics']
    }
    
    # Special handling for specific chart types
    chart_types = {
        'pie chart': ['pie diagram', 'circular chart', 'pie visualization'],
        'bar chart': ['bar graph', 'column chart', 'bar visualization'],
        'line chart': ['line graph', 'trend chart', 'line visualization']
    }
    
    # Layout terms
    layout_terms = {
        'side by side': ['next to each other', 'horizontally aligned', 'in a row'],
        'arrange': ['organize', 'position', 'layout'],
        'align': ['arrange', 'position', 'organize']
    }
    
    # Create variations
    variations = [prompt]  # Original prompt
    
    # First variation - replace visualization terms
    v1 = prompt
    for term, replacements in viz_terms.items():
        if term in v1.lower():
            v1 = v1.lower().replace(term, replacements[0], 1)
    variations.append(v1.capitalize())
    
    # Second variation - replace chart types and layout terms
    v2 = prompt
    for term, replacements in {**chart_types, **layout_terms}.items():
        if term in v2.lower():
            v2 = v2.lower().replace(term, replacements[1], 1)
    variations.append(v2.capitalize())
    
    # Third variation - more significant rephrasing while keeping the meaning
    v3 = prompt
    for term, replacements in {**viz_terms, **chart_types, **layout_terms}.items():
        if term in v3.lower():
            v3 = v3.lower().replace(term, replacements[2], 1)
    variations.append(v3.capitalize())
    
    # Ensure we have exactly 4 items (original + 3 variations)
    while len(variations) < 4:
        variations.append(variations[-1])
    
    return variations[1:]  # Return just the variations

def extract_prompts():
    macros_dir = Path('macros_en')
    output_file = Path('macros_gen/original_prompts.csv')
    
    # Get all JSON files without filtering
    json_files = list(macros_dir.glob('*.json'))
    
    prompts = []
    for file_path in json_files:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                if 'prompt' in data:
                    original_prompt = data['prompt']
                    variations = create_prompt_variations(original_prompt)
                    prompts.append({
                        'filename': file_path.name,
                        'prompt': original_prompt,
                        'prompt_v1': variations[0],
                        'prompt_v2': variations[1],
                        'prompt_v3': variations[2]
                    })
        except json.JSONDecodeError:
            print(f"Error reading {file_path}")
            continue
    
    # Sort by filename
    prompts.sort(key=lambda x: x['filename'])
    
    # Write to CSV
    with open(output_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['filename', 'prompt', 'prompt_v1', 'prompt_v2', 'prompt_v3'])
        writer.writeheader()
        writer.writerows(prompts)

if __name__ == '__main__':
    extract_prompts() 