"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Edit3,
  User,
  Mail,

  // Image as ImageIcon,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AvatarCustomizer } from "./AvatarCustomizer";
import { ProfileData, User as IUser } from "@/types/interfaces";
import { formatDate } from "@/helpers/formatTime";

interface ProfileHeaderProps {
  avatarOptions?: IUser["avatarOptions"];
}

export default function ProfileHeader({ avatarOptions }: ProfileHeaderProps) {
  const params = useParams();
  const identifier = params?.identifier as string;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [identifier]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
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
      console.error("Error fetching profile:", error);
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvatar = async (avatarData: any) => {
    try {
      const response = await fetch("/api/update-avatar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: profileData?.user._id,
          avatarOptions: avatarData,
          avatarUrl: `https://avataaars.io/?${new URLSearchParams(
            avatarData
          ).toString()}`,
        }),
      });

      if (response.ok) {
        const { imageUrl } = await response.json();
        setProfileData((prev) => ({
          ...prev!,
          user: {
            ...prev!.user,
            image: imageUrl,
          },
        }));
        setShowAvatarModal(false);
        toast.success("Avatar updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update avatar:", error);
      toast.error("Failed to update avatar");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!profileData) return <div>User not found</div>;

  const { user, isOwner } = profileData;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Profile Image */}
          <div className="relative mx-auto w-32 h-32 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
            {user.image ? (
              <img
                src={user.image}
                alt={user.username}
                className="relative w-full h-full rounded-full object-cover border-4 border-gray-700 shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${user.username}&background=7e22ce&color=fff&size=200&bold=true`;
                }}
              />
            ) : (
              <div className="relative w-full h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 border-4 border-gray-700 shadow-2xl flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {user.username?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            )}
            {isOwner && (
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-800 flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <Edit3 className="w-3 h-3 text-white" />
              </button>
            )}
          </div>

          {/* User Info */}
          <h1 className="text-4xl font-bold text-white mb-2">
            @{user.username}
          </h1>
          <p className="text-purple-300 text-lg mb-6">{user.anonymousName}</p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-center mb-2">
                <User className="w-6 h-6 text-purple-400 mr-2" />
                <span className="font-semibold">Gender</span>
              </div>
              <p className="text-purple-300 capitalize">
                {user.gender || "Not specified"}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-center mb-2">
                <Mail className="w-6 h-6 text-purple-400 mr-2" />
                <span className="font-semibold">Email</span>
              </div>
              <p className="text-purple-300 text-sm truncate">
                {isOwner ? user.email : "Private"}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6 text-purple-400 mr-2" />
                <span className="font-semibold">Joined</span>
              </div>
              <p className="text-purple-300">{formatDate(user.createdAt)}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Avatar Customizer Modal */}
        <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
          <DialogContent className="max-w-[200vw] p-0 border-none bg-transparent">
            <AvatarCustomizer
              onSave={handleSaveAvatar}
              onClose={() => setShowAvatarModal(false)}
              initialOptions={{
                avatarStyle: avatarOptions?.avatarStyle,
                topType: avatarOptions?.topType,
                accessoriesType: avatarOptions?.accessoriesType,
                hairColor: avatarOptions?.hairColor,
                facialHairType: avatarOptions?.facialHairType,
                facialHairColor: avatarOptions?.facialHairColor,
                clotheType: avatarOptions?.clotheType,
                colorFabric: avatarOptions?.colorFabric,
                eyeType: avatarOptions?.eyeType,
                eyebrowType: avatarOptions?.eyebrowType,
                mouthType: avatarOptions?.mouthType,
                skinColor: avatarOptions?.skinColor,
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
