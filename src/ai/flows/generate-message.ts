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
  subject: z.string().optional().describe('The generated subject line, if applicable.'),
  body: z.string().describe('The generated message content/body.'),
});
export type GenerateMessageOutput = z.infer<typeof GenerateMessageOutputSchema>;

export async function generateMessage(input: GenerateMessageInput): Promise<GenerateMessageOutput> {
  return generateMessageFlow(input);
}

// Prompt for simple text generation (for non-email types)
const generateTextPrompt = ai.definePrompt({
  name: 'generateTextPrompt',
  input: {schema: z.object({prompt: z.string()})},
  output: {schema: z.object({message: z.string()})},
  prompt: `{{prompt}}`,
});

// Prompt for structured JSON email generation
const generateJsonEmailPrompt = ai.definePrompt({
  name: 'generateJsonEmailPrompt',
  input: {schema: z.object({prompt: z.string()})},
  output: {schema: z.object({subject: z.string(), body: z.string()})},
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
    
    const config: {maxOutputTokens?: number} = {};
    if (wordLimit) {
      // Set max tokens based on word limit for efficiency, with a buffer.
      config.maxOutputTokens = wordLimit * 3;
    } else {
      config.maxOutputTokens = 400;
    }

    // Handle Email types with a specific JSON-demanding prompt
    if (messageType === 'Email' || messageType === 'Cold Outreach') {
      const recipientInstruction = recipient ? `- For personalization, subtly mention the recipient: "${recipient}".` : '';
      const wordLimitInstruction = wordLimit ? `- Strictly adhere to a word limit of approximately ${wordLimit} words for the email body.` : '';
      const signatureInstruction = `- Conclude the message with the sign-off "${signature || 'Best regards'}".\n- Sign the message with the name "${yourName || '[Your Name]'}".`;

      const jsonPromptText = `You are an expert career communications assistant. Your task is to generate a professional email subject and body based on the user's specifications.

### CRITICAL INSTRUCTION: OUTPUT FORMAT ###
You MUST respond with a single, valid JSON object and nothing else. The JSON object must have exactly two keys:
1. "subject": A concise, professional subject line for the email.
2. "body": The full, well-formatted text of the email message itself.

### EXAMPLE OF YOUR REQUIRED RESPONSE FORMAT ###
{
  "subject": "Regarding the Software Engineer Internship Opportunity",
  "body": "Dear ${recipient || '[Recipient Name]'},\n\nI am writing to express my keen interest in the Software Engineer internship position... [rest of the email body]...\n\n${signatureInstruction}"
}

### USER'S REQUIREMENTS ###
- **Goal of the Email:** ${goal}.
- **Tone:** The message must be written in a ${tone} tone.
- **Key Points to Include in Body:** ${keyPoints}.
${wordLimitInstruction}
${recipientInstruction}

Now, generate the JSON object based on these requirements.`;
      const {output} = await generateJsonEmailPrompt({prompt: jsonPromptText}, {config});
      return output!;
    } 
    
    // Handle other message types with text-based prompts
    let messageTypeInstructions = `
### RULES & CONSTRAINTS ###
- **Formatting:** Generate only the raw text of the message. Do NOT include any markdown, titles, or introductory phrases like "Here is the draft:".`;
    let signatureBlock = `
### SIGNATURE ###
- Conclude the message with the sign-off "${signature || 'Best regards'}".
- Sign the message with the name "${yourName || '[Your Name]'}". If no name is provided, use the placeholder.
`;
    
    switch (messageType) {
        case 'Resume Bullet Point':
            messageTypeInstructions = `
### MESSAGE-TYPE SPECIFIC RULES ###
- **Output Format:** Generate a single, powerful, action-oriented bullet point.
- **Content:** Start with an action verb. Quantify achievements where possible based on the key points.
- **Exclusions:** Do NOT include any greetings, sign-offs, or conversational text. Output ONLY the bullet point.`;
            signatureBlock = ''; // No signature for resume bullets
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
    }

    const recipientInstruction = recipient ? `- For personalization, subtly mention the recipient: "${recipient}".` : '';
    const wordLimitInstruction = wordLimit ? `- Strictly adhere to a word limit of approximately ${wordLimit} words.` : '- Aim for a concise but complete message (around 150-200 words).';

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
    
    // This prompt expects a { message: string } output.
    const {output: textOutput} = await generateTextPrompt({prompt: fullPrompt}, {config});
    
    // Adapt to the new output schema
    return { body: textOutput!.message };
  }
);
