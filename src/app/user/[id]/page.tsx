import { notFound } from "next/navigation";
import TypeWiseAI from "@/components/career-craft-ai";
import GoToHistory from "./GoToHistory";

interface UserPageProps {
  params: { id: string };
}

export default function UserPage({ params }: UserPageProps) {
  const { id } = params;
  if (!id) return notFound();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen m-5">
      <TypeWiseAI />
      <GoToHistory userId={id} />
    </div>
  );
}
