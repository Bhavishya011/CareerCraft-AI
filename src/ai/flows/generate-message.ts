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
  messageType: z.string().optional().describe('The type of message to generate, e.g., Email, LinkedIn Message.'),
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

// A simple prompt template. The actual prompt is built dynamically in the flow.
const generateMessagePrompt = ai.definePrompt({
  name: 'generateMessagePrompt',
  input: {schema: z.object({prompt: z.string()})},
  output: {schema: GenerateMessageOutputSchema},
  prompt: `{{prompt}}`,
});

const generateMessageFlow = ai.defineFlow(
  {
    name: 'generateMessageFlow',
    inputSchema: GenerateMessageInputSchema,
    outputSchema: GenerateMessageOutputSchema,
  },
  async (input) => {
    const { goal, keyPoints, tone, recipient, yourName, signature, wordLimit, messageType } = input;

    let messageTypeInstructions = `
### RULES & CONSTRAINTS ###
- **Formatting:** Generate only the raw text of the message. Do NOT include any markdown, titles, or introductory phrases like "Here is the draft:".`;
    let signatureBlock = `
### SIGNATURE ###
- Conclude the message with the sign-off "${signature || 'Best regards'}".
- Sign the message with the name "${yourName || '[Your Name]'}". If no name is provided, use the placeholder.
`;

    if (messageType) {
        switch (messageType) {
            case 'Resume Bullet Point':
                messageTypeInstructions = `
### MESSAGE-TYPE SPECIFIC RULES ###
- **Output Format:** Generate a single, powerful, action-oriented bullet point.
- **Content:** Start with an action verb. Quantify achievements where possible based on the key points.
- **Exclusions:** Do NOT include any greetings, sign-offs, or conversational text. Output ONLY the bullet point.`;
                signatureBlock = ''; // No signature for resume bullets
                break;
            case 'Email':
                messageTypeInstructions = `
### MESSAGE-TYPE SPECIFIC RULES ###
- **Output Format:** Format as a standard professional email. Suggest a subject line formatted as "Subject: [Your Subject Here]" on the first line, followed by a blank line, then the body of the email.
- **Content:** Maintain a formal or specified tone throughout the email body.`;
                break;
            case 'LinkedIn Message':
                 messageTypeInstructions = `
### MESSAGE-TYPE SPECIFIC RULES ###
- **Output Format:** Format as a professional but slightly more casual direct message.
- **Content:** Keep the message concise and to the point. The tone can be friendlier than a formal email.`;
                break;
            case 'Cover Letter Paragraph':
                 messageTypeInstructions = `
### MESSAGE-TYPE SPECIFIC RULES ###
- **Output Format:** Generate a well-structured paragraph suitable for a cover letter.
- **Content:** The paragraph should be formal and persuasive, directly addressing the key points and goal.`;
                break;
            case 'Cold Outreach':
                 messageTypeInstructions = `
### MESSAGE-TYPE SPECIFIC RULES ###
- **Output Format:** A concise and compelling message for initial contact, suitable for an email.
- **Content:** Focus on grabbing attention quickly and providing a clear call to action. Suggest a compelling subject line formatted as "Subject: [Your Subject Here]".`;
                break;
        }
    }


    const recipientInstruction = recipient
        ? `- For personalization, subtly mention the recipient: "${recipient}".`
        : '';
    const wordLimitInstruction = wordLimit
        ? `- Strictly adhere to a word limit of approximately ${wordLimit} words.`
        : '- Aim for a concise but complete message (around 150-200 words).';

    const fullPrompt = `You are an expert career communications assistant. Your task is to write a professional message based on the user's specifications.
${messageType ? `\nYou are writing a: **${messageType}**.` : ''}

${messageTypeInstructions}

### CORE INSTRUCTIONS ###
- **Goal:** Your primary objective is to: ${goal}.
- **Tone:** The message must be written in a ${tone} tone.
- **Key Points:** You must incorporate the following key points provided by the user: ${keyPoints}.

### GENERAL RULES & CONSTRAINTS ###
${wordLimitInstruction}
${recipientInstruction}

${signatureBlock}

### MESSAGE DRAFT ###
`;

    const config: {maxOutputTokens?: number} = {};
    if (input.wordLimit) {
      // Set max tokens based on word limit for efficiency, with a buffer.
      config.maxOutputTokens = input.wordLimit * 3;
    } else {
      config.maxOutputTokens = 400;
    }

    const {output} = await generateMessagePrompt({prompt: fullPrompt}, {config});
    return output!;
  }
);
