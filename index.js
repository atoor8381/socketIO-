import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// here we are using await bcz the open returns a promise and we need to wait for it to resolve before we can use the db object.
const db = await open({
  filename: 'chat.db',
  driver: sqlite3.Database
})

await db.exec(
  `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
  );`
)


const app = express();
const server = createServer(app);

const io = new Server(server, {
  connectionStateRecovery: {}
});

io.on('connection',async (socket) => {
  console.log('a user connected');
  if (!socket.recovered) {
    try {
      await db.each('SELECT id, content FROM messages WHERE id>?', [socket.handshake.auth.socketOffset || 0], (_err, row) => {
        socket.emit("chat message", row.content, row.id)
      })
    } catch (error) {
      console.log(error)
    }
  }
  socket.on("chat message", async (msg, callback, clientoffset) => {
    let result;
    try {
      result = await db.run(`INSERT INTO messages(content, client_offset) VALUES(?, ?)`, msg, clientoffset)
    }
    catch (err) {
      if(err.errno=19){
        callback()
      }
      return;
    }
    io.emit("chat message", msg, result.lastID)
    console.log('message ' + msg, result.lastID)
  callback()
  })
  socket.on("user typing", () => {
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

