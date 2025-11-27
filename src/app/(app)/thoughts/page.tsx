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
import { ApiResponse } from "@/types/ApiResponse";
import { Thought, TReply, User } from "@/types/interfaces";
import { formatTimeAgo } from "@/helpers/formatTime";

function DashboardPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  // Store how many replies are visible per thought
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<Record<string, number>>({});
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const { data: session, status } = useSession();

  const fetchThoughts = useCallback(async (refresh = false) => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse<Thought[]>>("/api/thoughts");
      const thoughtsData = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setThoughts(thoughtsData);

      // Initialize visible replies count (show 1 initially if replies exist)
      const initialCounts: Record<string, number> = {};
      thoughtsData.forEach((thought) => {
        initialCounts[thought._id] = thought.thoughtReplies.length > 0 ? 1 : 0;
      });
      setVisibleRepliesCount(initialCounts);

      if (refresh) {
        toast.success("Refreshed");
      }
    } catch (error) {
      toast.error("Failed to fetch thoughts");
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
    setReplyContent("");
  };

  const loadMoreReplies = (thoughtId: string) => {
    setVisibleRepliesCount((prev) => ({
      ...prev,
      [thoughtId]: Math.min(
        (prev[thoughtId] || 0) + 3,
        thoughts.find((t) => t._id === thoughtId)?.thoughtReplies.length || 0
      ),
    }));
  };

  const collapseReplies = (thoughtId: string) => {
    setVisibleRepliesCount((prev) => ({
      ...prev,
      [thoughtId]: 1,
    }));
  };

  const handleReplySubmit = async (thoughtId: string) => {
    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }

    setIsSubmittingReply(true);
    const tempId = `temp-${Date.now()}`;

    // Optimistic Update
    const optimisticReply: TReply = {
      _id: tempId,
      user: {
        _id: session?.user._id ?? "",
        username: session?.user.username ?? "",
        anonymousName: (session?.user as any)?.anonymousName,
        image: session?.user.image,
      },
      reply: replyContent, // This is the text that was missing before
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Update UI immediately
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

      // Show the new reply
      setVisibleRepliesCount((prev) => ({
        ...prev,
        [thoughtId]: (thoughts.find(t => t._id === thoughtId)?.thoughtReplies.length || 0) + 1
      }));

      // API Call
      const response = await axios.post<ApiResponse<TReply>>(
        `/api/thoughts/${thoughtId}/replies`,
        { reply: replyContent }
      );

      // Replace Optimistic Data with Real Data
      setThoughts((prevThoughts) =>
        prevThoughts.map((t) => {
          if (t._id === thoughtId) {
            return {
              ...t,
              thoughtReplies: t.thoughtReplies.map((r) =>
                r._id === tempId ? response.data.data : r
              ),
            };
          }
          return t;
        })
      );

      setReplyContent("");
      setReplyingTo(null);
      toast.success("Reply posted");
    } catch (error) {
      // Revert on error
      setThoughts((prevThoughts) =>
        prevThoughts.map((t) => {
          if (t._id === thoughtId) {
            return {
              ...t,
              thoughtReplies: t.thoughtReplies.filter((r) => r._id !== tempId),
            };
          }
          return t;
        })
      );
      toast.error("Failed to post reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (thoughtId: string, replyId: string) => {
    if (!confirm("Delete this reply?")) return;

    setIsDeleting((prev) => ({ ...prev, [replyId]: true }));
    try {
      await axios.delete(`/api/thoughts/${thoughtId}/replies`, {
        data: { thoughtReplyId: replyId },
      });

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
      toast.success("Reply deleted");
    } catch (error) {
      toast.error("Failed to delete reply");
    } finally {
      setIsDeleting((prev) => ({ ...prev, [replyId]: false }));
    }
  };

  // Helper to get unique avatars for preview
  const getPreviewAvatars = (replies: TReply[]) => {
    const uniqueUsers = new Map();
    replies.forEach(r => {
      if(r.user && !uniqueUsers.has(r.user._id)) uniqueUsers.set(r.user._id, r.user);
    });
    return Array.from(uniqueUsers.values()).slice(0, 3);
  };

  const isReplyOwner = (reply: TReply) => reply.user._id === session?.user?._id;

  if (status === "loading") return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white pb-20">
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Thought Threads
          </h1>
          <Button variant="ghost" size="icon" onClick={() => fetchThoughts(true)}>
             <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="max-w-xl mx-auto mt-4 space-y-4">
        {thoughts.map((thought) => (
          <div key={thought._id} className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            
            {/* Thought Header */}
            <div className="flex items-start space-x-3">
              <Avatar className="h-10 w-10 border border-purple-500/50">
                <AvatarImage src={thought.user?.image} />
                <AvatarFallback>{thought.user?.username?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                   <div>
                      <span className="font-semibold text-gray-200">
                        {thought.user?.anonymousName || thought.user?.username}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTimeAgo(thought.createdAt)}
                      </span>
                   </div>
                </div>
                
                <p className="mt-2 text-gray-300 whitespace-pre-wrap">{thought.thought}</p>
                
                {/* Images */}
                {thought.image?.length > 0 && (
                   <div className="mt-3 grid gap-2">
                     {thought.image.map((img, idx) => (
                        <img key={idx} src={img} alt="Thought content" className="rounded-lg max-h-96 w-full object-cover bg-gray-900" />
                     ))}
                   </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-700/50">
               <div className="flex items-center space-x-4">
                  {/* Reply Toggle */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-purple-400 p-0 h-auto"
                    onClick={() => toggleReplyInput(thought._id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-1.5" />
                    {thought.thoughtReplies.length}
                  </Button>
                  
                  {/* Avatar Stack Preview */}
                  {thought.thoughtReplies.length > 0 && (
                    <div className="flex -space-x-2">
                      {getPreviewAvatars(thought.thoughtReplies).map((u, i) => (
                         <Avatar key={i} className="h-5 w-5 border-2 border-gray-800">
                           <AvatarImage src={u.image} />
                           <AvatarFallback className="text-[10px]">{u.username?.charAt(0)}</AvatarFallback>
                         </Avatar>
                      ))}
                    </div>
                  )}
               </div>
            </div>

            {/* Reply Input Area */}
            {replyingTo === thought._id && (
              <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user.image} />
                    <AvatarFallback>{session?.user.username?.charAt(0)}</AvatarFallback>
                 </Avatar>
                 <div className="flex-1 flex gap-2">
                   <Textarea 
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Post your reply..."
                      className="min-h-[40px] h-[40px] py-2 bg-gray-900 border-gray-600 focus:border-purple-500"
                   />
                   <Button 
                      size="icon" 
                      onClick={() => handleReplySubmit(thought._id)}
                      disabled={isSubmittingReply}
                      className="bg-purple-600 hover:bg-purple-700 h-10 w-10 shrink-0"
                   >
                      <Send className="h-4 w-4" />
                   </Button>
                 </div>
              </div>
            )}

            {/* Replies List - FLAT STRUCTURE */}
            {thought.thoughtReplies.length > 0 && visibleRepliesCount[thought._id] > 0 && (
              <div className="mt-4 space-y-4 pl-2">
                {thought.thoughtReplies.slice(0, visibleRepliesCount[thought._id]).map((reply) => (
                  <div key={reply._id} className="flex gap-3 group">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={reply.user?.image} />
                      <AvatarFallback className="text-xs">{reply.user?.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 bg-gray-900/40 rounded-lg p-3 relative">
                       <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-gray-200">
                             {reply.user?.anonymousName || reply.user?.username}
                          </span>
                          <span className="text-xs text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                       </div>
                       
                       {/* REPLY CONTENT - Correctly rendered now */}
                       <p className="text-sm text-gray-300 break-words">{reply.reply}</p>

                       {/* Delete Button */}
                       {(isReplyOwner(reply) || thought.user._id === session?.user._id) && (
                         <button 
                           onClick={() => handleDeleteReply(thought._id, reply._id)}
                           disabled={isDeleting[reply._id]}
                           className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400"
                         >
                           {isDeleting[reply._id] ? <RefreshCw className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3"/>}
                         </button>
                       )}
                    </div>
                  </div>
                ))}
                
                {/* View More / Less Buttons */}
                {thought.thoughtReplies.length > visibleRepliesCount[thought._id] ? (
                   <button 
                     onClick={() => loadMoreReplies(thought._id)}
                     className="text-xs text-blue-400 hover:underline flex items-center ml-11"
                   >
                     <ChevronDown className="h-3 w-3 mr-1" />
                     Show more replies
                   </button>
                ) : thought.thoughtReplies.length > 1 && (
                   <button 
                     onClick={() => collapseReplies(thought._id)}
                     className="text-xs text-gray-500 hover:underline flex items-center ml-11"
                   >
                     <ChevronUp className="h-3 w-3 mr-1" />
                     Hide replies
                   </button>
                )}
              </div>
            )}

          </div>
        ))}
      </main>
    </div>
  );
}

export default DashboardPage;