/**
 *
 * @author Paolo Masci, Patrick Oladimeji
 * @date 27/03/15 20:30:33 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
require.config({
    baseUrl: "./",
    paths: {
	       d3: './lib'
    }
});

require([
        "widgets/TouchscreenButton",
        "widgets/BasicDisplay",
        "widgets/car/Gauge",
        "widgets/car/Navigator",
        "widgets/ButtonActionsQueue",
        "websockets/FMIClient"
    ], function (
        TouchscreenButton,
        BasicDisplay,
        Gauge,
        Navigator,
        ButtonActionsQueue,
        FMIClient
    ) {
        "use strict";
        var client = FMIClient.getInstance();
        var PVSioStateParser = require("util/PVSioStateParser");

        // Function automatically invoked by PVSio-web when the back-end sends states updates
        function onMessageReceived(err, event) {
            console.log(event);
            render(event);
        }

        // Function used for polling the robot state at periodic intervals
        var tick;
        function start_tick(interval) {
            if (!tick) {
                tick = setInterval(function () {
                    ButtonActionsQueue.getInstance().queueGUIAction("tick", onMessageReceived);
                }, interval);
            }
        }
        function stop_tick() {
            if (tick) {
                clearInterval(tick);
                tick = null;
            }
        }

        var car = {};

        // ----------------------------- DASHBOARD INTERACTION -----------------------------
        car.left = new TouchscreenButton("left", {  width: 40, height: 25, top: 390, left: 250 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['press/release'],
            keyCode: 37 // left key
        }, {
            parent: "joypad"
        });
        car.up = new TouchscreenButton("accelerate", { width: 25, height: 40, top: 350, left: 290 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['press/release'],
            keyCode: 38 // up key
        }, {
            parent: "joypad"
        });
        car.right = new TouchscreenButton("right", {  width: 40, height: 25, top: 390, left: 310 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['press/release'],
            keyCode: 39 // right key
        }, {
            parent: "joypad"
        });
        car.down = new TouchscreenButton("brake", { width: 25, height: 40, top: 410, left: 290 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['press/release'],
            keyCode: 40 // down key
        }, {
            parent: "joypad"
        });
        car.neutral = new TouchscreenButton("neutral", {  width: 40, height: 25, top: 390, left: 630 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['click'],
            keyCode: 66 // b
        }, {
            parent: "joypad"
        });
        car.drive = new TouchscreenButton("drive", {  width: 40, height: 25, top: 350, left: 585 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['click'],
            keyCode: 89 // y
        }, {
            parent: "joypad"
        });
        car.reverse = new TouchscreenButton("reverse", {  width: 40, height: 25, top: 425, left: 588 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['click'],
            keyCode: 65 // a
        }, {
            parent: "joypad"
        });
        car.autopilot = new TouchscreenButton("autopilot", {  width: 40, height: 35, top: 360, left: 435 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['click'],
            keyCode: 65 // a
        }, {
            parent: "joypad"
        });
        car.speed_left = new Gauge('speedometer-gauge-left',
                {
                    top: 450,
                    left: 330,
                    width: 90
                },
                {
                    parent: "joypad",
                    max: 1,
                    min: -1,
                    initial: 0,
                    label: 'LEFT',
                    redZones: [{ from: 0.68, to: 1 }, { from: -0.68, to: -1 }],
                    style: "powergauge"
                });
        car.speed_right = new Gauge('speedometer-gauge-right',
                {
                    top: 450,
                    left: 500,
                    width: 90
                },
                {
                    parent: "joypad",
                    size: 90,
                    max: 1,
                    min: -1,
                    initial: 0,
                    label: 'RIGHT',
                    redZones: [{ from: 0.68, to: 1 }, { from: -0.68, to: -1 }],
                    style: "powergauge"
                });
        car.speed = new Gauge('speedometer-gauge-main',
                {
                    top: 70,
                    left: 240,
                    width: 220
                },
                {
                    parent: "joypad",
                    size: 220,
                    max: 0.18,
                    min: 0,
                    initial: 0,
                    label: 'MPS',
                    majorTicks: 8,
                    redZones: [{ from: 0.154, to: 0.18 }],
                    style: "powergauge"
                });
        car.navigator = new Navigator("nav-display",
                {
                    top: 80,
                    left: 460,
                    width: 180,
                    height: 180
                }, {
                    // autoscale: true,
                    parent: "joypad",
		    maxX: 0.296,
                    maxY: 0.4914,
		    x0: 0.138,
		    y0: -0.08
		   
		   
                });
        car.gear = new BasicDisplay(
            'gear',
            { top: 154, left: 380, width: 24, height: 26 },
            {
                parent: "joypad",
                borderWidth: 2,
                borderStyle: "solid",
                borderColor: "black",
                fontsize: 22,
                backgroundColor: "gray"
            }
        );
        car.position = new BasicDisplay(
            'position',
            { top: 246, left: 462, width: 176, height: 12 },
            {
                parent: "joypad",
                fontsize: 10,
                backgroundColor: "gray"
            }
        );

        // Render car dashboard components
        function render(res) {
            car.left.render(res);
            car.right.render(res);
            car.up.render(res);
            car.down.render(res);
            car.neutral.render(res);
            car.drive.render(res);
            car.reverse.render(res);
            car.autopilot.render(res);
            car.navigator.reveal();
            car.gear.render({ gear: "N" });
            car.position.render("(0.138, -0.08)");
            // car.navigator.render([{ x:0, y:-50 }, { x:-100, y:-50 }, { x:-100, y:-150 }, { x:100, y:-150 }, { x:100, y:-100 }, { x:200, y:50 }, { x: -200, y: -200 }]);
            // gauges
            if (res) {
                var ans = res.split(";");
                var state = {};
                if (ans.length >= 1) {
                    state = PVSioStateParser.parse(ans[0]);
                    if (state) {
                        var left = PVSioStateParser.evaluate(state["motorSpeed"]["left"]);
                        car.speed_left.render(left);
                        var right = PVSioStateParser.evaluate(state["motorSpeed"]["right"]);
                        car.speed_right.render(right);
                        // basic display supports automatic parsing of the state
                        var gear = (state["gear"] === "DRIVE")? "D"
                                     : (state["gear"] === "REVERSE")? "R"
                                     : (state["gear"] === "NEUTRAL")? "N"
                                     : "E";
                        car.gear.render(gear);
                    }
                }
                if (ans.length >= 2) {
                    state = PVSioStateParser.parse(ans[1]);
                    if (state) {
                        var pos_x = PVSioStateParser.evaluate(state["x"]);
                        var pos_y = PVSioStateParser.evaluate(state["y"]);
                        car.navigator.render([{ x: pos_x, y: pos_y }]);
                        car.position.render("(" + pos_x + ", " + pos_y + ")");
                        var linear = PVSioStateParser.evaluate(state["linear"]);
                        car.speed.render(linear);
                        var angular = PVSioStateParser.evaluate(state["angular"]);
                        // we should use angular to rotate the arrow when the vehicle is spinning
                    }
                }
            }
        }

        render();
        start_tick(500); // tick interval is in milliseconds

});
