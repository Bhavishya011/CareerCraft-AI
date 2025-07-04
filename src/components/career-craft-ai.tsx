'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateMessage, type GenerateMessageInput } from '@/ai/flows/generate-message';
import { suggestPrompt } from '@/ai/flows/suggest-prompt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ClipboardCopy, Wand2, FileCode2 } from 'lucide-react';

const formSchema = z.object({
  goal: z.string().min(10, { message: 'Please describe your goal in at least 10 characters.' }),
  keyPoints: z.string().min(10, { message: 'Please provide at least 10 characters of key points.' }),
  tone: z.string().min(3, { message: 'Please describe the tone in at least 3 characters.' }),
});

export default function CareerCraftAI() {
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goal: '',
      keyPoints: '',
      tone: '',
    },
  });

  const handleSuggest = async () => {
    setIsSuggesting(true);
    setGeneratedMessage('');
    try {
      const suggestion = await suggestPrompt();
      form.reset(suggestion);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: 'Could not fetch AI-powered suggestions. Please try again.',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setGeneratedMessage('');
    try {
      const result = await generateMessage(values as GenerateMessageInput);
      setGeneratedMessage(result.message);
    } catch (error) {
      console.error('Error generating message:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'The AI could not generate a message. Please check your inputs and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    toast({
      title: 'Copied to clipboard!',
      description: 'The message has been copied successfully.',
    });
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
                <FileCode2 className="h-6 w-6 text-primary" aria-hidden="true"/>
            </div>
            <div>
                <CardTitle className="text-2xl font-headline">CareerCraft AI</CardTitle>
                <CardDescription>Generate professional messages with the power of AI.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Goal</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Request a promotion from my manager" {...field} disabled={isLoading || isSuggesting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="keyPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Points</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Highlight my recent achievements, express my commitment to the company, and state my desired new role."
                      className="resize-none"
                      rows={4}
                      {...field}
                      disabled={isLoading || isSuggesting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desired Tone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Confident, respectful, and professional" {...field} disabled={isLoading || isSuggesting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CardFooter className="flex justify-between p-0 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleSuggest}
                    disabled={isLoading || isSuggesting}
                >
                    <Wand2 className={`mr-2 h-4 w-4 ${isSuggesting ? 'animate-spin' : ''}`} />
                    {isSuggesting ? 'Suggesting...' : 'Suggest Inputs'}
                </Button>
                <Button type="submit" disabled={isLoading || isSuggesting}>
                    <Sparkles className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Generating...' : 'Generate Message'}
                </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>

      {(isLoading || generatedMessage) && (
        <>
            <Separator className="my-6" />
            <CardContent>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold font-headline">Generated Message</h3>
                    {!isLoading && (
                        <Button variant="ghost" size="icon" onClick={handleCopy}>
                            <ClipboardCopy className="h-4 w-4" />
                            <span className="sr-only">Copy message</span>
                        </Button>
                    )}
                </div>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ) : (
                    <div className="p-4 bg-secondary rounded-md border text-sm text-secondary-foreground whitespace-pre-wrap">
                        {generatedMessage}
                    </div>
                )}
            </div>
            </CardContent>
        </>
      )}
    </Card>
  );
}
