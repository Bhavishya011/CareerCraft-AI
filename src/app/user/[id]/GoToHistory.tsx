"use client";
import Link from "next/link";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"; // Make sure you have @heroicons/react installed

export default function GoToHistory({ userId }: { userId: string }) {
  return (
    
    <Link
      href={`/user/${userId}/profile`}
      className="mt-8 px-6 py-3 bg-gradient-to-r font-semibold rounded-xl shadow-lg flex items-center gap-3 justify-center text-lg transition-transform hover:scale-105 hover:shadow-xl"
    >
      <ChatBubbleLeftRightIcon className="w-6 h-6" />
      See previous Messages
    </Link>
  );
}