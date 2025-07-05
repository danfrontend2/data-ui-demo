import OpenAI from 'openai';

export class OpenAIService {
    private openai: OpenAI;
    private model: string;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.REACT_APP_OPENAI_API_KEY,
            organization: process.env.REACT_APP_OPENAI_ORG_ID,
            dangerouslyAllowBrowser: true
        });
        // Model will be passed later
        this.model = process.env.REACT_APP_OPENAI_MODEL || '';
    }

    async generateMacro(prompt: string): Promise<any> {
        try {
            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: "You are a macro generation assistant. Generate valid macro JSON based on user prompts."
                    },
                    {
                        role: "user",
                        content: prompt
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
                throw new Error('Invalid JSON in response');
            }
        } catch (error: any) {
            console.error('OpenAI API Error:', error);
            throw new Error(`Failed to generate macro: ${error.message}`);
        }
    }
} 