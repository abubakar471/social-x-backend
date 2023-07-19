import express from 'express';
import morgan from 'morgan';
const app = express();
import { readdirSync } from 'fs';
import cors from 'cors';
import mongoose from 'mongoose';
require('dotenv').config();

import { Server } from 'socket.io';
import { createServer } from 'http';

const server = createServer(app);
// const io = new Server(server);
const io = require("socket.io")(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"]
    }
  });


// database
mongoose.connect(process.env.DATABASE)
    .then(() => {
        console.log("successfully connected to the database");
    })
    .catch((err) => {
        console.log("database error => ", err);
    })

app.use(cors({
    origin: [process.env.CLIENT_URL],
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false }));

// routes
readdirSync('./routes').map((r) => app.use('/api', require(`./routes/${r}`)));

// socket.io
// io.on("connect", (socket) => {
//     socket.on("send-message", (message) => {
//         socket.broadcast.emit('receive-message', message);
//     })
// })



io.on("connect", (socket) => {
    socket.on("new-post", (newPost) => {
        console.log("socket io post => ", newPost)
        socket.broadcast.emit("new-post", newPost);
    })
})

let PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log("server is runnning on port ", PORT);
})