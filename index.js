const express = require('express');
const { spawn } = require('child_process');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

let stopCamera = false; // flag variable to stop the camera

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('run-detection', () => {
    stopCamera = false; // reset stop flag

    const process = spawn('python', ['detect.py', '--weight','best.pt','--source', '0'], { cwd: __dirname + '/yolov5' });

    process.stdout.on('data', (data) => {
      if (!stopCamera) {
        socket.emit('detection-output', data.toString());
      } else {
        process.kill('SIGINT'); // kill the process if stop flag is set
      }
    });

    process.stderr.on('data', (data) => {
      if (!stopCamera) {
        socket.emit('detection-output', data.toString());
      } else {
        process.kill('SIGINT'); // kill the process if stop flag is set
      }
    });

    process.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      socket.emit('detection-complete');
    });
  });

  socket.on('stop-detection', () => {
    stopCamera = true; // set stop flag
  });
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
