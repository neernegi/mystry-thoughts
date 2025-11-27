"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import axios from "axios";
import { ApiResponse } from "@/types/ApiResponse";
import { formatTimeAgo } from "@/helpers/formatTime";
import { toast } from "sonner"; // Assuming you use Sonner like in the previous file

// Updated Interface based on new Schema (No replies)
interface User {
  _id: string;
  username: string;
  anonymousName?: string;
  image?: string;
}

interface Confession {
  _id: string;
  user: User;
  confession: string;
  createdAt: string;
}

function DashboardPage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const { data: session, status } = useSession();

  const fetchConfessions = useCallback(async (refresh = false) => {
    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse<Confession[]>>("/api/confession");
      const confessionsData = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setConfessions(confessionsData);

      if (refresh) {
        toast.success("Refreshed");
      }
    } catch (error) {
      toast.error("Failed to fetch confessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchConfessions(false);
    }
  }, [session, fetchConfessions]);

  const handleDeleteConfession = async (confessionId: string) => {
    if(!confirm("Are you sure you want to delete this confession?")) return;
    
    setIsDeleting(confessionId);
    try {
      await axios.delete(`/api/confession/${confessionId}`);
      
      setConfessions((prev) => 
        prev.filter((confession) => confession._id !== confessionId)
      );
      
      toast.success("Confession deleted successfully");
    } catch (error) {
      toast.error("Failed to delete confession");
    } finally {
      setIsDeleting(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gradient-to-br from-gray-900 to-purple-900">
        <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="mb-6">Please login to view confession threads</p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Login
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
            Confession Wall
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
              <AvatarImage src={session.user.image || undefined} />
              <AvatarFallback className="bg-purple-600">
                {session.user.username?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto pb-20 pt-4 px-4 space-y-4">
        {isLoading && confessions.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-700 bg-gray-800/30">
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
              Be the first to confess something!
            </p>
          </div>
        ) : (
          confessions.map((confession) => (
            <div 
              key={confession._id} 
              className="bg-gray-800/40 border border-gray-700 rounded-xl p-5 hover:bg-gray-800/60 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10 border border-purple-500/50">
                  <AvatarImage src={confession.user?.image} />
                  <AvatarFallback className="bg-purple-600">
                    {confession.user?.username?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-200">
                        {confession.user?.anonymousName ||
                          confession.user?.username}
                      </span>
                      {!confession.user?.anonymousName && (
                        <Badge variant="secondary" className="text-[10px] h-5 bg-gray-700 text-gray-300">
                          @{confession.user?.username}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        • {formatTimeAgo(confession.createdAt)}
                      </span>
                    </div>
                    
                    {session.user._id === confession.user._id && (
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8 text-gray-500 hover:text-red-400 -mr-2"
                         onClick={() => handleDeleteConfession(confession._id)}
                         disabled={isDeleting === confession._id}
                       >
                         {isDeleting === confession._id ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <Trash2 className="h-4 w-4" />
                         )}
                       </Button>
                    )}
                  </div>
                  
                  <p className="mt-2 text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {confession.confession}
                  </p>
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