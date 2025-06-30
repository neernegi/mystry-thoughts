"use client";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ApiResponse } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { User } from "next-auth";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import * as z from "zod";
import InfoCards from "@/components/custom-ui/KeyInfo";
import AISlideShow from "@/components/custom-ui/AiSlideShow";
import InsightStats from "./InsightStats";
import InsightHistory from "./InsightHistory";
import DashboardInsights from "./DashboardInsights";
// import DashboardInsights from "./DashboardInsights";

function DashboardPage() {
  const keyTerms = [
    {
      icon: "🌐",
      title: "Server Components",
      description:
        "React components that render on the server for better performance",
    },
    {
      icon: "🔀",
      title: "Route Groups",
      description:
        "Next.js feature for organizing routes without affecting URL structure",
    },
    {
      icon: "📡",
      title: "Streaming",
      description: "Technique for progressively rendering UI components",
    },
    {
      icon: "⏳",
      title: "Suspense",
      description: "React feature for handling loading states",
    },
  ];
  // const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(false);

  const { data: session, status } = useSession();

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-300">
        Please login to view this page
      </div>
    );
  }

  const { username } = session.user as User;
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  const profileUrl = `${baseUrl}/u/${username}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile URL has been copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back, {username}!</p>
        </div>

        {/* Profile URL Section */}
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Your Profile Link</CardTitle>
            <CardDescription className="text-gray-400">
              Share this link to receive anonymous messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={profileUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
        <div>
          <InsightStats />
        </div>
        <div>
          <InsightHistory />
        </div>
       <div>
        <DashboardInsights />
       </div>
         
     
      </div>
    </div>
  );
}

export default DashboardPage;
