import { Confession } from "@/types/interfaces";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Edit3, 
  Trash2, 
  Plus,
  Eye,
  EyeOff,
  Send,
 
  Mail,
  Users,
  Image as ImageIcon,
  X
} from 'lucide-react';



export const ConfessionCard = ({ confession, index, isOwner, handleDelete, formatDate }: 
  { confession: Confession, index: number, isOwner: boolean, handleDelete: Function, formatDate: Function }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-pink-500/50 transition-all duration-300"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center space-x-3">
        {confession.user.image ? (
          <img
            src={confession.user.image}
            alt={confession.user.username}
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${confession.user.username}&background=ec4899&color=fff&size=80&bold=true`;
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {confession.user.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold">@{confession.user.username}</p>
          <p className="text-gray-400 text-sm">{formatDate(confession.createdAt)}</p>
        </div>
      </div>
      {isOwner && (
        <button
          onClick={() => handleDelete(confession._id, 'confession')}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
    
    <p className="mb-4 leading-relaxed">{confession.confession}</p>
    
    <div className="flex items-center space-x-4 text-gray-400">
     
      <button className="flex items-center space-x-2 hover:text-pink-400 transition-colors">
        <MessageCircle className="w-5 h-5" />
        <span>{confession.repliesToConfession.length} Replies</span>
      </button>
    </div>
  </motion.div>
);