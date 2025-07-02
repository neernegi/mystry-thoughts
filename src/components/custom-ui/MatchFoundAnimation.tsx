"use client";

import { useEffect } from "react";

export const MatchFoundAnimation = ({
  matchedUser,
  onContinue,
}: {
  matchedUser: { anonymousName: string; avatar: string; chatRoomId: string };
  onContinue: () => void;
}) => {

  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-800 via-emerald-900 to-teal-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-40 h-40 mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center text-6xl animate-bounce">
              ✨
            </div>
          </div>
          <div className="absolute -inset-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-30 animate-ping"></div>
        </div>

        <div className="text-white mb-6">
          <h2 className="text-4xl font-bold mb-2 animate-pulse">
            Match Found! 🎉
          </h2>
          <p className="text-xl opacity-90">
            You matched with {matchedUser?.anonymousName || "Anonymous"}
          </p>
          <p className="mt-4 text-lg opacity-80">
            Redirecting to chat in 2 seconds...
          </p>
        </div>
      </div>
    </div>
  );
};