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
import {Sparkles, ClipboardCopy, Wand2, RefreshCw, Briefcase, MailCheck, Users, Pencil, Download} from 'lucide-react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {Label} from "@/components/ui/label";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Switch} from "@/components/ui/switch";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formSchema = z.object({
  messageType: z.string().nonempty({message: 'Please select a message type.'}),
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
    messageType: 'Email',
    goal: 'Politely ask for an available internship position for the upcoming summer.',
    keyPoints: 'I am a second-year Computer Science student.\nMy skills include Python, JavaScript, and Firebase.\nI was impressed by your company\'s recent launch of [Product Name].\nMy resume is attached for your review.',
    tone: 'Professional & Formal',
    recipient: 'Hiring Manager',
    yourName: 'Alex Doe',
    signature: 'Best regards',
    wordLimit: '150',
  },
  followup: {
    messageType: 'Email',
    goal: 'Send a thank-you note after an interview.',
    keyPoints: 'Thank the interviewer for their time.\nReiterate my strong interest in the role.\nBriefly mention a specific point from our conversation that I enjoyed, for example [Topic].\nI am excited about the opportunity to contribute to the team.',
    tone: 'Enthusiastic & Friendly',
    recipient: 'Jane Smith',
    yourName: 'Alex Doe',
    signature: 'Sincerely',
    wordLimit: '120',
  },
  networking: {
    messageType: 'LinkedIn Message',
    goal: 'Send a connection request on LinkedIn to someone in my field of interest.',
    keyPoints: 'I am a student passionate about [Your Field].\nI found their work on [Project/Article] very insightful.\nI would be honored to connect and follow their professional journey.',
    tone: 'Concise & Direct',
    recipient: 'John Appleseed',
    yourName: 'Alex Doe',
    signature: '',
    wordLimit: '50',
  },
};

const MessagePreview = ({ subject, body, type, recipient, yourName }: { subject?: string, body: string, type: string, recipient?: string, yourName?: string }) => {
  const renderContent = () => {
    const cardClassName = "p-4 my-2 font-sans text-sm bg-card/60 border-accent/20 backdrop-blur-sm";

    switch (type) {
      case 'Email':
      case 'Cold Outreach':
        return (
          <Card className={cardClassName}>
            <div className="text-muted-foreground">
              <p><strong className="text-foreground">To:</strong> {recipient || '[Recipient]'}</p>
              <p><strong className="text-foreground">From:</strong> {yourName || '[Your Name]'}</p>
              <p><strong className="text-foreground">Subject:</strong> {subject || '(No subject generated)'}</p>
            </div>
            <Separator className="my-3 border-accent/20" />
            <div className="whitespace-pre-wrap">{body}</div>
          </Card>
        );

      case 'LinkedIn Message':
        return (
          <div className="p-4 my-2 flex items-start gap-3">
            <Avatar>
                <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="person avatar" />
                <AvatarFallback>{(yourName || 'A').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="bg-primary text-primary-foreground p-3 rounded-xl rounded-tl-sm text-sm">
              <p className="whitespace-pre-wrap">{body}</p>
            </div>
          </div>
        );

      case 'Resume Bullet Point':
        return (
          <Card className={cardClassName}>
            <ul className="list-disc list-outside pl-5 text-sm">
              <li>{body}</li>
            </ul>
          </Card>
        );

      case 'Cover Letter Paragraph':
        return (
          <Card className={`${cardClassName} font-serif text-base border-dashed border-accent/40`}>
            <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
          </Card>
        );

      default:
        return <Textarea value={body} readOnly className="min-h-[200px] resize-y text-sm font-body bg-background" />;
    }
  };

  return <div className="mt-4">{renderContent()}</div>;
};


export default function TypeWiseAI() {
  const [generatedOutput, setGeneratedOutput] = useState<{ subject?: string; body: string } | null>(null);
  const [editableBody, setEditableBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const {toast} = useToast();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      messageType: '',
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
    form.reset({
      ...template,
      recipient: template.recipient || '',
      yourName: template.yourName || '',
      signature: template.signature || '',
      wordLimit: template.wordLimit || '',
    });
    toast({
      title: 'Template Applied!',
      description: `The form has been pre-filled with the "${type}" template.`,
    });
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    setGeneratedOutput(null);
    setEditableBody('');
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
    setGeneratedOutput(null);
    setEditableBody('');
    setIsEditMode(false);
    try {
      const payload: GenerateMessageInput = {
        ...values,
        wordLimit: values.wordLimit ? Number(values.wordLimit) : undefined,
      };
      const result = await generateMessage(payload);
      setGeneratedOutput(result);
      setEditableBody(result.body);
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
  
  const handleRedesign = () => {
    form.handleSubmit(onSubmit)();
  };

  const handleCopy = () => {
    if (!editableBody) return;
    navigator.clipboard.writeText(editableBody);
    toast({
      title: 'Copied to clipboard!',
      description: 'The message has been copied successfully.',
    });
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setTimeout(() => {
        textAreaRef.current?.focus();
        textAreaRef.current?.select();
    }, 0);
  };

  const handleDownloadPdf = async () => {
    if (!generatedOutput) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let fullText = editableBody;
    if (generatedOutput.subject) {
        fullText = `Subject: ${generatedOutput.subject}\n\n${editableBody}`;
    }
    const splitText = doc.splitTextToSize(fullText, 180);
    doc.text(splitText, 10, 10);
    doc.save('TypeWise-Message.pdf');
    toast({
      title: 'Download Started',
      description: 'Your PDF is being downloaded.',
    });
  };

  const handleDownloadWord = () => {
    if (!generatedOutput) return;
    let fullText = editableBody;
    if (generatedOutput.subject) {
        fullText = `Subject: ${generatedOutput.subject}\n\n${editableBody}`;
    }
    const blob = new Blob([fullText], {type: 'application/msword'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'TypeWise-Message.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Download Started',
      description: 'Your Word document is being downloaded.',
    });
  };
  
  const formValues = form.watch();

  return (
    <TooltipProvider>
      <Card className="w-full max-w-3xl rounded-2xl border border-accent/20 bg-card/60 backdrop-blur-sm shadow-2xl shadow-accent/10 animate-fade-up">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg border border-accent/20">
              <Wand2 className="h-6 w-6 text-accent" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                TypeWise AI
              </CardTitle>
              <CardDescription className="text-muted-foreground pt-1">
                Instantly create polished messages for any career goal.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-2">
              <Label>Get Started with a Template</Label>
              <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => applyTemplate('internship')} className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20"><Briefcase className="mr-2"/>Internship Request</Button>
                  <Button variant="secondary" size="sm" onClick={() => applyTemplate('followup')} className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20"><MailCheck className="mr-2"/>Interview Follow-up</Button>
                  <Button variant="secondary" size="sm" onClick={() => applyTemplate('networking')} className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20"><Users className="mr-2"/>Networking Outreach</Button>
              </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="messageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Type</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isSuggesting}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select the type of message you want to create" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="LinkedIn Message">LinkedIn Message</SelectItem>
                          <SelectItem value="Resume Bullet Point">Resume Bullet Point</SelectItem>
                          <SelectItem value="Cover Letter Paragraph">Cover Letter Paragraph</SelectItem>
                          <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="goal"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>Message Goal</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Request a promotion from my manager" {...field} disabled={isLoading || isSuggesting} className="bg-background" />
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
                          placeholder="e.g., Highlight my recent achievements, express my commitment, state my desired new role."
                          className="resize-none bg-background"
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
                          <SelectTrigger className="bg-background">
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

                <Accordion type="single" collapsible className="w-full border-b-accent/20">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Optional Details</AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField control={form.control} name="recipient" render={({field}) => (
                            <FormItem><FormLabel>Recipient (Optional)</FormLabel><FormControl><Input placeholder="e.g., The Hiring Team" {...field} disabled={isLoading || isSuggesting} className="bg-background"/></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="yourName" render={({field}) => (
                            <FormItem><FormLabel>Your Name (Optional)</FormLabel><FormControl><Input placeholder="e.g., Alex Doe" {...field} disabled={isLoading || isSuggesting} className="bg-background"/></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="signature" render={({field}) => (
                            <FormItem><FormLabel>Sign-off (Optional)</FormLabel><FormControl><Input placeholder="e.g., Sincerely" {...field} disabled={isLoading || isSuggesting} className="bg-background"/></FormControl><FormMessage /></FormItem>
                         )} />
                         <FormField control={form.control} name="wordLimit" render={({field}) => (
                            <FormItem><FormLabel>Word Limit (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 150" {...field} disabled={isLoading || isSuggesting} className="bg-background"/></FormControl><FormMessage /></FormItem>
                         )} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 p-0 pt-4">
                <Button type="button" variant="outline" onClick={handleSuggest} disabled={isLoading || isSuggesting} className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20">
                  <Wand2 className={`mr-2 h-4 w-4 ${isSuggesting ? 'animate-spin' : ''}`} />
                  {isSuggesting ? 'Suggesting...' : 'Suggest Inputs'}
                </Button>
                <Button type="submit" disabled={isLoading || isSuggesting} className="w-full sm:w-auto font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/40">
                  <Sparkles className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Generating...' : 'Generate Message'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>

        {(isLoading || generatedOutput) && (
          <>
            <Separator className="my-6 border-accent/20" />
            <CardContent className="animate-fade-in">
              <div className="space-y-4">
                 {isLoading ? (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold tracking-tight">Generating Message...</h3>
                    <Skeleton className="h-40 w-full bg-card/80" />
                  </div>
                ) : generatedOutput && (
                  <>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold tracking-tight">Generated Message</h3>
                      <div className="flex items-center gap-2 sm:gap-4">
                          <div className="flex items-center space-x-2">
                              <Switch id="edit-mode-toggle" checked={isEditMode} onCheckedChange={setIsEditMode} />
                              <Label htmlFor="edit-mode-toggle" className="text-sm">{isEditMode ? 'Edit' : 'Preview'}</Label>
                          </div>
                      </div>
                    </div>

                    {isEditMode ? (
                        <Textarea
                          ref={textAreaRef}
                          value={editableBody}
                          onChange={(e) => setEditableBody(e.target.value)}
                          placeholder="Your generated message will appear here. You can edit it directly."
                          className="min-h-[200px] resize-y text-sm font-body bg-background"
                        />
                    ) : (
                        <MessagePreview 
                          subject={generatedOutput.subject}
                          body={editableBody} 
                          type={formValues.messageType} 
                          recipient={formValues.recipient} 
                          yourName={formValues.yourName} 
                        />
                    )}
                    
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={handleEdit} className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCopy} className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20">
                            <ClipboardCopy className="mr-2 h-4 w-4" />
                            Copy
                        </Button>
                         <Button variant="outline" size="sm" onClick={handleRedesign} className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Redesign
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-accent/20">
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
                  </>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </TooltipProvider>
  );
}
