export default function AppFooter() {
  return (
    <footer className="w-full border-t border-t-accent/20 bg-background py-4">
      <div className="container flex items-center justify-center text-center text-sm text-muted-foreground px-4 sm:px-6">
        <p>
          Crafted with ❤️ by 
          <a href="https://github.com/Bhavishya011" className="font-medium text-accent hover:underline animate-glow-pulse mx-1">Bhavishya Jain</a> & 
          <a href="https://github.com/soumya-xy" className="font-medium text-accent hover:underline animate-glow-pulse mx-1">Soumya Jain</a> 
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> • </span>
          © 2025 TypeWise AI
        </p>
      </div>
    </footer>
  );
}
