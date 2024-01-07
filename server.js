const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
var ip_editor=new Map();
var ip_viewer=new Map();
var editor_text="";
var noofclient=0;
var offset;
var ip_range= [
  ["", ""],
  ["", ""],
  ["", ""]
];
// var ip_range_demo= [
//   [":ffff:192.168.233.64", ":ffff:192.168.233.64"],
//   ["::1", "::ffff:127.0.0.1"],
  // ["", ""]
// ];

// let ip_editor = new Set();
// let ip_viewer = new Set();

function ipchange(ipAddress) {
  const ipComponents = ipAddress.split('.');
  const decimalNumber = ipComponents.map(component => component.padStart(3, '0')).join('');
  return Number(decimalNumber);
}

function checkIpAddress(inputIp, startIp, endIp) {
  var inputDecimal = ipchange(inputIp);
  console.log(inputDecimal);
  var startDecimal = ipchange(startIp);
  console.log(startDecimal);
  var endDecimal = ipchange(endIp);
  console.log(endDecimal);
  var isInRange = inputDecimal >= startDecimal && inputDecimal <= endDecimal;
  return isInRange;
}

function decode(text){
  var newalpha = "";
    for (let i = 0; i < text.length; i++){
      if(i%2==0){
        newalpha += String.fromCharCode(Math.abs(text.charCodeAt(i)-offset-1)%256);
      }
      else{
        newalpha += String.fromCharCode(Math.abs(text.charCodeAt(i)-offset+1)%256);
      }
      
    }
    return newalpha;
}

app.use(express.static(path.join(__dirname, 'private')));

app.post('/process',(req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.get('*', (req,res) => {
  if(res.socket.remoteAddress=="::ffff:192.168.233.147"){
      res.sendFile(path.join(__dirname, 'public', 'error.html'));
  }
  else{
    if(noofclient==0){
      res.sendFile(path.join(__dirname, 'public', 'form.html'));
      noofclient++;
    }
    else{
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
    noofclient++;
  }
  }
  });

io.on('connection', (socket) => {

    var clientIP = socket.handshake.address;
    console.log(clientIP!=="::1");
    console.log(clientIP!=="::ffff:127.0.0.1");
    if((clientIP!=="::1" && clientIP!=="::ffff:127.0.0.1")){
        socket.emit('updated',editor_text,offset);
        if(ip_editor.get(clientIP)==undefined){
          ip_editor.set(clientIP,1);
        }
        else{
        ip_editor.set(clientIP,parseInt(ip_editor.get(clientIP))+1);
        }
        console.log("editor",ip_editor);
    }
    else{
        socket.emit('view',editor_text,offset);
        if(ip_viewer.get(clientIP)==undefined){
          ip_viewer.set(clientIP,1);
        }
        else{
        ip_viewer.set(clientIP,parseInt(ip_viewer.get(clientIP))+1);
        }
        console.log("view",ip_viewer);
    }
    var ip_editor_json =JSON.stringify(Array.from(ip_editor.entries()));
    var ip_viewer_json =JSON.stringify(Array.from(ip_viewer.entries()));
    // console.log(mapData);
    // ip_editor_json.forEach(([key,value])=>{
    //   console.log('Ip: ${key}, No: ${value}');
    // });
    io.emit('view_update',ip_viewer_json);
    io.emit('edit_update', ip_editor_json);

  socket.on('redirect',(text,off)=>{
    ip_range=text;
    offset=off;
    console.log(ip_range,offset);
    console.log(checkIpAddress(ip_range[1][0],ip_range[1][1],"172.168.130.0"));
    // socket.emit('redirect',1);
  })
  socket.on('update', (text) => {
    editor_text=text;
    io.emit('updated', editor_text,offset);
  });

  socket.on('disconnect', () => {
    if(ip_editor.get(clientIP)==1){
      ip_editor.delete(clientIP);
    }
    else if(ip_viewer.get(clientIP)==1){
      ip_viewer.delete(clientIP);
    }
    else if(ip_editor.get(clientIP)!=undefined){
      ip_editor.set(clientIP,parseInt(ip_editor.get(clientIP))-1);
    }
    else if((ip_viewer.get(clientIP)!=undefined)){
      ip_viewer.set(clientIP,parseInt(ip_viewer.get(clientIP))-1);
    }
    var ip_editor_json =JSON.stringify(Array.from(ip_editor.entries()));
    var ip_viewer_json =JSON.stringify(Array.from(ip_viewer.entries()));
    // console.log(mapData);
    io.emit('view_update',ip_viewer_json);
    io.emit('edit_update', ip_editor_json);
    console.log('User disconnected');
  });
  

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});