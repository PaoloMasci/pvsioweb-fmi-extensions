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
        "widgets/car/Gauge",
        "widgets/ButtonActionsQueue",
        "websockets/FMIClient"
    ], function (
        TouchscreenButton,
        Gauge,
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
        });
        car.up = new TouchscreenButton("accelerate", { width: 25, height: 40, top: 350, left: 290 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['press/release'],
            keyCode: 38 // up key
        });
        car.right = new TouchscreenButton("right", {  width: 40, height: 25, top: 390, left: 310 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['press/release'],
            keyCode: 39 // right key
        });
        car.down = new TouchscreenButton("brake", { width: 25, height: 40, top: 410, left: 290 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['press/release'],
            keyCode: 40 // down key
        });
        car.neutral = new TouchscreenButton("neutral", {  width: 40, height: 25, top: 390, left: 630 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['click'],
            keyCode: 66 // b
        });
        car.drive = new TouchscreenButton("drive", {  width: 40, height: 25, top: 350, left: 585 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['click'],
            keyCode: 89 // y
        });
        car.reverse = new TouchscreenButton("reverse", {  width: 40, height: 25, top: 425, left: 588 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['click'],
            keyCode: 65 // a
        });
        car.autopilot = new TouchscreenButton("autopilot", {  width: 40, height: 35, top: 360, left: 435 }, {
            callback: onMessageReceived,
            backgroundColor: "transparent",
            evts: ['click'],
            keyCode: 65 // a
        });
        car.speed_left = new Gauge('speedometer-gauge-left',
                {
                    top: 120,
                    left: 240,
                    width: 220
                },
                {
                    position: "absolute",
                    size: 170,
                    drawOuterCircle: true,
                    outerStrokeColor: "#838286",
                    outerFillColor: "#838286",
                    innerStrokeColor: "888",
                    innerFillColor: "#fff",
                    majorTickColor: "#000",
                    majorTickWidth: "2px",
                    minorTicks: 4,
                    minorTickColor: "#000",
                    max: 1,
                    min: -1,
                    initial: 0,
                    label: 'LEFT',
                    majorTicks: 7,
                    greenZones: [],
                    yellowZones: [],
                    redZones: [{ from: 0.8, to: 1 }, { from: -0.8, to: -1 }],
                    pointerFillColor: "#dc555a",
                    pointerStrokeColor: "#6f6e73",
                    pointerShowLabel: false,
                    pointerUseBaseCircle: true,
                    pointerBaseCircleAbovePointer: false,
                    pointerBaseCircleFillColor: "#838286",
                    pointerBaseCircleStrokeColor: "#838286",
                    pointerBaseCircleRadius: 0.2
                }
            );
        car.speed_right = new Gauge('speedometer-gauge-right',
                {
                    top: 120,
                    left: 500,
                    width: 220
                },
                {
                    position: "absolute",
                    size: 170,
                    drawOuterCircle: true,
                    outerStrokeColor: "#838286",
                    outerFillColor: "#838286",
                    innerStrokeColor: "888",
                    innerFillColor: "#fff",
                    majorTickColor: "#000",
                    majorTickWidth: "2px",
                    minorTicks: 4,
                    minorTickColor: "#000",
                    max: 1,
                    min: -1,
                    initial: 0,
                    label: 'RIGHT',
                    majorTicks: 7,
                    greenZones: [],
                    yellowZones: [],
                    redZones: [{ from: 0.8, to: 1 }, { from: -0.8, to: -1 }],
                    pointerFillColor: "#dc555a",
                    pointerStrokeColor: "#6f6e73",
                    pointerShowLabel: false,
                    pointerUseBaseCircle: true,
                    pointerBaseCircleAbovePointer: false,
                    pointerBaseCircleFillColor: "#838286",
                    pointerBaseCircleStrokeColor: "#838286",
                    pointerBaseCircleRadius: 0.2
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
            // gauges
            if (res) {
                var state = PVSioStateParser.parse(res);
                if (state) {
                    var left = PVSioStateParser.evaluate(state["motorSpeed "]["left "]);
                    car.speed_left.render(left);
                    console.log(left);
                    var right = PVSioStateParser.evaluate(state["motorSpeed "]["right "]);
                    car.speed_right.render(right);
                    console.log(right);
                }
            }
        }

        render();
        start_tick(500); // tick interval is in milliseconds

});
