import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';


const app = express();
const server = createServer(app);

const io = new Server(server);

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on("chat message", (msg) => {
    console.log('message' + msg)
  })
  socket.on("user typing",()=>{
    console.log("user is typing ")
  })
  socket.on('disconnect', () => {
  console.log('a user disconnected');
  })
});


let __dirname = dirname(fileURLToPath(import.meta.url))

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'))
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});

// Express creates an HTTP server but doesn't give us enough control to use Socket.io. Thast's why we use both http and the express. 

