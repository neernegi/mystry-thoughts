'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { toast } from "sonner";
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
  User,
  Mail,
  Users,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProfileHeader from '@/components/custom-ui/ProfileHeader';



interface User {
  _id: string;
  username: string;
  email: string;
  image: string;
  gender: string;
  anonymousName: string;
  createdAt: string;
}

interface Reply {
  _id: string;
  user: {
    _id: string;
    username: string;
    anonymousName: string;
    image: string;
  };
  reply?: string;
  replyConfession?: string;
  createdAt: string;
  replyOfreplies?: Reply[];
}

interface Thought {
  _id: string;
  user: User;
  thought: string;
  image: string[];
  thoughtReplies: Reply[];
  createdAt: string;
}

interface Confession {
  _id: string;
  user: User;
  confession: string;
  repliesToConfession: Reply[];
  createdAt: string;
}

interface ProfileData {
  user: User;
  thoughts: Thought[];
  confessions: Confession[];
  isOwner: boolean;
}


export default function ProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const identifier = params?.identifier as string;
  const thoughtFileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'thoughts' | 'confessions'>('thoughts');
  const [showCreateThought, setShowCreateThought] = useState(false);
  const [showCreateConfession, setShowCreateConfession] = useState(false);
  const [thoughtContent, setThoughtContent] = useState('');
  const [confessionContent, setConfessionContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [identifier]);

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${identifier}`);
      const data = await response.json();
      if (data.success) {
        setProfileData(data.data);
      } else {
        setProfileData(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => 
        file.type.match('image.*') && file.size <= 5 * 1024 * 1024
      );
      
      setImages(prev => [...prev, ...validFiles]);
      
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...previewUrls];
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImages(newImages);
    setPreviewUrls(newPreviews);
    URL.revokeObjectURL(previewUrls[index]);
  };

  const handleSaveAvatar = async (avatarData: any) => {
    try {
      const response = await fetch('/api/update-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profileData?.user._id,
          avatarOptions: avatarData,
          avatarUrl: `https://avataaars.io/?${new URLSearchParams(avatarData).toString()}`
        }),
      });

      if (response.ok) {
        const { imageUrl } = await response.json();
        setProfileData(prev => ({
          ...prev!,
          user: {
            ...prev!.user,
            image: imageUrl
          }
        }));
        setShowAvatarModal(false);
        toast.success('Avatar updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
      toast.error('Failed to update avatar');
    }
  };

  const handleCreateThought = async () => {
    if ((!thoughtContent.trim() && images.length === 0) || !profileData?.isOwner) return;
    
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('thought', thoughtContent);
      images.forEach(image => formData.append('image', image));

      const response = await fetch('/api/thoughts', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setThoughtContent('');
        setImages([]);
        setPreviewUrls([]);
        setShowCreateThought(false);
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error creating thought:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateConfession = async () => {
    if (!confessionContent.trim() || !profileData?.isOwner) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/confession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confession: confessionContent })
      });

      if (response.ok) {
        setConfessionContent('');
        setShowCreateConfession(false);
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error creating confession:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, type: 'thought' | 'confession') => {
    if (!profileData?.isOwner || !confirm('Are you sure you want to delete this?')) return;

    try {
      const endpoint = type === 'thought' ? `/api/thoughts/${id}` : `/api/confession/${id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (response.ok) {
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profileData) {
    return <NotFoundPage />;
  }

  const { user, thoughts, confessions, isOwner } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-3xl"></div>
        
        <div className="relative max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Profile Header */}
          <ProfileHeader />
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-1 border border-gray-700">
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  setActiveTab('thoughts');
                  setShowCreateThought(false);
                  setShowCreateConfession(false);
                }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'thoughts'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Thoughts ({thoughts.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('confessions');
                  setShowCreateThought(false);
                  setShowCreateConfession(false);
                }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'confessions'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Confessions ({confessions.length})
              </button>
            </div>
          </div>
        </div>

        {/* Create Buttons */}
        {isOwner && (
          <div className="text-center mb-8">
            {activeTab === 'thoughts' ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowCreateThought(!showCreateThought);
                  setShowCreateConfession(false);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center mx-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                {showCreateThought ? 'Cancel' : 'Create Thought'}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowCreateConfession(!showCreateConfession);
                  setShowCreateThought(false);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center mx-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                {showCreateConfession ? 'Cancel' : 'Create Confession'}
              </motion.button>
            )}
          </div>
        )}

        {/* Create Thought Form */}
        <AnimatePresence>
          {showCreateThought && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
                <textarea
                  value={thoughtContent}
                  onChange={(e) => setThoughtContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-gray-700/50 text-white placeholder-gray-400 rounded-xl p-4 border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 resize-none"
                  rows={4}
                />
                
                {/* Image Preview */}
                {previewUrls.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-600"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-gray-900/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Image Upload */}
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => thoughtFileInputRef.current?.click()}
                    className="flex items-center text-gray-300 hover:text-white transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Add Images
                    <input
                      type="file"
                      ref={thoughtFileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      multiple
                      accept="image/*"
                    />
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowCreateThought(false);
                        setThoughtContent('');
                        setImages([]);
                        setPreviewUrls([]);
                      }}
                      className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateThought}
                      disabled={creating || (!thoughtContent.trim() && images.length === 0)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300 flex items-center"
                    >
                      {creating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Confession Form */}
        <AnimatePresence>
          {showCreateConfession && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700">
                <textarea
                  value={confessionContent}
                  onChange={(e) => setConfessionContent(e.target.value)}
                  placeholder="What's your confession?"
                  className="w-full bg-gray-700/50 text-white placeholder-gray-400 rounded-xl p-4 border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 resize-none"
                  rows={4}
                />
                
                <div className="flex justify-end mt-4 space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateConfession(false);
                      setConfessionContent('');
                    }}
                    className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateConfession}
                    disabled={creating || !confessionContent.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300 flex items-center"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Grid */}
        <div className="grid gap-6">
          {activeTab === 'thoughts' ? (
            thoughts.length > 0 ? (
              thoughts.map((thought, index) => (
                <ThoughtCard 
                  key={thought._id}
                  thought={thought}
                  index={index}
                  isOwner={isOwner}
                  handleDelete={handleDelete}
                  formatDate={formatDate}
                />
              ))
            ) : (
              <EmptyState 
                message="No thoughts yet"
                subMessage={isOwner ? "Share your first thought!" : ""}
              />
            )
          ) : (
            confessions.length > 0 ? (
              confessions.map((confession, index) => (
                <ConfessionCard
                  key={confession._id}
                  confession={confession}
                  index={index}
                  isOwner={isOwner}
                  handleDelete={handleDelete}
                  formatDate={formatDate}
                />
              ))
            ) : (
              <EmptyState 
                message="No confessions yet"
                subMessage={isOwner ? "Share your first confession!" : ""}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

const NotFoundPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
    <div className="text-center text-white">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl">Profile not found</p>
    </div>
  </div>
);



const ThoughtCard = ({ thought, index, isOwner, handleDelete, formatDate }: 
  { thought: Thought, index: number, isOwner: boolean, handleDelete: Function, formatDate: Function }) => (
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
              {thought.user.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold">@{thought.user.username}</p>
          <p className="text-gray-400 text-sm">{formatDate(thought.createdAt)}</p>
        </div>
      </div>
      {isOwner && (
        <button
          onClick={() => handleDelete(thought._id, 'thought')}
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

const ConfessionCard = ({ confession, index, isOwner, handleDelete, formatDate }: 
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

const EmptyState = ({ message, subMessage }: { message: string, subMessage: string }) => (
  <div className="text-center py-16">
    <div className="text-gray-400 text-xl mb-4">{message}</div>
    {subMessage && <p className="text-gray-500">{subMessage}</p>}
  </div>
);