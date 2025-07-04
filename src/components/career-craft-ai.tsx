'use client';

import {useState, useRef} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {generateMessage, type GenerateMessageInput} from '@/ai/flows/generate-message';
import {suggestPrompt} from '@/ai/flows/suggest-prompt';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {useToast} from '@/hooks/use-toast';
import {Sparkles, ClipboardCopy, Wand2, FileCode2, Briefcase, MailCheck, Users, Pencil, Download} from 'lucide-react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Label} from "@/components/ui/label";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import jsPDF from 'jspdf';

const formSchema = z.object({
  goal: z.string().min(10, {message: 'Please describe your goal in at least 10 characters.'}),
  keyPoints: z.string().min(10, {message: 'Please provide at least 10 characters of key points.'}),
  tone: z.string().nonempty({message: 'Please select a tone.'}),
  recipient: z.string().optional(),
  yourName: z.string().optional(),
  signature: z.string().optional(),
  wordLimit: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const templates = {
  internship: {
    goal: 'Politely ask for an available internship position for the upcoming summer.',
    keyPoints: 'I am a second-year Computer Science student.\nMy skills include Python, JavaScript, and Firebase.\nI was impressed by your company\'s recent launch of [Product Name].\nMy resume is attached for your review.',
    tone: 'Professional & Formal',
    wordLimit: '',
  },
  followup: {
    goal: 'Send a thank-you note after an interview.',
    keyPoints: 'Thank the interviewer for their time.\nReiterate my strong interest in the role.\nBriefly mention a specific point from our conversation that I enjoyed, for example [Topic].\nI am excited about the opportunity to contribute to the team.',
    tone: 'Enthusiastic & Friendly',
    wordLimit: '',
  },
  networking: {
    goal: 'Send a connection request on LinkedIn to someone in my field of interest.',
    keyPoints: 'I am a student passionate about [Your Field].\nI found their work on [Project/Article] very insightful.\nI would be honored to connect and follow their professional journey.',
    tone: 'Concise & Direct',
    wordLimit: '50',
  },
};

export default function CareerCraftAI() {
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [editableMessage, setEditableMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const {toast} = useToast();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goal: '',
      keyPoints: '',
      tone: '',
      recipient: '',
      yourName: '',
      signature: '',
      wordLimit: '',
    },
  });

  const applyTemplate = (type: keyof typeof templates) => {
    const template = templates[type];
    form.reset(template);
    toast({
      title: 'Template Applied!',
      description: `The form has been pre-filled with the "${type}" template.`,
    });
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    setGeneratedMessage('');
    setEditableMessage('');
    try {
      const suggestion = await suggestPrompt();
      form.reset({...form.getValues(), ...suggestion});
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

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setGeneratedMessage('');
    setEditableMessage('');
    try {
      const payload: GenerateMessageInput = {
        ...values,
        wordLimit: values.wordLimit ? Number(values.wordLimit) : undefined,
      };
      const result = await generateMessage(payload);
      setGeneratedMessage(result.message);
      setEditableMessage(result.message);
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
    if (!editableMessage) return;
    navigator.clipboard.writeText(editableMessage);
    toast({
      title: 'Copied to clipboard!',
      description: 'The message has been copied successfully.',
    });
  };

  const handleEdit = () => {
    textAreaRef.current?.focus();
  };

  const handleDownloadPdf = () => {
    if (!editableMessage) return;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(editableMessage, 180);
    doc.text(splitText, 10, 10);
    doc.save('CareerCraft-Message.pdf');
    toast({
      title: 'Download Started',
      description: 'Your PDF is being downloaded.',
    });
  };

  const handleDownloadWord = () => {
    if (!editableMessage) return;
    const blob = new Blob([editableMessage], {type: 'application/msword'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CareerCraft-Message.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Download Started',
      description: 'Your Word document is being downloaded.',
    });
  };

  return (
    <Card className="w-full max-w-3xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FileCode2 className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-2xl font-headline">CareerCraft AI</CardTitle>
            <CardDescription>Generate professional messages with the power of AI.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-2">
            <Label>Get Started with a Template</Label>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => applyTemplate('internship')}><Briefcase/>Internship Request</Button>
                <Button variant="outline" size="sm" onClick={() => applyTemplate('followup')}><MailCheck/>Interview Follow-up</Button>
                <Button variant="outline" size="sm" onClick={() => applyTemplate('networking')}><Users/>Networking Outreach</Button>
            </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="goal"
                render={({field}) => (
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
                render={({field}) => (
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
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Desired Tone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isSuggesting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tone for your message" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Professional & Formal">Professional & Formal</SelectItem>
                        <SelectItem value="Enthusiastic & Friendly">Enthusiastic & Friendly</SelectItem>
                        <SelectItem value="Concise & Direct">Concise & Direct</SelectItem>
                        <SelectItem value="Confident & Assertive">Confident & Assertive</SelectItem>
                        <SelectItem value="Grateful & Appreciative">Grateful & Appreciative</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Optional Details</AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormField control={form.control} name="recipient" render={({field}) => (
                          <FormItem><FormLabel>Recipient (Optional)</FormLabel><FormControl><Input placeholder="e.g., The Hiring Team" {...field} disabled={isLoading || isSuggesting} /></FormControl><FormMessage /></FormItem>
                       )} />
                       <FormField control={form.control} name="yourName" render={({field}) => (
                          <FormItem><FormLabel>Your Name (Optional)</FormLabel><FormControl><Input placeholder="e.g., Alex Doe" {...field} disabled={isLoading || isSuggesting} /></FormControl><FormMessage /></FormItem>
                       )} />
                       <FormField control={form.control} name="signature" render={({field}) => (
                          <FormItem><FormLabel>Sign-off (Optional)</FormLabel><FormControl><Input placeholder="e.g., Sincerely" {...field} disabled={isLoading || isSuggesting} /></FormControl><FormMessage /></FormItem>
                       )} />
                       <FormField control={form.control} name="wordLimit" render={({field}) => (
                          <FormItem><FormLabel>Word Limit (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 150" {...field} disabled={isLoading || isSuggesting} /></FormControl><FormMessage /></FormItem>
                       )} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 p-0 pt-4">
              <Button type="button" variant="outline" onClick={handleSuggest} disabled={isLoading || isSuggesting}>
                <Wand2 className={`mr-2 h-4 w-4 ${isSuggesting ? 'animate-spin' : ''}`} />
                {isSuggesting ? 'Suggesting...' : 'Suggest Inputs'}
              </Button>
              <Button type="submit" disabled={isLoading || isSuggesting} className="w-full sm:w-auto">
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
                  <Skeleton className="h-40 w-full" />
                  <div className="flex justify-end">
                    <Skeleton className="h-10 w-44" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    ref={textAreaRef}
                    value={editableMessage}
                    onChange={(e) => setEditableMessage(e.target.value)}
                    placeholder="Your generated message will appear here. You can edit it directly."
                    className="min-h-[200px] resize-y text-sm font-body"
                  />
                  <div className="flex items-center justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                      </Button>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={handleDownloadPdf}>
                                  PDF Document (.pdf)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleDownloadWord}>
                                  Word Document (.doc)
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}
