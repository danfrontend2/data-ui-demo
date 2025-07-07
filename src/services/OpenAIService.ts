import OpenAI from 'openai';

export class OpenAIService {
    private static instance: OpenAIService;
    private openai: OpenAI;
    private model: string;

    private constructor() {
        // Get API key from environment variables (supports .env files)
        const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
        
        if (!apiKey) {
            throw new Error('OpenAI API key not found in environment variables');
        }

        this.openai = new OpenAI({
            apiKey: apiKey,
            organization: '',
            dangerouslyAllowBrowser: true
        });
        
        // Get model from environment variables
        this.model = process.env.REACT_APP_OPENAI_MODEL || 'gpt-3.5-turbo';
        console.log(`Using model: ${this.model}`);
        console.log('OpenAI client initialized with API key from environment variables');
    }

    public static getInstance(): OpenAIService {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService();
        }
        return OpenAIService.instance;
    }

    async generateMacro(prompt: string): Promise<any> {
        try {
            // Sanitize prompt to ensure it only contains valid characters
            const sanitizedPrompt = prompt.replace(/[^\x20-\x7E\n\r\t]/g, '');
            
            console.log(`Sending request to model: ${this.model}`);
            console.log(`API Key length: ${process.env.REACT_APP_OPENAI_API_KEY?.length}`);
            console.log(`API Key (first 20 chars): ${process.env.REACT_APP_OPENAI_API_KEY?.substring(0, 20)}...`);
            console.log(`API Key (last 10 chars): ...${process.env.REACT_APP_OPENAI_API_KEY?.slice(-10)}`);
            console.log(`API Key contains asterisks: ${process.env.REACT_APP_OPENAI_API_KEY?.includes('*')}`);
            console.log(`Full prompt: ${sanitizedPrompt}`);
            
            const requestBody = {
                model: this.model,
                messages: [
                    {
                        role: "system" as const,
                        content: `You are a macro generation assistant. Generate valid macro JSON based on user prompts.

IMPORTANT: You must return ONLY valid JSON in this exact format:

{
  "prompt": "description of what the macro does",
  "steps": [
    {
      "id": "unique_step_id",
      "timestamp": 1234567890,
      "type": "ACTION_TYPE",
      "details": { /* action-specific details */ },
      "message": "Human readable description"
    }
  ]
}

Available action types:
- ADD_GRID: Add a new data grid
- DROP_FILE: Load data into grid from file
- SELECT_RANGE: Select data range for visualization
- ADD_CHART: Create chart from selected data
- ARRANGE: Arrange items in columns

Example for "show bar chart of countries population":
{
  "prompt": "show bar chart of countries population",
  "steps": [
    {
      "id": "step_1",
      "timestamp": 1717666853668,
      "type": "ADD_GRID",
      "details": {
        "item": {
          "i": "grid_12345",
          "type": "grid",
          "x": 0,
          "y": 0,
          "w": 12,
          "h": 12
        }
      },
      "message": "Adding new data grid"
    },
    {
      "id": "step_2", 
      "timestamp": 1717666857900,
      "type": "DROP_FILE",
      "details": {
        "gridId": "grid_12345",
        "excelData": [
          ["Country", "Population"],
          ["China", 1412],
          ["India", 1400],
          ["USA", 339]
        ]
      },
      "message": "Loading country population data"
    },
    {
      "id": "step_3",
      "timestamp": 1717666860465,
      "type": "ADD_CHART",
      "details": {
        "item": {
          "i": "chart_12345",
          "type": "bar-chart",
          "x": 0,
          "y": 12,
          "w": 12,
          "h": 9,
          "chartData": [
            {"Country": "China", "Population": 1412},
            {"Country": "India", "Population": 1400},
            {"Country": "USA", "Population": 339}
          ],
          "chartConfig": {
            "xField": "Country",
            "yField": "Population"
          }
        }
      },
      "message": "Creating bar chart"
    }
  ]
}

Return ONLY the JSON, no other text.`
                    },
                    {
                        role: "user" as const,
                        content: sanitizedPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            };
            
            console.log('Request body:', JSON.stringify(requestBody, null, 2));
            
            const completion = await this.openai.chat.completions.create(requestBody);

            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI');
            }

            console.log('Successful response received');
            console.log('Response length:', response.length);

            // Try to parse JSON
            try {
                return JSON.parse(response);
            } catch (e) {
                console.error('JSON parsing error:', e);
                console.log('Raw response:', response);
                throw new Error('Invalid JSON in response');
            }
        } catch (error: any) {
            console.error('OpenAI API Error Details:', {
                message: error.message,
                status: error.status,
                error: error.error,
                code: error.code,
                param: error.param,
                type: error.type
            });
            throw new Error(`Failed to generate macro: ${error.message}`);
        }
    }
} 