import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import ChatRoom from "@/components/custom-ui/ChatRoom";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

interface ChatPageProps {
  params: Promise<{
    chatRoomId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getServerSession(authOptions);
  const { chatRoomId } = await params;
  
  if (!session || !session.user) {
    redirect("/sign-in");
  }
  
  return <ChatRoom chatRoomId={chatRoomId} />;
}