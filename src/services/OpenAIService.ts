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
            console.log(`Prompt received: "${prompt}"`);
            console.log(`Prompt length: ${prompt?.length || 0}`);
            console.log(`Prompt type: ${typeof prompt}`);
            
            if (!prompt || prompt.trim().length === 0) {
                throw new Error('Empty or invalid prompt provided');
            }
            
            console.log(`Sending request to model: ${this.model}`);
            
            const requestBody = {
                model: this.model,
                messages: [
                    {
                        role: "system" as const,
                        content: `You are a macro generation assistant. Generate valid macro JSON based on user prompts.

CRITICAL: You MUST return ONLY valid JSON in EXACTLY this format - no other structure is allowed:

{
  "prompt": "description of what the macro does",
  "steps": [
    {
      "id": "unique_step_id", 
      "timestamp": 1234567890,
      "type": "ACTION_TYPE",
      "details": { /* action-specific details */ }
    }
  ]
}

DO NOT use any other JSON structure. DO NOT wrap it in "macros" array or use "actions" field. The root object must have "prompt" and "steps" fields only.

Available action types:
- ADD_GRID: Add a new data grid
- DROP_FILE: Load data into grid from file  
- SELECT_RANGE: Select data range for visualization
- ADD_CHART: Create chart from selected data
- ARRANGE: Arrange items in layout

Example - "show company revenue chart":
{
  "prompt": "show company revenue chart", 
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
      }
    },
    {
      "id": "step_2",
      "timestamp": 1717666857900, 
      "type": "DROP_FILE",
      "details": {
        "gridId": "grid_12345",
        "excelData": [
          ["Company", "Revenue", "Employees"],
          ["Apple", 394328, 164000],
          ["Microsoft", 198270, 221000],
          ["Google", 307394, 182502]
        ]
      }
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
            {"category": "Apple", "Revenue": 394328},
            {"category": "Microsoft", "Revenue": 198270},
            {"category": "Google", "Revenue": 307394}
          ],
          "chartConfig": {
            "series": [
              {
                "field": "Revenue",
                "name": "Revenue"
              }
            ]
          }
        }
      }
    }
  ]
}

For pie-chart example:
{
  "type": "pie-chart",
  "chartData": [
    {"category": "Apple", "Revenue": 394},
    {"category": "Microsoft", "Revenue": 211}
  ],
  "chartConfig": {
    "series": [
      {
        "field": "Revenue",
        "name": "Revenue"
      }
    ]
  }
}

CRITICAL RULES FOR CHARTS:
1. ALWAYS analyze the user's request to determine what data they want
2. Generate relevant data based on the user's request topic (companies, planets, countries, etc.)
3. DO NOT copy data from the example above - create appropriate data for the user's request

4. For ADD_CHART - chartData MUST include BOTH categories AND numeric values:
   - WRONG: [{"Company": "Apple"}, {"Company": "Microsoft"}] - only categories
   - CORRECT: [{"Company": "Apple", "Revenue": 394328}, {"Company": "Microsoft", "Revenue": 198270}] - categories + values
   
5. chartData MUST exactly match excelData:
   - If excelData has ["Apple", 394328, 164000] 
   - Then chartData MUST have {"Company": "Apple", "Revenue": 394328, "Employees": 164000}
   - Copy ALL numbers from excelData to chartData - do NOT make up new numbers!
   
6. Steps connection: DROP_FILE data → exactly same data in ADD_CHART chartData
7. Chart type configurations - ALL charts use the same format:
   - bar-chart: use "category" field in chartData and "series" array in chartConfig
   - pie-chart: use "category" field in chartData and "series" array in chartConfig  
   - line-chart: use "category" field in chartData and "series" array in chartConfig
   - Format: {"category": "ItemName", "FieldName": value} and chartConfig.series[{field: "FieldName", name: "FieldName"}]
8. Column names MUST be in English: "Company", "Revenue", "Population", etc.
9. Use simple field names without special characters: "Revenue_Billion" not "Доход__млрд___$__"

Return ONLY the JSON, no other text.`
                    },
                    {
                        role: "user" as const,
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 10000,
            };
            
            console.log('User message content:', JSON.stringify(requestBody.messages[1].content));
            console.log('Request model:', requestBody.model);
            
            const completion = await this.openai.chat.completions.create(requestBody);

            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI');
            }

            console.log('Successful response received', response);
            console.log('Response length:', response.length);
            // Try to parse JSON
            try {
                const parsedResponse = JSON.parse(response);
                
                // Validate response structure
                if (!parsedResponse.steps || !Array.isArray(parsedResponse.steps)) {
                    console.error('Invalid response structure - missing or invalid steps array:', parsedResponse);
                    throw new Error('Response must have a "steps" array');
                }
                
                // Always set prompt to user's original request
                parsedResponse.prompt = prompt;
                console.log('Set prompt field to user\'s original request');
                
                // Debug chartData in ADD_CHART steps
                parsedResponse.steps?.forEach((step: any, index: number) => {
                    if (step.type === 'ADD_CHART') {
                        console.log(`Step ${index + 1} (ADD_CHART) chartData:`, 
                            JSON.stringify(step.details?.item?.chartData, null, 2));
                        console.log(`Step ${index + 1} (ADD_CHART) chartConfig:`, 
                            JSON.stringify(step.details?.item?.chartConfig, null, 2));
                    }
                });
                
                return parsedResponse;
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