import { Github, Wand2 } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-accent/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-accent" />
          <span className="font-bold text-foreground">CareerCraft AI</span>
        </div>
        <a 
          href="https://github.com/Bhavishya011/CareerCraft-AI" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 text-sm text-foreground transition-colors hover:text-accent"
        >
          <Github className="h-4 w-4" />
          View on GitHub
        </a>
      </div>
    </header>
  );
}
