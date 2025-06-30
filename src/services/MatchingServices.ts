// services/MatchingService.ts
import User from '../models/User';
import Match from '../models/Match';
import ChatRoom from '../models/ChatRoom';
import { IUser } from '../interfaces/User';

export class MatchingService {
  
  // Find random opposite gender user for matching
  static async findRandomMatch(userId: string): Promise<IUser | null> {
    try {
      const currentUser = await User.findById(userId);
      if (!currentUser) return null;

      const oppositeGender = currentUser.gender === 'male' ? 'female' : 'male';

      // Find all opposite gender users who are online and searching
      const availableUsers = await User.find({
        _id: { $ne: userId },
        gender: oppositeGender,
        isOnline: true,
        isSearching: true
      });

      if (availableUsers.length === 0) return null;

      // Random selection using Math.floor like OTP generation
      const randomIndex = Math.floor(Math.random() * availableUsers.length);
      return availableUsers[randomIndex];
    } catch (error) {
      console.error('Error finding random match:', error);
      return null;
    }
  }

  // Create a match and chat room
  static async createMatch(user1Id: string, user2Id: string) {
    try {
      // Check if match already exists
      const existingMatch = await Match.findOne({
        $or: [
          { user1: user1Id, user2: user2Id },
          { user1: user2Id, user2: user1Id }
        ],
        status: 'active'
      });

      if (existingMatch) {
        return { match: existingMatch, chatRoom: await ChatRoom.findById(existingMatch.chatRoomId) };
      }

      // Create chat room first
      const chatRoom = new ChatRoom({
        participants: [user1Id, user2Id],
        matchId: null // Will be updated after match creation
      });
      await chatRoom.save();

      // Create match
      const match = new Match({
        user1: user1Id,
        user2: user2Id,
        chatRoomId: chatRoom._id
      });
      await match.save();

      // Update chat room with match ID
      chatRoom.matchId = match._id;
      await chatRoom.save();

      // Update users' searching status
      await User.updateMany(
        { _id: { $in: [user1Id, user2Id] } },
        { isSearching: false }
      );

      return { match, chatRoom };
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  // Process matching request
  static async processMatch(userId: string) {
    try {
      // Set user as searching
      await User.findByIdAndUpdate(userId, { isSearching: true });

      // Find random match
      const matchedUser = await this.findRandomMatch(userId);
      
      if (!matchedUser) {
        return { success: false, message: 'No users available for matching' };
      }

      // Create match and chat room
      const { match, chatRoom } = await this.createMatch(userId, matchedUser._id);

      return {
        success: true,
        match,
        chatRoom,
        matchedUser: {
          _id: matchedUser._id,
          username: matchedUser.username,
          profilePicture: matchedUser.profilePicture
        }
      };
    } catch (error) {
      console.error('Error processing match:', error);
      return { success: false, message: 'Error processing match' };
    }
  }

  // Get user's active matches
  static async getUserMatches(userId: string) {
    try {
      const matches = await Match.find({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'active'
      })
      .populate('user1', 'username profilePicture')
      .populate('user2', 'username profilePicture')
      .populate('chatRoomId');

      return matches;
    } catch (error) {
      console.error('Error getting user matches:', error);
      return [];
    }
  }
}