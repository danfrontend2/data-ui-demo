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
            
            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a macro generation assistant. Generate valid macro JSON based on user prompts."
                    },
                    {
                        role: "user",
                        content: sanitizedPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
            });

            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI');
            }

            // Try to parse JSON
            try {
                return JSON.parse(response);
            } catch (e) {
                console.error('JSON parsing error:', e);
                console.log('Raw response:', response);
                throw new Error('Invalid JSON in response');
            }
        } catch (error: any) {
            console.error('OpenAI API Error:', error);
            throw new Error(`Failed to generate macro: ${error.message}`);
        }
    }
} 