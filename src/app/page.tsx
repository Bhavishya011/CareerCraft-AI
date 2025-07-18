import TypeWiseAI from "@/components/career-craft-ai";

export default function Home() {
  return (
    <div className="flex flex-col items-center p-4 sm:p-6 md:p-8">
      {/* Hero Section */}
      <section className="w-full max-w-3xl text-center mb-8 sm:mb-12 animate-fade-up">
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-br from-accent to-foreground bg-clip-text text-transparent mb-4">
          Instantly Create Polished, Personalized Career Messages
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-6">
          TypeWise AI helps you craft professional emails, LinkedIn messages,
          cover letters, and more—tailored to your goals, tone, and key points.
          Save time, stand out, and communicate with confidence.
        </p>
        <div className="flex flex-col items-center gap-6 mb-8">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <li className="bg-card/80 border border-accent/20 rounded-xl p-4 shadow-sm text-left sm:text-center">
              <span className="font-bold text-accent">AI-Powered Writing:</span>{" "}
              Get instant, high-quality drafts for any career scenario.
            </li>
            <li className="bg-card/80 border border-accent/20 rounded-xl p-4 shadow-sm text-left sm:text-center">
              <span className="font-bold text-accent">
                Personalized to You:
              </span>{" "}
              Adjust tone, key points, and recipient for a message that fits
              your style.
            </li>
            <li className="bg-card/80 border border-accent/20 rounded-xl p-4 shadow-sm text-left sm:text-center">
              <span className="font-bold text-accent">Multiple Formats:</span>{" "}
              Generate emails, LinkedIn messages, resume bullets, and more.
            </li>
            <li className="bg-card/80 border border-accent/20 rounded-xl p-4 shadow-sm text-left sm:text-center">
              <span className="font-bold text-accent">Edit & Download:</span>{" "}
              Instantly edit, copy, or download your message as PDF or Word.
            </li>
          </ul>
          <div className="w-full flex justify-center">
            <span className="inline-block bg-primary/10 text-primary px-6 py-3 rounded-full text-base font-semibold border border-accent/20 mt-4 shadow-md text-center">
              Start crafting your perfect message below!
            </span>
          </div>
        </div>
        <div className="w-full border-t border-accent/20 my-6"></div>
      </section>
      <TypeWiseAI />
    </div>
  );
}
