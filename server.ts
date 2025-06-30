import next from "next";
import { createServer } from "node:http";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join-room", ({ room, username }) => {
      socket.join(room);
      console.log(`User ${username} joined room ${room}`);
      socket.to(room).emit("user-joined", `${username} joined the chat`);
    });

    socket.on("message", ({ room, message, sender }) => {
      console.log(`Message from ${sender} in room ${room}: ${message}`);
      const messageData = {
        content: message,
        sender,
        timestamp: new Date().toISOString()
      };
      socket.to(room).emit("message", messageData);
    });

    socket.on("typing", ({ room, isTyping, sender }) => {
      socket.to(room).emit("typing", { isTyping, sender });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`Server running on http://${hostname}:${port}`);
  });
});