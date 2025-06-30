"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  MessageCircle,
  Send,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";

interface User {
  _id: string;
  username: string;
  anonymousName?: string;
  image?: string;
}

interface Reply {
  _id: string;
  user: User;
  reply: string;
  replyOfreplies?: Reply[];
  createdAt: string;
  updatedAt: string;
}

interface Thought {
  _id: string;
  user: User;
  thought: string;
  image: string[];
  thoughtReplies: Reply[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function DashboardPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<Record<string, number>>({});
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const { data: session, status } = useSession();

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const fetchThoughts = useCallback(async (refresh = false) => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse<Thought[]>>("/api/thoughts");
      const thoughtsData = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setThoughts(thoughtsData);

      // Initialize visible replies count (show only first reply initially)
      const initialCounts: Record<string, number> = {};
      thoughtsData.forEach((thought) => {
        initialCounts[thought._id] = thought.thoughtReplies.length > 0 ? 1 : 0;
      });
      setVisibleRepliesCount(initialCounts);

      if (refresh) {
        toast.success("Showing latest thoughts");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to fetch thoughts");
      } else {
        toast.error("Failed to fetch thoughts");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchThoughts(false);
    }
  }, [session, fetchThoughts]);

  const toggleReplyInput = (thoughtId: string) => {
    setReplyingTo(replyingTo === thoughtId ? null : thoughtId);
  };

  const loadMoreReplies = (thoughtId: string) => {
    setVisibleRepliesCount((prev) => ({
      ...prev,
      [thoughtId]: Math.min(
        (prev[thoughtId] || 1) + 3,
        thoughts.find((t) => t._id === thoughtId)?.thoughtReplies.length || 0
      ),
    }));
  };

  const collapseReplies = (thoughtId: string) => {
    setVisibleRepliesCount((prev) => ({
      ...prev,
      [thoughtId]: 1, // Show only first reply when collapsed
    }));
  };

  const handleReplySubmit = async (thoughtId: string) => {
    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    setIsSubmittingReply(true);
    try {
      // Optimistically update UI
      const optimisticReply: Reply = {
        _id: `temp-${Date.now()}`,
        user: {
          _id: session?.user._id ?? "",
          username: session?.user.username ?? "",
          anonymousName: (session?.user as any)?.anonymousName,
          image: session?.user.image,
        },
        reply: replyContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setThoughts((prevThoughts) =>
        prevThoughts.map((t) => {
          if (t._id === thoughtId) {
            return {
              ...t,
              thoughtReplies: [...t.thoughtReplies, optimisticReply],
            };
          }
          return t;
        })
      );

      // Update visible replies count for this thought
      setVisibleRepliesCount((prev) => ({
        ...prev,
        [thoughtId]: (prev[thoughtId] || 0) + 1,
      }));

      // Make API call
      const response = await axios.post<ApiResponse<Reply>>(
        `/api/thoughts/${thoughtId}/replies`,
        { reply: replyContent }
      );

      // Replace optimistic reply with actual response
      setThoughts((prevThoughts) =>
        prevThoughts.map((t) => {
          if (t._id === thoughtId) {
            return {
              ...t,
              thoughtReplies: t.thoughtReplies.map((r) =>
                r._id === optimisticReply._id ? response.data.data : r
              ),
            };
          }
          return t;
        })
      );

      setReplyContent("");
      setReplyingTo(null);
      toast.success("Reply posted successfully");
    } catch (error) {
      // Rollback optimistic update
      setThoughts((prevThoughts) =>
        prevThoughts.map((t) => {
          if (t._id === thoughtId) {
            return {
              ...t,
              thoughtReplies: t.thoughtReplies.filter(
                (r) => r._id !== `temp-${Date.now()}`
              ),
            };
          }
          return t;
        })
      );

      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to post reply");
      } else {
        toast.error("Failed to post reply");
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (thoughtId: string, replyId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    setIsDeleting((prev) => ({ ...prev, [replyId]: true }));
    try {
      // Optimistically remove the reply from UI
      setThoughts((prevThoughts) =>
        prevThoughts.map((t) => {
          if (t._id === thoughtId) {
            return {
              ...t,
              thoughtReplies: t.thoughtReplies.filter((r) => r._id !== replyId),
            };
          }
          return t;
        })
      );

      // Update visible replies count if needed
      setVisibleRepliesCount((prev) => {
        const currentCount = prev[thoughtId] || 0;
        return {
          ...prev,
          [thoughtId]: Math.max(currentCount - 1, 0),
        };
      });

      // Make API call
      await axios.delete(`/api/thoughts/${thoughtId}/replies`, {
        data: { thoughtReplyId: replyId },
      });

      toast.success("Reply deleted successfully");
    } catch (error) {
      // Revert optimistic update if deletion fails
      setThoughts((prevThoughts) => {
        const originalThought = thoughts.find((t) => t._id === thoughtId);
        if (originalThought) {
          return prevThoughts.map((t) =>
            t._id === thoughtId ? originalThought : t
          );
        }
        return prevThoughts;
      });

      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to delete reply");
      } else {
        toast.error("Failed to delete reply");
      }
    } finally {
      setIsDeleting((prev) => ({ ...prev, [replyId]: false }));
    }
  };

  const getUniqueRepliers = (replies: Reply[], currentCount: number): User[] => {
    const uniqueUsers = new Map<string, User>();
    replies.slice(0, currentCount).forEach((reply) => {
      if (reply.user && !uniqueUsers.has(reply.user._id)) {
        uniqueUsers.set(reply.user._id, reply.user);
      }
    });
    return Array.from(uniqueUsers.values()).slice(0, 3);
  };

  const isReplyOwner = (reply: Reply) => {
    return reply.user._id === session?.user?._id;
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gradient-to-br from-gray-900 to-purple-900">
        <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="mb-6">Please login to view your thoughts</p>
          <Button
            onClick={() => (window.location.href = "/login")}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Thought Threads
          </h1>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchThoughts(true)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <RefreshCw
                className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image || undefined} />
              <AvatarFallback className="bg-purple-600">
                {session.user.username?.charAt(0)?.toUpperCase() ?? ""}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto pb-20">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-700">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex space-x-4 pt-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : thoughts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-700">
              <MessageCircle className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-300">
              No thoughts yet
            </h3>
            <p className="text-gray-500 mt-1">
              Share your thoughts with the community
            </p>
          </div>
        ) : (
          thoughts.map((thought) => (
            <div
              key={thought._id}
              className="p-4 border-b border-gray-700 relative group"
            >
              {/* Vertical separator line */}
              <div className="absolute left-4 top-14 bottom-0 w-0.5 bg-gray-700"></div>

              <div className="flex items-start space-x-3 pl-2">
                <Avatar className="h-10 w-10 border-2 border-purple-500 hover:border-purple-300 transition-all">
                  <AvatarImage src={thought.user?.image} />
                  <AvatarFallback className="bg-purple-600 font-medium">
                    {thought.user?.username?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-100 hover:text-purple-300 cursor-pointer">
                        {thought.user?.anonymousName || thought.user?.username}
                      </span>
                      {!thought.user?.anonymousName && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-700 hover:bg-gray-600"
                        >
                          @{thought.user?.username}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(thought.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-1 text-gray-300">{thought.thought}</p>

                  {/* Display images if they exist */}
                  {thought.image?.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {thought.image.map((imgUrl, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden">
                          <img
                            src={imgUrl}
                            alt={`Thought image ${idx}`}
                            className="w-full h-auto max-h-64 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply section - always show reply button */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {thought.thoughtReplies.length > 0 && (
                        <>
                          <div className="flex items-center -space-x-1">
                            {getUniqueRepliers(
                              thought.thoughtReplies,
                              visibleRepliesCount[thought._id] || 1
                            ).map((user, i) => (
                              <Avatar
                                key={i}
                                className="h-5 w-5 border-2 border-gray-800 hover:border-purple-400 transition-all"
                              >
                                <AvatarImage src={user?.image} />
                                <AvatarFallback className="bg-purple-500 text-xs font-medium">
                                  {user?.username?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span
                            className="text-xs text-gray-400 hover:text-purple-400 cursor-pointer transition-colors"
                            onClick={() => {
                              if (visibleRepliesCount[thought._id] > 1) {
                                collapseReplies(thought._id);
                              } else {
                                loadMoreReplies(thought._id);
                              }
                            }}
                          >
                            {thought.thoughtReplies.length} replies •{" "}
                            {visibleRepliesCount[thought._id] > 1
                              ? "Hide replies"
                              : "Show replies"}
                          </span>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-purple-400 hover:bg-transparent group-hover:opacity-100 transition-all"
                      onClick={() => toggleReplyInput(thought._id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Reply</span>
                    </Button>
                  </div>

                  {/* Reply input */}
                  {replyingTo === thought._id && (
                    <div className="mt-3 flex space-x-2">
                      <Avatar className="h-8 w-8 border-2 border-purple-500">
                        <AvatarImage src={session.user.image || undefined} />
                        <AvatarFallback className="bg-purple-600 font-medium">
                          {session.user.username?.charAt(0)?.toUpperCase() ?? ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex items-center space-x-2">
                        <Textarea
                          placeholder="Write your reply..."
                          className="flex-1 bg-gray-800 border-gray-700 focus:border-purple-500 resize-none text-gray-300 placeholder-gray-500"
                          rows={2}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <Button
                          size="icon"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleReplySubmit(thought._id)}
                          disabled={isSubmittingReply || !replyContent.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies list */}
                  {thought.thoughtReplies.length > 0 &&
                    visibleRepliesCount[thought._id] > 0 && (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-700">
                        {thought.thoughtReplies
                          .slice(0, visibleRepliesCount[thought._id])
                          .map((reply, i) => (
                            <div key={i} className="flex space-x-2 pt-2 group">
                              <Avatar className="h-6 w-6 border-2 border-gray-800 hover:border-purple-400 transition-all">
                                <AvatarImage src={reply?.user?.image} />
                                <AvatarFallback className="bg-purple-500 text-xs font-medium">
                                  {reply?.user?.username
                                    ?.charAt(0)
                                    ?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 relative">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-100 hover:text-purple-300 cursor-pointer">
                                    {reply?.user?.anonymousName ||
                                      reply?.user?.username}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-300">
                                  {reply?.reply}
                                </p>
                                {(isReplyOwner(reply) || thought.user._id === session.user._id) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-0 right-0 text-gray-500 hover:text-red-400 hover:bg-transparent"
                                    onClick={() => handleDeleteReply(thought._id, reply._id)}
                                    disabled={isDeleting[reply._id]}
                                  >
                                    {isDeleting[reply._id] ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}

                        {/* Load more/collapse buttons */}
                        {thought.thoughtReplies.length > 1 && (
                          <div className="flex justify-center pt-2">
                            {visibleRepliesCount[thought._id] <
                            thought.thoughtReplies.length ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-gray-400 hover:text-purple-400"
                                onClick={() => loadMoreReplies(thought._id)}
                              >
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show more replies (
                                {thought.thoughtReplies.length -
                                  visibleRepliesCount[thought._id]}{" "}
                                more)
                              </Button>
                            ) : (
                              visibleRepliesCount[thought._id] > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-gray-400 hover:text-purple-400"
                                  onClick={() => collapseReplies(thought._id)}
                                >
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Hide replies
                                </Button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default DashboardPage;