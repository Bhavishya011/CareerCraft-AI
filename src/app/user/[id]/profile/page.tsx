import UserHistory from "@/components/UserHistory";

export default function UserProfilePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-3xl font-bold mb-4">Your Message History</h1>
      <UserHistory />
    </div>
  );
}