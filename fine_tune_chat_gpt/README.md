# ChatGPT Fine-tuning for UI Macros

This folder contains script for fine-tuning the ChatGPT model using UI macro data.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure your OpenAI API key using one of these methods:
   - Create a `.env` file in the project directory:
     ```
     OPENAI_API_KEY=your-api-key-here
     ```
   - Or set an environment variable:
     ```bash
     export OPENAI_API_KEY=your-api-key-here
     ```

## Usage

### Fine-tuning

1. Ensure the `training_data.jsonl` file is in the `fine_tune_chat_gpt/` directory

2. Run the fine-tuning script:
```bash
python fine_tune.py
```

The script will perform the following steps:
- Validate the training data
- Upload the data to OpenAI
- Create and start a fine-tuning job
- Monitor progress until completion

### Using the Fine-tuned Model

Once fine-tuning is complete, you can use the model to generate macros:

1. Update the `MODEL_NAME` in `get_response.py` with your fine-tuned model name
2. Run the script:
```bash
python get_response.py
```

The script includes example prompts and will output the generated macro JSON for each prompt.

## Data Structure

The `training_data.jsonl` file contains examples in the following format:
```json
{
  "messages": [
    {"role": "user", "content": "user prompt"},
    {"role": "assistant", "content": "macro JSON"}
  ]
}
```

## Monitoring

The script automatically tracks fine-tuning progress and outputs:
- Process status
- Number of processed tokens
- Final model after successful completion

## Notes

- We have over 400 examples for training, which is good for quality fine-tuning
- Uses gpt-3.5-turbo model by default
- The process may take several hours
- Fine-tuning cost depends on the number of tokens 