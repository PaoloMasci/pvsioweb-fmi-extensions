/**
 * @module Gauge
 * @version 1.0.0
 * @description
 * Gauge renders a basic gauge object (using D3 Gauge Plus library). It assumes that this
 * library was already loaded (TODO fix this). The gauge will be rendered with the
 * pointer showing the current value. The initial value is 0. The render method can
 * then be called, passing the new value as parameter, and the widget will update the gauge
 * to show the new provided value.
 *
 * @author Henrique Pacheco
 * @date Mar 25, 2017
 *
 * @example <caption>Usage of Gauge within a PVSio-web project.</caption>
 * define(function (require, exports, module) {
 *     "use strict";
 *
 *     // Require the Gauge module
 *     require("widgets/car/Gauge");
 *
 *     function main() {
 *          // After Gauge module was loaded, initialize it
 *          var gauge = new Gauge('gauge-gauge', {
 *              label: "kmh",
 *              max: 240,
 *              min: 0
 *          });
 *
 *          // Re-render the Gauge, provinding a new value
 *          gauge.render(10);
 *     }
 * });
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, d3_gauge_plus*/
define(function (require, exports, module) {
    "use strict";

    /**
     * @function <a name="Gauge">Gauge</a>
     * @description Gauge constructor.
     *
     * @param id {String} The ID of the element that will contain the gauge.
     * @param coords {Object} The four coordinates (top, left, width, height) of the display, specifying
     *        the left, top corner, and the width and height of the (rectangular) display.
     *        Default is { top: 0, left: 0, width: 200, height: 80 }.
     * @param opt {Object} Options:
     *          <li>max (integer): Upper limit of the gauge (default is 200).</li>
     *          <li>min (integer): Bottom limit of the gauge (default is 0).</li>
     *          <li>initial (integer): Initial value of the pointer of the gauge (default is 0).</li>
     *          <li>label (String): Label presented inside the gauge (default is the empty string).</li>
     * @memberof module:Gauge
     * @instance
     */
    function Gauge(id, coords, opt) {

        function createGauge(id, coords, opt) {
            var config = {
                size: coords.width || 100,
                rotation: 270,
                gap: 90,
                drawOuterCircle: false,
                outerStrokeColor: "#fff",
                outerFillColor: "#fff",
                innerStrokeColor: "#fff",
                innerFillColor: "#000",
                label: opt.label,
                labelSize: 0.1, // Default font size is 10% of radius.
                labelColor: "#888",
                min: opt.min,
                max: opt.max,
                initial: opt.initial,
                clampUnderflow: false,
                clampOverflow: false,
                majorTicks: 9,
                majorTickColor: "#fff",
                majorTickWidth: "3px",
                minorTicks: 3,
                minorTickColor: "#fff",
                minorTickWidth: "1px",
                greenColor: "#109618",
                yellowColor: "#FF9900",
                redColor: "#e31406",

                // Added settings
                pointerFillColor: "#dc3912",
                pointerStrokeColor: "#c63310",
                pointerUseBaseCircle: false,
                // Percentage of total radius
                pointerBaseCircleRadius: 0.1,
                pointerBaseCircleFillColor: "#fff",
                pointerBaseCircleStrokeColor: "red",
                pointerBaseCircleStrokeWidth: "1px",

                transitionDuration: 200,
                greenZones: [ ],
                yellowZones: [ ],
                redZones: [ { from: (opt.max - (opt.max * 0.125)), to: opt.max } ]
            };

            // Merge options provided over the gauge default ones
            for (var attr in opt) { config[attr] = opt[attr]; }

            return new d3_gauge_plus.Gauge(id, config);
        }


        opt = opt || {};

        // Handle coords
        coords = coords || {};
        this.top = coords.top || 0;
        this.left = coords.left || 0;
        this.width = coords.width || 200;
        this.height = coords.height || 80;
        this.parent = (opt.parent) ? ("#" + opt.parent) : "body";

        this.div = d3.select('#'+id)
            .style("position", opt.position)
            .style("top", this.top + "px").style("left", this.left + "px")
            .style("width", (this.width) + "px").style("height", (this.height) + "px");

        opt.position = opt.position || "absolute";


        // Gauge params
        opt.max = opt.max || 200;
        opt.min = opt.min || 0;
        opt.initial = opt.initial || 0;
        opt.label = opt.label || '';

        // D3 Gauge Plus object
        this.gauge_obj = createGauge(id, coords, opt);

        // display the gauge
        this.gauge_obj.render();

        return this;
    }

    /**
     * @function <a name="Gauge">Gauge</a>
     * @description Render method.
     *
     * @param new_value {Float} The new value to set the gauge pointer.
     * @param opt {Object} Override options when re-rendering. See constructor docs for
     * detailed docs on the available options.
     *
     * @memberof module:Gauge
     * @instance
     */
    Gauge.prototype.render = function(new_value, opt) {
        opt = opt || {};
        this.gauge_obj.setPointer(new_value);
    };

    module.exports = Gauge;
});
