(function () {
  "use strict";
  var http    = require("http"),
      qrcode  = require("qrcode-js"),
      app     = require("http").createServer(webServer),
      io      = require('socket.io').listen(app),
      fs      = require("fs");

  var prototyperShellHTML = fs.readFileSync(__dirname + '/www/index.html'),
      clients             = [],
      basePath            = "";

  io.sockets.on('connection', function (socket) {
    clients.push(socket);
  });

  function webServer(req, res) {
    if(req.url == "/") {
        res.setHeader("Content-Type", "text/html");
        res.end(prototyperShellHTML);
    } else {
        fs.readFile(basePath + "/" + req.url.substr(1), function(err, data) {
           if(err) {
               res.writeHead(404);
               res.end("File not found: " + req.url);
               return;
           }

           res.writeHead(200);
           res.end(data);
        });
    }
  }

  function startServer(path, callback) {
    console.log("PATH: ", path);
    basePath = path;
    app.listen(8080);
    getIP(callback);
  }

  function getIP(callback) {
    var net = require('net'),
        socket = net.createConnection(80, 'www.google.com');

    socket.on('connect', function() {
      var url = "http://" + socket.address().address + ":8080";
      socket.end();
      callback(undefined, qrcode.toDataURL(url, 4));
    });
    socket.on('error', function(e) {
      callback(e, 'error');
    });
  }

  function updateClients() {
    Array.prototype.forEach.call(clients, function(client) {
      client.emit("update");
    });
  }

  function init(DomainManager) {
    if (!DomainManager.hasDomain("prototype")) {
      DomainManager.registerDomain("prototype", {major: 0, minor: 1});
    }
    DomainManager.registerCommand("prototype", "startServer", startServer, true, "Starts a server on port 8080. Returns DataURL for a QR code with the URL of the server", [{name: "path", type: "string", description: "Root path of the project to serve"}], [{name: "dataUrl", type: "string", description: "A dataURL for a QR code with the server URL"}]);
        DomainManager.registerCommand("prototype", "update", updateClients, false, "Updates the clients, returns nothing", [], []);

  }

  exports.init = init;
}());