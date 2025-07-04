'use server';

/**
 * @fileOverview AI agent that generates professional messages based on user input.
 *
 * - generateMessage - A function that generates a professional message.
 * - GenerateMessageInput - The input type for the generateMessage function.
 * - GenerateMessageOutput - The return type for the generateMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMessageInputSchema = z.object({
  goal: z.string().describe('The goal of the message.'),
  keyPoints: z.string().describe('The key points to include in the message.'),
  tone: z.string().describe('The desired tone of the message.'),
  recipient: z.string().optional().describe('The recipient of the message.'),
  yourName: z.string().optional().describe('The name of the sender.'),
  signature: z.string().optional().describe('The desired sign-off.'),
  wordLimit: z.number().optional().describe('An approximate word limit for the message.'),
});
export type GenerateMessageInput = z.infer<typeof GenerateMessageInputSchema>;

const GenerateMessageOutputSchema = z.object({
  message: z.string().describe('The generated professional message.'),
});
export type GenerateMessageOutput = z.infer<typeof GenerateMessageOutputSchema>;

export async function generateMessage(input: GenerateMessageInput): Promise<GenerateMessageOutput> {
  return generateMessageFlow(input);
}

const generateMessagePrompt = ai.definePrompt({
  name: 'generateMessagePrompt',
  input: {schema: GenerateMessageInputSchema},
  output: {schema: GenerateMessageOutputSchema},
  prompt: `You are an expert career communications assistant. Your task is to write a professional message based on the user's specifications.

### CORE INSTRUCTIONS ###
- **Goal:** Your primary objective is to: {{goal}}.
- **Tone:** The message must be written in a {{tone}} tone.
- **Key Points:** You must incorporate the following key points provided by the user: {{{keyPoints}}}.

### RULES & CONSTRAINTS ###
- **Formatting:** Generate only the raw text of the message. Do NOT include any markdown, titles, or introductory phrases like "Here is the draft:".
- **Word Limit:** {{#if wordLimit}}- Strictly adhere to a word limit of approximately {{wordLimit}} words.{{else}}- Aim for a concise but complete message (around 150-200 words).{{/if}}
{{#if recipient}}- For personalization, subtly mention the recipient: "{{recipient}}".{{/if}}

### SIGNATURE ###
- Conclude the message with the sign-off "{{#if signature}}{{signature}}{{else}}Best regards{{/if}}".
- Sign the message with the name "{{#if yourName}}{{yourName}}{{else}}[Your Name]{{/if}}". If no name is provided, use the placeholder.

### MESSAGE DRAFT ###
`,
});

const generateMessageFlow = ai.defineFlow(
  {
    name: 'generateMessageFlow',
    inputSchema: GenerateMessageInputSchema,
    outputSchema: GenerateMessageOutputSchema,
  },
  async (input) => {
    const config: {maxOutputTokens?: number} = {};
    if (input.wordLimit) {
      // Set max tokens based on word limit for efficiency, with a buffer.
      config.maxOutputTokens = input.wordLimit * 2;
    } else {
      config.maxOutputTokens = 350;
    }

    const {output} = await generateMessagePrompt(input, {config});
    return output!;
  }
);
