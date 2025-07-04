'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting example prompts to new users.
 *
 * - suggestPrompt - A function that returns example values for goal, key points, and tone.
 * - SuggestPromptOutput - The return type for the suggestPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPromptOutputSchema = z.object({
  goal: z.string().describe('An example goal for the message.'),
  keyPoints: z.string().describe('Example key points to include in the message.'),
  tone: z.string().describe('An example tone for the message.'),
});
export type SuggestPromptOutput = z.infer<typeof SuggestPromptOutputSchema>;

export async function suggestPrompt(): Promise<SuggestPromptOutput> {
  return suggestPromptFlow();
}

const prompt = ai.definePrompt({
  name: 'suggestPromptPrompt',
  output: {schema: SuggestPromptOutputSchema},
  prompt: `You are a helpful assistant that provides example inputs for a professional message generator.

  Provide an example goal, some key points to include, and the desired tone for the message.
  The goal should be a specific objective the user wants to achieve with the message.
  The key points should be a few important details to include in the message.
  The tone should be the overall feeling or attitude the message should convey.

  Ensure that the output is valid JSON of the following format:
  {
    "goal": "example goal",
    "keyPoints": "example key points",
    "tone": "example tone"
  }`,
});

const suggestPromptFlow = ai.defineFlow({
  name: 'suggestPromptFlow',
  outputSchema: SuggestPromptOutputSchema,
}, async () => {
  const {output} = await prompt({});
  return output!;
});
