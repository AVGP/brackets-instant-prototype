define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        Menus          = brackets.getModule("command/Menus"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeConnection = brackets.getModule("utils/NodeConnection"),
        ProjectManager = brackets.getModule("project/ProjectManager");

    var nodeConnection = null;

    // Helper function that chains a series of promise-returning
    // functions together via their done callbacks.
    function chain() {
        var functions = Array.prototype.slice.call(arguments, 0);
        if (functions.length > 0) {
            var firstFunction = functions.shift();
            var firstPromise = firstFunction.call();
            firstPromise.done(function () {
                chain.apply(null, functions);
            });
        }
    }


    // Function to run when the menu item is clicked
    function handleStart() {
        nodeConnection = new NodeConnection();
        // Helper function to connect to node
        function connect() {
            var connectionPromise = nodeConnection.connect(true);
            connectionPromise.fail(function () {
                console.error("[brackets-prototype-node] failed to connect to node");
            });
            return connectionPromise;
        }

        // Helper function that loads our domain into the node server
        function loadSimpleDomain() {
            var path = ExtensionUtils.getModulePath(module, "node/Prototype");
            var loadPromise = nodeConnection.loadDomains([path], true);
            loadPromise.fail(function (err) {
                console.log("[brackets-prototype-node] failed to load domain!", err);
            });
            return loadPromise;
        }

        function startServer() {
          var promise = nodeConnection.domains.prototype.startServer(ProjectManager.getProjectRoot().fullPath);
          promise.done(function(dataUrl) {
            console.log("GOOD");
            window.open(dataUrl);
          });
          promise.fail(function(err) {
            alert("Can't generate QR Code for URL :(");
            console.log(err);
          });
          return promise;
        }

        // Call all the helper functions in order
        chain(connect, loadSimpleDomain, startServer);
    }

    // Function to run when the menu item is clicked
    function handleUpdate() {
      if(!nodeConnection) return;
      console.log(nodeConnection);
      nodeConnection.domains.prototype.update();
    }

    // First, register a command - a UI-less object associating an id to a handler
    var START_COMMAND_ID  = "instant_prototype.start",
        UPDATE_COMMAND_ID = "instant_prototype.update";

    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);

    CommandManager.register("Start instant prototyping", START_COMMAND_ID, handleStart);
    menu.addMenuItem(START_COMMAND_ID, "Ctrl-Shift-L");

    CommandManager.register("Update prototyping clients", UPDATE_COMMAND_ID, handleUpdate);
    menu.addMenuItem(UPDATE_COMMAND_ID, "Ctrl-Shift-U");

    exports.handleStart = handleStart;
    exports.handleUpdate = handleUpdate;
});