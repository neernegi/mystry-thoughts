import { Server } from 'socket.io';
import http from 'http';
import UserModel from '@/model/user';
import MessageRequest from '@/model/messageRequest';
import Message from '@/model/message';




export const initializeSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user's room
    socket.on('join', async (userId: string) => {
      socket.join(userId);
      await UserModel.findByIdAndUpdate(userId, { online: true });
      
      // Notify others about user's online status
      socket.broadcast.emit('user-online', userId);
    });

    // Handle message request
    socket.on('send-message-request', async ({ senderId, receiverId }) => {
      const request = new MessageRequest({
        sender: senderId,
        receiver: receiverId
      });
      await request.save();
      
      // Notify receiver
      io.to(receiverId).emit('new-message-request', request);
    });

    // Handle message request response
    socket.on('respond-message-request', async ({ requestId, status }) => {
      const request = await MessageRequest.findByIdAndUpdate(
        requestId,
        { status },
        { new: true }
      ).populate('sender receiver');
      
      if (!request) return;
      
      // Notify sender about the response
      io.to(request.sender._id.toString()).emit('message-request-response', request);
      
      if (status === 'accepted') {
        // Notify both users that they can now chat
        io.to(request.sender._id.toString()).emit('chat-enabled', {
          userId: request.receiver._id,
          username: request.receiver.username
        });
        
        io.to(request.receiver._id.toString()).emit('chat-enabled', {
          userId: request.sender._id,
          username: request.sender.username
        });
      }
    });

    // Handle sending messages
    socket.on('send-message', async ({ senderId, receiverId, content }) => {
      // Check if chat is enabled between these users
      const isChatEnabled = await MessageRequest.findOne({
        $or: [
          { sender: senderId, receiver: receiverId, status: 'accepted' },
          { sender: receiverId, receiver: senderId, status: 'accepted' }
        ]
      });
      
      if (!isChatEnabled) return;
      
      const message = new Message({
        sender: senderId,
        receiver: receiverId,
        content
      });
      await message.save();
      
      // Send message to receiver
      io.to(receiverId).emit('receive-message', message);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);
      // You might want to update user's online status here
    });
  });

  return io;
};