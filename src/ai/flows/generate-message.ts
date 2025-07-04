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
  prompt: `You are a professional message generator. You will generate a message based on the goal, key points, and tone provided.

Goal: {{{goal}}}
Key Points: {{{keyPoints}}}
Tone: {{{tone}}}

Message:`,
});

const generateMessageFlow = ai.defineFlow(
  {
    name: 'generateMessageFlow',
    inputSchema: GenerateMessageInputSchema,
    outputSchema: GenerateMessageOutputSchema,
  },
  async input => {
    const {output} = await generateMessagePrompt(input);
    return output!;
  }
);
