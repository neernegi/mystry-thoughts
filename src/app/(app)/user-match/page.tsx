"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Users,
  Heart,
  Sparkles,
  User,
  Coffee,
  Plus,
  ArrowRight,
  Bell,
  Check,
  X,
  Send,
} from "lucide-react";
import { MatchFoundAnimation } from "@/components/custom-ui/MatchFoundAnimation";
import { MatchingAnimation } from "@/components/custom-ui/MatchingAnimation";
import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { socket } from "@/lib/socketClient";
import {
  ActiveChat,
  ExistingMatch,
  User as IUser,
  MatchFoundResponse,
  MessageRequest,
  MessageRequestResponse,
} from "@/types/interfaces";
import { formatTimeAgo } from "@/helpers/formatTime";

export default function MatchPage() {
  const [isMatching, setIsMatching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchedUser, setMatchedUser] = useState<{
    anonymousName: string;
    avatar: string;
    chatRoomId: string;
  } | null>(null);
  const [existingMatches, setExistingMatches] = useState<ExistingMatch[]>([]);
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const [isLoadingMatchRequest, setIsLoadingMatchRequest] = useState(true);
  const [matchRequestData, setMatchRequestData] = useState<MessageRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "requests" | "sent">("active");
  const router = useRouter();
  const { data: session, status } = useSession();

  // Fixed: Correct logic for received and sent requests
  const receivedRequests = useMemo(() => {
    if (!session?.user?._id) return [];
    return matchRequestData.filter(
      (request) => request.recipient._id === session.user._id && request.status === "pending"
    );
  }, [matchRequestData, session?.user?._id]);

  const sentRequests = useMemo(() => {
    if (!session?.user?._id) return [];
    return matchRequestData.filter(
      (request) => request.sender._id === session.user._id && request.status === "pending"
    );
  }, [matchRequestData, session?.user?._id]);

  useEffect(() => {
    if (status === "authenticated") {
      handleFetchMatchRequest();
    }
  }, [status]);

  const handleFetchMatchRequest = async () => {
    setIsLoadingMatchRequest(true);
    try {
      const response = await axios.get<MessageRequestResponse>("/api/messageRequest");

      console.log('Full API response:', response.data);

      if (response.data.success) {
        // Handle both response structures for compatibility
        let allRequests: MessageRequest[] = [];
        
        // Some responses may nest requests under a `data` object (new structure),
        // while others expose `requests` at the top level (old structure).
        const maybeNested = (response.data as any).data;
        if (maybeNested?.allRequests) {
          // New structure with separated requests
          allRequests = maybeNested.allRequests;
          console.log('Using new response structure');
        } else if (response.data.requests) {
          // Old structure
          allRequests = response.data.requests;
          console.log('Using old response structure');
        }

        console.log('All requests:', allRequests);
        console.log('Sent requests count:', allRequests.filter(req => 
          req.sender._id === session?.user?._id && req.status === "pending"
        ).length);
        console.log('Received requests count:', allRequests.filter(req => 
          req.recipient._id === session?.user?._id && req.status === "pending"
        ).length);

        setMatchRequestData(allRequests);

        // Filter accepted requests for active chats
        const acceptedRequests = allRequests.filter(
          (req) => req.status === "accepted"
        );

        // Fetch chat room details for each accepted request
        await fetchActiveChats(acceptedRequests);

        // Convert accepted requests to ExistingMatch format
        const activeMatches: ExistingMatch[] = acceptedRequests.map((req) => ({
          _id: req.relatedMatch,
          chatRoom: { _id: "temp" },
          user1: req.sender,
          user2: req.recipient,
          createdAt: req.createdAt,
          status: "accepted" as const,
        }));

        setExistingMatches(activeMatches);
      }
    } catch (error) {
      console.error("Error fetching match requests:", error);
      toast.error("Failed to fetch match requests");
    } finally {
      setIsLoadingMatchRequest(false);
    }
  };

  const fetchActiveChats = async (acceptedRequests: MessageRequest[]) => {
    const chats: ActiveChat[] = [];
    const currentUserId = session?.user?._id;

    for (const request of acceptedRequests) {
      try {
        const otherUser =
          request.sender._id === currentUserId
            ? request.recipient
            : request.sender;
        const participants = [currentUserId, otherUser._id].join(",");

        const chatResponse = await axios.get(`/api/chat/find`, {
          params: { participants },
        });

        if (chatResponse.data.success && chatResponse.data.chatRoom) {
          const chatRoom = chatResponse.data.chatRoom;

          const chatDetailResponse = await axios.get(
            `/api/chat/${chatRoom._id}`
          );

          let lastMessage = undefined;
          if (
            chatDetailResponse.data.success &&
            chatDetailResponse.data.messages.length > 0
          ) {
            const messages = chatDetailResponse.data.messages;
            const lastMsg = messages[messages.length - 1];
            lastMessage = {
              content: lastMsg.content,
              timestamp: lastMsg.timestamp,
              sender: lastMsg.sender._id,
            };
          }

          chats.push({
            _id: request._id,
            chatRoomId: chatRoom._id,
            otherUser: otherUser,
            lastMessage,
            createdAt: request.createdAt,
            status: request.status,
          });
        }
      } catch (error) {
        console.error("Error fetching chat details:", error);
        const otherUser =
          request.sender._id === currentUserId
            ? request.recipient
            : request.sender;
        chats.push({
          _id: request._id,
          chatRoomId: "",
          otherUser: otherUser,
          createdAt: request.createdAt,
          status: request.status,
        });
      }
    }

    setActiveChats(chats);
  };

  const handleAcceptMatch = async (requestId: string) => {
    try {
      const response = await axios.post(`/api/messageRequest/respond`, {
        requestId: requestId,
        accept: true,
      });

      if (response.data.success) {
        await handleFetchMatchRequest();
        toast.success("Match accepted!");
      }
    } catch (err) {
      console.error("Error accepting match:", err);
      setError("Failed to accept match. Please try again.");
      toast.error("Failed to accept match. Please try again.");
    }
  };

  const handleRejectMatch = async (requestId: string) => {
    try {
      const response = await axios.post(`/api/messageRequest/respond`, {
        requestId: requestId,
        accept: false,
      });

      if (response.data.success) {
        await handleFetchMatchRequest();
        toast.success("Match request declined");
      }
    } catch (err) {
      console.error("Error rejecting match:", err);
      setError("Failed to reject match. Please try again.");
      toast.error("Failed to reject match. Please try again.");
    }
  };

  const handleMatchClick = async () => {
    setIsMatching(true);
    setError(null);
    try {
      const response = await axios.post<MatchFoundResponse>("/api/user-match");

      if (response.data.success && response.data.data?.match) {
        const match = response.data.data.match;
        const otherUser = match.user2;

        setMatchedUser({
          anonymousName: otherUser?.anonymousName ?? "",
          avatar: otherUser?.image ?? "",
          chatRoomId: "",
        });
        setIsMatched(true);

        await handleFetchMatchRequest();
        toast.success(`Match request sent to ${otherUser.anonymousName}`);
      } else {
        const errorMsg = response.data.message || "Failed to find a match";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("Matching error:", err);
      const errorMsg =
        (err as any)?.response?.data?.message ||
        "An error occurred while matching";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsMatching(false);
    }
  };

  const handleContinueToChat = () => {
    setIsMatched(false);
    setMatchedUser(null);
  };

  const handleContinueExistingChat = async (chat: ActiveChat) => {
    try {
      if (chat.chatRoomId) {
        socket.connect();
        router.push(`/chat/${chat.chatRoomId}`);
      } else {
        const currentUserId = session?.user?._id;
        const participants = [currentUserId, chat.otherUser._id].join(",");

        const response = await axios.get(`/api/chat/find`, {
          params: { participants },
        });

        if (response.data.success && response.data.chatRoom) {
          socket.connect();
          router.push(`/chat/${response.data.chatRoom._id}`);
        } else {
          toast.error("Chat room not found");
        }
      }
    } catch (error) {
      console.error("Error opening chat:", error);
      toast.error("Failed to open chat");
    }
  };

  if (isMatching) return <MatchingAnimation />;
  if (isMatched && matchedUser) {
    return (
      <MatchFoundAnimation
        matchedUser={matchedUser}
        onContinue={handleContinueToChat}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Anonymous Chat
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-300">
              <span className="font-medium">{activeChats.length}</span> active
              {receivedRequests.length > 0 && (
                <span className="text-green-400 ml-2">
                  {receivedRequests.length} received
                </span>
              )}
              {sentRequests.length > 0 && (
                <span className="text-yellow-400 ml-2">
                  {sentRequests.length} sent
                </span>
              )}
            </div>
            <button
              onClick={handleMatchClick}
              disabled={isMatching}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>{isMatching ? "Matching..." : "Find New Match"}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="flex mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-6 py-3 font-medium flex items-center space-x-2 ${
              activeTab === "active"
                ? "text-purple-400 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Active Chats</span>
            {activeChats.length > 0 && (
              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                {activeChats.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-3 font-medium flex items-center space-x-2 ${
              activeTab === "requests"
                ? "text-purple-400 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>Match Requests</span>
            {receivedRequests.length > 0 && (
              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                {receivedRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("sent")}
            className={`px-6 py-3 font-medium flex items-center space-x-2 ${
              activeTab === "sent"
                ? "text-purple-400 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Send className="w-5 h-5" />
            <span>Sent Requests</span>
            {sentRequests.length > 0 && (
              <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                {sentRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Active Chats Tab */}
        {activeTab === "active" && (
          <>
            {!isLoadingMatchRequest && activeChats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeChats.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => handleContinueExistingChat(chat)}
                    className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-700 hover:border-purple-500/50 group relative"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative">
                        <img
                          src={chat.otherUser?.image}
                          alt={chat.otherUser?.anonymousName}
                          className="w-14 h-14 rounded-full ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all"
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">
                          {chat.otherUser?.anonymousName}
                        </h3>
                      </div>
                    </div>

                    {chat.lastMessage ? (
                      <div className="mb-4">
                        <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                          {chat.lastMessage.sender === session?.user?._id
                            ? "You: "
                            : ""}
                          {chat.lastMessage.content}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(chat.lastMessage.timestamp)}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm italic">
                          No messages yet - start the conversation!
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <span className="text-xs text-gray-500">
                        Matched {formatTimeAgo(chat.createdAt)}
                      </span>
                      <div className="flex items-center text-purple-400 text-sm font-medium group-hover:text-purple-300">
                        Continue Chat
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">
                  No active conversations
                </h3>
                <p className="text-gray-500">
                  {receivedRequests.length > 0 || sentRequests.length > 0
                    ? "You have pending match requests to review"
                    : "Find a new match to start chatting"}
                </p>
              </div>
            )}
          </>
        )}

        {/* Match Requests Tab */}
        {activeTab === "requests" && (
          <>
            {!isLoadingMatchRequest && receivedRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {receivedRequests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-green-500/10 animate-pulse rounded-xl pointer-events-none"></div>

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative">
                        <img
                          src={request.sender?.image}
                          alt={request.sender?.anonymousName}
                          className="w-14 h-14 rounded-full ring-2 ring-green-500/20"
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">
                          {request.sender?.anonymousName}
                        </h3>
                        <div className="flex items-center text-sm text-green-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Wants to chat with you
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                      {request.sender.anonymousName} sent you a match request.
                      Accept to start chatting.
                    </p>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleRejectMatch(request._id)}
                        className="flex-1 py-2 px-4 bg-gray-700 hover:bg-red-600 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                      <button
                        onClick={() => handleAcceptMatch(request._id)}
                        className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                      Received {formatTimeAgo(request.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">
                  No match requests
                </h3>
                <p className="text-gray-500">
                  When you receive match requests, they'll appear here
                </p>
              </div>
            )}
          </>
        )}

        {/* Sent Requests Tab */}
        {activeTab === "sent" && (
          <>
            {!isLoadingMatchRequest && sentRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sentRequests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative overflow-hidden"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative">
                        <img
                          src={request.recipient?.image}
                          alt={request.recipient?.anonymousName}
                          className="w-14 h-14 rounded-full ring-2 ring-yellow-500/20"
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-yellow-500 rounded-full border-2 border-gray-800"></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">
                          {request.recipient?.anonymousName}
                        </h3>
                        <div className="flex items-center text-sm text-yellow-400">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          Waiting for response
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                      You sent a match request to{" "}
                      {request.recipient.anonymousName}. Waiting for response.
                    </p>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleRejectMatch(request._id)}
                        className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center space-x-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel Request</span>
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                      Sent {formatTimeAgo(request.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Send className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-gray-300 mb-2">
                  No sent requests
                </h3>
                <p className="text-gray-500">
                  Requests you send will appear here
                </p>
              </div>
            )}
          </>
        )}

        {isLoadingMatchRequest && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}

        {activeChats.length === 0 &&
          receivedRequests.length === 0 &&
          sentRequests.length === 0 &&
          !isLoadingMatchRequest && (
            <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700 mt-12">
              <div className="max-w-2xl mx-auto text-center">
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
                    <Users className="w-12 h-12 text-purple-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Start Your Anonymous Journey
                  </h2>
                  <p className="text-gray-400 text-lg mb-8">
                    Connect with strangers worldwide. Share thoughts, stories,
                    and experiences without revealing your identity.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="p-6 bg-white rounded-xl">
                    <User className="w-10 h-10 mx-auto mb-3 text-purple-500" />
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Anonymous
                    </h3>
                    <p className="text-sm text-gray-600">
                      Your identity stays completely private
                    </p>
                  </div>
                  <div className="p-6 bg-white rounded-xl">
                    <Heart className="w-10 h-10 mx-auto mb-3 text-pink-500" />
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Safe & Secure
                    </h3>
                    <p className="text-sm text-gray-600">
                      Moderated platform with safety measures
                    </p>
                  </div>
                  <div className="p-6 bg-white rounded-xl">
                    <Coffee className="w-10 h-10 mx-auto mb-3 text-blue-500" />
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Genuine Connections
                    </h3>
                    <p className="text-sm text-gray-600">
                      Real conversations with real people
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleMatchClick}
                  disabled={isMatching}
                  className="group relative px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <Heart className="w-6 h-6 group-hover:animate-bounce" />
                    <span>
                      {isMatching ? "Finding Match..." : "Find My Match"}
                    </span>
                    <Sparkles className="w-6 h-6 group-hover:animate-spin" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}