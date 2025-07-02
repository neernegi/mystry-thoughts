import { Thought } from "@/types/interfaces";
import { motion } from "framer-motion";
import { MessageCircle, Trash2, Image as ImageIcon } from "lucide-react";

export const ThoughtCard = ({
  thought,
  index,
  isOwner,
  handleDelete,
  formatDate,
}: {
  thought: Thought;
  index: number;
  isOwner: boolean;
  handleDelete: Function;
  formatDate: Function;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center space-x-3">
        {thought.user.image ? (
          <img
            src={thought.user.image}
            alt={thought.user.username}
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${thought.user.username}&background=7e22ce&color=fff&size=80&bold=true`;
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {thought.user.username?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold">@{thought.user.username}</p>
          <p className="text-gray-400 text-sm">
            {formatDate(thought.createdAt)}
          </p>
        </div>
      </div>
      {isOwner && (
        <button
          onClick={() => handleDelete(thought._id, "thought")}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>

    {thought.thought && (
      <p className="mb-4 leading-relaxed">{thought.thought}</p>
    )}

    {thought.image?.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {thought.image.map((image, idx) => (
          <div key={idx} className="relative group">
            <img
              src={image}
              alt={`Thought image ${idx}`}
              className="w-full h-auto max-h-64 object-cover rounded-lg border border-gray-600"
            />
          </div>
        ))}
      </div>
    )}

    <div className="flex items-center space-x-4 text-gray-400">
      <button className="flex items-center space-x-2 hover:text-purple-400 transition-colors">
        <MessageCircle className="w-5 h-5" />
        <span>{thought.thoughtReplies.length} Replies</span>
      </button>
    </div>
  </motion.div>
);
