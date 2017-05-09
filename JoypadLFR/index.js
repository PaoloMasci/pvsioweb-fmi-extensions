/**
 *
 * @author Paolo Masci
 * @date Mar 16, 2017
 */
"use strict";
var ws = null;

function connected () {
	console.log("CONNECTED!");
	document.getElementById("connection_status").style.setProperty("background-color", "lightgreen");
	document.getElementById("connection_status").innerHTML = "CONNECTED!";
	document.getElementById("command_prompt").style.setProperty("border", "lightgreen");
}

function disconnected () {
	console.log("DISCONNECTED :((");
	document.getElementById("connection_status").style.setProperty("background-color", "red");
	document.getElementById("connection_status").innerHTML = "DISCONNECTED :((";
	document.getElementById("command_prompt").style.setProperty("border", "red");
}

function message_received (event) {
	console.log(event);
	document.getElementById("connection_status").style.setProperty("background-color", "blue");
	document.getElementById("connection_status").innerHTML = "MESSAGE RECEIVED!";
	document.getElementById("command_prompt").style.setProperty("border", "blue");
}

function install_handlers() {
	document.getElementById("send").onclick = function() {
		var data = document.getElementById("cmd").value;
		ws.send(data);
	};
	document.getElementById("open").onclick = function() {
		ws = new WebSocket("ws://localhost:8084");
		if (ws) {
			ws.onopen = function (event) {
				connected();
			};
			ws.onerror = function (event) {
				disconnected();
				console.log(event);
			};
			ws.onclose = function (event) {
				disconnected();
				ws = null;
			};
			ws.onmessage = function (event) {
				message_received(event);
			};
		}
	}
}

setTimeout(install_handlers, 50);
