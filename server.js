const express = require("express");
const path = require("path");
const app = express();
app.get("/", (req, res) => {
  res.send("server is running");
});
// __dirname1 = path.resolve();
// app.use(express.static(path.join(__dirname1, "/frontend/build")));

// app.get("*", (req, res) =>
//   res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
// );
const players = {};
const server = app.listen(5000, console.log("server is running at port 5000"));
const io = require("socket.io")(server, {
  pingTimeout: 6000,
  cors: {
    origin: "http://localhost:3000",
  },
});
io.on("connection", (socket) => {
  console.log(`connected to socket id: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log("disconnected socket");
  });
  socket.on("send message", (message) => {
    console.log(`send message: ${message}`);
    io.emit("received message", message);
  });
  //room features
  socket.on("join room", (roomid, name) => {
    console.log(`join room: ${roomid}`);
    if (roomid === "") {
      console.log("enter a room id");
    } else {
      socket.join(roomid);
      io.to(roomid).emit("show join", name);
    }
  });
  //send and receive private messages
  socket.on("send privateMessage", ({ message, roomid, name }) => {
    io.to(roomid).emit("received privateMessage", name, message);
  });
  socket.on("game board", ({ idToCall, ticTacToe, turn }) => {
    io.to(idToCall).emit("new game board", ticTacToe, turn);
  });
  socket.on("game board1", ({ me, ticTacToe, turn }) => {
    io.to(me).emit("new game board1", ticTacToe, turn);
  });

  ///update clicked

  players[socket.id] = {
    id: socket.id,
    name: "Player " + (Object.keys(players).length + 1),
  };
  //video call
  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
  });

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
    socket.join(data.userToCall);
    console.log(`join room ${data.userToCall}`);
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
    socket.join(data.myid);
    console.log(`join room ${data.myid}`);
  });
});
