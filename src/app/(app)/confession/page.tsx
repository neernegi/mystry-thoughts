"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  MessageCircle,
  Send,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Confession, Reply, User } from "@/types/interfaces";
import { ApiResponse } from "@/types/ApiResponse";
import { formatTimeAgo } from "@/helpers/formatTime";





function DashboardPage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<
    Record<string, boolean>
  >({});
  const [visibleReplies, setVisibleReplies] = useState<Record<string, number>>(
    {}
  );
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const { data: session, status } = useSession();

  // Current user data
  const currentUser = {
    _id: session?.user?._id || "current-user",
    username: session?.user?.name || "user",
    image: session?.user?.image || null,
  };

  // Helper function to format time


  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    const toastEl = document.createElement("div");
    toastEl.textContent = message;
    toastEl.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
      type === "success" ? "bg-green-600" : "bg-red-600"
    }`;
    document.body.appendChild(toastEl);
    setTimeout(() => document.body.removeChild(toastEl), 3000);
  };

  const fetchConfessions = useCallback(async (refresh = false) => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse<Confession[]>>(
        "/api/confession"
      );
      const confessionsData = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setConfessions(confessionsData);

      // Initialize visible replies count for each confession
      const initialVisibleReplies: Record<string, number> = {};
      confessionsData.forEach((confession) => {
        initialVisibleReplies[confession._id] = 3;
      });
      setVisibleReplies(initialVisibleReplies);

      if (refresh) {
        showToast("Showing latest confessions");
      }
    } catch (error) {
      showToast("Failed to fetch confessions", "error");
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfessions(false);
    }
  }, [isAuthenticated, fetchConfessions]);

  const toggleReplies = (confessionId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [confessionId]: !prev[confessionId],
    }));
  };

  const showMoreReplies = (confessionId: string) => {
    setVisibleReplies((prev) => ({
      ...prev,
      [confessionId]: (prev[confessionId] || 3) + 3,
    }));
  };

  const hideReplies = (confessionId: string) => {
    setVisibleReplies((prev) => ({
      ...prev,
      [confessionId]: 3,
    }));
    setExpandedReplies((prev) => ({
      ...prev,
      [confessionId]: false,
    }));
  };

  const toggleReplyInput = (confessionId: string) => {
    setReplyingTo((prev) => (prev === confessionId ? null : confessionId));
    setReplyContent("");
  };

  const handleReplySubmit = async (confessionId: string) => {
    if (!replyContent.trim()) {
      showToast("Reply cannot be empty", "error");
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await axios.post<ApiResponse<Reply>>(
        `/api/confession/${confessionId}/replies`,
        {
          replyConfession: replyContent,
        }
      );

      const newReply = response.data.data || {
        _id: Date.now().toString(),
        replyConfession: replyContent,
        user: currentUser,
        createdAt: new Date(),
      };

      setConfessions((prev) =>
        prev.map((confession) => {
          if (confession._id === confessionId) {
            return {
              ...confession,
              repliesToConfession: [
                ...confession.repliesToConfession,
                newReply,
              ],
            };
          }
          return confession;
        })
      );

      setReplyContent("");
      setReplyingTo(null);
      showToast("Reply posted successfully");
    } catch (error) {
      console.error("Reply error:", error);
      showToast("Failed to post reply", "error");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (confessionId: string, replyId: string) => {
    try {
      await axios.delete(`/api/confession/${confessionId}/replies/${replyId}`);

      setConfessions((prev) =>
        prev.map((confession) => {
          if (confession._id === confessionId) {
            return {
              ...confession,
              repliesToConfession: confession.repliesToConfession.filter(
                (reply) => reply._id !== replyId
              ),
            };
          }
          return confession;
        })
      );

      showToast("Reply deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Failed to delete reply", "error");
    }
  };

  const getUniqueRepliers = (replies: Reply[]): User[] => {
    const uniqueUsers = new Map<string, User>();
    replies.forEach((reply) => {
      if (reply.user && !uniqueUsers.has(reply.user._id)) {
        uniqueUsers.set(reply.user._id, reply.user);
      }
    });
    return Array.from(uniqueUsers.values()).slice(0, 3);
  };

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gradient-to-br from-gray-900 to-purple-900">
        <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="mb-6">Please login to view your confession threads</p>
          <Button
            onClick={() => setIsAuthenticated(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Login (Demo)
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
            Confession Threads
          </h1>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchConfessions(true)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <RefreshCw
                className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser?.image ?? undefined} />
              <AvatarFallback className="bg-purple-600">
                {currentUser.username?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto pb-20">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-700">
              <div className="flex space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          ))
        ) : confessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-700">
              <MessageCircle className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-300">
              No confessions yet
            </h3>
            <p className="text-gray-500 mt-1">
              Share your profile link to receive confessions
            </p>
          </div>
        ) : (
          confessions.map((confession) => (
            <div key={confession._id}>
              <div className="px-4 py-6 relative">
                {/* Main confession */}
                <div className="flex items-start space-x-3 relative">
                  <div className="flex flex-col items-center relative">
                    <Avatar className="h-10 w-10 border border-purple-500 relative z-10 bg-gray-900">
                      <AvatarImage src={confession?.user?.image} />
                      <AvatarFallback className="bg-purple-600">
                        {confession.user?.username?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {confession.user?.anonymousName ||
                            confession.user?.username}
                        </span>
                        {!confession.user?.anonymousName && (
                          <Badge variant="secondary" className="text-xs">
                            @{confession.user?.username}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(confession.createdAt)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 h-8 w-8"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-gray-300 leading-relaxed">
                      {confession.confession}
                    </p>

                    {/* Reply section */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        {/* Unique replier avatars */}
                        {confession.repliesToConfession.length > 0 && (
                          <div className="flex items-center space-x-1">
                            {getUniqueRepliers(
                              confession.repliesToConfession
                            ).map((user) => (
                              <Avatar
                                key={user?._id}
                                className="h-6 w-6 border border-purple-400 -ml-1 first:ml-0"
                              >
                                <AvatarImage src={user?.image} />
                                <AvatarFallback className="bg-purple-500 text-xs">
                                  {user.username?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            <span className="text-sm text-gray-400 ml-2">
                              {confession.repliesToConfession.length}{" "}
                              {confession.repliesToConfession.length === 1
                                ? "reply"
                                : "replies"}
                            </span>
                          </div>
                        )}
                        {confession.repliesToConfession.length === 0 && (
                          <span className="text-sm text-gray-500">
                            No replies yet
                          </span>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleReplyInput(confession._id)}
                        className={`h-8 w-8 transition-colors ${
                          replyingTo === confession._id
                            ? "text-purple-400 bg-purple-900/20"
                            : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                        }`}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Replies Container */}
                <div className="relative">
                  {/* Replies */}
                  {confession.repliesToConfession.length > 0 && (
                    <div className="mt-4 space-y-4 relative">
                      {confession.repliesToConfession
                        .slice(
                          0,
                          expandedReplies[confession._id]
                            ? visibleReplies[confession._id]
                            : 1
                        )
                        .map((reply) => (
                          <div
                            key={reply._id}
                            className="flex items-start space-x-3 relative ml-7"
                          >
                            <Avatar className="h-8 w-8 border border-purple-400 relative z-10 bg-gray-900">
                              <AvatarImage src={reply?.user?.image} />
                              <AvatarFallback className="bg-purple-500 text-xs">
                                {reply?.user?.username
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                  {reply?.user?.anonymousName ||
                                    reply?.user?.username}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                                {reply?.replyConfession}
                              </p>
                            </div>
                            {reply.user._id === currentUser._id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-500 hover:text-red-500"
                                onClick={() =>
                                  handleDeleteReply(confession._id, reply._id)
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}

                      {/* Show more/less replies buttons */}
                      {confession.repliesToConfession.length > 1 && (
                        <div className="flex items-center space-x-4 ml-7 relative">
                          {!expandedReplies[confession._id] ? (
                            <button
                              onClick={() => toggleReplies(confession._id)}
                              className="text-sm text-gray-400 hover:text-gray-300 font-medium transition-colors"
                            >
                              View {confession.repliesToConfession.length - 1}{" "}
                              more{" "}
                              {confession.repliesToConfession.length - 1 === 1
                                ? "reply"
                                : "replies"}
                            </button>
                          ) : (
                            <div className="flex space-x-4">
                              {visibleReplies[confession._id] <
                                confession.repliesToConfession.length && (
                                <button
                                  onClick={() =>
                                    showMoreReplies(confession._id)
                                  }
                                  className="text-sm text-gray-400 hover:text-gray-300 font-medium transition-colors"
                                >
                                  View more replies
                                </button>
                              )}
                              <button
                                onClick={() => hideReplies(confession._id)}
                                className="text-sm text-gray-400 hover:text-gray-300 font-medium transition-colors"
                              >
                                Hide replies
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply input */}
                  {replyingTo === confession._id && (
                    <div className="flex items-start space-x-3 mt-4 pt-4 border-t border-gray-700 animate-in slide-in-from-top-2 duration-200 relative ml-7">
                      <Avatar className="h-8 w-8 relative z-10 bg-gray-900">
                        <AvatarImage src={currentUser.image ?? undefined} />
                        <AvatarFallback className="bg-purple-600">
                          {currentUser.username?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <Textarea
                          placeholder="Write a thoughtful reply..."
                          className="bg-gray-800/50 border-gray-700 focus:border-purple-500 resize-none transition-colors"
                          rows={3}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(null)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 transition-colors"
                            onClick={() => handleReplySubmit(confession._id)}
                            disabled={isSubmittingReply || !replyContent.trim()}
                          >
                            {isSubmittingReply ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                <span>Posting...</span>
                              </div>
                            ) : (
                              "Reply"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Horizontal separator between confessions */}
              <Separator className="bg-gray-700/50" />
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
