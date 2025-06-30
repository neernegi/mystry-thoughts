// services/ChatService.ts
import Message from '../models/Message';
import ChatRoom from '../models/ChatRoom';
import { IMessage } from '../interfaces/Message';

export class ChatService {
  
  // Send message
  static async sendMessage(data: {
    chatRoomId: string;
    senderId: string;
    receiverId: string;
    messageType: 'text' | 'audio' | 'image';
    content?: string;
    audioUrl?: string;
    imageUrl?: string;
  }) {
    try {
      const message = new Message(data);
      await message.save();
      
      // Populate sender info
      await message.populate('senderId', 'username profilePicture');
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get chat history
  static async getChatHistory(chatRoomId: string, page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;
      
      const messages = await Message.find({ chatRoomId })
        .populate('senderId', 'username profilePicture')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(chatRoomId: string, userId: string) {
    try {
      await Message.updateMany(
        { 
          chatRoomId, 
          receiverId: userId, 
          isRead: false 
        },
        { isRead: true }
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Check if user can access chat room
  static async canUserAccessChatRoom(chatRoomId: string, userId: string): Promise<boolean> {
    try {
      const chatRoom = await ChatRoom.findById(chatRoomId);
      return chatRoom ? chatRoom.participants.includes(userId) : false;
    } catch (error) {
      console.error('Error checking chat room access:', error);
      return false;
    }
  }
}
