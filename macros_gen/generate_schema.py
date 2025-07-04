from genson import SchemaBuilder
import json
import glob
import os

def generate_schema():
    builder = SchemaBuilder()
    
    # Process files from macros_gen directory
    macro_files = glob.glob('*.json')
    
    print(f"Found {len(macro_files)} macro files")
    
    for file_path in macro_files:
        if file_path == 'schema.json':  # Skip the output file
            continue
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                builder.add_object(data)
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
    
    schema = builder.to_schema()
    
    # Add some metadata and description
    schema['title'] = 'Macro Schema'
    schema['description'] = 'JSON Schema for validating macro files'
    
    # Write the schema
    with open('schema.json', 'w') as f:
        json.dump(schema, f, indent=2)
    
    print("Schema generated successfully!")
    print(f"Total files processed: {len(macro_files)}")

if __name__ == '__main__':
    generate_schema() 