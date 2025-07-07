import OpenAI from 'openai';

declare global {
    interface Window {
        _env_: {
            REACT_APP_OPENAI_API_KEY: string;
            REACT_APP_OPENAI_ORG_ID: string;
            REACT_APP_OPENAI_MODEL: string;
            REACT_APP_OPENAI_MODEL_S: string;
        }
    }
}

export class OpenAIService {
    private static instance: OpenAIService;
    private openai: OpenAI;
    private model: string;

    private constructor() {
        // Get API key from Netlify environment variables
        // In development, this will use the local .env file
        // In production, it will use Netlify environment variables
        let apiKey = '';
        
        // For Netlify Functions (server-side)
        if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_OPENAI_API_KEY) {
            apiKey = process.env.REACT_APP_OPENAI_API_KEY;
        } 
        // For browser (client-side)
        else if (window._env_ && window._env_.REACT_APP_OPENAI_API_KEY) {
            // If the API key is masked (starts with 'sk-...'), we need to get it from Netlify
            if (window._env_.REACT_APP_OPENAI_API_KEY.startsWith('sk-...')) {
                // In this case, we'll need to make a request to a Netlify function to get the API key
                console.warn('Using masked API key - OpenAI calls will need to be proxied through a Netlify function');
                apiKey = window._env_.REACT_APP_OPENAI_API_KEY;
            } else {
                apiKey = window._env_.REACT_APP_OPENAI_API_KEY;
            }
        }

        if (!apiKey) {
            throw new Error('OpenAI API key not found in environment variables');
        }

        // Sanitize API key to ensure it only contains valid characters
        const sanitizedApiKey = apiKey.replace(/[^\x20-\x7E]/g, '');

        this.openai = new OpenAI({
            apiKey: sanitizedApiKey,
            organization: window._env_?.REACT_APP_OPENAI_ORG_ID || undefined,
            dangerouslyAllowBrowser: true
        });
        
        // Model will be passed later
        this.model = window._env_?.REACT_APP_OPENAI_MODEL || '';
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
                temperature: 0.7, // Can be configured
                max_tokens: 2000,  // Also configurable
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