/**
 * Manages a queue of messages to send to the server
 */
define(function (require, exports, module) {

    var guiActions, instance;
    var FMIClient = require("websockets/FMIClient").getInstance();
    var buffer = [];
    var busy = false;

    function ButtonActionsQueue() {
        guiActions = Promise.resolve();
    }

    ButtonActionsQueue.prototype.queueGUIAction = function (action, cb) {
        function try_send() {
            if (buffer.length && !busy) {
                busy = true;
                return new Promise(function (resolve, reject) {
                    var elem = buffer.pop();
                    var x = elem.action;
                    var callback = elem.callback;
                    console.log("sending action " + x);
                    ws.websocket_send(x, function (err, res) {
                        callback(err, res);
                        if (err) {
                            reject(err);
                            busy = false;
                            try_send();
                        } else {
                            resolve(res);
                            busy = false;
                            try_send();
                        }
                    }).catch(function (err) {
                        reject(err);
                        busy = false;
                        try_send();
                    });
                });
            }
        }
        function queue_action() {
            buffer.push({ action: action, callback: cb });
        }
        var ws = FMIClient.getWebSocket();
        cb = cb || function () {};
        if (ws) {
            guiActions = guiActions.then(function (res) {
                if (FMIClient.isWebSocketConnected()) {
                    queue_action();
                    try_send();
                } else {
                    FMIClient.connectToServer().then(function (res) {
                        queue_action();
                        try_send();
                    });
                }
            });
        }
    };

    module.exports = {
        getInstance: function () {
            instance = instance || new ButtonActionsQueue();
            return instance;
        }
    };
});
