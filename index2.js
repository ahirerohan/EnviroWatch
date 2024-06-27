// app.js

const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

app.use(express.static(__dirname + '/public'));

app.post('/upload', upload.single('image'), (req, res, next) => {
  const filePath = req.file.path;

  const process = spawn('python', ['detect.py', '--weight', 'best.pt', '--source', filePath], { cwd: __dirname + '/yolov5' });

  process.stdout.on('data', (data) => {
    io.emit('detection-output', data.toString());
  });

  process.stderr.on('data', (data) => {
    io.emit('detection-output', data.toString());
  });

  process.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    io.emit('detection-complete');
  });

  res.send('File uploaded!');
});

server.listen(4000, () => {
  console.log('Server started on port 3000');
});
