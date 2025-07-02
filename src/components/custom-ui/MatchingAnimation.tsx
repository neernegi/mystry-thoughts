"use client";


export const MatchingAnimation = ({
  onMatchFound,
}: {
  onMatchFound?: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/10 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
            }}
          />
        ))}
      </div>

      <div className="text-center z-10 px-6">
        <div className="space-y-6">
          <div className="flex justify-center space-x-4">
            <div
              className="w-4 h-4 bg-pink-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-4 h-4 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-4 h-4 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <div className="text-white text-xl font-semibold animate-pulse">
            🔍 Searching for your perfect match...
          </div>
          <div className="text-purple-200">This might take a moment ✨</div>
        </div>
      </div>
    </div>
  );
};
