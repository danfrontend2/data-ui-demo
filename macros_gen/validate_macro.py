import json
from jsonschema import validate
import sys

def validate_macro(macro_json):
    # Load the schema
    with open('schema.json', 'r') as f:
        schema = json.load(f)
    
    try:
        # Validate against the schema
        validate(instance=macro_json, schema=schema)
        return True, None
    except Exception as e:
        return False, str(e)

def validate_macro_string(macro_str):
    try:
        # First try to parse the JSON
        macro_json = json.loads(macro_str)
        return validate_macro(macro_json)
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON format: {str(e)}"

if __name__ == '__main__':
    # Test with a file if provided as argument
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'r') as f:
            macro_str = f.read()
        is_valid, error = validate_macro_string(macro_str)
        if is_valid:
            print("Macro is valid!")
        else:
            print(f"Macro is invalid: {error}")
    else:
        print("Please provide a macro file path as argument") 