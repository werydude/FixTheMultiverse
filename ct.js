/*! Made with ct.js http://ctjs.rocks/ */

if (location.protocol === 'file:') {
    // eslint-disable-next-line no-alert
    alert('Your game won\'t work like this because\nWeb 👏 builds 👏 require 👏 a web 👏 server!\n\nConsider using a desktop build, or upload your web build to itch.io, GameJolt or your own website.\n\nIf you haven\'t created this game, please contact the developer about this issue.\n\n Also note that ct.js games do not work inside the itch app; you will need to open the game with your browser of choice.');
}

const deadPool = []; // a pool of `kill`-ed copies for delaying frequent garbage collection
const copyTypeSymbol = Symbol('I am a ct.js copy');
setInterval(function cleanDeadPool() {
    deadPool.length = 0;
}, 1000 * 60);

/**
 * The ct.js library
 * @namespace
 */
const ct = {
    /**
     * A target number of frames per second. It can be interpreted as a second in timers.
     * @type {number}
     */
    speed: [60][0] || 60,
    templates: {},
    snd: {},
    stack: [],
    fps: [60][0] || 60,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * Use ct.delta to balance your movement and other calculations on different framerates by
     * multiplying it with your reference value.
     *
     * Note that `this.move()` already uses it, so there is no need to premultiply
     * `this.speed` with it.
     *
     * **A minimal example:**
     * ```js
     * this.x += this.windSpeed * ct.delta;
     * ```
     *
     * @template {number}
     */
    delta: 1,
    /**
     * A measure of how long a frame took time to draw, usually equal to 1 and larger on lags.
     * For example, if it is equal to 2, it means that the previous frame took twice as much time
     * compared to expected FPS rate.
     *
     * This is a version for UI elements, as it is not affected by time scaling, and thus works well
     * both with slow-mo effects and game pause.
     *
     * @template {number}
     */
    deltaUi: 1,
    /**
     * The camera that outputs its view to the renderer.
     * @template {Camera}
     */
    camera: null,
    /**
     * ct.js version in form of a string `X.X.X`.
     * @template {string}
     */
    version: '2.0.2',
    meta: [{"name":"","author":"","site":"","version":"0.0.0"}][0],
    get width() {
        return ct.pixiApp.renderer.view.width;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New width in pixels
     * @template {number}
     */
    set width(value) {
        ct.camera.width = ct.roomWidth = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(value, ct.height);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    },
    get height() {
        return ct.pixiApp.renderer.view.height;
    },
    /**
     * Resizes the drawing canvas and viewport to the given value in pixels.
     * When used with ct.fittoscreen, can be used to enlarge/shrink the viewport.
     * @param {number} value New height in pixels
     * @template {number}
     */
    set height(value) {
        ct.camera.height = ct.roomHeight = value;
        if (!ct.fittoscreen || ct.fittoscreen.mode === 'fastScale') {
            ct.pixiApp.renderer.resize(ct.width, value);
        }
        if (ct.fittoscreen) {
            ct.fittoscreen();
        }
        return value;
    }
};

// eslint-disable-next-line no-console
console.log(
    `%c 😺 %c ct.js game editor %c v${ct.version} %c https://ctjs.rocks/ `,
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;',
    'background: #446adb; color: #fff; padding: 0.5em 0;',
    'background: #5144db; color: #fff; padding: 0.5em 0;'
);

ct.highDensity = [true][0];
const pixiAppSettings = {
    width: [1920][0],
    height: [1080][0],
    antialias: ![true][0],
    powerPreference: 'high-performance',
    sharedTicker: false,
    sharedLoader: true
};
try {
    /**
     * The PIXI.Application that runs ct.js game
     * @template {PIXI.Application}
     */
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
} catch (e) {
    console.error(e);
    // eslint-disable-next-line no-console
    console.warn('[ct.js] Something bad has just happened. This is usually due to hardware problems. I\'ll try to fix them now, but if the game still doesn\'t run, try including a legacy renderer in the project\'s settings.');
    PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(PIXI.settings.SPRITE_MAX_TEXTURES, 16);
    ct.pixiApp = new PIXI.Application(pixiAppSettings);
}

PIXI.settings.ROUND_PIXELS = [true][0];
ct.pixiApp.ticker.maxFPS = [60][0] || 0;
if (!ct.pixiApp.renderer.options.antialias) {
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
}
/**
 * @template PIXI.Container
 */
ct.stage = ct.pixiApp.stage;
ct.pixiApp.renderer.autoDensity = ct.highDensity;
document.getElementById('ct').appendChild(ct.pixiApp.view);

/**
 * A library of different utility functions, mainly Math-related, but not limited to them.
 * @namespace
 */
ct.u = {
    /**
     * Get the environment the game runs on.
     * @returns {string} Either 'ct.ide', or 'nw', or 'electron', or 'browser'.
     */
    getEnvironment() {
        if (window.name === 'ct.js debugger') {
            return 'ct.ide';
        }
        try {
            if (nw.require) {
                return 'nw';
            }
        } catch (oO) {
            void 0;
        }
        try {
            require('electron');
            return 'electron';
        } catch (Oo) {
            void 0;
        }
        return 'browser';
    },
    /**
     * Get the current operating system the game runs on.
     * @returns {string} One of 'windows', 'darwin' (which is MacOS), 'linux', or 'unknown'.
     */
    getOS() {
        const ua = window.navigator.userAgent;
        if (ua.indexOf('Windows') !== -1) {
            return 'windows';
        }
        if (ua.indexOf('Linux') !== -1) {
            return 'linux';
        }
        if (ua.indexOf('Mac') !== -1) {
            return 'darwin';
        }
        return 'unknown';
    },
    /**
     * Returns the length of a vector projection onto an X axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldx(l, d) {
        return l * Math.cos(d * Math.PI / 180);
    },
    /**
     * Returns the length of a vector projection onto an Y axis.
     * @param {number} l The length of the vector
     * @param {number} d The direction of the vector
     * @returns {number} The length of the projection
     */
    ldy(l, d) {
        return l * Math.sin(d * Math.PI / 180);
    },
    /**
     * Returns the direction of a vector that points from the first point to the second one.
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The angle of the resulting vector, in degrees
     */
    pdn(x1, y1, x2, y2) {
        return (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 360) % 360;
    },
    // Point-point DistanCe
    /**
     * Returns the distance between two points
     * @param {number} x1 The x location of the first point
     * @param {number} y1 The y location of the first point
     * @param {number} x2 The x location of the second point
     * @param {number} y2 The y location of the second point
     * @returns {number} The distance between the two points
     */
    pdc(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    },
    /**
     * Convers degrees to radians
     * @param {number} deg The degrees to convert
     * @returns {number} The resulting radian value
     */
    degToRad(deg) {
        return deg * Math.PI / 180;
    },
    /**
     * Convers radians to degrees
     * @param {number} rad The radian value to convert
     * @returns {number} The resulting degree
     */
    radToDeg(rad) {
        return rad / Math.PI * 180;
    },
    /**
     * Rotates a vector (x; y) by `deg` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} deg The degree to rotate by
     * @returns {PIXI.Point} A pair of new `x` and `y` parameters.
     */
    rotate(x, y, deg) {
        return ct.u.rotateRad(x, y, ct.u.degToRad(deg));
    },
    /**
     * Rotates a vector (x; y) by `rad` around (0; 0)
     * @param {number} x The x component
     * @param {number} y The y component
     * @param {number} rad The radian value to rotate around
     * @returns {PIXI.Point} A pair of new `x` and `y` parameters.
     */
    rotateRad(x, y, rad) {
        const sin = Math.sin(rad),
              cos = Math.cos(rad);
        return new PIXI.Point(
            cos * x - sin * y,
            cos * y + sin * x
        );
    },
    /**
     * Gets the most narrow angle between two vectors of given directions
     * @param {number} dir1 The direction of the first vector
     * @param {number} dir2 The direction of the second vector
     * @returns {number} The resulting angle
     */
    deltaDir(dir1, dir2) {
        dir1 = ((dir1 % 360) + 360) % 360;
        dir2 = ((dir2 % 360) + 360) % 360;
        var t = dir1,
            h = dir2,
            ta = h - t;
        if (ta > 180) {
            ta -= 360;
        }
        if (ta < -180) {
            ta += 360;
        }
        return ta;
    },
    /**
     * Returns a number in between the given range (clamps it).
     * @param {number} min The minimum value of the given number
     * @param {number} val The value to fit in the range
     * @param {number} max The maximum value of the given number
     * @returns {number} The clamped value
     */
    clamp(min, val, max) {
        return Math.max(min, Math.min(max, val));
    },
    /**
     * Linearly interpolates between two values by the apha value.
     * Can also be describing as mixing between two values with a given proportion `alpha`.
     * @param {number} a The first value to interpolate from
     * @param {number} b The second value to interpolate to
     * @param {number} alpha The mixing value
     * @returns {number} The result of the interpolation
     */
    lerp(a, b, alpha) {
        return a + (b - a) * alpha;
    },
    /**
     * Returns the position of a given value in a given range. Opposite to linear interpolation.
     * @param  {number} a The first value to interpolate from
     * @param  {number} b The second value to interpolate top
     * @param  {number} val The interpolated values
     * @return {number} The position of the value in the specified range.
     * When a <= val <= b, the result will be inside the [0;1] range.
     */
    unlerp(a, b, val) {
        return (val - a) / (b - a);
    },
    /**
     * Re-maps the given value from one number range to another.
     * @param  {number} val The value to be mapped
     * @param  {number} inMin Lower bound of the value's current range
     * @param  {number} inMax Upper bound of the value's current range
     * @param  {number} outMin Lower bound of the value's target range
     * @param  {number} outMax Upper bound of the value's target range
     * @returns {number} The mapped value.
     */
    map(val, inMin, inMax, outMin, outMax) {
        return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    /**
     * Translates a point from UI space to game space.
     * @param {number} x The x coordinate in UI space.
     * @param {number} y The y coordinate in UI space.
     * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
     */
    uiToGameCoord(x, y) {
        return ct.camera.uiToGameCoord(x, y);
    },
    /**
     * Translates a point from fame space to UI space.
     * @param {number} x The x coordinate in game space.
     * @param {number} y The y coordinate in game space.
     * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
     */
    gameToUiCoord(x, y) {
        return ct.camera.gameToUiCoord(x, y);
    },
    hexToPixi(hex) {
        return Number('0x' + hex.slice(1));
    },
    pixiToHex(pixi) {
        return '#' + (pixi).toString(16).padStart(6, 0);
    },
    /**
     * Tests whether a given point is inside the given rectangle
     * (it can be either a copy or an array).
     * @param {number} x The x coordinate of the point.
     * @param {number} y The y coordinate of the point.
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a rectangular shape)
     * or an array in a form of [x1, y1, x2, y2], where (x1;y1) and (x2;y2) specify
     * the two opposite corners of the rectangle.
     * @returns {boolean} `true` if the point is inside the rectangle, `false` otherwise.
     */
    prect(x, y, arg) {
        var xmin, xmax, ymin, ymax;
        if (arg.splice) {
            xmin = Math.min(arg[0], arg[2]);
            xmax = Math.max(arg[0], arg[2]);
            ymin = Math.min(arg[1], arg[3]);
            ymax = Math.max(arg[1], arg[3]);
        } else {
            xmin = arg.x - arg.shape.left * arg.scale.x;
            xmax = arg.x + arg.shape.right * arg.scale.x;
            ymin = arg.y - arg.shape.top * arg.scale.y;
            ymax = arg.y + arg.shape.bottom * arg.scale.y;
        }
        return x >= xmin && y >= ymin && x <= xmax && y <= ymax;
    },
    /**
     * Tests whether a given point is inside the given circle (it can be either a copy or an array)
     * @param {number} x The x coordinate of the point
     * @param {number} y The y coordinate of the point
     * @param {(Copy|Array<Number>)} arg Either a copy (it must have a circular shape)
     * or an array in a form of [x1, y1, r], where (x1;y1) define the center of the circle
     * and `r` defines the radius of it.
     * @returns {boolean} `true` if the point is inside the circle, `false` otherwise
     */
    pcircle(x, y, arg) {
        if (arg.splice) {
            return ct.u.pdc(x, y, arg[0], arg[1]) < arg[2];
        }
        return ct.u.pdc(0, 0, (arg.x - x) / arg.scale.x, (arg.y - y) / arg.scale.y) < arg.shape.r;
    },
    /**
     * Copies all the properties of the source object to the destination object.
     * This is **not** a deep copy. Useful for extending some settings with default values,
     * or for combining data.
     * @param {object} o1 The destination object
     * @param {object} o2 The source object
     * @param {any} [arr] An optional array of properties to copy. If not specified,
     * all the properties will be copied.
     * @returns {object} The modified destination object
     */
    ext(o1, o2, arr) {
        if (arr) {
            for (const i in arr) {
                if (o2[arr[i]]) {
                    o1[arr[i]] = o2[arr[i]];
                }
            }
        } else {
            for (const i in o2) {
                o1[i] = o2[i];
            }
        }
        return o1;
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer is run in gameplay time scale, meaning that it is affected by time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    wait(time) {
        return ct.timer.add(time);
    },
    /**
     * Returns a Promise that resolves after the given time.
     * This timer runs in UI time scale and is not sensitive to time stretching.
     * @param {number} time Time to wait, in milliseconds
     * @returns {CtTimer} The timer, which you can call `.then()` to
     */
    waitUi(time) {
        return ct.timer.addUi(time);
    },
    /**
     * Creates a new function that returns a promise, based
     * on a function with a regular (err, result) => {...} callback.
     * @param {Function} f The function that needs to be promisified
     * @see https://javascript.info/promisify
     */
    promisify(f) {
        // eslint-disable-next-line func-names
        return function (...args) {
            return new Promise((resolve, reject) => {
                const callback = function callback(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                };
                args.push(callback);
                f.call(this, ...args);
            });
        };
    },
    required(paramName, method) {
        let str = 'The parameter ';
        if (paramName) {
            str += `${paramName} `;
        }
        if (method) {
            str += `of ${method} `;
        }
        str += 'is required.';
        throw new Error(str);
    },
    numberedString(prefix, input) {
        return prefix + '_' + input.toString().padStart(2, '0');
    },
    getStringNumber(str) {
        return Number(str.split('_').pop());
    }
};
ct.u.ext(ct.u, {// make aliases
    getOs: ct.u.getOS,
    lengthDirX: ct.u.ldx,
    lengthDirY: ct.u.ldy,
    pointDirection: ct.u.pdn,
    pointDistance: ct.u.pdc,
    pointRectangle: ct.u.prect,
    pointCircle: ct.u.pcircle,
    extend: ct.u.ext
});

// eslint-disable-next-line max-lines-per-function
(() => {
    const killRecursive = copy => {
        copy.kill = true;
        if (copy.onDestroy) {
            ct.templates.onDestroy.apply(copy);
            copy.onDestroy.apply(copy);
        }
        for (const child of copy.children) {
            if (child[copyTypeSymbol]) {
                killRecursive(child);
            }
        }
        const stackIndex = ct.stack.indexOf(copy);
        if (stackIndex !== -1) {
            ct.stack.splice(stackIndex, 1);
        }
        if (copy.template) {
            const templatelistIndex = ct.templates.list[copy.template].indexOf(copy);
            if (templatelistIndex !== -1) {
                ct.templates.list[copy.template].splice(templatelistIndex, 1);
            }
        }
        deadPool.push(copy);
    };
    const manageCamera = () => {
        if (ct.camera) {
            ct.camera.update(ct.delta);
            ct.camera.manageStage();
        }
    };

    ct.loop = function loop(delta) {
        ct.delta = delta;
        ct.deltaUi = ct.pixiApp.ticker.elapsedMS / (1000 / (ct.pixiApp.ticker.maxFPS || 60));
        ct.inputs.updateActions();
        ct.timer.updateTimers();
        ct.place.debugTraceGraphics.clear();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.templates.beforeStep.apply(ct.stack[i]);
            ct.stack[i].onStep.apply(ct.stack[i]);
            ct.templates.afterStep.apply(ct.stack[i]);
        }
        // There may be a number of rooms stacked on top of each other.
        // Loop through them and filter out everything that is not a room.
        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeStep.apply(item);
            item.onStep.apply(item);
            ct.rooms.afterStep.apply(item);
        }
        // copies
        for (const copy of ct.stack) {
            // eslint-disable-next-line no-underscore-dangle
            if (copy.kill && !copy._destroyed) {
                killRecursive(copy); // This will also allow a parent to eject children
                                     // to a new container before they are destroyed as well
                copy.destroy({
                    children: true
                });
            }
        }

        for (const cont of ct.stage.children) {
            cont.children.sort((a, b) =>
                ((a.depth || 0) - (b.depth || 0)) || ((a.uid || 0) - (b.uid || 0)) || 0);
        }

        manageCamera();

        for (let i = 0, li = ct.stack.length; i < li; i++) {
            ct.templates.beforeDraw.apply(ct.stack[i]);
            ct.stack[i].onDraw.apply(ct.stack[i]);
            ct.templates.afterDraw.apply(ct.stack[i]);
            ct.stack[i].xprev = ct.stack[i].x;
            ct.stack[i].yprev = ct.stack[i].y;
        }

        for (const item of ct.stage.children) {
            if (!(item instanceof Room)) {
                continue;
            }
            ct.rooms.beforeDraw.apply(item);
            item.onDraw.apply(item);
            ct.rooms.afterDraw.apply(item);
        }
        /*%afterframe%*/
        if (ct.rooms.switching) {
            ct.rooms.forceSwitch();
        }
    };
})();




/**
 * @property {number} value The current value of an action. It is always in the range from -1 to 1.
 * @property {string} name The name of the action.
 */
class CtAction {
    /**
     * This is a custom action defined in the Settings tab → Edit actions section.
     * Actions are used to abstract different input methods into one gameplay-related interface:
     * for example, joystick movement, WASD keys and arrows can be turned into two actions:
     * `MoveHorizontally` and `MoveVertically`.
     * @param {string} name The name of the new action.
     */
    constructor(name) {
        this.name = name;
        this.methodCodes = [];
        this.methodMultipliers = [];
        this.prevValue = 0;
        this.value = 0;
        return this;
    }
    /**
     * Checks whether the current action listens to a given input method.
     * This *does not* check whether this input method is supported by ct.
     *
     * @param {string} code The code to look up.
     * @returns {boolean} `true` if it exists, `false` otherwise.
     */
    methodExists(code) {
        return this.methodCodes.indexOf(code) !== -1;
    }
    /**
     * Adds a new input method to listen.
     *
     * @param {string} code The input method's code to listen to. Must be unique per action.
     * @param {number} [multiplier] An optional multiplier, e.g. to flip its value.
     * Often used with two buttons to combine them into a scalar input identical to joysticks.
     * @returns {void}
     */
    addMethod(code, multiplier) {
        if (this.methodCodes.indexOf(code) === -1) {
            this.methodCodes.push(code);
            this.methodMultipliers.push(multiplier !== void 0 ? multiplier : 1);
        } else {
            throw new Error(`[ct.inputs] An attempt to add an already added input "${code}" to an action "${name}".`);
        }
    }
    /**
     * Removes the provided input method for an action.
     *
     * @param {string} code The input method to remove.
     * @returns {void}
     */
    removeMethod(code) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodCodes.splice(ind, 1);
            this.methodMultipliers.splice(ind, 1);
        }
    }
    /**
     * Changes the multiplier for an input method with the provided code.
     * This method will produce a warning if one is trying to change an input method
     * that is not listened by this action.
     *
     * @param {string} code The input method's code to change
     * @param {number} multiplier The new value
     * @returns {void}
     */
    setMultiplier(code, multiplier) {
        const ind = this.methodCodes.indexOf(code);
        if (ind !== -1) {
            this.methodMultipliers[ind] = multiplier;
        } else {
            // eslint-disable-next-line no-console
            console.warning(`[ct.inputs] An attempt to change multiplier of a non-existent method "${code}" at event ${this.name}`);
            // eslint-disable-next-line no-console
            console.trace();
        }
    }
    /**
     * Recalculates the digital value of an action.
     *
     * @returns {number} A scalar value between -1 and 1.
     */
    update() {
        this.prevValue = this.value;
        this.value = 0;
        for (let i = 0, l = this.methodCodes.length; i < l; i++) {
            const rawValue = ct.inputs.registry[this.methodCodes[i]] || 0;
            this.value += rawValue * this.methodMultipliers[i];
        }
        this.value = Math.max(-1, Math.min(this.value, 1));
    }
    /**
     * Resets the state of this action, setting its value to `0`
     * and its pressed, down, released states to `false`.
     *
     * @returns {void}
     */
    reset() {
        this.prevValue = this.value = 0;
    }
    /**
     * Returns whether the action became active in the current frame,
     * either by a button just pressed or by using a scalar input.
     *
     * `true` for being pressed and `false` otherwise
     * @type {boolean}
     */
    get pressed() {
        return this.prevValue === 0 && this.value !== 0;
    }
    /**
     * Returns whether the action became inactive in the current frame,
     * either by releasing all buttons or by resting all scalar inputs.
     *
     * `true` for being released and `false` otherwise
     * @type {boolean}
     */
    get released() {
        return this.prevValue !== 0 && this.value === 0;
    }
    /**
     * Returns whether the action is active, e.g. by a pressed button
     * or a currently used scalar input.
     *
     * `true` for being active and `false` otherwise
     * @type {boolean}
     */
    get down() {
        return this.value !== 0;
    }
    /* In case you need to be hated for the rest of your life, uncomment this */
    /*
    valueOf() {
        return this.value;
    }
    */
}

/**
 * A list of custom Actions. They are defined in the Settings tab → Edit actions section.
 * @type {Object.<string,CtAction>}
 */
ct.actions = {};
/**
 * @namespace
 */
ct.inputs = {
    registry: {},
    /**
     * Adds a new action and puts it into `ct.actions`.
     *
     * @param {string} name The name of an action, as it will be used in `ct.actions`.
     * @param {Array<Object>} methods A list of input methods. This list can be changed later.
     * @returns {CtAction} The created action
     */
    addAction(name, methods) {
        if (name in ct.actions) {
            throw new Error(`[ct.inputs] An action "${name}" already exists, can't add a new one with the same name.`);
        }
        const action = new CtAction(name);
        for (const method of methods) {
            action.addMethod(method.code, method.multiplier);
        }
        ct.actions[name] = action;
        return action;
    },
    /**
     * Removes an action with a given name.
     * @param {string} name The name of an action
     * @returns {void}
     */
    removeAction(name) {
        delete ct.actions[name];
    },
    /**
     * Recalculates values for every action in a game.
     * @returns {void}
     */
    updateActions() {
        for (const i in ct.actions) {
            ct.actions[i].update();
        }
    }
};

ct.inputs.addAction('MoveX', [{"code":"keyboard.KeyD"},{"code":"keyboard.KeyA","multiplier":-1},{"code":"keyboard.ArrowRight"},{"code":"keyboard.ArrowLeft","multiplier":-1},{"code":"gamepad.Right"},{"code":"gamepad.Left","multiplier":-1},{"code":"gamepad.LStickX"},{"code":"vkeys.Vjoy1X"}]);
ct.inputs.addAction('MoveY', [{"code":"keyboard.KeyW","multiplier":-1},{"code":"keyboard.KeyS"},{"code":"keyboard.ArrowUp","multiplier":-1},{"code":"keyboard.ArrowDown"},{"code":"gamepad.Up","multiplier":-1},{"code":"gamepad.Down"},{"code":"gamepad.LStickY"},{"code":"vkeys.Vjoy1Y"}]);
ct.inputs.addAction('Press', [{"code":"pointer.Any"}]);


/**
 * @typedef IRoomMergeResult
 *
 * @property {Array<Copy>} copies
 * @property {Array<Tilemap>} tileLayers
 * @property {Array<Background>} backgrounds
 */

class Room extends PIXI.Container {
    static getNewId() {
        this.roomId++;
        return this.roomId;
    }

    constructor(template) {
        super();
        this.x = this.y = 0;
        this.uid = Room.getNewId();
        this.tileLayers = [];
        this.backgrounds = [];
        if (!ct.room) {
            ct.room = ct.rooms.current = this;
        }
        if (template) {
            if (template.extends) {
                ct.u.ext(this, template.extends);
            }
            this.onCreate = template.onCreate;
            this.onStep = template.onStep;
            this.onDraw = template.onDraw;
            this.onLeave = template.onLeave;
            this.template = template;
            this.name = template.name;
            if (this === ct.room) {
                ct.pixiApp.renderer.backgroundColor = ct.u.hexToPixi(this.template.backgroundColor);
            }
            ct.fittoscreen();
if (this === ct.room) {
    ct.place.tileGrid = {};
}

            for (let i = 0, li = template.bgs.length; i < li; i++) {
                // Need to put extensions here, so we don't use ct.backgrounds.add
                const bg = new ct.templates.Background(
                    template.bgs[i].texture,
                    null,
                    template.bgs[i].depth,
                    template.bgs[i].extends
                );
                this.addChild(bg);
            }
            for (let i = 0, li = template.tiles.length; i < li; i++) {
                const tl = new Tilemap(template.tiles[i]);
                tl.cache();
                this.tileLayers.push(tl);
                this.addChild(tl);
            }
            for (let i = 0, li = template.objects.length; i < li; i++) {
                const exts = template.objects[i].exts || {};
                ct.templates.copyIntoRoom(
                    template.objects[i].template,
                    template.objects[i].x,
                    template.objects[i].y,
                    this,
                    {
                        tx: template.objects[i].tx,
                        ty: template.objects[i].ty,
                        tr: template.objects[i].tr,
                        ...exts
                    }
                );
            }
        }
        return this;
    }
    get x() {
        return -this.position.x;
    }
    set x(value) {
        this.position.x = -value;
        return value;
    }
    get y() {
        return -this.position.y;
    }
    set y(value) {
        this.position.y = -value;
        return value;
    }
}
Room.roomId = 0;

(function roomsAddon() {
    /* global deadPool */
    var nextRoom;
    /**
     * @namespace
     */
    ct.rooms = {
        templates: {},
        /**
         * An object that contains arrays of currently present rooms.
         * These include the current room (`ct.room`), as well as any rooms
         * appended or prepended through `ct.rooms.append` and `ct.rooms.prepend`.
         * @type {Object.<string,Array<Room>>}
         */
        list: {},
        /**
         * Creates and adds a background to the current room, at the given depth.
         * @param {string} texture The name of the texture to use
         * @param {number} depth The depth of the new background
         * @returns {Background} The created background
         */
        addBg(texture, depth) {
            const bg = new ct.templates.Background(texture, null, depth);
            ct.room.addChild(bg);
            return bg;
        },
        /**
         * Adds a new empty tile layer to the room, at the given depth
         * @param {number} layer The depth of the layer
         * @returns {Tileset} The created tile layer
         * @deprecated Use ct.tilemaps.create instead.
         */
        addTileLayer(layer) {
            return ct.tilemaps.create(layer);
        },
        /**
         * Clears the current stage, removing all rooms with copies, tile layers, backgrounds,
         * and other potential entities.
         * @returns {void}
         */
        clear() {
            ct.stage.children = [];
            ct.stack = [];
            for (const i in ct.templates.list) {
                ct.templates.list[i] = [];
            }
            for (const i in ct.backgrounds.list) {
                ct.backgrounds.list[i] = [];
            }
            ct.rooms.list = {};
            for (const name in ct.rooms.templates) {
                ct.rooms.list[name] = [];
            }
        },
        /**
         * This method safely removes a previously appended/prepended room from the stage.
         * It will trigger "On Leave" for a room and "On Destroy" event
         * for all the copies of the removed room.
         * The room will also have `this.kill` set to `true` in its event, if it comes in handy.
         * This method cannot remove `ct.room`, the main room.
         * @param {Room} room The `room` argument must be a reference
         * to the previously created room.
         * @returns {void}
         */
        remove(room) {
            if (!(room instanceof Room)) {
                if (typeof room === 'string') {
                    throw new Error('[ct.rooms] To remove a room, you should provide a reference to it (to an object), not its name. Provided value:', room);
                }
                throw new Error('[ct.rooms] An attempt to remove a room that is not actually a room! Provided value:', room);
            }
            const ind = ct.rooms.list[room.name];
            if (ind !== -1) {
                ct.rooms.list[room.name].splice(ind, 1);
            } else {
                // eslint-disable-next-line no-console
                console.warn('[ct.rooms] Removing a room that was not found in ct.rooms.list. This is strange…');
            }
            room.kill = true;
            ct.stage.removeChild(room);
            for (const copy of room.children) {
                copy.kill = true;
            }
            room.onLeave();
            ct.rooms.onLeave.apply(room);
        },
        /*
         * Switches to the given room. Note that this transition happens at the end
         * of the frame, so the name of a new room may be overridden.
         */
        'switch'(roomName) {
            if (ct.rooms.templates[roomName]) {
                nextRoom = roomName;
                ct.rooms.switching = true;
            } else {
                console.error('[ct.rooms] The room "' + roomName + '" does not exist!');
            }
        },
        switching: false,
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` after all the other rooms.
         * @param {string} roomName The name of the room to be appended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        append(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] append failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChild(room);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Creates a new room and adds it to the stage, separating its draw stack
         * from existing ones.
         * This room is added to `ct.stage` before all the other rooms.
         * @param {string} roomName The name of the room to be prepended
         * @param {object} [exts] Any additional parameters applied to the new room.
         * Useful for passing settings and data to new widgets and prefabs.
         * @returns {Room} A newly created room
         */
        prepend(roomName, exts) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] prepend failed: the room ${roomName} does not exist!`);
                return false;
            }
            const room = new Room(ct.rooms.templates[roomName]);
            if (exts) {
                ct.u.ext(room, exts);
            }
            ct.stage.addChildAt(room, 0);
            room.onCreate();
            ct.rooms.onCreate.apply(room);
            ct.rooms.list[roomName].push(room);
            return room;
        },
        /**
         * Merges a given room into the current one. Skips room's OnCreate event.
         *
         * @param {string} roomName The name of the room that needs to be merged
         * @returns {IRoomMergeResult} Arrays of created copies, backgrounds, tile layers,
         * added to the current room (`ct.room`). Note: it does not get updated,
         * so beware of memory leaks if you keep a reference to this array for a long time!
         */
        merge(roomName) {
            if (!(roomName in ct.rooms.templates)) {
                console.error(`[ct.rooms] merge failed: the room ${roomName} does not exist!`);
                return false;
            }
            const generated = {
                copies: [],
                tileLayers: [],
                backgrounds: []
            };
            const template = ct.rooms.templates[roomName];
            const target = ct.room;
            for (const t of template.bgs) {
                const bg = new ct.templates.Background(t.texture, null, t.depth, t.extends);
                target.backgrounds.push(bg);
                target.addChild(bg);
                generated.backgrounds.push(bg);
            }
            for (const t of template.tiles) {
                const tl = new Tilemap(t);
                target.tileLayers.push(tl);
                target.addChild(tl);
                generated.tileLayers.push(tl);
                tl.cache();
            }
            for (const t of template.objects) {
                const c = ct.templates.copyIntoRoom(t.template, t.x, t.y, target, {
                    tx: t.tx || 1,
                    ty: t.ty || 1,
                    tr: t.tr || 0
                });
                generated.copies.push(c);
            }
            return generated;
        },
        forceSwitch(roomName) {
            if (nextRoom) {
                roomName = nextRoom;
            }
            if (ct.room) {
                ct.room.onLeave();
                ct.rooms.onLeave.apply(ct.room);
                ct.room = void 0;
            }
            ct.rooms.clear();
            deadPool.length = 0;
            var template = ct.rooms.templates[roomName];
            ct.roomWidth = template.width;
            ct.roomHeight = template.height;
            ct.camera = new Camera(
                ct.roomWidth / 2,
                ct.roomHeight / 2,
                ct.roomWidth,
                ct.roomHeight
            );
            if (template.cameraConstraints) {
                ct.camera.minX = template.cameraConstraints.x1;
                ct.camera.maxX = template.cameraConstraints.x2;
                ct.camera.minY = template.cameraConstraints.y1;
                ct.camera.maxY = template.cameraConstraints.y2;
            }
            ct.pixiApp.renderer.resize(template.width, template.height);
            ct.rooms.current = ct.room = new Room(template);
            ct.stage.addChild(ct.room);
            ct.room.onCreate();
            ct.rooms.onCreate.apply(ct.room);
            ct.rooms.list[roomName].push(ct.room);
            
            ct.camera.manageStage();
            ct.rooms.switching = false;
            nextRoom = void 0;
        },
        onCreate() {
            if (this === ct.room) {
    const debugTraceGraphics = new PIXI.Graphics();
    debugTraceGraphics.depth = 10000000; // Why not. Overlap everything.
    ct.room.addChild(debugTraceGraphics);
    ct.place.debugTraceGraphics = debugTraceGraphics;
}
for (const layer of this.tileLayers) {
    if (this.children.indexOf(layer) === -1) {
        continue;
    }
    ct.place.enableTilemapCollisions(layer);
}

        },
        onLeave() {
            if (this === ct.room) {
    ct.place.grid = {};
}
/* global ct */

if (!this.kill) {
    for (var tween of ct.tween.tweens) {
        tween.reject({
            info: 'Room switch',
            code: 1,
            from: 'ct.tween'
        });
    }
    ct.tween.tweens = [];
}

        },
        /**
         * The name of the starting room, as it was set in ct.IDE.
         * @type {string}
         */
        starting: 'Lobby'
    };
})();
/**
 * The current room
 * @type {Room}
 */
ct.room = null;

ct.rooms.beforeStep = function beforeStep() {
    ct.pointer.updateGestures();
var i = 0;
while (i < ct.tween.tweens.length) {
    var tween = ct.tween.tweens[i];
    if (tween.obj.kill) {
        tween.reject({
            code: 2,
            info: 'Copy is killed'
        });
        ct.tween.tweens.splice(i, 1);
        continue;
    }
    var a = tween.timer.time / tween.duration;
    if (a > 1) {
        a = 1;
    }
    for (var field in tween.fields) {
        var s = tween.starting[field],
            d = tween.fields[field] - tween.starting[field];
        tween.obj[field] = tween.curve(s, d, a);
    }
    if (a === 1) {
        tween.resolve(tween.fields);
        ct.tween.tweens.splice(i, 1);
        continue;
    }
    i++;
}

};
ct.rooms.afterStep = function afterStep() {
    
};
ct.rooms.beforeDraw = function beforeDraw() {
    
};
ct.rooms.afterDraw = function afterDraw() {
    for (const pointer of ct.pointer.down) {
    pointer.xprev = pointer.x;
    pointer.yprev = pointer.y;
    pointer.xuiprev = pointer.x;
    pointer.yuiprev = pointer.y;
}
for (const pointer of ct.pointer.hover) {
    pointer.xprev = pointer.x;
    pointer.yprev = pointer.y;
    pointer.xuiprev = pointer.x;
    pointer.yuiprev = pointer.y;
}
ct.inputs.registry['pointer.Wheel'] = 0;
ct.pointer.clearReleased();
ct.pointer.xmovement = ct.pointer.ymovement = 0;
if (ct.sound.follow && !ct.sound.follow.kill) {
    ct.sound.howler.pos(
        ct.sound.follow.x,
        ct.sound.follow.y,
        ct.sound.useDepth ? ct.sound.follow.z : 0
    );
} else if (ct.sound.manageListenerPosition) {
    ct.sound.howler.pos(ct.camera.x, ct.camera.y, ct.camera.z || 0);
}
ct.keyboard.clear();

};


ct.rooms.templates['Game'] = {
    name: 'Game',
    width: 2560,
    height: 1440,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":675,"y":120,"exts":{},"tx":1,"ty":1,"template":"1200px-Checkerboard_pattern.svg"},{"x":675,"y":120,"exts":{},"tx":1,"ty":1,"template":"Coin"},{"x":2240,"y":256,"exts":{},"tx":5,"ty":5,"template":"Data"},{"x":674,"y":1325,"exts":{"mode":"1"},"template":"Letters"},{"x":674,"y":1325,"exts":{"mode":"0"},"template":"Letters"},{"x":128,"y":1152,"exts":{},"template":"Submit"},{"x":128,"y":896,"exts":{},"template":"WarpText"},{"x":512,"y":960,"exts":{},"tx":0.17655172413793102,"ty":0.17655172413793102,"template":"YesNo"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#FFFFFF',
    
    onStep() {
        

let m = ct.pointer

let pos = 4*((Math.round(m.x)) + (Math.round(m.y) * this.width))

//console.log([pos, this.pixels[pos], this.pixels[pos + 1], this.pixels[pos + 2], this.pixels[pos + 3], this.pixels.length])
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        let board = ct.templates.list['1200px-Checkerboard_pattern.svg'][0]
let coin = ct.templates.list['Coin'][0]
this.board = board
this.coin = coin
board.walls = []
let start = board.position
let size = 240
let offset = 5

this.activeBox = null
this.warpMode = false

let rng = Array(12).fill(true).concat(Array(48).fill(false)).map((v,i) => {return {i, value:v}})
rng.sort((a,b) => toValue(a.i) - toValue(b.i))
let rng_set = rng.map((r)=>r.value)
console.log(rng_set)
let count = 0;
let i_o;
//console.log(Object.keys(rng).count(true))

this.r = ct.pixiApp.renderer
this.pixels = this.r.extract.pixels(this)

if (Nakama.state.match === null){
    console.log("waiting for match id")
}
Array(11).fill(null).forEach((r,i_r) => {
    //console.log(rng)
    i_o = !(i_r % 2)
    board.grid.push([false])
    if (i_o){board.grid[i_r].push(false)}
    Array(6-i_o).fill(null).forEach((c,i_c) => {
        let wall = ct.templates.copy('Wall', size*(i_r/2)+start.x+(offset*(i_o))-(size/2*(!i_o)), size*i_c+start.y+(offset*(-1+2*i_o)), {enabled: rng_set[count]})
        wall.code = `${2*(i_c+1)-1+i_o}:${i_r+1}`
        changeColor(wall.colorFilter,1,!wall.enabled,!wall.enabled,3) //* 3x Alpha, one for each channel /
        //wall.rotation = Math.PI/2 *i_o
        if (i_o){ // This method is prefered over roation as it doesn't cause weird inf values with ct.pointer
            [wall.width, wall.height] = [wall.height, wall.width]
            wall.x -= 10; wall.y -= 5
        }
        //i_o ? wall.y += wall.width * 0.1 : wall.x += wall.width * 0.1
        //wall.width *= 0.9
        board.grid[i_r].push(wall)
        board.grid[i_r].push(!i_o)
        count += 1

    })
    if (!i_o){board.grid[i_r].pop(board.grid[i_r].length)}
    board.grid[i_r].push(false)
    
})
board.grid.unshift(Array(11+2).fill(false))
board.grid.push(Array(11+2).fill(false))

board.grid = rotate(board.grid)

console.log(board.grid)

///               ///
///* CLICK GRID *///
///              ///

Array(5).fill(null).forEach((_,i_x)=>{
    Array(5).fill(null).forEach((_,i_y) => {
        ct.templates.copy("Grid_Button", board.x + (240*i_x) + 120, board.y + (240*i_y) + 120, {grid: {x: i_x, y: i_y}})
    })
})


this.updateCards = (m) => {
    ct.templates.list['Match_Card'].forEach((x) => {x.kill = true;x.alpha = 0;console.log(`GO AWAY ${x}${m}`)})
    //let keys = (!Nakama.state.debug)? Object.keys(Nakama.state.players).filter((x)=>x!==Nakama.session.user_id) : Object.keys(Nakama.state.players)
    let keys = Object.keys(Nakama.state.players)
    keys.forEach((p, i)=>{
        ct.templates.copy('Match_Card', 
                            2112,
                            448 + (64*i),
                            {   
                                
                                user_id: p,
                                match: {
                                    match_id: Nakama.state.players[p],
                                    size: ""
                                },
                                clickable: false,
                                fontSize: 25
                                
                            }
                        )
        })
}



ct.rooms.append('Game_UI', {isUi: true})
    },
    extends: {}
}
ct.rooms.templates['Room_1JQRGN'] = {
    name: 'Room_1JQRGN',
    width: 1280,
    height: 720,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":320,"y":128,"exts":{},"template":"bg2"},{"x":0,"y":0,"exts":{},"template":"bg2"}]'),
    bgs: JSON.parse('[{"depth":0,"texture":"bg","extends":{}}]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        let r = ct.pixiApp.renderer
let pixels = r.extract.pixels(this)

let m = ct.pointer

let n = (4 * ((0) + (63*this.width)))
console.log(pixels[0+n],pixels[1+n],pixels[2+n],pixels[3+n])

let pos = 4*((Math.round(m.x)) + (Math.round(m.y) * this.width))

console.log([pos, pixels[pos], pixels[pos + 1], pixels[pos + 2], pixels[pos + 3], pixels.length])
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {}
}
ct.rooms.templates['Lobby'] = {
    name: 'Lobby',
    width: 1920,
    height: 1080,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":256,"y":64,"exts":{"frame":"0"},"template":"Match Buttons"},{"x":480,"y":96,"exts":{},"template":"refresh"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        
    },
    onLeave() {
        
    },
    onCreate() {
        this.welcome = this.addChild(new PIXI.Text(`Welcome Anonymous!`))
this.welcome.x = 640
this.welcome.y = 80
this.welcome.glow = ct.filters.addGlow(this.welcome)
this.welcome.glow.innerStrength = 10
this.welcome.glow.outerStrength = 0

this.getMatches = (f=null) => {
    ct.templates.list['Match_Card'].forEach((x) => x.destroy = true)
    getMatches()
        .then((x)=>{
                    Nakama.state.loading = false
                    this.matches=x;
                    if (x){
                        x.forEach((m, i)=>{
                        
                        ct.templates.copy('Match_Card', 
                                            256 + ((256 + 64) * Math.floor(i/11)),
                                            192 + (64 * (i % 11)),
                                            {match: m}
                                        )
                        })
                    }
                    
                })
        .then(() => {if (f){f()}})
}

//this.getMatches()
    },
    extends: {}
}
ct.rooms.templates['Game_UI'] = {
    name: 'Game_UI',
    width: 960,
    height: 540,
    /* JSON.parse allows for a much faster loading of big objects */
    objects: JSON.parse('[{"x":128,"y":128,"exts":{"orientation":"w"},"tx":2,"ty":2,"template":"toLobby"}]'),
    bgs: JSON.parse('[]'),
    tiles: JSON.parse('[{"depth":-10,"tiles":[],"extends":{}}]'),
    backgroundColor: '#000000',
    
    onStep() {
        
    },
    onDraw() {
        //ct.camera.realign(this);
    },
    onLeave() {
        
    },
    onCreate() {
        
    },
    extends: {
    "isUi": true
}
}


/**
 * @namespace
 */
ct.styles = {
    types: { },
    /**
     * Creates a new style with a given name.
     * Technically, it just writes `data` to `ct.styles.types`
     */
    new(name, styleTemplate) {
        ct.styles.types[name] = styleTemplate;
        return styleTemplate;
    },
    /**
     * Returns a style of a given name. The actual behavior strongly depends on `copy` parameter.
     * @param {string} name The name of the style to load
     * @param {boolean|Object} [copy] If not set, returns the source style object.
     * Editing it will affect all new style calls.
     * When set to `true`, will create a new object, which you can safely modify
     * without affecting the source style.
     * When set to an object, this will create a new object as well,
     * augmenting it with given properties.
     * @returns {object} The resulting style
     */
    get(name, copy) {
        if (copy === true) {
            return ct.u.ext({}, ct.styles.types[name]);
        }
        if (copy) {
            return ct.u.ext(ct.u.ext({}, ct.styles.types[name]), copy);
        }
        return ct.styles.types[name];
    }
};

ct.styles.new(
    "matchid",
    {
    "fontFamily": "verdana",
    "fontSize": 10,
    "fontStyle": "normal",
    "fontWeight": "800",
    "align": "center",
    "lineJoin": "round",
    "lineHeight": 13.5,
    "strokeThickness": 0,
    "stroke": "#000000"
});



/**
 * @extends {PIXI.AnimatedSprite}
 * @class
 * @property {string} template The name of the template from which the copy was created
 * @property {IShapeTemplate} shape The collision shape of a copy
 * @property {number} depth The relative position of a copy in a drawing stack.
 * Higher values will draw the copy on top of those with lower ones
 * @property {number} xprev The horizontal location of a copy in the previous frame
 * @property {number} yprev The vertical location of a copy in the previous frame
 * @property {number} xstart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.templates.copy`.
 * @property {number} ystart The starting location of a copy,
 * meaning the point where it was created — either by placing it in a room with ct.IDE
 * or by calling `ct.templates.copy`.
 * @property {number} hspeed The horizontal speed of a copy
 * @property {number} vspeed The vertical speed of a copy
 * @property {number} gravity The acceleration that pulls a copy at each frame
 * @property {number} gravityDir The direction of acceleration that pulls a copy at each frame
 * @property {number} depth The position of a copy in draw calls
 * @property {boolean} kill If set to `true`, the copy will be destroyed by the end of a frame.
 */
const Copy = (function Copy() {
    const textureAccessor = Symbol('texture');
    const zeroDirectionAccessor = Symbol('zeroDirection');
    const hspeedAccessor = Symbol('hspeed');
    const vspeedAccessor = Symbol('vspeed');
    let uid = 0;
    class Copy extends PIXI.AnimatedSprite {
        /**
         * Creates an instance of Copy.
         * @param {string} template The name of the template to copy
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object with additional properties
         * that will exist prior to a copy's OnCreate event
         * @param {PIXI.DisplayObject|Room} [container] A container to set as copy's parent
         * before its OnCreate event. Defaults to ct.room.
         * @memberof Copy
         */
        constructor(template, x, y, exts, container) {
            container = container || ct.room;
            var t;
            if (template) {
                if (!(template in ct.templates.templates)) {
                    throw new Error(`[ct.templates] An attempt to create a copy of a non-existent template \`${template}\` detected. A typo?`);
                }
                t = ct.templates.templates[template];
                if (t.texture && t.texture !== '-1') {
                    const textures = ct.res.getTexture(t.texture);
                    super(textures);
                    this[textureAccessor] = t.texture;
                    this.anchor.x = textures[0].defaultAnchor.x;
                    this.anchor.y = textures[0].defaultAnchor.y;
                } else {
                    super([PIXI.Texture.EMPTY]);
                }
                this.template = template;
                this.parent = container;
                this.blendMode = t.blendMode || PIXI.BLEND_MODES.NORMAL;
                if (t.playAnimationOnStart) {
                    this.play();
                }
                if (t.extends) {
                    ct.u.ext(this, t.extends);
                }
            } else {
                super([PIXI.Texture.EMPTY]);
            }
            // it is defined in main.js
            // eslint-disable-next-line no-undef
            this[copyTypeSymbol] = true;
            this.position.set(x || 0, y || 0);
            this.xprev = this.xstart = this.x;
            this.yprev = this.ystart = this.y;
            this[hspeedAccessor] = 0;
            this[vspeedAccessor] = 0;
            this[zeroDirectionAccessor] = 0;
            this.speed = this.direction = this.gravity = 0;
            this.gravityDir = 90;
            this.depth = 0;
            if (exts) {
                ct.u.ext(this, exts);
                if (exts.tx) {
                    this.scale.x = exts.tx;
                }
                if (exts.ty) {
                    this.scale.y = exts.ty;
                }
                if (exts.tr) {
                    this.angle = exts.tr;
                }
            }
            this.uid = ++uid;
            if (template) {
                ct.u.ext(this, {
                    template,
                    depth: t.depth,
                    onStep: t.onStep,
                    onDraw: t.onDraw,
                    onCreate: t.onCreate,
                    onDestroy: t.onDestroy,
                    shape: ct.res.getTextureShape(t.texture || -1)
                });
                if (exts && exts.depth !== void 0) {
                    this.depth = exts.depth;
                }
                if (ct.templates.list[template]) {
                    ct.templates.list[template].push(this);
                } else {
                    ct.templates.list[template] = [this];
                }
                this.onBeforeCreateModifier();
                ct.templates.templates[template].onCreate.apply(this);
            }
            return this;
        }

        /**
         * The name of the current copy's texture, or -1 for an empty texture.
         * @param {string} value The name of the new texture
         * @type {(string|number)}
         */
        set tex(value) {
            if (this[textureAccessor] === value) {
                return value;
            }
            var {playing} = this;
            this.textures = ct.res.getTexture(value);
            this[textureAccessor] = value;
            this.shape = ct.res.getTextureShape(value);
            this.anchor.x = this.textures[0].defaultAnchor.x;
            this.anchor.y = this.textures[0].defaultAnchor.y;
            if (playing) {
                this.play();
            }
            return value;
        }
        get tex() {
            return this[textureAccessor];
        }

        get speed() {
            return Math.hypot(this.hspeed, this.vspeed);
        }
        /**
         * The speed of a copy that is used in `this.move()` calls
         * @param {number} value The new speed value
         * @type {number}
         */
        set speed(value) {
            if (value === 0) {
                this[zeroDirectionAccessor] = this.direction;
                this.hspeed = this.vspeed = 0;
                return;
            }
            if (this.speed === 0) {
                const restoredDir = this[zeroDirectionAccessor];
                this[hspeedAccessor] = value * Math.cos(restoredDir * Math.PI / 180);
                this[vspeedAccessor] = value * Math.sin(restoredDir * Math.PI / 180);
                return;
            }
            var multiplier = value / this.speed;
            this.hspeed *= multiplier;
            this.vspeed *= multiplier;
        }
        get hspeed() {
            return this[hspeedAccessor];
        }
        set hspeed(value) {
            if (this.vspeed === 0 && value === 0) {
                this[zeroDirectionAccessor] = this.direction;
            }
            this[hspeedAccessor] = value;
            return value;
        }
        get vspeed() {
            return this[vspeedAccessor];
        }
        set vspeed(value) {
            if (this.hspeed === 0 && value === 0) {
                this[zeroDirectionAccessor] = this.direction;
            }
            this[vspeedAccessor] = value;
            return value;
        }
        get direction() {
            if (this.speed === 0) {
                return this[zeroDirectionAccessor];
            }
            return (Math.atan2(this.vspeed, this.hspeed) * 180 / Math.PI + 360) % 360;
        }
        /**
         * The moving direction of the copy, in degrees, starting with 0 at the right side
         * and going with 90 facing upwards, 180 facing left, 270 facing down.
         * This parameter is used by `this.move()` call.
         * @param {number} value New direction
         * @type {number}
         */
        set direction(value) {
            this[zeroDirectionAccessor] = value;
            if (this.speed > 0) {
                var speed = this.speed;
                this.hspeed = speed * Math.cos(value * Math.PI / 180);
                this.vspeed = speed * Math.sin(value * Math.PI / 180);
            }
            return value;
        }

        /**
         * Performs a movement step, reading such parameters as `gravity`, `speed`, `direction`.
         * @returns {void}
         */
        move() {
            if (this.gravity) {
                this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
                this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
            }
            this.x += this.hspeed * ct.delta;
            this.y += this.vspeed * ct.delta;
        }
        /**
         * Adds a speed vector to the copy, accelerating it by a given delta speed
         * in a given direction.
         * @param {number} spd Additive speed
         * @param {number} dir The direction in which to apply additional speed
         * @returns {void}
         */
        addSpeed(spd, dir) {
            this.hspeed += spd * Math.cos(dir * Math.PI / 180);
            this.vspeed += spd * Math.sin(dir * Math.PI / 180);
        }

        /**
         * Returns the room that owns the current copy
         * @returns {Room} The room that owns the current copy
         */
        getRoom() {
            let parent = this.parent;
            while (!(parent instanceof Room)) {
                parent = parent.parent;
            }
            return parent;
        }

        // eslint-disable-next-line class-methods-use-this
        onBeforeCreateModifier() {
            // Filled by ct.IDE and catmods
            
        }
    }
    return Copy;
})();

(function ctTemplateAddon(ct) {
    const onCreateModifier = function () {
        this.$chashes = ct.place.getHashes(this);
for (const hash of this.$chashes) {
    if (!(hash in ct.place.grid)) {
        ct.place.grid[hash] = [this];
    } else {
        ct.place.grid[hash].push(this);
    }
}
if ([false][0] && this instanceof ct.templates.Copy) {
    this.$cDebugText = new PIXI.Text('Not initialized', {
        fill: 0xffffff,
        dropShadow: true,
        dropShadowDistance: 2,
        fontSize: [][0] || 16
    });
    this.$cDebugCollision = new PIXI.Graphics();
    this.addChild(this.$cDebugCollision, this.$cDebugText);
}

    };

    /**
     * An object with properties and methods for manipulating templates and copies,
     * mainly for finding particular copies and creating new ones.
     * @namespace
     */
    ct.templates = {
        Copy,
        /**
         * An object that contains arrays of copies of all templates.
         * @type {Object.<string,Array<Copy>>}
         */
        list: {
            BACKGROUND: [],
            TILEMAP: []
        },
        /**
         * A map of all the templates of templates exported from ct.IDE.
         * @type {object}
         */
        templates: { },
        /**
         * Creates a new copy of a given template inside a specific room.
         * @param {string} template The name of the template to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {Room} [room] The room to which add the copy.
         * Defaults to the current room.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @returns {Copy} the created copy.
         */
        copyIntoRoom(template, x = 0, y = 0, room, exts) {
            // An advanced constructor. Returns a Copy
            if (!room || !(room instanceof Room)) {
                throw new Error(`Attempt to spawn a copy of template ${template} inside an invalid room. Room's value provided: ${room}`);
            }
            const obj = new Copy(template, x, y, exts);
            room.addChild(obj);
            ct.stack.push(obj);
            onCreateModifier.apply(obj);
            return obj;
        },
        /**
         * Creates a new copy of a given template inside the current root room.
         * A shorthand for `ct.templates.copyIntoRoom(template, x, y, ct.room, exts)`
         * @param {string} template The name of the template to use
         * @param {number} [x] The x coordinate of a new copy. Defaults to 0.
         * @param {number} [y] The y coordinate of a new copy. Defaults to 0.
         * @param {object} [exts] An optional object which parameters will be applied
         * to the copy prior to its OnCreate event.
         * @returns {Copy} the created copy.
         */
        copy(template, x = 0, y = 0, exts) {
            return ct.templates.copyIntoRoom(template, x, y, ct.room, exts);
        },
        /**
         * Applies a function to each copy in the current room
         * @param {Function} func The function to apply
         * @returns {void}
         */
        each(func) {
            for (const copy of ct.stack) {
                if (!(copy instanceof Copy)) {
                    continue; // Skip backgrounds and tile layers
                }
                func.apply(copy, this);
            }
        },
        /**
         * Applies a function to a given object (e.g. to a copy)
         * @param {Copy} obj The copy to perform function upon.
         * @param {Function} function The function to be applied.
         */
        withCopy(obj, func) {
            func.apply(obj, this);
        },
        /**
         * Applies a function to every copy of the given template name
         * @param {string} template The name of the template to perform function upon.
         * @param {Function} function The function to be applied.
         */
        withTemplate(template, func) {
            for (const copy of ct.templates.list[template]) {
                func.apply(copy, this);
            }
        },
        /**
         * Checks whether there are any copies of this template's name.
         * Will throw an error if you pass an invalid template name.
         * @param {string} template The name of a template to check.
         * @returns {boolean} Returns `true` if at least one copy exists in a room;
         * `false` otherwise.
         */
        exists(template) {
            if (!(template in ct.templates.templates)) {
                throw new Error(`[ct.templates] ct.templates.exists: There is no such template ${template}.`);
            }
            return ct.templates.list[template].length > 0;
        },
        /*
         * Checks whether a given object exists in game's world.
         * Intended to be applied to copies, but may be used with other PIXI entities.
         * @param {Copy|PIXI.DisplayObject|any} obj The copy which existence needs to be checked.
         * @returns {boolean} Returns `true` if a copy exists; `false` otherwise.
         */
        valid(obj) {
            if (obj instanceof Copy) {
                return !obj.kill;
            }
            if (obj instanceof PIXI.DisplayObject) {
                return Boolean(obj.position);
            }
            return Boolean(obj);
        },
        /**
         * Checks whether a given object is a ct.js copy.
         * @param {any} obj The object which needs to be checked.
         * @returns {boolean} Returns `true` if the passed object is a copy; `false` otherwise.
         */
        isCopy(obj) {
            return obj instanceof Copy;
        }
    };

    
ct.templates.templates["1200px-Checkerboard_pattern.svg"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "1200px-Checkerboard_pattern.svg",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.glow = ct.filters.addGlow(this)
this.glow.enabled = true
this.glow.color = 0x00FF00
this.grid_dim = 5
this.gridSize = 240

this.grid = []

this.text = []
    },
    extends: {
    "cgroup": "board"
}
};
ct.templates.list['1200px-Checkerboard_pattern.svg'] = [];
ct.templates.templates["Coin"] = {
    depth: 2,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Coin",
    onStep: function () {
        
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.board = ct.templates.list['1200px-Checkerboard_pattern.svg'][0]
let s = 0.9

/* Bitwise NOT is equivelent to trucation (or actually, flooring) here, but faster */
this.grid = Array(2).fill(~~(Math.random() * 5))
this.grid = {x: this.grid[0], y: this.grid[1]}

this.x = this.board.x + ((1-s)/2 *  this.width) + (240 * (this.grid.x)) + (120*s)
this.y = this.board.y + ((1-s)/2 * this.height) + (240 * (this.grid.y)) + (120*s)

this.scale.x = this.scale.y = s
this.last = {x: this.x, y: this.y, dir: null, value: 0, moved: 0}
this.colorFilter = ct.filters.addAdjustment(this)
this.colorFilter.blue  = 0
this.colorFilter.red   = 0
this.colorFilter.green = 1

this.animating = 0
this.teleport_offset = 0

this.glitch = ct.filters.addGlitch(this)
this.glitch.offset = 0

this.changed = false
console.log(this)
this.grid_origin = {...this.grid}

this.steps = []
this.stepMove = (i=0, last=false,callback=(()=>false)) =>{
    console.log([this.steps,i,this.steps[i]])
    ct.tween.add(this.steps[i]).then(()=>{
        if (last){
            console.log("last")
            this.steps = []
            console.log(callback)
            callback()
        } else {
            console.log("next")
            this.stepMove(i+1,(i+1)===(this.steps.length - 1))
        }
    })
}

this.checkActions = (moveCode, selfMove = false) =>{
    console.log([">>>>>#>>>> ", moveCode])
    let totalGridMove = 0
    let bump = false

    let dir = ['x','y'][moveCode[0]%2]
    let sign = (moveCode[0] <= 1 ? 1 : -1)
    console.log(`PreFlip ${sign}`)
    console.log([moveCode[0]%2, Nakama.state.orient[moveCode[0]%2]])
    sign *= (Nakama.state.orient[moveCode[0]%2] ? -1 : 1)
    let moveSize = moveCode[1]
    let temp_pos = this[dir]

    console.log(dir,sign,moveSize)
    
    for (let i=0; i<moveSize;i++){
        let dx = (dir==="x" ? temp_pos : this.x) + (dir === 'x' ? sign * 240 : 0)
        let dy = (dir==="y" ? temp_pos : this.y) + (dir === 'y' ? sign * 240 : 0)
        let walls = ct.place.traceLine({
            x1: (dir==="x" ? temp_pos : this.x),
            y1: (dir==="y" ? temp_pos : this.y),
            x2: dx,
            y2: dy
        }, 'wall', true).filter((x)=>x.enabled);

        let onBoard = !(ct.place.free(this, dx, dy, 'board'))

        if (walls.length === 0){
            
            if (onBoard){
                totalGridMove += sign
                //this[dir] += sign * 240
                temp_pos += sign * 240
                let f = {}
                f[dir] = temp_pos
                this.steps.push({
                    obj: this,
                    fields: f,
                    duration: 50
                })
                
            } else {
                let portal_walls = ct.place.traceLine({
                    x1: (dir==="x" ? temp_pos : this.x) - (dir === 'x' ? sign * 240 * 5 : 0),
                    y1: (dir==="y" ? temp_pos : this.y) - (dir === 'y' ? sign * 240 * 5 : 0),
                    x2: (dir==="x" ? temp_pos : this.x) - (dir === 'x' ? sign * 240 * 4 : 0),
                    y2: (dir==="y" ? temp_pos : this.y) - (dir === 'y' ? sign * 240 * 4 : 0)
                }, 'wall', true).filter((x)=>x.enabled);
                if (portal_walls.length === 0) {
                    totalGridMove -= 4 * sign
                    temp_pos -= (sign * 240 * 4)
                    let f = {}
                    f[dir] = temp_pos
                    this.steps.push({
                        obj: this,
                        fields: f,
                        duration: 50
                    })
                } else {
                    portal_walls[0].bumpFlash()
                    bump = true
                    console.log("PORTAL BUMP")
                    break;
                }
            }
            
        } else {
            walls[0].bumpFlash()
            bump = true
            console.log("BUMP")
            break;
        }
    }
    this.grid[dir] += totalGridMove
    if (this.steps.length >0){
        this.stepMove(0, this.steps.length === 1, bump ? (()=>this.bumpFlash(dir, sign)):(()=>false))
    } else if (bump){
        this.bumpFlash(dir, sign)
    }
    Nakama.socket.sendMatchState(Nakama.state.match.match_id, 4, Number(bump))
}

this.whereAmI = (i,x) => {
    //console.log(this.grid)
    if (x===-0){x=0}
    let b = ((this.grid.x+1)*2)+(!i?x:0)
    let a = ((this.grid.x+1)*2)+(i?x:0)
    return this.board.grid[a][b]
}

this.bumpFlash = (dir,val,origin={x:this.x,y:this.y}) => {
    console.log("Flash", dir,val)
    let motion = 60
    this.animating +=1
    ct.tween.add({
        obj: this,
        fields: {
            x: this.x + (motion*(dir==="x")*val),
            y: this.y + (motion*(dir==="y")*val)
        },
        duration: 50,
        curve: ct.tween.easeInBack
    }).then((_) => {
        ct.tween.add({
                obj: this,
                fields: {
                    x: this.x - (motion*(dir==="x")*val),
                    y: this.y - (motion*(dir==="y")*val)
                },
                duration: 50,
                curve: ct.tween.easeInOutBack
            }).then((_)=>{
                    this.animating-=1
                    this.x = origin.x
                    this.y = origin.y
                })
        }
    )

    this.colorFilter.red = 1
    this.colorFilter.green = 0
    ct.tween.add({
        obj: this.colorFilter,
        fields: {
            red: 0,
            green: 1
        },
        duration: 50,
        curve: ct.tween.easeInBack
    })
}

this.glitchOut = (v=300) => {
    if (this.animating === 0){
        ct.tween.add({
                obj: this.glitch,
                fields: {
                    offset: Math.random() * v * (2*Math.round(Math.random()) - 1)
                },
                duration: 50
        }).then(() => this.glitch.offset = 0)
    }
    
}
    },
    extends: {
    "cgroup": "game"
}
};
ct.templates.list['Coin'] = [];
ct.templates.templates["Wall"] = {
    depth: 3,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Placeholder",
    onStep: function () {
        let isValid = ct.pointer.hovers(this) && (Nakama.state.debug || !this.enabled)
//console.log(isValid)
this.glow.enabled = this.outLine.enabled = isValid
this.alpha = this.enabled ? 1 : (ct.pointer.hovers(this) || this.alphaOverride ? 1 : 0) 

if (ct.pointer.collides(this,undefined, true) && isValid){
    this.enabled = Nakama.state.debug ? !this.enabled : true
    this.enable_mode()
    Nakama.socket.sendMatchState(Nakama.state.match.match_id, 2, `${this.code}:${this.enabled?1:0}`) //<<<<
}

if (this.control){
    this.width += ct.actions.MoveX.value
    this.height += ct.actions.MoveY.value
}

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        let board = ct.templates.list['1200px-Checkerboard_pattern.svg'][0]
let start = board.position

/* 
Filter order matters here for drawing reasons:
    1. We don't want our other filters to be tinted with the colorFilter
    2. We want the outline to be drawn on top of the glow
*/

this.colorFilter = ct.filters.addAdjustment(this)


this.outLine = ct.filters.addOutline(this)
this.outLine.thickness = 2
this.outLine.enabled = false

this.glow = ct.filters.addGlow(this)
this.glow.color = 0xFFFFBB
this.glow.enabled = false


this.alpha = this.enabled ? 3 : 0
this.alphaOverride = false

this.enable_mode = () => {
    this.enabled ? changeColor(this.colorFilter,1,0,0,3) : changeColor(this.colorFilter,1,1,1,3)
}


this.animating = false
this.bumpFlash = () =>{
    if (!this.animating){
        this.animating = true
        this.alphaOverride = true
        this.alpha = 1

        ct.tween.add({
            obj: this.colorFilter,
            fields: {green: 1},
            duration: 100
        }).then((_)=>{
            ct.tween.add({
                obj: this.colorFilter,
                fields: {green: 0},
                duration: 100
            }).then(()=>{
                this.alphaOverride = false;
                this.animating=false;
                //console.log(`${this.code} is all done!`)
            })
        })
    }
}
    },
    extends: {
    "alpha": 1,
    "cgroup": "wall"
}
};
ct.templates.list['Wall'] = [];
ct.templates.templates["bg2"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "bg2",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
    },
    extends: {}
};
ct.templates.list['bg2'] = [];
ct.templates.templates["toLobby"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Nav-button",
    onStep: function () {
        /* pointer methods are bugged for rotated objects, so we have to do in manually */

let hover = ct.pointer.x.between(this.b.minX, this.b.maxX) && ct.pointer.y.between(this.b.minY, this.b.maxY)
//console.log([ct.pointer.x, ct.pointer.y, this.b, ct.pointer.x.between(this.b.minX, this.b.maxX), ct.pointer.y.between(this.b.minY, this.b.maxY)])
this.glow.enabled = this.outLine.enabled = hover

/* On Release */
if (this.pressed && ct.actions.Press.value === 0){
    leaveMatch()
    ct.rooms.switch('Lobby')
}

this.pressed = (hover && ct.actions.Press.value)
this.transform.scale.x = this.transform.scale.y = this.pressed ? 1.2 * this.scale_ratio : 1 * this.scale_ratio
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        const orientations = ['e','n','w','s']



if (this.orientation){
    let rot = 0;
    let o = Array.from(this.orientation);
    o.filter((i) => orientations.includes(i)).forEach((x) => rot += orientations.indexOf(x))
    console.log(`>> ${rot}`)
    this.transform.rotation =  rot/o.length * (Math.PI / 2)
}

/* Filters affect bounds, so we hardcode them in here to avoid flickering with glow*/
/* Coords are positioned in center */
const globals = ct.u.uiToGameCoord(this.x, this.y)
this.b = {
    minX: globals.x - this.width/2,
    minY: globals.y - this.height/2,
    maxX: globals.x + this.width/2,
    maxY: globals.y + this.height/2
}

this.outLine = ct.filters.addOutline(this)
this.outLine.thickness = 2

this.glow = ct.filters.addGlow(this)
this.glow.color = 0xFFFFBB

this.glow.enabled = this.outLine.enabled = false

this.pressed = false
this.scale_ratio = this.scale.x
console.log(this.x)


    },
    extends: {}
};
ct.templates.list['toLobby'] = [];
ct.templates.templates["Match Buttons"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Match Buttons",
    onStep: function () {
        if (this.alpha === 0 && Nakama.socket!==undefined){
    this.alpha=Nakama.socket.adapter._isConnected;
    let username = window.location.search.substring(1).split("&")[0]
    username ? Nakama.client.updateAccount(Nakama.session, {
                "username": username
            }).then(()=>ct.room.welcome.text = `Welcome ${username}!`) : null
    
    ct.room.getMatches()
}
this.glow.enabled = ct.pointer.hovers(this)
this.scale.x = this.scale.y = ct.pointer.collides(this) ? 0.9 : 1
if (!this.refresh){this.refresh = ct.templates.list['refresh'][0]}
if (ct.pointer.collides(this, undefined, true)){
    Nakama.socket.createMatch().then((m) => Nakama.state.match = m)
    this.refresh.spin = true
    ct.room.getMatches((_) => {this.refresh.spin = false; this.refresh.rotation = 0})
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.gotoAndStop(this.frame)

this.outline = ct.filters.addOutline(this)
this.outline.enabled = true

this.glow = ct.filters.addGlow(this)
this.glow.color = 0xFFFFBB
this.glow.enabled = false

this.refresh = ct.templates.list['refresh'][0]
console.log(this.refresh)
    },
    extends: {
    "alpha": 0
}
};
ct.templates.list['Match Buttons'] = [];
ct.templates.templates["Data"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Compass",
    onStep: function () {
        

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.details = {}
console.log(Nakama.state.orient)

this.details.top = this.addChild(new PIXI.Text(`
    ${Nakama.state.orient[1] ? "S" : "N"}`,
    ct.styles.get("matchid")))
this.details.top.y = (this.height * -1) / this.scale.y + 8
this.details.top.x = this.width/(-10) + 8

this.details.bottom = this.addChild(new PIXI.Text(`
    ${Nakama.state.orient[1] ? "N" : "S"}`,
    ct.styles.get("matchid")))
this.details.bottom.y = 4
this.details.bottom.x = this.width/(-10) + 8



this.details.left = this.addChild(new PIXI.Text(`
    ${Nakama.state.orient[0] ? "E" : "W"}`,
    ct.styles.get("matchid")))
this.details.left.y = ((this.height * -1) / this.scale.y * 0.5) + 5
this.details.left.x = ((this.width/(-10)) * 2) + 8


this.details.right = this.addChild(new PIXI.Text(`
    ${Nakama.state.orient[0] ? "W" : "E"}`,
    ct.styles.get("matchid")))
this.details.right.y = ((this.height * -1) / this.scale.y * 0.5) + 5
this.details.right.x = 4


console.log([this.details.left.x, this.details.right.x])



Object.keys(this.details).forEach((x)=>this.details[x].glow = ct.filters.addGlow(this.details[x]))

    },
    extends: {}
};
ct.templates.list['Data'] = [];
ct.templates.templates["refresh"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "refresh",
    onStep: function () {
        
if (this.alpha === 0 && Nakama.socket!==undefined){this.alpha=Nakama.socket.adapter._isConnected}
/* pointer methods are bugged for rotated objects, so we have to do in manually */
let hover = ct.pointer.x.between(this.b.minX, this.b.maxX) && ct.pointer.y.between(this.b.minY, this.b.maxY)
//console.log([ct.pointer.x, ct.pointer.y, this.b, ct.pointer.x.between(this.b.minX, this.b.maxX), ct.pointer.y.between(this.b.minY, this.b.maxY)])
this.glow.enabled = this.outLine.enabled = hover

/* On Release */
if (this.pressed && ct.actions.Press.value === 0){
    ct.room.getMatches()
}



this.pressed = (hover && ct.actions.Press.value)
this.transform.scale.x = this.transform.scale.y = this.pressed ? 1.2 * this.scale_ratio : 1 * this.scale_ratio


this.rotation += (((2 * Math.PI) + ct.delta)/(100)) * Nakama.state.loading

    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.b = {
    minX: this.x - this.width/2,
    minY: this.y - this.height/2,
    maxX: this.x + this.width/2,
    maxY: this.y + this.height/2
}

this.outLine = ct.filters.addOutline(this)
this.outLine.thickness = 2

this.glow = ct.filters.addGlow(this)
this.glow.color = 0xFFFFBB

this.glow.enabled = this.outLine.enabled = false

this.pressed = false
this.scale_ratio = this.scale.x
console.log(this.x)

this.spin = false
    },
    extends: {
    "alpha": 0
}
};
ct.templates.list['refresh'] = [];
ct.templates.templates["Match_Card"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Match_Card",
    onStep: function () {
        this.glow.enabled = (this.clickable !== false) ? ct.pointer.hovers(this) : this.glow.enabled
this.scale.x = this.scale.y = ct.pointer.collides(this) && this.clickable !== false ? 0.9 : 1
if (ct.pointer.collides(this,undefined,true)){
    if (this.clickable !== false){
        Nakama.state.match = this.match
        // Orient Code
        Nakama.state.orient = [Math.random()>0.5,Math.random()>0.5]
        joinMatch(this.match.match_id).then(ct.rooms.switch('Game'))
    }
}
if (this.animating){
    this.x = this.origin.x
    this.y = this.origin.y
}

if (!this.enabled && this.match.match_id !== undefined){
    this.enabled = true
    this.alpha = 1
}

if (this.match.match_id === undefined && !this.gettingName && this.clickable === false){
    this.gettingName = true
    Nakama.client.getUsers(Nakama.session, this.user_id).then((users)=>addPlayer(this.user_id,users.users[0].username))
        .then(()=>this.gettingName=false)
        .then(()=>{
            this.match.match_id = Nakama.state.players[this.user_id]
            this.details.text = `${this.match.match_id}`
        })
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        let font = Object.assign({}, ct.styles.get("matchid"))
font.fontSize = this.fontSize ? this.fontSize : font.fontSize
this.details = this.addChild(new PIXI.Text(`
    ${this.match.match_id}\n
    ${this.match.size}`,
    font))
this.details.y = (this.height - this.details.height)/2
this.details.x = 10

this.origin = {
            x: this.x,
            y: this.y
}

this.outline = ct.filters.addOutline(this)
this.outline.enabled = true

this.glow = ct.filters.addGlow(this)
this.glow.color_default = 0xFFFFBB
this.glow.color = this.glow.color_default
this.glow.enabled = true

console.log(this.glow)

this.gettingName = false
this.enabled = false

this.animating = 0
this.duration = 50
this.bumpFlash = () => {
    this.glow.color = 0xFF0000;
    console.log(this.glow)

    let motion = 30
    this.animating +=1
    ct.tween.add({
        obj: this,
        fields: {
            x: this.x + (motion)
        },
        duration: this.duration
    }).then((_) => {
        ct.tween.add({
                obj: this,
                fields: {
                    x: this.x - (motion)
                },
                duration: this.duration
            }).then((_) => {
                ct.tween.add({
                    obj: this,
                    fields: {
                        x: this.x - (motion)
                    },
                    duration: this.duration
                }).then((_) => {
                        ct.tween.add({
                                obj: this,
                                fields: {
                                    x: this.x + (motion)
                                },
                                duration: this.duration
                            }).then((_)=>{
                                    this.animating-=1
                                    this.x = this.origin.x
                                    this.y = this.origin.y
                                })
                        }
                    )
            })
        }
    )
}
    },
    extends: {
    "alpha": 0
}
};
ct.templates.list['Match_Card'] = [];
ct.templates.templates["Letters"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Letters",
    onStep: function () {
        this.move();
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        
this.symbols = [[1,2,3,4,5],["A","B","C","D","E"]]
let space = "       "

this.letters = this.addChild(new PIXI.Text( `${space}${this.symbols[this.mode][0]}${space}`+
                                            `${space}${this.symbols[this.mode][1]}${space}`+
                                            `${space}${this.symbols[this.mode][2]}${space}`+
                                            `${space}${this.symbols[this.mode][3]}${space}`+
                                            `${space}${this.symbols[this.mode][4]}`
                                            ))
this.letters.x = 0
this.letters.y = 0
this.letters.glow = ct.filters.addGlow(this.letters)
this.letters.scale.x = this.letters.scale.y = 2
this.rotation = this.mode==1?0:(Math.PI / -2)
this.x -= this.mode==1?0:this.height
    },
    extends: {}
};
ct.templates.list['Letters'] = [];
ct.templates.templates["Grid_Button"] = {
    depth: 1,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Grid_Button",
    onStep: function () {
        let coin = ct.room.coin
let board = ct.room.board
let directions = ['x','y']
if (ct.room.activeBox !== this){
    this.active = ct.pointer.hovers(this)
    this.alpha = this.active ? 1 : 0.3
    this.fx.enabled = ct.pointer.collides(this)
    this.glow.enabled = false
    if (ct.pointer.collides(this)){
        ct.room.activeBox = null
        let bitmask = (this.grid.x === coin.grid.x) + (this.grid.y === coin.grid.y)
        if (bitmask > 0){
            //ct.pointer.collides(this) ? console.log([coin.x,coin.y]) : null
            if (!ct.room.warpMode){
                this.glow.color = 0x00FF00
                let bumps = ct.place.traceLine({
                    x1: coin.x,
                    y1: coin.y,
                    x2: this.x,
                    y2: this.y
                }, undefined, true).filter((wall)=>wall.enabled)

                if (bumps.length > 0){
                    
                    (directions).every((dir)=>{
                        if (coin[dir] !== this[dir] && coin.animating === 0){
                            console.log([coin.grid[dir], this.grid[dir]])
                            if (Math.abs(coin.grid[dir] - this.grid[dir]) === 1){
                                console.log("Legal Bump!");
                                ct.room.activeBox = this
                            } else {
                                coin.bumpFlash(dir,Math.sign(this[dir]-coin[dir]))
                                
                            }
                            return false;
                        } else {return true;}
                    })
                    bumps[0].bumpFlash()
                } else {
                    bitmask === 2 ? coin.glitchOut() : ct.room.activeBox = this
                }
            } else {
                this.glow.color = 0xFF33FF
                /* Instead of rotating 180 deg twice (one for orientation with +/-, the other to get opposite side), we leave it as is */
                let rotPdc = (ct.u.pointDirection(coin.x, coin.y, this.x, this.y) / 90)// + 2) % 4) 
                let mappedVal = (rotPdc-2)%2 // Give the opposite side which we check on: [+x,+y,-x,-y]==[0,1,2,3]=>[-0,-1,0,1]==[-x,-y,+x,+y]
                let isX = mappedVal===0
                let sign = isX ? !(1/mappedVal === -Infinity) : Math.sign(mappedVal)===1
                if ((isX ? coin.grid.x : coin.grid.y) === (sign ? 4 : 0)){
                    let bumps = ct.place.traceLine({
                        x1: coin.x,
                        y1: coin.y,
                        x2: isX ? (sign ? board.x+board.width+120 : board.x-120) : coin.x,
                        y2: isX ? coin.y : (sign ? board.y+board.height+120 : board.y-120)
                    }, undefined, true).concat(
                        ct.place.traceLine({
                            x1: isX ? (sign ? board.x-120 : board.x+board.width+120) : this.x,
                            y1: isX ? this.y : (sign ? board.y-120 : board.y+board.height+120),
                            x2: this.x,
                            y2: this.y
                        }, undefined, true)
                    ).filter((wall)=>wall.enabled)
                    bumps = [...new Set(bumps)]
                    if (bumps.length >0){
                        bumps.forEach((bump)=>bump.bumpFlash())
                    } else {
                        console.log([isX,sign])
                        ct.room.activeBox = this
                    }
                    
                } else {
                    let pwall_code = `${isX?((coin.grid.y * 2) + 2):(sign ? 11 : 1)}:${isX?(sign ? 11 : 1):((coin.grid.x * 2) + 2)}`
                    console.log([pwall_code, coin.grid,isX,sign])
                    let portalWall = ct.templates.list["Wall"].filter((wall)=>wall.code === pwall_code)[0]
                    //console.log(portalWall)
                    coin.bumpFlash(isX?'x':'y',sign?-1:1)
                    portalWall.bumpFlash()
                }
            }
        } else{
            //coin.bumpFlash(directions[Math.round(Math.random())],(Math.round(Math.random())*2) - 1)
            coin.glitchOut()
        }
    }
    
} else {
    this.glow.enabled = true
    this.fx.enabled = false
    this.alpha = 0.3
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.active = false
this.fx = ct.filters.addRGBSplit(this)
this.glow = ct.filters.addGlow(this)
this.glow.color = 0x00FF00
this.glow.enabled = false


    },
    extends: {
    "alpha": 0.3
}
};
ct.templates.list['Grid_Button'] = [];
ct.templates.templates["Submit"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "Submit",
    onStep: function () {
        let press = ct.pointer.collides(this)
this.splitFilter.enabled = press
this.shadow.enabled = !press

if (ct.pointer.collides(this,undefined,true)){
    if (ct.room.activeBox){
        let move = this.calculateMove()
        Nakama.socket.sendMatchState(Nakama.state.match.match_id, 3, move)
        ct.room.coin.checkActions(move, true)
        ct.room.activeBox = null
    } else {
        ct.room.coin.glitchOut()
    }
    
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        const moveSize = -5

this.splitFilter = ct.filters.addRGBSplit(this)
this.splitFilter.red = this.splitFilter.green = this.splitFilter.blue = [0,moveSize]
this.splitFilter.enabled = false

this.shadow = ct.filters.addDropShadow(this)
this.shadow.angle = Math.PI / (-2 * Math.sign(moveSize))
this.shadow.distance = -1 * moveSize
this.shadow.pixelSize.x = this.shadow.pixelSize.y = 0.1

this.border = ct.filters.addOutline(this)

this.calculateMove = () => {
    let coords = [
        (ct.room.activeBox.grid.x - ct.room.coin.grid.x), 
        (ct.room.activeBox.grid.y - ct.room.coin.grid.y)
        ]

    let i = Number(coords[0] === 0)
    console.log(i)
    
    let swap = Math.sign(coords[i]) === -1 ^ ct.room.warpMode ^ Nakama.state.orient[i]
    console.log(`${Math.sign(coords[i]) !== 1}^${ct.room.warpMode}^${Nakama.state.orient[i]}=${swap}`)
    let code =  `${i+(2*Number(swap))}`+
                `${Math.abs(coords[i] + (5 * ct.room.warpMode * Math.sign(coords[i]) * -1))}`
    console.log([coords,code])
    return code
}

/*        n=3
/          /\
/
/ w=2<           >e=0
/
/          \/
/          s=1
/ Matches ct.u.pdc
 */
    },
    extends: {}
};
ct.templates.list['Submit'] = [];
ct.templates.templates["WarpText"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "WarpText",
    onStep: function () {
        let press = ct.pointer.collides(this)
let release = ct.pointer.collides(this, undefined, true)
this.splitFilter.enabled = press
this.shadow.enabled = !press
if (this.indicator){
    this.indicator.shadow.enabled = !press
    this.splitFilter.enabled = press
    if (release){
        this.indicator.gotoAndStop(Number(this.indicator.currentFrame===0))
        ct.room.activeBox = null
    }
    
} else {
    this.indicator = ct.templates.list["YesNo"][0]
}
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        const moveSize = -5

this.indicator = ct.templates.list["YesNo"][0]

this.splitFilter = ct.filters.addRGBSplit(this)
this.splitFilter.red = this.splitFilter.green = this.splitFilter.blue = [0,moveSize]
this.splitFilter.enabled = false

this.shadow = ct.filters.addDropShadow(this)
this.shadow.angle = Math.PI / (-2 * Math.sign(moveSize))
this.shadow.distance = -1 * moveSize
this.shadow.pixelSize.x = this.shadow.pixelSize.y = 0.1

this.border = ct.filters.addOutline(this)
    },
    extends: {}
};
ct.templates.list['WarpText'] = [];
ct.templates.templates["YesNo"] = {
    depth: 0,
    blendMode: PIXI.BLEND_MODES.NORMAL,
    playAnimationOnStart: false,
    texture: "YesNo",
    onStep: function () {
        ct.room.warpMode = this.currentFrame===0
    },
    onDraw: function () {
        
    },
    onDestroy: function () {
        
    },
    onCreate: function () {
        this.gotoAndStop(1)

const moveSize = -5

this.splitFilter = ct.filters.addRGBSplit(this)
this.splitFilter.red = this.splitFilter.green = this.splitFilter.blue = [0,moveSize]
this.splitFilter.enabled = false

this.shadow = ct.filters.addDropShadow(this)
this.shadow.angle = Math.PI / (-2 * Math.sign(moveSize))
this.shadow.distance = -1 * moveSize
this.shadow.pixelSize.x = this.shadow.pixelSize.y = 0.1

this.border = ct.filters.addOutline(this)
    },
    extends: {}
};
ct.templates.list['YesNo'] = [];
    (function vkeysTemplates() {
    ct.templates.templates.VKEY = {
        onStep: function () {
            var down = false,
                hover = false;
            if (ct.mouse) {
                if (ct.mouse.hoversUi(this)) {
                    hover = true;
                    if (ct.mouse.down) {
                        down = true;
                    }
                }
            }
            if (ct.touch) {
                for (const touch of ct.touch.events) {
                    if (ct.touch.collideUi(this, touch.id)) {
                        down = hover = true;
                        break;
                    }
                }
            }
            if (ct.pointer) {
                if (ct.pointer.hoversUi(this)) {
                    hover = true;
                    if (ct.pointer.collidesUi(this)) {
                        down = true;
                    }
                }
            }

            if (down) {
                this.tex = this.opts.texActive || this.opts.texNormal;
                ct.inputs.registry['vkeys.' + this.opts.key] = 1;
            } else {
                ct.inputs.registry['vkeys.' + this.opts.key] = 0;
                if (hover) {
                    this.tex = this.opts.texHover || this.opts.texNormal;
                } else {
                    this.tex = this.opts.texNormal;
                }
            }
        },
        onDraw: function () {
            this.x = (typeof this.opts.x === 'function') ? this.opts.x() : this.opts.x;
            this.y = (typeof this.opts.y === 'function') ? this.opts.y() : this.opts.y;
        },
        onDestroy: function () {
            void 0;
        },
        onCreate: function () {
            this.tex = this.opts.texNormal;
            this.depth = this.opts.depth;
        }
    };

    ct.templates.templates.VJOYSTICK = {
        onCreate: function () {
            this.tex = this.opts.tex;
            this.depth = this.opts.depth;
            this.down = false;
            this.trackball = new PIXI.Sprite(ct.res.getTexture(this.opts.trackballTex, 0));
            this.addChild(this.trackball);
        },
        // eslint-disable-next-line complexity
        onStep: function () {
            var dx = 0,
                dy = 0;
            if (ct.mouse) {
                if (ct.mouse.hoversUi(this)) {
                    if (ct.mouse.down) {
                        this.down = true;
                    }
                }
                if (ct.mouse.released) {
                    this.down = false;
                }
                if (this.down) {
                    dx = ct.mouse.xui - this.x;
                    dy = ct.mouse.yui - this.y;
                }
            }
            if (ct.touch) {
                if (!this.touchId) {
                    for (const touch of ct.touch.events) {
                        if (ct.touch.collideUi(this, touch.id)) {
                            this.down = true;
                            this.touchId = touch.id;
                            break;
                        }
                    }
                }
                var touch = ct.touch.getById(this.touchId);
                if (touch) {
                    dx = touch.xui - this.x;
                    dy = touch.yui - this.y;
                } else {
                    this.touchId = false;
                    this.down = false;
                }
            }
            if (ct.pointer) {
                if (this.trackedPointer && !ct.pointer.down.includes(this.trackedPointer)) {
                    this.trackedPointer = void 0;
                }
                if (!this.trackedPointer) {
                    const pointer = ct.pointer.collidesUi(this);
                    if (pointer) {
                        this.down = true;
                        this.trackedPointer = pointer;
                    }
                }
                if (this.trackedPointer) {
                    dx = this.trackedPointer.xui - this.x;
                    dy = this.trackedPointer.yui - this.y;
                } else {
                    this.touchId = false;
                    this.down = false;
                }
            }
            var r = this.shape.r || this.shape.right || 64;
            if (this.down) {
                dx /= r;
                dy /= r;
                var length = Math.hypot(dx, dy);
                if (length > 1) {
                    dx /= length;
                    dy /= length;
                }
                ct.inputs.registry['vkeys.' + this.opts.key + 'X'] = dx;
                ct.inputs.registry['vkeys.' + this.opts.key + 'Y'] = dy;
            } else {
                ct.inputs.registry['vkeys.' + this.opts.key + 'X'] = 0;
                ct.inputs.registry['vkeys.' + this.opts.key + 'Y'] = 0;
            }
            this.trackball.x = dx * r;
            this.trackball.y = dy * r;
        },
        onDraw: function () {
            this.x = (typeof this.opts.x === 'function') ? this.opts.x() : this.opts.x;
            this.y = (typeof this.opts.y === 'function') ? this.opts.y() : this.opts.y;
        },
        onDestroy: function () {
            void 0;
        }
    };
})();


    ct.templates.beforeStep = function beforeStep() {
        
    };
    ct.templates.afterStep = function afterStep() {
        
    };
    ct.templates.beforeDraw = function beforeDraw() {
        if ([false][0] && this instanceof ct.templates.Copy) {
    this.$cDebugText.scale.x = this.$cDebugCollision.scale.x = 1 / this.scale.x;
    this.$cDebugText.scale.y = this.$cDebugCollision.scale.y = 1 / this.scale.y;
    this.$cDebugText.angle = this.$cDebugCollision.angle = -this.angle;

    const newtext = `Partitions: ${this.$chashes.join(', ')}
CGroup: ${this.cgroup || 'unset'}
Shape: ${(this._shape && this._shape.__type) || 'unused'}`;
    if (this.$cDebugText.text !== newtext) {
        this.$cDebugText.text = newtext;
    }
    this.$cDebugCollision
    .clear();
    ct.place.drawDebugGraphic.apply(this);
    this.$cHadCollision = false;
}

    };
    ct.templates.afterDraw = function afterDraw() {
        /* eslint-disable no-underscore-dangle */
if ((this.transform && (this.transform._localID !== this.transform._currentLocalID)) ||
    this.x !== this.xprev ||
    this.y !== this.yprev
) {
    delete this._shape;
    const oldHashes = this.$chashes || [];
    this.$chashes = ct.place.getHashes(this);
    for (const hash of oldHashes) {
        if (this.$chashes.indexOf(hash) === -1) {
            ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
        }
    }
    for (const hash of this.$chashes) {
        if (oldHashes.indexOf(hash) === -1) {
            if (!(hash in ct.place.grid)) {
                ct.place.grid[hash] = [this];
            } else {
                ct.place.grid[hash].push(this);
            }
        }
    }
}

    };
    ct.templates.onDestroy = function onDestroy() {
        if (this.$chashes) {
    for (const hash of this.$chashes) {
        ct.place.grid[hash].splice(ct.place.grid[hash].indexOf(this), 1);
    }
}

    };
})(ct);
/**
 * @extends {PIXI.TilingSprite}
 * @property {number} shiftX How much to shift the texture horizontally, in pixels.
 * @property {number} shiftY How much to shift the texture vertically, in pixels.
 * @property {number} movementX The speed at which the background's texture moves by X axis,
 * wrapping around its area. The value is measured in pixels per frame, and takes
 * `ct.delta` into account.
 * @property {number} movementY The speed at which the background's texture moves by Y axis,
 * wrapping around its area. The value is measured in pixels per frame, and takes
 * `ct.delta` into account.
 * @property {number} parallaxX A value that makes background move faster
 * or slower relative to other objects. It is often used to create an effect of depth.
 * `1` means regular movement, values smaller than 1
 * will make it move slower and make an effect that a background is placed farther away from camera;
 * values larger than 1 will do the opposite, making the background appear closer than the rest
 * of object.
 * This property is for horizontal movement.
 * @property {number} parallaxY A value that makes background move faster
 * or slower relative to other objects. It is often used to create an effect of depth.
 * `1` means regular movement, values smaller than 1
 * will make it move slower and make an effect that a background is placed farther away from camera;
 * values larger than 1 will do the opposite, making the background appear closer than the rest
 * of object.
 * This property is for vertical movement.
 * @class
 */
class Background extends PIXI.TilingSprite {
    constructor(texName, frame = 0, depth = 0, exts = {}) {
        var width = ct.camera.width,
            height = ct.camera.height;
        const texture = texName instanceof PIXI.Texture ?
            texName :
            ct.res.getTexture(texName, frame || 0);
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-x') {
            height = texture.height * (exts.scaleY || 1);
        }
        if (exts.repeat === 'no-repeat' || exts.repeat === 'repeat-y') {
            width = texture.width * (exts.scaleX || 1);
        }
        super(texture, width, height);
        if (!ct.backgrounds.list[texName]) {
            ct.backgrounds.list[texName] = [];
        }
        ct.backgrounds.list[texName].push(this);
        ct.templates.list.BACKGROUND.push(this);
        ct.stack.push(this);
        this.anchor.x = this.anchor.y = 0;
        this.depth = depth;
        this.shiftX = this.shiftY = this.movementX = this.movementY = 0;
        this.parallaxX = this.parallaxY = 1;
        if (exts) {
            ct.u.extend(this, exts);
        }
        if (this.scaleX) {
            this.tileScale.x = Number(this.scaleX);
        }
        if (this.scaleY) {
            this.tileScale.y = Number(this.scaleY);
        }
        this.reposition();
    }
    onStep() {
        this.shiftX += ct.delta * this.movementX;
        this.shiftY += ct.delta * this.movementY;
    }
    /**
     * Updates the position of this background.
     */
    reposition() {
        const cameraBounds = this.isUi ?
            {
                x: 0, y: 0, width: ct.camera.width, height: ct.camera.height
            } :
            ct.camera.getBoundingBox();
        if (this.repeat !== 'repeat-x' && this.repeat !== 'no-repeat') {
            this.y = cameraBounds.y;
            this.tilePosition.y = -this.y * this.parallaxY + this.shiftY;
            this.height = cameraBounds.height + 1;
        } else {
            this.y = this.shiftY + cameraBounds.y * (this.parallaxY - 1);
        }
        if (this.repeat !== 'repeat-y' && this.repeat !== 'no-repeat') {
            this.x = cameraBounds.x;
            this.tilePosition.x = -this.x * this.parallaxX + this.shiftX;
            this.width = cameraBounds.width + 1;
        } else {
            this.x = this.shiftX + cameraBounds.x * (this.parallaxX - 1);
        }
    }
    onDraw() {
        this.reposition();
    }
    static onCreate() {
        void 0;
    }
    static onDestroy() {
        void 0;
    }
    get isUi() {
        return this.parent ? Boolean(this.parent.isUi) : false;
    }
}
/**
 * @namespace
 */
ct.backgrounds = {
    Background,
    list: {},
    /**
     * @returns {Background} The created background
     */
    add(texName, frame = 0, depth = 0, container = ct.room) {
        if (!texName) {
            throw new Error('[ct.backgrounds] The texName argument is required.');
        }
        const bg = new Background(texName, frame, depth);
        container.addChild(bg);
        return bg;
    }
};
ct.templates.Background = Background;

/**
 * @extends {PIXI.Container}
 * @class
 */
class Tilemap extends PIXI.Container {
    /**
     * @param {object} template A template object that contains data about depth
     * and tile placement. It is usually used by ct.IDE.
     */
    constructor(template) {
        super();
        this.pixiTiles = [];
        if (template) {
            this.depth = template.depth;
            this.tiles = template.tiles.map(tile => ({
                ...tile
            }));
            if (template.extends) {
                Object.assign(this, template.extends);
            }
            for (let i = 0, l = template.tiles.length; i < l; i++) {
                const textures = ct.res.getTexture(template.tiles[i].texture);
                const sprite = new PIXI.Sprite(textures[template.tiles[i].frame]);
                sprite.anchor.x = sprite.anchor.y = 0;
                sprite.shape = textures.shape;
                this.addChild(sprite);
                this.pixiTiles.push(sprite);
                this.tiles[i].sprite = sprite;
                sprite.x = template.tiles[i].x;
                sprite.y = template.tiles[i].y;
            }
        } else {
            this.tiles = [];
        }
        ct.templates.list.TILEMAP.push(this);
    }
    /**
     * Adds a tile to the tilemap. Will throw an error if a tilemap is cached.
     * @param {string} textureName The name of the texture to use
     * @param {number} x The horizontal location of the tile
     * @param {number} y The vertical location of the tile
     * @param {number} [frame] The frame to pick from the source texture. Defaults to 0.
     * @returns {PIXI.Sprite} The created tile
     */
    addTile(textureName, x, y, frame = 0) {
        if (this.cached) {
            throw new Error('[ct.tiles] Adding tiles to cached tilemaps is forbidden. Create a new tilemap, or add tiles before caching the tilemap.');
        }
        const texture = ct.res.getTexture(textureName, frame);
        const sprite = new PIXI.Sprite(texture);
        sprite.x = x;
        sprite.y = y;
        sprite.shape = texture.shape;
        this.tiles.push({
            texture: textureName,
            frame,
            x,
            y,
            width: sprite.width,
            height: sprite.height,
            sprite
        });
        this.addChild(sprite);
        this.pixiTiles.push(sprite);
        return sprite;
    }
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     */
    cache(chunkSize = 1024) {
        if (this.cached) {
            throw new Error('[ct.tiles] Attempt to cache an already cached tilemap.');
        }

        // Divide tiles into a grid of larger cells so that we can cache these cells as
        const bounds = this.getLocalBounds();
        const cols = Math.ceil(bounds.width / chunkSize),
              rows = Math.ceil(bounds.height / chunkSize);
        this.cells = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = new PIXI.Container();
                this.cells.push(cell);
            }
        }
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0],
                  x = Math.floor((tile.x - bounds.x) / chunkSize),
                  y = Math.floor((tile.y - bounds.y) / chunkSize);
            this.cells[y * cols + x].addChild(tile);
        }
        this.removeChildren();

        // Filter out empty cells, cache filled ones
        for (let i = 0, l = this.cells.length; i < l; i++) {
            if (this.cells[i].children.length === 0) {
                this.cells.splice(i, 1);
                i--;
                l--;
                continue;
            }
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }

        this.cached = true;
    }
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This version packs tiles into rhombus-shaped chunks, and sorts them
     * from top to bottom. This fixes seam issues for isometric games.
     */
    cacheDiamond(chunkSize = 1024) {
        if (this.cached) {
            throw new Error('[ct.tiles] Attempt to cache an already cached tilemap.');
        }

        this.cells = [];
        this.diamondCellMap = {};
        for (let i = 0, l = this.tiles.length; i < l; i++) {
            const tile = this.children[0];
            const [xNormalized, yNormalized] = ct.u.rotate(tile.x, tile.y * 2, -45);
            const x = Math.floor(xNormalized / chunkSize),
                  y = Math.floor(yNormalized / chunkSize),
                  key = `${x}:${y}`;
            if (!(key in this.diamondCellMap)) {
                const chunk = new PIXI.Container();
                chunk.chunkX = x;
                chunk.chunkY = y;
                this.diamondCellMap[key] = chunk;
                this.cells.push(chunk);
            }
            this.diamondCellMap[key].addChild(tile);
        }
        this.removeChildren();

        this.cells.sort((a, b) => {
            const maxA = Math.max(a.chunkY, a.chunkX),
                  maxB = Math.max(b.chunkY, b.chunkX);
            if (maxA === maxB) {
                return b.chunkX - a.chunkX;
            }
            return maxA - maxB;
        });

        for (let i = 0, l = this.cells.length; i < l; i++) {
            this.addChild(this.cells[i]);
            this.cells[i].cacheAsBitmap = true;
        }

        this.cached = true;
    }
}
ct.templates.Tilemap = Tilemap;

/**
 * @namespace
 */
ct.tilemaps = {
    /**
     * Creates a new tilemap at a specified depth, and adds it to the main room (ct.room).
     * @param {number} [depth] The depth of a newly created tilemap. Defaults to 0.
     * @returns {Tilemap} The created tilemap.
     */
    create(depth = 0) {
        const tilemap = new Tilemap();
        tilemap.depth = depth;
        ct.room.addChild(tilemap);
        return tilemap;
    },
    /**
     * Adds a tile to the specified tilemap. It is the same as
     * calling `tilemap.addTile(textureName, x, y, frame).
     * @param {Tilemap} tilemap The tilemap to modify.
     * @param {string} textureName The name of the texture to use.
     * @param {number} x The horizontal location of the tile.
     * @param {number} y The vertical location of the tile.
     * @param {number} [frame] The frame to pick from the source texture. Defaults to 0.
     * @returns {PIXI.Sprite} The created tile
     */
    addTile(tilemap, textureName, x, y, frame = 0) {
        return tilemap.addTile(textureName, x, y, frame);
    },
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This is the same as calling `tilemap.cache();`
     *
     * @param {Tilemap} tilemap The tilemap which needs to be cached.
     * @param {number} chunkSize The size of one chunk.
     */
    cache(tilemap, chunkSize) {
        tilemap.cache(chunkSize);
    },
    /**
     * Enables caching on this tileset, freezing it and turning it
     * into a series of bitmap textures. This proides great speed boost,
     * but prevents further editing.
     *
     * This version packs tiles into rhombus-shaped chunks, and sorts them
     * from top to bottom. This fixes seam issues for isometric games.
     * Note that tiles should be placed on a flat plane for the proper sorting.
     * If you need an effect of elevation, consider shifting each tile with
     * tile.pivot.y property.
     *
     * This is the same as calling `tilemap.cacheDiamond();`
     *
     * @param {Tilemap} tilemap The tilemap which needs to be cached.
     * @param {number} chunkSize The size of one chunk.
     */
    cacheDiamond(tilemap, chunkSize) {
        tilemap.cacheDiamond(chunkSize);
    }
};

/**
 * This class represents a camera that is used by ct.js' cameras.
 * Usually you won't create new instances of it, but if you need, you can substitute
 * ct.camera with a new one.
 *
 * @extends {PIXI.DisplayObject}
 * @class
 *
 * @property {number} x The real x-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetX`
 * if the camera is in transition.
 * @property {number} y The real y-coordinate of the camera.
 * It does not have a screen shake effect applied, as well as may differ from `targetY`
 * if the camera is in transition.
 * @property {number} width The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.x to get a scaled version.
 * To change this value, see `ct.width` property.
 * @property {number} height The width of the unscaled shown region.
 * This is the base, unscaled value. Use ct.camera.scale.y to get a scaled version.
 * To change this value, see `ct.height` property.
 * @property {number} targetX The x-coordinate of the target location.
 * Moving it instead of just using the `x` parameter will trigger the drift effect.
 * @property {number} targetY The y-coordinate of the target location.
 * Moving it instead of just using the `y` parameter will trigger the drift effect.
 *
 * @property {Copy|false} follow If set, the camera will follow the given copy.
 * @property {boolean} followX Works if `follow` is set to a copy.
 * Enables following in X axis. Set it to `false` and followY to `true`
 * to limit automatic camera movement to vertical axis.
 * @property {boolean} followY Works if `follow` is set to a copy.
 * Enables following in Y axis. Set it to `false` and followX to `true`
 * to limit automatic camera movement to horizontal axis.
 * @property {number|null} borderX Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number|null} borderY Works if `follow` is set to a copy.
 * Sets the frame inside which the copy will be kept, in game pixels.
 * Can be set to `null` so the copy is set to the center of the screen.
 * @property {number} shiftX Displaces the camera horizontally
 * but does not change x and y parameters.
 * @property {number} shiftY Displaces the camera vertically
 * but does not change x and y parameters.
 * @property {number} drift Works if `follow` is set to a copy.
 * If set to a value between 0 and 1, it will make camera movement smoother
 *
 * @property {number} shake The current power of a screen shake effect,
 * relative to the screen's max side (100 is 100% of screen shake).
 * If set to 0 or less, it, disables the effect.
 * @property {number} shakePhase The current phase of screen shake oscillation.
 * @property {number} shakeDecay The amount of `shake` units substracted in a second.
 * Default is 5.
 * @property {number} shakeFrequency The base frequency of the screen shake effect.
 * Default is 50.
 * @property {number} shakeX A multiplier applied to the horizontal screen shake effect.
 * Default is 1.
 * @property {number} shakeY A multiplier applied to the vertical screen shake effect.
 * Default is 1.
 * @property {number} shakeMax The maximum possible value for the `shake` property
 * to protect players from losing their monitor, in `shake` units. Default is 10.
 */
const Camera = (function Camera() {
    const shakeCamera = function shakeCamera(camera, delta) {
        const sec = delta / (PIXI.Ticker.shared.maxFPS || 60);
        camera.shake -= sec * camera.shakeDecay;
        camera.shake = Math.max(0, camera.shake);
        if (camera.shakeMax) {
            camera.shake = Math.min(camera.shake, camera.shakeMax);
        }
        const phaseDelta = sec * camera.shakeFrequency;
        camera.shakePhase += phaseDelta;
        // no logic in these constants
        // They are used to desync fluctuations and remove repetitive circular movements
        camera.shakePhaseX += phaseDelta * (1 + Math.sin(camera.shakePhase * 0.1489) * 0.25);
        camera.shakePhaseY += phaseDelta * (1 + Math.sin(camera.shakePhase * 0.1734) * 0.25);
    };
    const followCamera = function followCamera(camera) {
        // eslint-disable-next-line max-len
        const bx = camera.borderX === null ? camera.width / 2 : Math.min(camera.borderX, camera.width / 2),
              // eslint-disable-next-line max-len
              by = camera.borderY === null ? camera.height / 2 : Math.min(camera.borderY, camera.height / 2);
        const tl = camera.uiToGameCoord(bx, by),
              br = camera.uiToGameCoord(camera.width - bx, camera.height - by);

        if (camera.followX) {
            if (camera.follow.x < tl.x - camera.interpolatedShiftX) {
                camera.targetX = camera.follow.x - bx + camera.width / 2;
            } else if (camera.follow.x > br.x - camera.interpolatedShiftX) {
                camera.targetX = camera.follow.x + bx - camera.width / 2;
            }
        }
        if (camera.followY) {
            if (camera.follow.y < tl.y - camera.interpolatedShiftY) {
                camera.targetY = camera.follow.y - by + camera.height / 2;
            } else if (camera.follow.y > br.y - camera.interpolatedShiftY) {
                camera.targetY = camera.follow.y + by - camera.height / 2;
            }
        }
    };
    const restrictInRect = function restrictInRect(camera) {
        if (camera.minX !== void 0) {
            const boundary = camera.minX + camera.width * camera.scale.x * 0.5;
            camera.x = Math.max(boundary, camera.x);
            camera.targetX = Math.max(boundary, camera.targetX);
        }
        if (camera.maxX !== void 0) {
            const boundary = camera.maxX - camera.width * camera.scale.x * 0.5;
            camera.x = Math.min(boundary, camera.x);
            camera.targetX = Math.min(boundary, camera.targetX);
        }
        if (camera.minY !== void 0) {
            const boundary = camera.minY + camera.height * camera.scale.y * 0.5;
            camera.y = Math.max(boundary, camera.y);
            camera.targetY = Math.max(boundary, camera.targetY);
        }
        if (camera.maxY !== void 0) {
            const boundary = camera.maxY - camera.height * camera.scale.y * 0.5;
            camera.y = Math.min(boundary, camera.y);
            camera.targetY = Math.min(boundary, camera.targetY);
        }
    };
    class Camera extends PIXI.DisplayObject {
        constructor(x, y, w, h) {
            super();
            this.follow = this.rotate = false;
            this.followX = this.followY = true;
            this.targetX = this.x = x;
            this.targetY = this.y = y;
            this.z = 500;
            this.width = w || 1920;
            this.height = h || 1080;
            this.shiftX = this.shiftY = this.interpolatedShiftX = this.interpolatedShiftY = 0;
            this.borderX = this.borderY = null;
            this.drift = 0;

            this.shake = 0;
            this.shakeDecay = 5;
            this.shakeX = this.shakeY = 1;
            this.shakeFrequency = 50;
            this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
            this.shakeMax = 10;

            this.getBounds = this.getBoundingBox;
        }

        get scale() {
            return this.transform.scale;
        }
        set scale(value) {
            if (typeof value === 'number') {
                value = {
                    x: value,
                    y: value
                };
            }
            this.transform.scale.copyFrom(value);
        }

        /**
         * Moves the camera to a new position. It will have a smooth transition
         * if a `drift` parameter is set.
         * @param {number} x New x coordinate
         * @param {number} y New y coordinate
         * @returns {void}
         */
        moveTo(x, y) {
            this.targetX = x;
            this.targetY = y;
        }

        /**
         * Moves the camera to a new position. Ignores the `drift` value.
         * @param {number} x New x coordinate
         * @param {number} y New y coordinate
         * @returns {void}
         */
        teleportTo(x, y) {
            this.targetX = this.x = x;
            this.targetY = this.y = y;
            this.shakePhase = this.shakePhaseX = this.shakePhaseY = 0;
            this.interpolatedShiftX = this.shiftX;
            this.interpolatedShiftY = this.shiftY;
        }

        /**
         * Updates the position of the camera
         * @param {number} delta A delta value between the last two frames.
         * This is usually ct.delta.
         * @returns {void}
         */
        update(delta) {
            shakeCamera(this, delta);
            // Check if we've been following a copy that is now killed
            if (this.follow && this.follow.kill) {
                this.follow = false;
            }
            // Follow copies around
            if (this.follow && ('x' in this.follow) && ('y' in this.follow)) {
                followCamera(this);
            }

            // The speed of drift movement
            const speed = this.drift ? Math.min(1, (1 - this.drift) * delta) : 1;
            // Perform drift motion
            this.x = this.targetX * speed + this.x * (1 - speed);
            this.y = this.targetY * speed + this.y * (1 - speed);

            // Off-center shifts drift, too
            this.interpolatedShiftX = this.shiftX * speed + this.interpolatedShiftX * (1 - speed);
            this.interpolatedShiftY = this.shiftY * speed + this.interpolatedShiftY * (1 - speed);

            restrictInRect(this);

            // Recover from possible calculation errors
            this.x = this.x || 0;
            this.y = this.y || 0;
        }

        /**
         * Returns the current camera position plus the screen shake effect.
         * @type {number}
         */
        get computedX() {
            // eslint-disable-next-line max-len
            const dx = (Math.sin(this.shakePhaseX) + Math.sin(this.shakePhaseX * 3.1846) * 0.25) / 1.25;
            // eslint-disable-next-line max-len
            const x = this.x + dx * this.shake * Math.max(this.width, this.height) / 100 * this.shakeX;
            return x + this.interpolatedShiftX;
        }
        /**
         * Returns the current camera position plus the screen shake effect.
         * @type {number}
         */
        get computedY() {
            // eslint-disable-next-line max-len
            const dy = (Math.sin(this.shakePhaseY) + Math.sin(this.shakePhaseY * 2.8948) * 0.25) / 1.25;
            // eslint-disable-next-line max-len
            const y = this.y + dy * this.shake * Math.max(this.width, this.height) / 100 * this.shakeY;
            return y + this.interpolatedShiftY;
        }

        /**
         * Returns the position of the left edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopLeftCorner`
         * and `getBottomLeftCorner` methods.
         * @returns {number} The location of the left edge.
         * @type {number}
         * @readonly
         */
        get left() {
            return this.computedX - (this.width / 2) * this.scale.x;
        }
        /**
         * Returns the position of the top edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopLeftCorner`
         * and `getTopRightCorner` methods.
         * @returns {number} The location of the top edge.
         * @type {number}
         * @readonly
         */
        get top() {
            return this.computedY - (this.height / 2) * this.scale.y;
        }
        /**
         * Returns the position of the right edge where the visible rectangle ends,
         * in game coordinates.
         * This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getTopRightCorner`
         * and `getBottomRightCorner` methods.
         * @returns {number} The location of the right edge.
         * @type {number}
         * @readonly
         */
        get right() {
            return this.computedX + (this.width / 2) * this.scale.x;
        }
        /**
         * Returns the position of the bottom edge where the visible rectangle ends,
         * in game coordinates. This can be used for UI positioning in game coordinates.
         * This does not count for rotations, though.
         * For rotated and/or scaled viewports, see `getBottomLeftCorner`
         * and `getBottomRightCorner` methods.
         * @returns {number} The location of the bottom edge.
         * @type {number}
         * @readonly
         */
        get bottom() {
            return this.computedY + (this.height / 2) * this.scale.y;
        }

        /**
         * Translates a point from UI space to game space.
         * @param {number} x The x coordinate in UI space.
         * @param {number} y The y coordinate in UI space.
         * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
         */
        uiToGameCoord(x, y) {
            const modx = (x - this.width / 2) * this.scale.x,
                  mody = (y - this.height / 2) * this.scale.y;
            const result = ct.u.rotate(modx, mody, this.angle);
            return new PIXI.Point(
                result.x + this.computedX,
                result.y + this.computedY
            );
        }

        /**
         * Translates a point from game space to UI space.
         * @param {number} x The x coordinate in game space.
         * @param {number} y The y coordinate in game space.
         * @returns {PIXI.Point} A pair of new `x` and `y` coordinates.
         */
        gameToUiCoord(x, y) {
            const relx = x - this.computedX,
                  rely = y - this.computedY;
            const unrotated = ct.u.rotate(relx, rely, -this.angle);
            return new PIXI.Point(
                unrotated.x / this.scale.x + this.width / 2,
                unrotated.y / this.scale.y + this.height / 2
            );
        }
        /**
         * Gets the position of the top-left corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getTopLeftCorner() {
            return this.uiToGameCoord(0, 0);
        }

        /**
         * Gets the position of the top-right corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getTopRightCorner() {
            return this.uiToGameCoord(this.width, 0);
        }

        /**
         * Gets the position of the bottom-left corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getBottomLeftCorner() {
            return this.uiToGameCoord(0, this.height);
        }

        /**
         * Gets the position of the bottom-right corner of the viewport in game coordinates.
         * This is useful for positioning UI elements in game coordinates,
         * especially with rotated viewports.
         * @returns {PIXI.Point} A pair of `x` and `y` coordinates.
         */
        getBottomRightCorner() {
            return this.uiToGameCoord(this.width, this.height);
        }

        /**
         * Returns the bounding box of the camera.
         * Useful for rotated viewports when something needs to be reliably covered by a rectangle.
         * @returns {PIXI.Rectangle} The bounding box of the camera.
         */
        getBoundingBox() {
            const bb = new PIXI.Bounds();
            const tl = this.getTopLeftCorner(),
                  tr = this.getTopRightCorner(),
                  bl = this.getBottomLeftCorner(),
                  br = this.getBottomRightCorner();
            bb.addPoint(new PIXI.Point(tl.x, tl.y));
            bb.addPoint(new PIXI.Point(tr.x, tr.y));
            bb.addPoint(new PIXI.Point(bl.x, bl.y));
            bb.addPoint(new PIXI.Point(br.x, br.y));
            return bb.getRectangle();
        }

        /**
         * Checks whether a given object (or any Pixi's DisplayObject)
         * is potentially visible, meaning that its bounding box intersects
         * the camera's bounding box.
         * @param {PIXI.DisplayObject} copy An object to check for.
         * @returns {boolean} `true` if an object is visible, `false` otherwise.
         */
        contains(copy) {
            // `true` skips transforms recalculations, boosting performance
            const bounds = copy.getBounds(true);
            return bounds.right > 0 &&
                bounds.left < this.width * this.scale.x &&
                bounds.bottom > 0 &&
                bounds.top < this.width * this.scale.y;
        }

        /**
         * Realigns all the copies in a room so that they distribute proportionally
         * to a new camera size based on their `xstart` and `ystart` coordinates.
         * Will throw an error if the given room is not in UI space (if `room.isUi` is not `true`).
         * You can skip the realignment for some copies
         * if you set their `skipRealign` parameter to `true`.
         * @param {Room} room The room which copies will be realigned.
         * @returns {void}
         */
        realign(room) {
            if (!room.isUi) {
                throw new Error('[ct.camera] An attempt to realing a room that is not in UI space. The room in question is', room);
            }
            const w = (ct.rooms.templates[room.name].width || 1),
                  h = (ct.rooms.templates[room.name].height || 1);
            for (const copy of room.children) {
                if (!('xstart' in copy) || copy.skipRealign) {
                    continue;
                }
                copy.x = copy.xstart / w * this.width;
                copy.y = copy.ystart / h * this.height;
            }
        }
        /**
         * This will align all non-UI layers in the game according to the camera's transforms.
         * This is automatically called internally, and you will hardly ever use it.
         * @returns {void}
         */
        manageStage() {
            const px = this.computedX,
                  py = this.computedY,
                  sx = 1 / (isNaN(this.scale.x) ? 1 : this.scale.x),
                  sy = 1 / (isNaN(this.scale.y) ? 1 : this.scale.y);
            for (const item of ct.stage.children) {
                if (!item.isUi && item.pivot) {
                    item.x = -this.width / 2;
                    item.y = -this.height / 2;
                    item.pivot.x = px;
                    item.pivot.y = py;
                    item.scale.x = sx;
                    item.scale.y = sy;
                    item.angle = -this.angle;
                }
            }
        }
    }
    return Camera;
})(ct);
void Camera;

(function timerAddon() {
    const ctTimerTime = Symbol('time');
    const ctTimerRoomUid = Symbol('roomUid');
    const ctTimerTimeLeftOriginal = Symbol('timeLeftOriginal');
    const promiseResolve = Symbol('promiseResolve');
    const promiseReject = Symbol('promiseReject');

    /**
     * @property {boolean} isUi Whether the timer uses ct.deltaUi or not.
     * @property {string|false} name The name of the timer
     */
    class CtTimer {
        /**
         * An object for holding a timer
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer
         * @param {boolean} [uiDelta=false] If `true`, it will use `ct.deltaUi` for counting time.
         * if `false`, it will use `ct.delta` for counting time.
         */
        constructor(timeMs, name = false, uiDelta = false) {
            this[ctTimerRoomUid] = ct.room.uid || null;
            this.name = name && name.toString();
            this.isUi = uiDelta;
            this[ctTimerTime] = 0;
            this[ctTimerTimeLeftOriginal] = timeMs;
            this.timeLeft = this[ctTimerTimeLeftOriginal];
            this.promise = new Promise((resolve, reject) => {
                this[promiseResolve] = resolve;
                this[promiseReject] = reject;
            });
            this.rejected = false;
            this.done = false;
            this.settled = false;
            ct.timer.timers.add(this);
        }

        /**
         * Attaches callbacks for the resolution and/or rejection of the Promise.
         *
         * @param {Function} onfulfilled The callback to execute when the Promise is resolved.
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        then(...args) {
            return this.promise.then(...args);
        }
        /**
         * Attaches a callback for the rejection of the Promise.
         *
         * @param {Function} [onrejected] The callback to execute when the Promise is rejected.
         * @returns {Promise} A Promise for the completion of which ever callback is executed.
         */
        catch(onrejected) {
            return this.promise.catch(onrejected);
        }

        /**
         * The time passed on this timer, in seconds
         * @type {number}
         */
        get time() {
            return this[ctTimerTime] * 1000 / ct.speed;
        }
        set time(newTime) {
            this[ctTimerTime] = newTime / 1000 * ct.speed;
        }

        /**
         * Updates the timer. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        update() {
            // Not something that would normally happen,
            // but do check whether this timer was not automatically removed
            if (this.rejected === true || this.done === true) {
                this.remove();
                return;
            }
            this[ctTimerTime] += this.isUi ? ct.deltaUi : ct.delta;
            if (ct.room.uid !== this[ctTimerRoomUid] && this[ctTimerRoomUid] !== null) {
                this.reject({
                    info: 'Room switch',
                    from: 'ct.timer'
                }); // Reject if the room was switched
            }

            // If the timer is supposed to end
            if (this.timeLeft !== 0) {
                this.timeLeft = this[ctTimerTimeLeftOriginal] - this.time;
                if (this.timeLeft <= 0) {
                    this.resolve();
                }
            }
        }

        /**
         * Instantly triggers the timer and calls the callbacks added through `then` method.
         * @returns {void}
         */
        resolve() {
            if (this.settled) {
                return;
            }
            this.done = true;
            this.settled = true;
            this[promiseResolve]();
            this.remove();
        }
        /**
         * Stops the timer with a given message by rejecting a Promise object.
         * @param {any} message The value to pass to the `catch` callback
         * @returns {void}
         */
        reject(message) {
            if (this.settled) {
                return;
            }
            this.rejected = true;
            this.settled = true;
            this[promiseReject](message);
            this.remove();
        }
        /**
         * Removes the timer from ct.js game loop. This timer will not trigger.
         * @returns {void}
         */
        remove() {
            ct.timer.timers.delete(this);
        }
    }
    window.CtTimer = CtTimer;

    /**
     * Timer utilities
     * @namespace
     */
    ct.timer = {
        /**
         * A set with all the active timers.
         * @type Set<CtTimer>
         */
        timers: new Set(),
        counter: 0,
        /**
         * Adds a new timer with a given name
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        add(timeMs, name = false) {
            return new CtTimer(timeMs, name, false);
        },
        /**
         * Adds a new timer with a given name that runs in a UI time scale
         *
         * @param {number} timeMs The length of the timer, **in milliseconds**
         * @param {string|false} [name=false] The name of the timer, which you use
         * to access it from `ct.timer.timers`.
         * @returns {CtTimer} The timer
         */
        addUi(timeMs, name = false) {
            return new CtTimer(timeMs, name, true);
        },
        /**
         * Updates the timers. **DONT CALL THIS UNLESS YOU KNOW WHAT YOU ARE DOING**
         *
         * @returns {void}
         * @private
         */
        updateTimers() {
            for (const timer of this.timers) {
                timer.update();
            }
        }
    };
})();
if (document.fonts) { for (const font of document.fonts) { font.load(); }}/**
 * @typedef ICtPlaceRectangle
 * @property {number} [x1] The left side of the rectangle.
 * @property {number} [y1] The upper side of the rectangle.
 * @property {number} [x2] The right side of the rectangle.
 * @property {number} [y2] The bottom side of the rectangle.
 * @property {number} [x] The left side of the rectangle.
 * @property {number} [y] The upper side of the rectangle.
 * @property {number} [width] The right side of the rectangle.
 * @property {number} [height] The bottom side of the rectangle.
 */
/**
 * @typedef ICtPlaceLineSegment
 * @property {number} x1 The horizontal coordinate of the starting point of the ray.
 * @property {number} y1 The vertical coordinate of the starting point of the ray.
 * @property {number} x2 The horizontal coordinate of the ending point of the ray.
 * @property {number} y2 The vertical coordinate of the ending point of the ray.
 */
/**
 * @typedef ICtPlaceCircle
 * @property {number} x The horizontal coordinate of the circle's center.
 * @property {number} y The vertical coordinate of the circle's center.
 * @property {number} radius The radius of the circle.
 */
/* eslint-disable no-underscore-dangle */
/* global SSCD */
/* eslint prefer-destructuring: 0 */
(function ctPlace(ct) {
    const circlePrecision = 16,
          twoPi = Math.PI * 0;
    const debugMode = [false][0];

    const getSSCDShapeFromRect = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        if (obj.angle === 0) {
            position.x -= obj.scale.x > 0 ?
                (shape.left * obj.scale.x) :
                (-obj.scale.x * shape.right);
            position.y -= obj.scale.y > 0 ?
                (shape.top * obj.scale.y) :
                (-shape.bottom * obj.scale.y);
            return new SSCD.Rectangle(
                position,
                new SSCD.Vector(
                    Math.abs((shape.left + shape.right) * obj.scale.x),
                    Math.abs((shape.bottom + shape.top) * obj.scale.y)
                )
            );
        }
        const upperLeft = ct.u.rotate(
            -shape.left * obj.scale.x,
            -shape.top * obj.scale.y, obj.angle
        );
        const bottomLeft = ct.u.rotate(
            -shape.left * obj.scale.x,
            shape.bottom * obj.scale.y, obj.angle
        );
        const bottomRight = ct.u.rotate(
            shape.right * obj.scale.x,
            shape.bottom * obj.scale.y, obj.angle
        );
        const upperRight = ct.u.rotate(
            shape.right * obj.scale.x,
            -shape.top * obj.scale.y, obj.angle
        );
        return new SSCD.LineStrip(position, [
            new SSCD.Vector(upperLeft.x, upperLeft.y),
            new SSCD.Vector(bottomLeft.x, bottomLeft.y),
            new SSCD.Vector(bottomRight.x, bottomRight.y),
            new SSCD.Vector(upperRight.x, upperRight.y)
        ], true);
    };

    const getSSCDShapeFromCircle = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        if (Math.abs(obj.scale.x) === Math.abs(obj.scale.y)) {
            return new SSCD.Circle(position, shape.r * Math.abs(obj.scale.x));
        }
        const vertices = [];
        for (let i = 0; i < circlePrecision; i++) {
            const point = [
                Math.sin(twoPi / circlePrecision * i) * shape.r * obj.scale.x,
                Math.cos(twoPi / circlePrecision * i) * shape.r * obj.scale.y
            ];
            if (obj.angle !== 0) {
                const {x, y} = ct.u.rotate(point[0], point[1], obj.angle);
                vertices.push(x, y);
            } else {
                vertices.push(point);
            }
        }
        return new SSCD.LineStrip(position, vertices, true);
    };

    const getSSCDShapeFromStrip = function (obj) {
        const {shape} = obj,
              position = new SSCD.Vector(obj.x, obj.y);
        const vertices = [];
        if (obj.angle !== 0) {
            for (const point of shape.points) {
                const {x, y} = ct.u.rotate(
                    point.x * obj.scale.x,
                    point.y * obj.scale.y, obj.angle
                );
                vertices.push(new SSCD.Vector(x, y));
            }
        } else {
            for (const point of shape.points) {
                vertices.push(new SSCD.Vector(point.x * obj.scale.x, point.y * obj.scale.y));
            }
        }
        return new SSCD.LineStrip(position, vertices, Boolean(shape.closedStrip));
    };

    const getSSCDShapeFromLine = function (obj) {
        const {shape} = obj;
        if (obj.angle !== 0) {
            const {x: x1, y: y1} = ct.u.rotate(
                shape.x1 * obj.scale.x,
                shape.y1 * obj.scale.y,
                obj.angle
            );
            const {x: x2, y: y2} = ct.u.rotate(
                shape.x2 * obj.scale.x,
                shape.y2 * obj.scale.y,
                obj.angle
            );
            return new SSCD.Line(
                new SSCD.Vector(
                    obj.x + x1,
                    obj.y + y1
                ),
                new SSCD.Vector(
                    x2 - x1,
                    y2 - y1
                )
            );
        }
        return new SSCD.Line(
            new SSCD.Vector(
                obj.x + shape.x1 * obj.scale.x,
                obj.y + shape.y1 * obj.scale.y
            ),
            new SSCD.Vector(
                (shape.x2 - shape.x1) * obj.scale.x,
                (shape.y2 - shape.y1) * obj.scale.y
            )
        );
    };

    /**
     * Gets SSCD shapes from object's shape field and its transforms.
     */
    var getSSCDShape = function (obj) {
        switch (obj.shape.type) {
        case 'rect':
            return getSSCDShapeFromRect(obj);
        case 'circle':
            return getSSCDShapeFromCircle(obj);
        case 'strip':
            return getSSCDShapeFromStrip(obj);
        case 'line':
            return getSSCDShapeFromLine(obj);
        default:
            return new SSCD.Circle(new SSCD.Vector(obj.x, obj.y), 0);
        }
    };

    // Premade filter predicates to avoid function creation and memory bloat during the game loop.
    const templateNameFilter = (target, other, template) => other.template === template;
    const cgroupFilter = (target, other, cgroup) => !cgroup || cgroup === other.cgroup;

    // Core collision-checking method that accepts various filtering predicates
    // and a variable partitioning grid.

    // eslint-disable-next-line max-params
    const genericCollisionQuery = function (
        target,
        customX,
        customY,
        partitioningGrid,
        queryAll,
        filterPredicate,
        filterVariable
    ) {
        const oldx = target.x,
              oldy = target.y;
        const shapeCashed = target._shape;
        let hashes, results;
        // Apply arbitrary location to the checked object
        if (customX !== void 0 && (oldx !== customX || oldy !== customY)) {
            target.x = customX;
            target.y = customY;
            target._shape = getSSCDShape(target);
            hashes = ct.place.getHashes(target);
        } else {
            hashes = target.$chashes || ct.place.getHashes(target);
            target._shape = target._shape || getSSCDShape(target);
        }
        if (queryAll) {
            results = [];
        }
        // Get all the known objects in close proximity to the tested object,
        // sourcing from the passed partitioning grid.
        for (const hash of hashes) {
            const array = partitioningGrid[hash];
            // Such partition cell is absent
            if (!array) {
                continue;
            }
            for (const obj of array) {
                // Skip checks against the tested object itself.
                if (obj === target) {
                    continue;
                }
                // Filter out objects
                if (!filterPredicate(target, obj, filterVariable)) {
                    continue;
                }
                // Check for collision between two objects
                if (ct.place.collide(target, obj)) {
                    // Singular pick; return the collided object immediately.
                    if (!queryAll) {
                        // Return the object back to its old position.
                        // Skip SSCD shape re-calculation.
                        if (oldx !== target.x || oldy !== target.y) {
                            target.x = oldx;
                            target.y = oldy;
                            target._shape = shapeCashed;
                        }
                        return obj;
                    }
                    // Multiple pick; push the collided object into an array.
                    if (!results.includes(obj)) {
                        results.push(obj);
                    }
                }
            }
        }
        // Return the object back to its old position.
        // Skip SSCD shape re-calculation.
        if (oldx !== target.x || oldy !== target.y) {
            target.x = oldx;
            target.y = oldy;
            target._shape = shapeCashed;
        }
        if (!queryAll) {
            return false;
        }
        return results;
    };

    ct.place = {
        m: 1, // direction modifier in ct.place.go,
        gridX: [1024][0] || 512,
        gridY: [1024][0] || 512,
        grid: {},
        tileGrid: {},
        getHashes(copy) {
            var hashes = [];
            var x = Math.round(copy.x / ct.place.gridX),
                y = Math.round(copy.y / ct.place.gridY),
                dx = Math.sign(copy.x - ct.place.gridX * x),
                dy = Math.sign(copy.y - ct.place.gridY * y);
            hashes.push(`${x}:${y}`);
            if (dx) {
                hashes.push(`${x + dx}:${y}`);
                if (dy) {
                    hashes.push(`${x + dx}:${y + dy}`);
                }
            }
            if (dy) {
                hashes.push(`${x}:${y + dy}`);
            }
            return hashes;
        },
        /**
         * Applied to copies in the debug mode. Draws a collision shape
         * @this Copy
         * @param {boolean} [absolute] Whether to use room coordinates
         * instead of coordinates relative to the copy.
         * @returns {void}
         */
        drawDebugGraphic(absolute) {
            const shape = this._shape || getSSCDShape(this);
            const g = this.$cDebugCollision;
            let color = 0x00ffff;
            if (this instanceof Copy) {
                color = 0x0066ff;
            } else if (this instanceof PIXI.Sprite) {
                color = 0x6600ff;
            }
            if (this.$cHadCollision) {
                color = 0x00ff00;
            }
            g.lineStyle(2, color);
            if (shape instanceof SSCD.Rectangle) {
                const pos = shape.get_position(),
                      size = shape.get_size();
                g.beginFill(color, 0.1);
                if (!absolute) {
                    g.drawRect(pos.x - this.x, pos.y - this.y, size.x, size.y);
                } else {
                    g.drawRect(pos.x, pos.y, size.x, size.y);
                }
                g.endFill();
            } else if (shape instanceof SSCD.LineStrip) {
                if (!absolute) {
                    g.moveTo(shape.__points[0].x, shape.__points[0].y);
                    for (let i = 1; i < shape.__points.length; i++) {
                        g.lineTo(shape.__points[i].x, shape.__points[i].y);
                    }
                } else {
                    g.moveTo(shape.__points[0].x + this.x, shape.__points[0].y + this.y);
                    for (let i = 1; i < shape.__points.length; i++) {
                        g.lineTo(shape.__points[i].x + this.x, shape.__points[i].y + this.y);
                    }
                }
            } else if (shape instanceof SSCD.Circle && shape.get_radius() > 0) {
                g.beginFill(color, 0.1);
                if (!absolute) {
                    g.drawCircle(0, 0, shape.get_radius());
                } else {
                    g.drawCircle(this.x, this.y, shape.get_radius());
                }
                g.endFill();
            } else if (shape instanceof SSCD.Line) {
                if (!absolute) {
                    g.moveTo(
                        shape.__position.x,
                        shape.__position.y
                    ).lineTo(
                        shape.__position.x + shape.__dest.x,
                        shape.__position.y + shape.__dest.y
                    );
                } else {
                    const p1 = shape.get_p1();
                    const p2 = shape.get_p2();
                    g.moveTo(p1.x, p1.y)
                    .lineTo(p2.x, p2.y);
                }
            } else if (!absolute) { // Treat as a point
                g.moveTo(-16, -16)
                .lineTo(16, 16)
                .moveTo(-16, 16)
                .lineTo(16, -16);
            } else {
                g.moveTo(-16 + this.x, -16 + this.y)
                .lineTo(16 + this.x, 16 + this.y)
                .moveTo(-16 + this.x, 16 + this.y)
                .lineTo(16 + this.x, -16 + this.y);
            }
        },
        collide(c1, c2) {
            // ct.place.collide(<c1: Copy, c2: Copy>)
            // Test collision between two copies
            c1._shape = c1._shape || getSSCDShape(c1);
            c2._shape = c2._shape || getSSCDShape(c2);
            if (c1._shape.__type === 'strip' ||
                c2._shape.__type === 'strip' ||
                c1._shape.__type === 'complex' ||
                c2._shape.__type === 'complex'
            ) {
                const aabb1 = c1._shape.get_aabb(),
                      aabb2 = c2._shape.get_aabb();
                if (!aabb1.intersects(aabb2)) {
                    return false;
                }
            }
            if (SSCD.CollisionManager.test_collision(c1._shape, c2._shape)) {
                if ([false][0]) {
                    c1.$cHadCollision = true;
                    c2.$cHadCollision = true;
                }
                return true;
            }
            return false;
        },
        /**
         * Determines if the place in (x,y) is occupied by any copies or tiles.
         * Optionally can take 'cgroup' as a filter for obstacles'
         * collision group (not shape type).
         *
         * @param {Copy} me The object to check collisions on.
         * @param {number} [x] The x coordinate to check, as if `me` was placed there.
         * @param {number} [y] The y coordinate to check, as if `me` was placed there.
         * @param {String} [cgroup] The collision group to check against
         * @returns {Copy|Array<Copy>} The collided copy, or an array of all the detected collisions
         * (if `multiple` is `true`)
         */
        occupied(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            const copies = genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                cgroupFilter, cgroup
            );
            // Was any suitable copy found? Return it immediately and skip the query for tiles.
            if (copies) {
                return copies;
            }
            // Return query result for tiles.
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                false,
                cgroupFilter, cgroup
            );
        },
        occupiedMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            const copies = genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                cgroupFilter, cgroup
            );
            const tiles = genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                true,
                cgroupFilter, cgroup
            );
            return copies.concat(tiles);
        },
        free(me, x, y, cgroup) {
            return !ct.place.occupied(me, x, y, cgroup);
        },
        meet(target, x, y, templateName) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                templateName = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                templateNameFilter, templateName
            );
        },
        meetMultiple(target, x, y, templateName) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                templateName = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                templateNameFilter, templateName
            );
        },
        copies(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                false,
                cgroupFilter, cgroup
            );
        },
        copiesMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.grid,
                true,
                cgroupFilter, cgroup
            );
        },
        tiles(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                false,
                cgroupFilter, cgroup
            );
        },
        tilesMultiple(target, x, y, cgroup) {
            if (typeof y !== 'number') {
                // No arbitrary location was passed, rewrite arguments w/o them.
                cgroup = x;
                x = void 0;
                y = void 0;
            }
            return genericCollisionQuery(
                target, x, y,
                ct.place.tileGrid,
                true,
                cgroupFilter, cgroup
            );
        },
        lastdist: null,
        nearest(x, y, templateName) {
            // ct.place.nearest(x: number, y: number, templateName: string)
            const copies = ct.templates.list[templateName];
            if (copies.length > 0) {
                var dist = Math.hypot(x - copies[0].x, y - copies[0].y);
                var inst = copies[0];
                for (const copy of copies) {
                    if (Math.hypot(x - copy.x, y - copy.y) < dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        furthest(x, y, template) {
            // ct.place.furthest(<x: number, y: number, template: Template>)
            const templates = ct.templates.list[template];
            if (templates.length > 0) {
                var dist = Math.hypot(x - templates[0].x, y - templates[0].y);
                var inst = templates[0];
                for (const copy of templates) {
                    if (Math.hypot(x - copy.x, y - copy.y) > dist) {
                        dist = Math.hypot(x - copy.x, y - copy.y);
                        inst = copy;
                    }
                }
                ct.place.lastdist = dist;
                return inst;
            }
            return false;
        },
        enableTilemapCollisions(tilemap, exactCgroup) {
            const cgroup = exactCgroup || tilemap.cgroup;
            if (tilemap.addedCollisions) {
                throw new Error('[ct.place] The tilemap already has collisions enabled.');
            }
            tilemap.cgroup = cgroup;
            // Prebake hashes and SSCD shapes for all the tiles
            for (const pixiSprite of tilemap.pixiTiles) {
                // eslint-disable-next-line no-underscore-dangle
                pixiSprite._shape = getSSCDShape(pixiSprite);
                pixiSprite.cgroup = cgroup;
                pixiSprite.$chashes = ct.place.getHashes(pixiSprite);
                /* eslint max-depth: 0 */
                for (const hash of pixiSprite.$chashes) {
                    if (!(hash in ct.place.tileGrid)) {
                        ct.place.tileGrid[hash] = [pixiSprite];
                    } else {
                        ct.place.tileGrid[hash].push(pixiSprite);
                    }
                }
                pixiSprite.depth = tilemap.depth;
            }
            if (debugMode) {
                for (const pixiSprite of tilemap.pixiTiles) {
                    pixiSprite.$cDebugCollision = new PIXI.Graphics();
                    ct.place.drawDebugGraphic.apply(pixiSprite, [false]);
                    pixiSprite.addChild(pixiSprite.$cDebugCollision);
                }
            }
            tilemap.addedCollisions = true;
        },
        moveAlong(me, dir, length, cgroup, precision) {
            if (!length) {
                return false;
            }
            if (typeof cgroup === 'number') {
                precision = cgroup;
                cgroup = void 0;
            }
            precision = Math.abs(precision || 1);
            if (length < 0) {
                length *= -1;
                dir += 180;
            }
            var dx = Math.cos(dir * Math.PI / 180) * precision,
                dy = Math.sin(dir * Math.PI / 180) * precision;
            while (length > 0) {
                if (length < 1) {
                    dx *= length;
                    dy *= length;
                }
                const occupied = ct.place.occupied(me, me.x + dx, me.y + dy, cgroup);
                if (!occupied) {
                    me.x += dx;
                    me.y += dy;
                    delete me._shape;
                } else {
                    return occupied;
                }
                length--;
            }
            return false;
        },
        moveByAxes(me, dx, dy, cgroup, precision) {
            if (dx === dy === 0) {
                return false;
            }
            if (typeof cgroup === 'number') {
                precision = cgroup;
                cgroup = void 0;
            }
            const obstacles = {
                x: false,
                y: false
            };
            precision = Math.abs(precision || 1);
            while (Math.abs(dx) > precision) {
                const occupied =
                    ct.place.occupied(me, me.x + Math.sign(dx) * precision, me.y, cgroup);
                if (!occupied) {
                    me.x += Math.sign(dx) * precision;
                    dx -= Math.sign(dx) * precision;
                } else {
                    obstacles.x = occupied;
                    break;
                }
            }
            while (Math.abs(dy) > precision) {
                const occupied =
                    ct.place.occupied(me, me.x, me.y + Math.sign(dy) * precision, cgroup);
                if (!occupied) {
                    me.y += Math.sign(dy) * precision;
                    dy -= Math.sign(dy) * precision;
                } else {
                    obstacles.y = occupied;
                    break;
                }
            }
            // A fraction of precision may be left but completely reachable; jump to this point.
            if (Math.abs(dx) < precision) {
                if (ct.place.free(me, me.x + dx, me.y, cgroup)) {
                    me.x += dx;
                }
            }
            if (Math.abs(dy) < precision) {
                if (ct.place.free(me, me.x, me.y + dy, cgroup)) {
                    me.y += dy;
                }
            }
            if (!obstacles.x && !obstacles.y) {
                return false;
            }
            return obstacles;
        },
        go(me, x, y, length, cgroup) {
            // ct.place.go(<me: Copy, x: number, y: number, length: number>[, cgroup: String])
            // tries to reach the target with a simple obstacle avoidance algorithm

            // if we are too close to the destination, exit
            if (ct.u.pdc(me.x, me.y, x, y) < length) {
                if (ct.place.free(me, x, y, cgroup)) {
                    me.x = x;
                    me.y = y;
                    delete me._shape;
                }
                return;
            }
            var dir = ct.u.pdn(me.x, me.y, x, y);

            //if there are no obstackles in front of us, go forward
            let projectedX = me.x + ct.u.ldx(length, dir),
                projectedY = me.y + ct.u.ldy(length, dir);
            if (ct.place.free(me, projectedX, projectedY, cgroup)) {
                me.x = projectedX;
                me.y = projectedY;
                delete me._shape;
                me.dir = dir;
            // otherwise, try to change direction by 30...60...90 degrees.
            // Direction changes over time (ct.place.m).
            } else {
                for (var i = -1; i <= 1; i += 2) {
                    for (var j = 30; j < 150; j += 30) {
                        projectedX = me.x + ct.u.ldx(length, dir + j * ct.place.m * i);
                        projectedY = me.y + ct.u.ldy(length, dir + j * ct.place.m * i);
                        if (ct.place.free(me, projectedX, projectedY, cgroup)) {
                            me.x = projectedX;
                            me.y = projectedY;
                            delete me._shape;
                            me.dir = dir + j * ct.place.m * i;
                            return;
                        }
                    }
                }
            }
        },
        traceCustom(shape, oversized, cgroup, getAll) {
            const results = [];
            if (debugMode) {
                shape.$cDebugCollision = ct.place.debugTraceGraphics;
                ct.place.drawDebugGraphic.apply(shape, [true]);
            }
            // Oversized tracing shapes won't work with partitioning table, and thus
            // will need to loop over all the copies and tiles in the room.
            // Non-oversized shapes can use plain ct.place.occupied.
            if (!oversized) {
                if (getAll) {
                    return ct.place.occupiedMultiple(shape, cgroup);
                }
                return ct.place.occupied(shape, cgroup);
            }
            // Oversized shapes.
            // Loop over all the copies in the room.
            for (const copy of ct.stack) {
                if (!cgroup || copy.cgroup === cgroup) {
                    if (ct.place.collide(shape, copy)) {
                        if (getAll) {
                            results.push(copy);
                        } else {
                            return copy;
                        }
                    }
                }
            }
            // Additionally, loop over all the tilesets and their tiles.
            for (const tilemap of ct.templates.list.TILEMAP) {
                if (!tilemap.addedCollisions) {
                    continue;
                }
                if (cgroup && tilemap.cgroup !== cgroup) {
                    continue;
                }
                for (const tile of tilemap.pixiTiles) {
                    if (ct.place.collide(shape, tile)) {
                        if (getAll) {
                            results.push(tile);
                        } else {
                            return tile;
                        }
                    }
                }
            }
            if (!getAll) {
                return false;
            }
            return results;
        },
        /**
         * Tests for intersections with a line segment.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the line segment; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceLineSegment} line An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceLine(line, cgroup, getAll) {
            let oversized = false;
            if (Math.abs(line.x1 - line.x2) > ct.place.gridX) {
                oversized = true;
            } else if (Math.abs(line.y1 - line.y2) > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: line.x1,
                y: line.y1,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'line',
                    x1: 0,
                    y1: 0,
                    x2: line.x2 - line.x1,
                    y2: line.y2 - line.y1
                }
            };
            const result = ct.place.traceCustom(shape, oversized, cgroup, getAll);
            if (getAll) {
                // An approximate sorting by distance
                result.sort(function sortCopies(a, b) {
                    var dist1, dist2;
                    dist1 = ct.u.pdc(line.x1, line.y1, a.x, a.y);
                    dist2 = ct.u.pdc(line.x1, line.y1, b.x, b.y);
                    return dist1 - dist2;
                });
            }
            return result;
        },
        /**
         * Tests for intersections with a filled rectangle.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the rectangle; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceRectangle} rect An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceRect(rect, cgroup, getAll) {
            let oversized = false;
            rect = { // Copy the object
                ...rect
            };
            // Turn x1, x2, y1, y2 into x, y, width, and height
            if ('x1' in rect) {
                rect.x = rect.x1;
                rect.y = rect.y1;
                rect.width = rect.x2 - rect.x1;
                rect.height = rect.y2 - rect.y1;
            }
            if (Math.abs(rect.width) > ct.place.gridX || Math.abs(rect.height) > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: rect.x,
                y: rect.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'rect',
                    left: 0,
                    top: 0,
                    right: rect.width,
                    bottom: rect.height
                }
            };
            return ct.place.traceCustom(shape, oversized, cgroup, getAll);
        },
        /**
         * Tests for intersections with a filled circle.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the circle; otherwise, returns the first one that fits the conditions.
         *
         * @param {ICtPlaceCircle} rect An object that describes the line segment.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        traceCircle(circle, cgroup, getAll) {
            let oversized = false;
            if (circle.radius * 2 > ct.place.gridX || circle.radius * 2 > ct.place.gridY) {
                oversized = true;
            }
            const shape = {
                x: circle.x,
                y: circle.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'circle',
                    r: circle.radius
                }
            };
            return ct.place.traceCustom(shape, oversized, cgroup, getAll);
        },
        /**
         * Tests for intersections with a polyline. It is a hollow shape made
         * of connected line segments. The shape is not closed unless you add
         * the closing point by yourself.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the polyline; otherwise, returns the first one that fits the conditions.
         *
         * @param {Array<IPoint>} polyline An array of objects with `x` and `y` properties.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        tracePolyline(polyline, cgroup, getAll) {
            const shape = {
                x: 0,
                y: 0,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'strip',
                    points: polyline
                }
            };
            return ct.place.traceCustom(shape, true, cgroup, getAll);
        },
        /**
         * Tests for intersections with a point.
         * If `getAll` is set to `true`, returns all the copies that intersect
         * the point; otherwise, returns the first one that fits the conditions.
         *
         * @param {object} point An object with `x` and `y` properties.
         * @param {string} [cgroup] An optional collision group to trace against.
         * If omitted, will trace through all the copies in the current room.
         * @param {boolean} [getAll] Whether to return all the intersections (true),
         * or return the first one.
         * @returns {Copy|Array<Copy>}
         */
        tracePoint(point, cgroup, getAll) {
            const shape = {
                x: point.x,
                y: point.y,
                scale: {
                    x: 1, y: 1
                },
                rotation: 0,
                angle: 0,
                shape: {
                    type: 'point'
                }
            };
            return ct.place.traceCustom(shape, false, cgroup, getAll);
        }
    };
    // Aliases
    ct.place.traceRectange = ct.place.traceRect;
    // a magic procedure which tells 'go' function to change its direction
    setInterval(function switchCtPlaceGoDirection() {
        ct.place.m *= -1;
    }, 789);
})(ct);

(function fittoscreen(ct) {
    document.body.style.overflow = 'hidden';
    var canv = ct.pixiApp.view;
    const positionCanvas = function positionCanvas(mode, scale) {
        if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canv.style.transform = `translate(-50%, -50%) scale(${scale})`;
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        } else if (mode === 'expandViewport' || mode === 'expand' || mode === 'scaleFill') {
            canv.style.position = 'static';
            canv.style.top = 'unset';
            canv.style.left = 'unset';
        } else if (mode === 'scaleFit') {
            canv.style.transform = 'translate(-50%, -50%)';
            canv.style.position = 'absolute';
            canv.style.top = '50%';
            canv.style.left = '50%';
        }
    };
    var resize = function resize() {
        const {mode} = ct.fittoscreen;
        const pixelScaleModifier = ct.highDensity ? (window.devicePixelRatio || 1) : 1;
        const kw = window.innerWidth / ct.roomWidth,
              kh = window.innerHeight / ct.roomHeight;
        let k = Math.min(kw, kh);
        if (mode === 'fastScaleInteger') {
            k = k < 1 ? k : Math.floor(k);
        }
        var canvasWidth, canvasHeight,
            cameraWidth, cameraHeight;
        if (mode === 'expandViewport' || mode === 'expand') {
            canvasWidth = Math.ceil(window.innerWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(window.innerHeight * pixelScaleModifier);
            cameraWidth = window.innerWidth;
            cameraHeight = window.innerHeight;
        } else if (mode === 'fastScale' || mode === 'fastScaleInteger') {
            canvasWidth = Math.ceil(ct.roomWidth * pixelScaleModifier);
            canvasHeight = Math.ceil(ct.roomHeight * pixelScaleModifier);
            cameraWidth = ct.roomWidth;
            cameraHeight = ct.roomHeight;
        } else if (mode === 'scaleFit' || mode === 'scaleFill') {
            if (mode === 'scaleFill') {
                canvasWidth = Math.ceil(ct.roomWidth * kw * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * kh * pixelScaleModifier);
                cameraWidth = window.innerWidth / k;
                cameraHeight = window.innerHeight / k;
            } else { // scaleFit
                canvasWidth = Math.ceil(ct.roomWidth * k * pixelScaleModifier);
                canvasHeight = Math.ceil(ct.roomHeight * k * pixelScaleModifier);
                cameraWidth = ct.roomWidth;
                cameraHeight = ct.roomHeight;
            }
        }

        ct.pixiApp.renderer.resize(canvasWidth, canvasHeight);
        if (mode !== 'scaleFill' && mode !== 'scaleFit') {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier;
        } else {
            ct.pixiApp.stage.scale.x = ct.pixiApp.stage.scale.y = pixelScaleModifier * k;
        }
        canv.style.width = Math.ceil(canvasWidth / pixelScaleModifier) + 'px';
        canv.style.height = Math.ceil(canvasHeight / pixelScaleModifier) + 'px';
        if (ct.camera) {
            ct.camera.width = cameraWidth;
            ct.camera.height = cameraHeight;
        }
        positionCanvas(mode, k);
    };
    var toggleFullscreen = function () {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow();
            win.setFullScreen(!win.isFullScreen());
            return;
        } catch (e) {
            void e; // Continue with web approach
        }
        var canvas = document.fullscreenElement ||
                     document.webkitFullscreenElement ||
                     document.mozFullScreenElement ||
                     document.msFullscreenElement,
            requester = document.getElementById('ct'),
            request = requester.requestFullscreen ||
                      requester.webkitRequestFullscreen ||
                      requester.mozRequestFullScreen ||
                      requester.msRequestFullscreen,
            exit = document.exitFullscreen ||
                   document.webkitExitFullscreen ||
                   document.mozCancelFullScreen ||
                   document.msExitFullscreen;
        if (!canvas) {
            var promise = request.call(requester);
            if (promise) {
                promise
                .catch(function fullscreenError(err) {
                    console.error('[ct.fittoscreen]', err);
                });
            }
        } else if (exit) {
            exit.call(document);
        }
    };
    var queuedFullscreen = function queuedFullscreen() {
        toggleFullscreen();
        document.removeEventListener('mouseup', queuedFullscreen);
        document.removeEventListener('keyup', queuedFullscreen);
        document.removeEventListener('click', queuedFullscreen);
    };
    var queueFullscreen = function queueFullscreen() {
        document.addEventListener('mouseup', queuedFullscreen);
        document.addEventListener('keyup', queuedFullscreen);
        document.addEventListener('click', queuedFullscreen);
    };
    window.addEventListener('resize', resize);
    ct.fittoscreen = resize;
    ct.fittoscreen.toggleFullscreen = queueFullscreen;
    var $mode = 'scaleFit';
    Object.defineProperty(ct.fittoscreen, 'mode', {
        configurable: false,
        enumerable: true,
        set(value) {
            $mode = value;
        },
        get() {
            return $mode;
        }
    });
    ct.fittoscreen.mode = $mode;
    ct.fittoscreen.getIsFullscreen = function getIsFullscreen() {
        try {
            // Are we in Electron?
            const win = require('electron').remote.BrowserWindow.getFocusedWindow;
            return win.isFullScreen;
        } catch (e) {
            void e; // Continue with web approach
        }
        return document.fullscreen || document.webkitIsFullScreen || document.mozFullScreen;
    };
})(ct);

(function mountCtPointer(ct) {
    const keyPrefix = 'pointer.';
    const setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };
    const getKey = function (key) {
        return ct.inputs.registry[keyPrefix + key];
    };
    const buttonMappings = {
        Primary: 1,
        Middle: 4,
        Secondary: 2,
        ExtraOne: 8,
        ExtraTwo: 16,
        Eraser: 32
    };
    var lastPanNum = 0,
        lastPanX = 0,
        lastPanY = 0,
        lastScaleDistance = 0,
        lastAngle = 0;

    // updates Action system's input methods for singular, double and triple pointers
    var countPointers = () => {
        setKey('Any', ct.pointer.down.length > 0 ? 1 : 0);
        setKey('Double', ct.pointer.down.length > 1 ? 1 : 0);
        setKey('Triple', ct.pointer.down.length > 2 ? 1 : 0);
    };
    // returns a new object with the necessary information about a pointer event
    var copyPointer = e => {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const xui = (e.clientX - rect.left) / rect.width * ct.camera.width,
              yui = (e.clientY - rect.top) / rect.height * ct.camera.height;
        const positionGame = ct.u.uiToGameCoord(xui, yui);
        const pointer = {
            id: e.pointerId,
            x: positionGame.x,
            y: positionGame.y,
            clientX: e.clientX,
            clientY: e.clientY,
            xui: xui,
            yui: yui,
            xprev: positionGame.x,
            yprev: positionGame.y,
            buttons: e.buttons,
            xuiprev: xui,
            yuiprev: yui,
            pressure: e.pressure,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
            twist: e.twist,
            type: e.pointerType,
            width: e.width / rect.width * ct.camera.width,
            height: e.height / rect.height * ct.camera.height
        };
        return pointer;
    };
    var updatePointer = (pointer, e) => {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const xui = (e.clientX - rect.left) / rect.width * ct.camera.width,
              yui = (e.clientY - rect.top) / rect.height * ct.camera.height;
        const positionGame = ct.u.uiToGameCoord(xui, yui);
        Object.assign(pointer, {
            x: positionGame.x,
            y: positionGame.y,
            xui: xui,
            yui: yui,
            clientX: e.clientX,
            clientY: e.clientY,
            pressure: e.pressure,
            buttons: e.buttons,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
            twist: e.twist,
            width: e.width / rect.width * ct.camera.width,
            height: e.height / rect.height * ct.camera.height
        });
    };
    var writePrimary = function (pointer) {
        Object.assign(ct.pointer, {
            x: pointer.x,
            y: pointer.y,
            xui: pointer.xui,
            yui: pointer.yui,
            pressure: pointer.pressure,
            buttons: pointer.buttons,
            tiltX: pointer.tiltX,
            tiltY: pointer.tiltY,
            twist: pointer.twist
        });
    };

    var handleHoverStart = function (e) {
        const pointer = copyPointer(e);
        ct.pointer.hover.push(pointer);
        if (e.isPrimary) {
            writePrimary(pointer);
        }
    };
    var handleHoverEnd = function (e) {
        const pointer = ct.pointer.hover.find(p => p.id === e.pointerId);
        if (pointer) {
            pointer.invalid = true;
            ct.pointer.hover.splice(ct.pointer.hover.indexOf(pointer), 1);
        }
        // Handles mouse pointers that were dragged out of the ct.js frame while pressing,
        // as they don't trigger pointercancel or such
        const downId = ct.pointer.down.findIndex(p => p.id === e.pointerId);
        if (downId !== -1) {
            ct.pointer.down.splice(downId, 1);
        }
    };
    var handleMove = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        let pointerHover = ct.pointer.hover.find(p => p.id === e.pointerId);
        if (!pointerHover) {
            // Catches hover events that started before the game has loaded
            handleHoverStart(e);
            pointerHover = ct.pointer.hover.find(p => p.id === e.pointerId);
        }
        const pointerDown = ct.pointer.down.find(p => p.id === e.pointerId);
        if (!pointerHover && !pointerDown) {
            return;
        }
        if (pointerHover) {
            updatePointer(pointerHover, e);
        }
        if (pointerDown) {
            updatePointer(pointerDown, e);
        }
        if (e.isPrimary) {
            writePrimary(pointerHover || pointerDown);
        }
    };
    var handleDown = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        ct.pointer.type = e.pointerType;
        const pointer = copyPointer(e);
        ct.pointer.down.push(pointer);
        countPointers();
        if (e.isPrimary) {
            writePrimary(pointer);
        }
    };
    var handleUp = function (e) {
        if (![false][0]) {
            e.preventDefault();
        }
        const pointer = ct.pointer.down.find(p => p.id === e.pointerId);
        if (pointer) {
            ct.pointer.released.push(pointer);
        }
        if (ct.pointer.down.indexOf(pointer) !== -1) {
            ct.pointer.down.splice(ct.pointer.down.indexOf(pointer), 1);
        }
        countPointers();
    };
    var handleWheel = function handleWheel(e) {
        setKey('Wheel', ((e.wheelDelta || -e.detail) < 0) ? -1 : 1);
        if (![false][0]) {
            e.preventDefault();
        }
    };

    let locking = false;
    const genericCollisionCheck = function genericCollisionCheck(
        copy,
        specificPointer,
        set,
        uiSpace
    ) {
        if (locking) {
            return false;
        }
        for (const pointer of set) {
            if (specificPointer && pointer.id !== specificPointer.id) {
                continue;
            }
            if (ct.place.collide(copy, {
                x: uiSpace ? pointer.xui : pointer.x,
                y: uiSpace ? pointer.yui : pointer.y,
                scale: {
                    x: 1,
                    y: 1
                },
                angle: 0,
                shape: {
                    type: 'rect',
                    top: pointer.height / 2,
                    bottom: pointer.height / 2,
                    left: pointer.width / 2,
                    right: pointer.width / 2
                }
            })) {
                return pointer;
            }
        }
        return false;
    };
    // Triggers on every mouse press event to capture pointer after it was released by a user,
    // e.g. after the window was blurred
    const pointerCapturer = function pointerCapturer() {
        if (!document.pointerLockElement && !document.mozPointerLockElement) {
            const request = document.body.requestPointerLock || document.body.mozRequestPointerLock;
            request.apply(document.body);
        }
    };
    const capturedPointerMove = function capturedPointerMove(e) {
        const rect = ct.pixiApp.view.getBoundingClientRect();
        const dx = e.movementX / rect.width * ct.camera.width,
              dy = e.movementY / rect.height * ct.camera.height;
        ct.pointer.xlocked += dx;
        ct.pointer.ylocked += dy;
        ct.pointer.xmovement = dx;
        ct.pointer.ymovement = dy;
    };

    ct.pointer = {
        setupListeners() {
            document.addEventListener('pointerenter', handleHoverStart, false);
            document.addEventListener('pointerout', handleHoverEnd, false);
            document.addEventListener('pointerleave', handleHoverEnd, false);
            document.addEventListener('pointerdown', handleDown, false);
            document.addEventListener('pointerup', handleUp, false);
            document.addEventListener('pointercancel', handleUp, false);
            document.addEventListener('pointermove', handleMove, false);
            document.addEventListener('wheel', handleWheel, {
                passive: false
            });
            document.addEventListener('DOMMouseScroll', handleWheel, {
                passive: false
            });
            document.addEventListener('contextmenu', e => {
                if (![false][0]) {
                    e.preventDefault();
                }
            });
        },
        hover: [],
        down: [],
        released: [],
        x: 0,
        y: 0,
        xprev: 0,
        yprev: 0,
        xui: 0,
        yui: 0,
        xuiprev: 0,
        yuiprev: 0,
        xlocked: 0,
        ylocked: 0,
        xmovement: 0,
        ymovement: 0,
        pressure: 1,
        buttons: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        width: 1,
        height: 1,
        type: null,
        clear() {
            ct.pointer.down.length = 0;
            ct.pointer.hover.length = 0;
            ct.pointer.clearReleased();
            countPointers();
        },
        clearReleased() {
            ct.pointer.released.length = 0;
        },
        collides(copy, pointer, checkReleased) {
            var set = checkReleased ? ct.pointer.released : ct.pointer.down;
            return genericCollisionCheck(copy, pointer, set, false);
        },
        collidesUi(copy, pointer, checkReleased) {
            var set = checkReleased ? ct.pointer.released : ct.pointer.down;
            return genericCollisionCheck(copy, pointer, set, true);
        },
        hovers(copy, pointer) {
            return genericCollisionCheck(copy, pointer, ct.pointer.hover, false);
        },
        hoversUi(copy, pointer) {
            return genericCollisionCheck(copy, pointer, ct.pointer.hover, true);
        },
        isButtonPressed(button, pointer) {
            if (!pointer) {
                return Boolean(getKey(button));
            }
            // eslint-disable-next-line no-bitwise
            return (pointer.buttons & buttonMappings[button]) === button ? 1 : 0;
        },
        updateGestures() {
            let x = 0,
                y = 0;
            const rect = ct.pixiApp.view.getBoundingClientRect();
            // Get the middle point of all the pointers
            for (const event of ct.pointer.down) {
                x += (event.clientX - rect.left) / rect.width;
                y += (event.clientY - rect.top) / rect.height;
            }
            x /= ct.pointer.down.length;
            y /= ct.pointer.down.length;

            let angle = 0,
                distance = lastScaleDistance;
            if (ct.pointer.down.length > 1) {
                const events = [
                    ct.pointer.down[0],
                    ct.pointer.down[1]
                ].sort((a, b) => a.id - b.id);
                angle = ct.u.pdn(
                    events[0].x,
                    events[0].y,
                    events[1].x,
                    events[1].y
                );
                distance = ct.u.pdc(
                    events[0].x,
                    events[0].y,
                    events[1].x,
                    events[1].y
                );
            }
            if (lastPanNum === ct.pointer.down.length) {
                if (ct.pointer.down.length > 1) {
                    setKey('DeltaRotation', (ct.u.degToRad(ct.u.deltaDir(lastAngle, angle))));
                    setKey('DeltaPinch', distance / lastScaleDistance - 1);
                } else {
                    setKey('DeltaPinch', 0);
                    setKey('DeltaRotation', 0);
                }
                if (!ct.pointer.down.length) {
                    setKey('PanX', 0);
                    setKey('PanY', 0);
                } else {
                    setKey('PanX', x - lastPanX);
                    setKey('PanY', y - lastPanY);
                }
            } else {
                // skip gesture updates to avoid shaking on new presses
                lastPanNum = ct.pointer.down.length;
                setKey('DeltaPinch', 0);
                setKey('DeltaRotation', 0);
                setKey('PanX', 0);
                setKey('PanY', 0);
            }
            lastPanX = x;
            lastPanY = y;
            lastAngle = angle;
            lastScaleDistance = distance;

            for (const button in buttonMappings) {
                setKey(button, 0);
                for (const pointer of ct.pointer.down) {
                    // eslint-disable-next-line no-bitwise
                    if ((pointer.buttons & buttonMappings[button]) === buttonMappings[button]) {
                        setKey(button, 1);
                    }
                }
            }
        },
        lock() {
            if (locking) {
                return;
            }
            locking = true;
            ct.pointer.xlocked = ct.pointer.xui;
            ct.pointer.ylocked = ct.pointer.yui;
            const request = document.body.requestPointerLock || document.body.mozRequestPointerLock;
            request.apply(document.body);
            document.addEventListener('click', pointerCapturer);
            document.addEventListener('pointermove', capturedPointerMove);
        },
        unlock() {
            if (!locking) {
                return;
            }
            locking = false;
            if (document.pointerLockElement || document.mozPointerLockElement) {
                (document.exitPointerLock || document.mozExitPointerLock)();
            }
            document.removeEventListener('click', pointerCapturer);
            document.removeEventListener('pointermove', capturedPointerMove);
        },
        get locked() {
            // Do not return the Document object
            return Boolean(document.pointerLockElement || document.mozPointerLockElement);
        }
    };
    setKey('Wheel', 0);
    if ([false][0]) {
        ct.pointer.lock();
    }
})(ct);

(function ctKeyboard() {
    var keyPrefix = 'keyboard.';
    var setKey = function (key, value) {
        ct.inputs.registry[keyPrefix + key] = value;
    };

    ct.keyboard = {
        string: '',
        lastKey: '',
        lastCode: '',
        alt: false,
        shift: false,
        ctrl: false,
        clear() {
            delete ct.keyboard.lastKey;
            delete ct.keyboard.lastCode;
            ct.keyboard.string = '';
            ct.keyboard.alt = false;
            ct.keyboard.shift = false;
            ct.keyboard.ctrl = false;
        },
        check: [],
        onDown(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            ct.keyboard.lastKey = e.key;
            ct.keyboard.lastCode = e.code;
            if (e.code) {
                setKey(e.code, 1);
            } else {
                setKey('Unknown', 1);
            }
            if (e.key) {
                if (e.key.length === 1) {
                    ct.keyboard.string += e.key;
                } else if (e.key === 'Backspace') {
                    ct.keyboard.string = ct.keyboard.string.slice(0, -1);
                } else if (e.key === 'Enter') {
                    ct.keyboard.string = '';
                }
            }
            e.preventDefault();
        },
        onUp(e) {
            ct.keyboard.shift = e.shiftKey;
            ct.keyboard.alt = e.altKey;
            ct.keyboard.ctrl = e.ctrlKey;
            if (e.code) {
                setKey(e.code, 0);
            } else {
                setKey('Unknown', 0);
            }
            e.preventDefault();
        }
    };

    if (document.addEventListener) {
        document.addEventListener('keydown', ct.keyboard.onDown, false);
        document.addEventListener('keyup', ct.keyboard.onUp, false);
    } else {
        document.attachEvent('onkeydown', ct.keyboard.onDown);
        document.attachEvent('onkeyup', ct.keyboard.onUp);
    }
})();

(function(global) {
    'use strict';
  
    var nativeKeyboardEvent = ('KeyboardEvent' in global);
    if (!nativeKeyboardEvent)
      global.KeyboardEvent = function KeyboardEvent() { throw TypeError('Illegal constructor'); };
  
    [
      ['DOM_KEY_LOCATION_STANDARD', 0x00], // Default or unknown location
      ['DOM_KEY_LOCATION_LEFT', 0x01], // e.g. Left Alt key
      ['DOM_KEY_LOCATION_RIGHT', 0x02], // e.g. Right Alt key
      ['DOM_KEY_LOCATION_NUMPAD', 0x03], // e.g. Numpad 0 or +
    ].forEach(function(p) { if (!(p[0] in global.KeyboardEvent)) global.KeyboardEvent[p[0]] = p[1]; });
  
    var STANDARD = global.KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
        LEFT = global.KeyboardEvent.DOM_KEY_LOCATION_LEFT,
        RIGHT = global.KeyboardEvent.DOM_KEY_LOCATION_RIGHT,
        NUMPAD = global.KeyboardEvent.DOM_KEY_LOCATION_NUMPAD;
  
    //--------------------------------------------------------------------
    //
    // Utilities
    //
    //--------------------------------------------------------------------
  
    function contains(s, ss) { return String(s).indexOf(ss) !== -1; }
  
    var os = (function() {
      if (contains(navigator.platform, 'Win')) { return 'win'; }
      if (contains(navigator.platform, 'Mac')) { return 'mac'; }
      if (contains(navigator.platform, 'CrOS')) { return 'cros'; }
      if (contains(navigator.platform, 'Linux')) { return 'linux'; }
      if (contains(navigator.userAgent, 'iPad') || contains(navigator.platform, 'iPod') || contains(navigator.platform, 'iPhone')) { return 'ios'; }
      return '';
    } ());
  
    var browser = (function() {
      if (contains(navigator.userAgent, 'Chrome/')) { return 'chrome'; }
      if (contains(navigator.vendor, 'Apple')) { return 'safari'; }
      if (contains(navigator.userAgent, 'MSIE')) { return 'ie'; }
      if (contains(navigator.userAgent, 'Gecko/')) { return 'moz'; }
      if (contains(navigator.userAgent, 'Opera/')) { return 'opera'; }
      return '';
    } ());
  
    var browser_os = browser + '-' + os;
  
    function mergeIf(baseTable, select, table) {
      if (browser_os === select || browser === select || os === select) {
        Object.keys(table).forEach(function(keyCode) {
          baseTable[keyCode] = table[keyCode];
        });
      }
    }
  
    function remap(o, key) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        var item = o[k];
        if (key in item) {
          r[item[key]] = item;
        }
      });
      return r;
    }
  
    function invert(o) {
      var r = {};
      Object.keys(o).forEach(function(k) {
        r[o[k]] = k;
      });
      return r;
    }
  
    //--------------------------------------------------------------------
    //
    // Generic Mappings
    //
    //--------------------------------------------------------------------
  
    // "keyInfo" is a dictionary:
    //   code: string - name from UI Events KeyboardEvent code Values
    //     https://w3c.github.io/uievents-code/
    //   location (optional): number - one of the DOM_KEY_LOCATION values
    //   keyCap (optional): string - keyboard label in en-US locale
    // USB code Usage ID from page 0x07 unless otherwise noted (Informative)
  
    // Map of keyCode to keyInfo
    var keyCodeToInfoTable = {
      // 0x01 - VK_LBUTTON
      // 0x02 - VK_RBUTTON
      0x03: { code: 'Cancel' }, // [USB: 0x9b] char \x0018 ??? (Not in D3E)
      // 0x04 - VK_MBUTTON
      // 0x05 - VK_XBUTTON1
      // 0x06 - VK_XBUTTON2
      0x06: { code: 'Help' }, // [USB: 0x75] ???
      // 0x07 - undefined
      0x08: { code: 'Backspace' }, // [USB: 0x2a] Labelled Delete on Macintosh keyboards.
      0x09: { code: 'Tab' }, // [USB: 0x2b]
      // 0x0A-0x0B - reserved
      0X0C: { code: 'Clear' }, // [USB: 0x9c] NumPad Center (Not in D3E)
      0X0D: { code: 'Enter' }, // [USB: 0x28]
      // 0x0E-0x0F - undefined
  
      0x10: { code: 'Shift' },
      0x11: { code: 'Control' },
      0x12: { code: 'Alt' },
      0x13: { code: 'Pause' }, // [USB: 0x48]
      0x14: { code: 'CapsLock' }, // [USB: 0x39]
      0x15: { code: 'KanaMode' }, // [USB: 0x88]
      0x16: { code: 'Lang1' }, // [USB: 0x90]
      // 0x17: VK_JUNJA
      // 0x18: VK_FINAL
      0x19: { code: 'Lang2' }, // [USB: 0x91]
      // 0x1A - undefined
      0x1B: { code: 'Escape' }, // [USB: 0x29]
      0x1C: { code: 'Convert' }, // [USB: 0x8a]
      0x1D: { code: 'NonConvert' }, // [USB: 0x8b]
      0x1E: { code: 'Accept' }, // [USB: ????]
      0x1F: { code: 'ModeChange' }, // [USB: ????]
  
      0x20: { code: 'Space' }, // [USB: 0x2c]
      0x21: { code: 'PageUp' }, // [USB: 0x4b]
      0x22: { code: 'PageDown' }, // [USB: 0x4e]
      0x23: { code: 'End' }, // [USB: 0x4d]
      0x24: { code: 'Home' }, // [USB: 0x4a]
      0x25: { code: 'ArrowLeft' }, // [USB: 0x50]
      0x26: { code: 'ArrowUp' }, // [USB: 0x52]
      0x27: { code: 'ArrowRight' }, // [USB: 0x4f]
      0x28: { code: 'ArrowDown' }, // [USB: 0x51]
      0x29: { code: 'Select' }, // (Not in D3E)
      0x2A: { code: 'Print' }, // (Not in D3E)
      0x2B: { code: 'Execute' }, // [USB: 0x74] (Not in D3E)
      0x2C: { code: 'PrintScreen' }, // [USB: 0x46]
      0x2D: { code: 'Insert' }, // [USB: 0x49]
      0x2E: { code: 'Delete' }, // [USB: 0x4c]
      0x2F: { code: 'Help' }, // [USB: 0x75] ???
  
      0x30: { code: 'Digit0', keyCap: '0' }, // [USB: 0x27] 0)
      0x31: { code: 'Digit1', keyCap: '1' }, // [USB: 0x1e] 1!
      0x32: { code: 'Digit2', keyCap: '2' }, // [USB: 0x1f] 2@
      0x33: { code: 'Digit3', keyCap: '3' }, // [USB: 0x20] 3#
      0x34: { code: 'Digit4', keyCap: '4' }, // [USB: 0x21] 4$
      0x35: { code: 'Digit5', keyCap: '5' }, // [USB: 0x22] 5%
      0x36: { code: 'Digit6', keyCap: '6' }, // [USB: 0x23] 6^
      0x37: { code: 'Digit7', keyCap: '7' }, // [USB: 0x24] 7&
      0x38: { code: 'Digit8', keyCap: '8' }, // [USB: 0x25] 8*
      0x39: { code: 'Digit9', keyCap: '9' }, // [USB: 0x26] 9(
      // 0x3A-0x40 - undefined
  
      0x41: { code: 'KeyA', keyCap: 'a' }, // [USB: 0x04]
      0x42: { code: 'KeyB', keyCap: 'b' }, // [USB: 0x05]
      0x43: { code: 'KeyC', keyCap: 'c' }, // [USB: 0x06]
      0x44: { code: 'KeyD', keyCap: 'd' }, // [USB: 0x07]
      0x45: { code: 'KeyE', keyCap: 'e' }, // [USB: 0x08]
      0x46: { code: 'KeyF', keyCap: 'f' }, // [USB: 0x09]
      0x47: { code: 'KeyG', keyCap: 'g' }, // [USB: 0x0a]
      0x48: { code: 'KeyH', keyCap: 'h' }, // [USB: 0x0b]
      0x49: { code: 'KeyI', keyCap: 'i' }, // [USB: 0x0c]
      0x4A: { code: 'KeyJ', keyCap: 'j' }, // [USB: 0x0d]
      0x4B: { code: 'KeyK', keyCap: 'k' }, // [USB: 0x0e]
      0x4C: { code: 'KeyL', keyCap: 'l' }, // [USB: 0x0f]
      0x4D: { code: 'KeyM', keyCap: 'm' }, // [USB: 0x10]
      0x4E: { code: 'KeyN', keyCap: 'n' }, // [USB: 0x11]
      0x4F: { code: 'KeyO', keyCap: 'o' }, // [USB: 0x12]
  
      0x50: { code: 'KeyP', keyCap: 'p' }, // [USB: 0x13]
      0x51: { code: 'KeyQ', keyCap: 'q' }, // [USB: 0x14]
      0x52: { code: 'KeyR', keyCap: 'r' }, // [USB: 0x15]
      0x53: { code: 'KeyS', keyCap: 's' }, // [USB: 0x16]
      0x54: { code: 'KeyT', keyCap: 't' }, // [USB: 0x17]
      0x55: { code: 'KeyU', keyCap: 'u' }, // [USB: 0x18]
      0x56: { code: 'KeyV', keyCap: 'v' }, // [USB: 0x19]
      0x57: { code: 'KeyW', keyCap: 'w' }, // [USB: 0x1a]
      0x58: { code: 'KeyX', keyCap: 'x' }, // [USB: 0x1b]
      0x59: { code: 'KeyY', keyCap: 'y' }, // [USB: 0x1c]
      0x5A: { code: 'KeyZ', keyCap: 'z' }, // [USB: 0x1d]
      0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
      0x5C: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
      0x5D: { code: 'ContextMenu' }, // [USB: 0x65] Context Menu
      // 0x5E - reserved
      0x5F: { code: 'Standby' }, // [USB: 0x82] Sleep
  
      0x60: { code: 'Numpad0', keyCap: '0', location: NUMPAD }, // [USB: 0x62]
      0x61: { code: 'Numpad1', keyCap: '1', location: NUMPAD }, // [USB: 0x59]
      0x62: { code: 'Numpad2', keyCap: '2', location: NUMPAD }, // [USB: 0x5a]
      0x63: { code: 'Numpad3', keyCap: '3', location: NUMPAD }, // [USB: 0x5b]
      0x64: { code: 'Numpad4', keyCap: '4', location: NUMPAD }, // [USB: 0x5c]
      0x65: { code: 'Numpad5', keyCap: '5', location: NUMPAD }, // [USB: 0x5d]
      0x66: { code: 'Numpad6', keyCap: '6', location: NUMPAD }, // [USB: 0x5e]
      0x67: { code: 'Numpad7', keyCap: '7', location: NUMPAD }, // [USB: 0x5f]
      0x68: { code: 'Numpad8', keyCap: '8', location: NUMPAD }, // [USB: 0x60]
      0x69: { code: 'Numpad9', keyCap: '9', location: NUMPAD }, // [USB: 0x61]
      0x6A: { code: 'NumpadMultiply', keyCap: '*', location: NUMPAD }, // [USB: 0x55]
      0x6B: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
      0x6C: { code: 'NumpadComma', keyCap: ',', location: NUMPAD }, // [USB: 0x85]
      0x6D: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD }, // [USB: 0x56]
      0x6E: { code: 'NumpadDecimal', keyCap: '.', location: NUMPAD }, // [USB: 0x63]
      0x6F: { code: 'NumpadDivide', keyCap: '/', location: NUMPAD }, // [USB: 0x54]
  
      0x70: { code: 'F1' }, // [USB: 0x3a]
      0x71: { code: 'F2' }, // [USB: 0x3b]
      0x72: { code: 'F3' }, // [USB: 0x3c]
      0x73: { code: 'F4' }, // [USB: 0x3d]
      0x74: { code: 'F5' }, // [USB: 0x3e]
      0x75: { code: 'F6' }, // [USB: 0x3f]
      0x76: { code: 'F7' }, // [USB: 0x40]
      0x77: { code: 'F8' }, // [USB: 0x41]
      0x78: { code: 'F9' }, // [USB: 0x42]
      0x79: { code: 'F10' }, // [USB: 0x43]
      0x7A: { code: 'F11' }, // [USB: 0x44]
      0x7B: { code: 'F12' }, // [USB: 0x45]
      0x7C: { code: 'F13' }, // [USB: 0x68]
      0x7D: { code: 'F14' }, // [USB: 0x69]
      0x7E: { code: 'F15' }, // [USB: 0x6a]
      0x7F: { code: 'F16' }, // [USB: 0x6b]
  
      0x80: { code: 'F17' }, // [USB: 0x6c]
      0x81: { code: 'F18' }, // [USB: 0x6d]
      0x82: { code: 'F19' }, // [USB: 0x6e]
      0x83: { code: 'F20' }, // [USB: 0x6f]
      0x84: { code: 'F21' }, // [USB: 0x70]
      0x85: { code: 'F22' }, // [USB: 0x71]
      0x86: { code: 'F23' }, // [USB: 0x72]
      0x87: { code: 'F24' }, // [USB: 0x73]
      // 0x88-0x8F - unassigned
  
      0x90: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0x91: { code: 'ScrollLock' }, // [USB: 0x47]
      // 0x92-0x96 - OEM specific
      // 0x97-0x9F - unassigned
  
      // NOTE: 0xA0-0xA5 usually mapped to 0x10-0x12 in browsers
      0xA0: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0xA1: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0xA2: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0xA3: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0xA4: { code: 'AltLeft', location: LEFT }, // [USB: 0xe2]
      0xA5: { code: 'AltRight', location: RIGHT }, // [USB: 0xe6]
  
      0xA6: { code: 'BrowserBack' }, // [USB: 0x0c/0x0224]
      0xA7: { code: 'BrowserForward' }, // [USB: 0x0c/0x0225]
      0xA8: { code: 'BrowserRefresh' }, // [USB: 0x0c/0x0227]
      0xA9: { code: 'BrowserStop' }, // [USB: 0x0c/0x0226]
      0xAA: { code: 'BrowserSearch' }, // [USB: 0x0c/0x0221]
      0xAB: { code: 'BrowserFavorites' }, // [USB: 0x0c/0x0228]
      0xAC: { code: 'BrowserHome' }, // [USB: 0x0c/0x0222]
      0xAD: { code: 'AudioVolumeMute' }, // [USB: 0x7f]
      0xAE: { code: 'AudioVolumeDown' }, // [USB: 0x81]
      0xAF: { code: 'AudioVolumeUp' }, // [USB: 0x80]
  
      0xB0: { code: 'MediaTrackNext' }, // [USB: 0x0c/0x00b5]
      0xB1: { code: 'MediaTrackPrevious' }, // [USB: 0x0c/0x00b6]
      0xB2: { code: 'MediaStop' }, // [USB: 0x0c/0x00b7]
      0xB3: { code: 'MediaPlayPause' }, // [USB: 0x0c/0x00cd]
      0xB4: { code: 'LaunchMail' }, // [USB: 0x0c/0x018a]
      0xB5: { code: 'MediaSelect' },
      0xB6: { code: 'LaunchApp1' },
      0xB7: { code: 'LaunchApp2' },
      // 0xB8-0xB9 - reserved
      0xBA: { code: 'Semicolon',  keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
      0xBB: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
      0xBC: { code: 'Comma', keyCap: ',' }, // [USB: 0x36] ,<
      0xBD: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
      0xBE: { code: 'Period', keyCap: '.' }, // [USB: 0x37] .>
      0xBF: { code: 'Slash', keyCap: '/' }, // [USB: 0x38] /? (US Standard 101)
  
      0xC0: { code: 'Backquote', keyCap: '`' }, // [USB: 0x35] `~ (US Standard 101)
      // 0xC1-0xCF - reserved
  
      // 0xD0-0xD7 - reserved
      // 0xD8-0xDA - unassigned
      0xDB: { code: 'BracketLeft', keyCap: '[' }, // [USB: 0x2f] [{ (US Standard 101)
      0xDC: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
      0xDD: { code: 'BracketRight', keyCap: ']' }, // [USB: 0x30] ]} (US Standard 101)
      0xDE: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
      // 0xDF - miscellaneous/varies
  
      // 0xE0 - reserved
      // 0xE1 - OEM specific
      0xE2: { code: 'IntlBackslash',  keyCap: '\\' }, // [USB: 0x64] \| (UK Standard 102)
      // 0xE3-0xE4 - OEM specific
      0xE5: { code: 'Process' }, // (Not in D3E)
      // 0xE6 - OEM specific
      // 0xE7 - VK_PACKET
      // 0xE8 - unassigned
      // 0xE9-0xEF - OEM specific
  
      // 0xF0-0xF5 - OEM specific
      0xF6: { code: 'Attn' }, // [USB: 0x9a] (Not in D3E)
      0xF7: { code: 'CrSel' }, // [USB: 0xa3] (Not in D3E)
      0xF8: { code: 'ExSel' }, // [USB: 0xa4] (Not in D3E)
      0xF9: { code: 'EraseEof' }, // (Not in D3E)
      0xFA: { code: 'Play' }, // (Not in D3E)
      0xFB: { code: 'ZoomToggle' }, // (Not in D3E)
      // 0xFC - VK_NONAME - reserved
      // 0xFD - VK_PA1
      0xFE: { code: 'Clear' } // [USB: 0x9c] (Not in D3E)
    };
  
    // No legacy keyCode, but listed in D3E:
  
    // code: usb
    // 'IntlHash': 0x070032,
    // 'IntlRo': 0x070087,
    // 'IntlYen': 0x070089,
    // 'NumpadBackspace': 0x0700bb,
    // 'NumpadClear': 0x0700d8,
    // 'NumpadClearEntry': 0x0700d9,
    // 'NumpadMemoryAdd': 0x0700d3,
    // 'NumpadMemoryClear': 0x0700d2,
    // 'NumpadMemoryRecall': 0x0700d1,
    // 'NumpadMemoryStore': 0x0700d0,
    // 'NumpadMemorySubtract': 0x0700d4,
    // 'NumpadParenLeft': 0x0700b6,
    // 'NumpadParenRight': 0x0700b7,
  
    //--------------------------------------------------------------------
    //
    // Browser/OS Specific Mappings
    //
    //--------------------------------------------------------------------
  
    mergeIf(keyCodeToInfoTable,
            'moz', {
              0x3B: { code: 'Semicolon', keyCap: ';' }, // [USB: 0x33] ;: (US Standard 101)
              0x3D: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6B: { code: 'Equal', keyCap: '=' }, // [USB: 0x2e] =+
              0x6D: { code: 'Minus', keyCap: '-' }, // [USB: 0x2d] -_
              0xBB: { code: 'NumpadAdd', keyCap: '+', location: NUMPAD }, // [USB: 0x57]
              0xBD: { code: 'NumpadSubtract', keyCap: '-', location: NUMPAD } // [USB: 0x56]
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-mac', {
              0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'moz-win', {
              0xAD: { code: 'Minus', keyCap: '-' } // [USB: 0x2d] -_
            });
  
    mergeIf(keyCodeToInfoTable,
            'chrome-mac', {
              0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
            });
  
    // Windows via Bootcamp (!)
    if (0) {
      mergeIf(keyCodeToInfoTable,
              'chrome-win', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
  
      mergeIf(keyCodeToInfoTable,
              'ie', {
                0xC0: { code: 'Quote', keyCap: '\'' }, // [USB: 0x34] '" (US Standard 101)
                0xDE: { code: 'Backslash',  keyCap: '\\' }, // [USB: 0x31] \| (US Standard 101)
                0xDF: { code: 'Backquote', keyCap: '`' } // [USB: 0x35] `~ (US Standard 101)
              });
    }
  
    mergeIf(keyCodeToInfoTable,
            'safari', {
              0x03: { code: 'Enter' }, // [USB: 0x28] old Safari
              0x19: { code: 'Tab' } // [USB: 0x2b] old Safari for Shift+Tab
            });
  
    mergeIf(keyCodeToInfoTable,
            'ios', {
              0x0A: { code: 'Enter', location: STANDARD } // [USB: 0x28]
            });
  
    mergeIf(keyCodeToInfoTable,
            'safari-mac', {
              0x5B: { code: 'MetaLeft', location: LEFT }, // [USB: 0xe3]
              0x5D: { code: 'MetaRight', location: RIGHT }, // [USB: 0xe7]
              0xE5: { code: 'KeyQ', keyCap: 'Q' } // [USB: 0x14] On alternate presses, Ctrl+Q sends this
            });
  
    //--------------------------------------------------------------------
    //
    // Identifier Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send keyIdentifier which can be
    // used to disambiguate keys.
  
    // keyIdentifierTable[keyIdentifier] -> keyInfo
  
    var keyIdentifierTable = {};
    if ('cros' === os) {
      keyIdentifierTable['U+00A0'] = { code: 'ShiftLeft', location: LEFT };
      keyIdentifierTable['U+00A1'] = { code: 'ShiftRight', location: RIGHT };
      keyIdentifierTable['U+00A2'] = { code: 'ControlLeft', location: LEFT };
      keyIdentifierTable['U+00A3'] = { code: 'ControlRight', location: RIGHT };
      keyIdentifierTable['U+00A4'] = { code: 'AltLeft', location: LEFT };
      keyIdentifierTable['U+00A5'] = { code: 'AltRight', location: RIGHT };
    }
    if ('chrome-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('safari-mac' === browser_os) {
      keyIdentifierTable['U+0010'] = { code: 'ContextMenu' };
    }
    if ('ios' === os) {
      // These only generate keyup events
      keyIdentifierTable['U+0010'] = { code: 'Function' };
  
      keyIdentifierTable['U+001C'] = { code: 'ArrowLeft' };
      keyIdentifierTable['U+001D'] = { code: 'ArrowRight' };
      keyIdentifierTable['U+001E'] = { code: 'ArrowUp' };
      keyIdentifierTable['U+001F'] = { code: 'ArrowDown' };
  
      keyIdentifierTable['U+0001'] = { code: 'Home' }; // [USB: 0x4a] Fn + ArrowLeft
      keyIdentifierTable['U+0004'] = { code: 'End' }; // [USB: 0x4d] Fn + ArrowRight
      keyIdentifierTable['U+000B'] = { code: 'PageUp' }; // [USB: 0x4b] Fn + ArrowUp
      keyIdentifierTable['U+000C'] = { code: 'PageDown' }; // [USB: 0x4e] Fn + ArrowDown
    }
  
    //--------------------------------------------------------------------
    //
    // Location Mappings
    //
    //--------------------------------------------------------------------
  
    // Cases where newer-ish browsers send location/keyLocation which
    // can be used to disambiguate keys.
  
    // locationTable[location][keyCode] -> keyInfo
    var locationTable = [];
    locationTable[LEFT] = {
      0x10: { code: 'ShiftLeft', location: LEFT }, // [USB: 0xe1]
      0x11: { code: 'ControlLeft', location: LEFT }, // [USB: 0xe0]
      0x12: { code: 'AltLeft', location: LEFT } // [USB: 0xe2]
    };
    locationTable[RIGHT] = {
      0x10: { code: 'ShiftRight', location: RIGHT }, // [USB: 0xe5]
      0x11: { code: 'ControlRight', location: RIGHT }, // [USB: 0xe4]
      0x12: { code: 'AltRight', location: RIGHT } // [USB: 0xe6]
    };
    locationTable[NUMPAD] = {
      0x0D: { code: 'NumpadEnter', location: NUMPAD } // [USB: 0x58]
    };
  
    mergeIf(locationTable[NUMPAD], 'moz', {
      0x6D: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0x6B: { code: 'NumpadAdd', location: NUMPAD } // [USB: 0x57]
    });
    mergeIf(locationTable[LEFT], 'moz-mac', {
      0xE0: { code: 'MetaLeft', location: LEFT } // [USB: 0xe3]
    });
    mergeIf(locationTable[RIGHT], 'moz-mac', {
      0xE0: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
    mergeIf(locationTable[RIGHT], 'moz-win', {
      0x5B: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
  
    mergeIf(locationTable[RIGHT], 'mac', {
      0x5D: { code: 'MetaRight', location: RIGHT } // [USB: 0xe7]
    });
  
    mergeIf(locationTable[NUMPAD], 'chrome-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD } // [USB: 0x53]
    });
  
    mergeIf(locationTable[NUMPAD], 'safari-mac', {
      0x0C: { code: 'NumLock', location: NUMPAD }, // [USB: 0x53]
      0xBB: { code: 'NumpadAdd', location: NUMPAD }, // [USB: 0x57]
      0xBD: { code: 'NumpadSubtract', location: NUMPAD }, // [USB: 0x56]
      0xBE: { code: 'NumpadDecimal', location: NUMPAD }, // [USB: 0x63]
      0xBF: { code: 'NumpadDivide', location: NUMPAD } // [USB: 0x54]
    });
  
  
    //--------------------------------------------------------------------
    //
    // Key Values
    //
    //--------------------------------------------------------------------
  
    // Mapping from `code` values to `key` values. Values defined at:
    // https://w3c.github.io/uievents-key/
    // Entries are only provided when `key` differs from `code`. If
    // printable, `shiftKey` has the shifted printable character. This
    // assumes US Standard 101 layout
  
    var codeToKeyTable = {
      // Modifier Keys
      ShiftLeft: { key: 'Shift' },
      ShiftRight: { key: 'Shift' },
      ControlLeft: { key: 'Control' },
      ControlRight: { key: 'Control' },
      AltLeft: { key: 'Alt' },
      AltRight: { key: 'Alt' },
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' },
  
      // Whitespace Keys
      NumpadEnter: { key: 'Enter' },
      Space: { key: ' ' },
  
      // Printable Keys
      Digit0: { key: '0', shiftKey: ')' },
      Digit1: { key: '1', shiftKey: '!' },
      Digit2: { key: '2', shiftKey: '@' },
      Digit3: { key: '3', shiftKey: '#' },
      Digit4: { key: '4', shiftKey: '$' },
      Digit5: { key: '5', shiftKey: '%' },
      Digit6: { key: '6', shiftKey: '^' },
      Digit7: { key: '7', shiftKey: '&' },
      Digit8: { key: '8', shiftKey: '*' },
      Digit9: { key: '9', shiftKey: '(' },
      KeyA: { key: 'a', shiftKey: 'A' },
      KeyB: { key: 'b', shiftKey: 'B' },
      KeyC: { key: 'c', shiftKey: 'C' },
      KeyD: { key: 'd', shiftKey: 'D' },
      KeyE: { key: 'e', shiftKey: 'E' },
      KeyF: { key: 'f', shiftKey: 'F' },
      KeyG: { key: 'g', shiftKey: 'G' },
      KeyH: { key: 'h', shiftKey: 'H' },
      KeyI: { key: 'i', shiftKey: 'I' },
      KeyJ: { key: 'j', shiftKey: 'J' },
      KeyK: { key: 'k', shiftKey: 'K' },
      KeyL: { key: 'l', shiftKey: 'L' },
      KeyM: { key: 'm', shiftKey: 'M' },
      KeyN: { key: 'n', shiftKey: 'N' },
      KeyO: { key: 'o', shiftKey: 'O' },
      KeyP: { key: 'p', shiftKey: 'P' },
      KeyQ: { key: 'q', shiftKey: 'Q' },
      KeyR: { key: 'r', shiftKey: 'R' },
      KeyS: { key: 's', shiftKey: 'S' },
      KeyT: { key: 't', shiftKey: 'T' },
      KeyU: { key: 'u', shiftKey: 'U' },
      KeyV: { key: 'v', shiftKey: 'V' },
      KeyW: { key: 'w', shiftKey: 'W' },
      KeyX: { key: 'x', shiftKey: 'X' },
      KeyY: { key: 'y', shiftKey: 'Y' },
      KeyZ: { key: 'z', shiftKey: 'Z' },
      Numpad0: { key: '0' },
      Numpad1: { key: '1' },
      Numpad2: { key: '2' },
      Numpad3: { key: '3' },
      Numpad4: { key: '4' },
      Numpad5: { key: '5' },
      Numpad6: { key: '6' },
      Numpad7: { key: '7' },
      Numpad8: { key: '8' },
      Numpad9: { key: '9' },
      NumpadMultiply: { key: '*' },
      NumpadAdd: { key: '+' },
      NumpadComma: { key: ',' },
      NumpadSubtract: { key: '-' },
      NumpadDecimal: { key: '.' },
      NumpadDivide: { key: '/' },
      Semicolon: { key: ';', shiftKey: ':' },
      Equal: { key: '=', shiftKey: '+' },
      Comma: { key: ',', shiftKey: '<' },
      Minus: { key: '-', shiftKey: '_' },
      Period: { key: '.', shiftKey: '>' },
      Slash: { key: '/', shiftKey: '?' },
      Backquote: { key: '`', shiftKey: '~' },
      BracketLeft: { key: '[', shiftKey: '{' },
      Backslash: { key: '\\', shiftKey: '|' },
      BracketRight: { key: ']', shiftKey: '}' },
      Quote: { key: '\'', shiftKey: '"' },
      IntlBackslash: { key: '\\', shiftKey: '|' }
    };
  
    mergeIf(codeToKeyTable, 'mac', {
      MetaLeft: { key: 'Meta' },
      MetaRight: { key: 'Meta' }
    });
  
    // Corrections for 'key' names in older browsers (e.g. FF36-, IE9, etc)
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent.key#Key_values
    var keyFixTable = {
      Add: '+',
      Decimal: '.',
      Divide: '/',
      Subtract: '-',
      Multiply: '*',
      Spacebar: ' ',
      Esc: 'Escape',
      Nonconvert: 'NonConvert',
      Left: 'ArrowLeft',
      Up: 'ArrowUp',
      Right: 'ArrowRight',
      Down: 'ArrowDown',
      Del: 'Delete',
      Menu: 'ContextMenu',
      MediaNextTrack: 'MediaTrackNext',
      MediaPreviousTrack: 'MediaTrackPrevious',
      SelectMedia: 'MediaSelect',
      HalfWidth: 'Hankaku',
      FullWidth: 'Zenkaku',
      RomanCharacters: 'Romaji',
      Crsel: 'CrSel',
      Exsel: 'ExSel',
      Zoom: 'ZoomToggle'
    };
  
    //--------------------------------------------------------------------
    //
    // Exported Functions
    //
    //--------------------------------------------------------------------
  
  
    var codeTable = remap(keyCodeToInfoTable, 'code');
  
    try {
      var nativeLocation = nativeKeyboardEvent && ('location' in new KeyboardEvent(''));
    } catch (_) {}
  
    function keyInfoForEvent(event) {
      var keyCode = 'keyCode' in event ? event.keyCode : 'which' in event ? event.which : 0;
      var keyInfo = (function(){
        if (nativeLocation || 'keyLocation' in event) {
          var location = nativeLocation ? event.location : event.keyLocation;
          if (location && keyCode in locationTable[location]) {
            return locationTable[location][keyCode];
          }
        }
        if ('keyIdentifier' in event && event.keyIdentifier in keyIdentifierTable) {
          return keyIdentifierTable[event.keyIdentifier];
        }
        if (keyCode in keyCodeToInfoTable) {
          return keyCodeToInfoTable[keyCode];
        }
        return null;
      }());
  
      // TODO: Track these down and move to general tables
      if (0) {
        // TODO: Map these for newerish browsers?
        // TODO: iOS only?
        // TODO: Override with more common keyIdentifier name?
        switch (event.keyIdentifier) {
        case 'U+0010': keyInfo = { code: 'Function' }; break;
        case 'U+001C': keyInfo = { code: 'ArrowLeft' }; break;
        case 'U+001D': keyInfo = { code: 'ArrowRight' }; break;
        case 'U+001E': keyInfo = { code: 'ArrowUp' }; break;
        case 'U+001F': keyInfo = { code: 'ArrowDown' }; break;
        }
      }
  
      if (!keyInfo)
        return null;
  
      var key = (function() {
        var entry = codeToKeyTable[keyInfo.code];
        if (!entry) return keyInfo.code;
        return (event.shiftKey && 'shiftKey' in entry) ? entry.shiftKey : entry.key;
      }());
  
      return {
        code: keyInfo.code,
        key: key,
        location: keyInfo.location,
        keyCap: keyInfo.keyCap
      };
    }
  
    function queryKeyCap(code, locale) {
      code = String(code);
      if (!codeTable.hasOwnProperty(code)) return 'Undefined';
      if (locale && String(locale).toLowerCase() !== 'en-us') throw Error('Unsupported locale');
      var keyInfo = codeTable[code];
      return keyInfo.keyCap || keyInfo.code || 'Undefined';
    }
  
    if ('KeyboardEvent' in global && 'defineProperty' in Object) {
      (function() {
        function define(o, p, v) {
          if (p in o) return;
          Object.defineProperty(o, p, v);
        }
  
        define(KeyboardEvent.prototype, 'code', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return keyInfo ? keyInfo.code : '';
        }});
  
        // Fix for nonstandard `key` values (FF36-)
        if ('key' in KeyboardEvent.prototype) {
          var desc = Object.getOwnPropertyDescriptor(KeyboardEvent.prototype, 'key');
          Object.defineProperty(KeyboardEvent.prototype, 'key', { get: function() {
            var key = desc.get.call(this);
            return keyFixTable.hasOwnProperty(key) ? keyFixTable[key] : key;
          }});
        }
  
        define(KeyboardEvent.prototype, 'key', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
        }});
  
        define(KeyboardEvent.prototype, 'location', { get: function() {
          var keyInfo = keyInfoForEvent(this);
          return (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
        }});
  
        define(KeyboardEvent.prototype, 'locale', { get: function() {
          return '';
        }});
      }());
    }
  
    if (!('queryKeyCap' in global.KeyboardEvent))
      global.KeyboardEvent.queryKeyCap = queryKeyCap;
  
    // Helper for IE8-
    global.identifyKey = function(event) {
      if ('code' in event)
        return;
  
      var keyInfo = keyInfoForEvent(event);
      event.code = keyInfo ? keyInfo.code : '';
      event.key = (keyInfo && 'key' in keyInfo) ? keyInfo.key : 'Unidentified';
      event.location = ('location' in event) ? event.location :
        ('keyLocation' in event) ? event.keyLocation :
        (keyInfo && 'location' in keyInfo) ? keyInfo.location : STANDARD;
      event.locale = '';
    };
  
  }(self));
  
/* global Howler Howl */
(function ctHowler() {
    ct.sound = {};
    ct.sound.howler = Howler;
    Howler.orientation(0, -1, 0, 0, 0, 1);
    Howler.pos(0, 0, 0);
    ct.sound.howl = Howl;

    var defaultMaxDistance = [][0] || 2500;
    ct.sound.useDepth = [false][0] === void 0 ?
        false :
        [false][0];
    ct.sound.manageListenerPosition = [false][0] === void 0 ?
        true :
        [false][0];

    /**
     * Detects if a particular codec is supported in the system
     * @param {string} type One of: "mp3", "mpeg", "opus", "ogg", "oga", "wav",
     * "aac", "caf", m4a", "mp4", "weba", "webm", "dolby", "flac".
     * @returns {boolean} true/false
     */
    ct.sound.detect = Howler.codecs;

    /**
     * Creates a new Sound object and puts it in resource object
     *
     * @param {string} name Sound's name
     * @param {object} formats A collection of sound files of specified extension,
     * in format `extension: path`
     * @param {string} [formats.ogg] Local path to the sound in ogg format
     * @param {string} [formats.wav] Local path to the sound in wav format
     * @param {string} [formats.mp3] Local path to the sound in mp3 format
     * @param {object} options An options object
     *
     * @returns {object} Sound's object
     */
    ct.sound.init = function init(name, formats, options) {
        options = options || {};
        var sounds = [];
        if (formats.wav && formats.wav.slice(-4) === '.wav') {
            sounds.push(formats.wav);
        }
        if (formats.mp3 && formats.mp3.slice(-4) === '.mp3') {
            sounds.push(formats.mp3);
        }
        if (formats.ogg && formats.ogg.slice(-4) === '.ogg') {
            sounds.push(formats.ogg);
        }
        // Do not use music preferences for ct.js debugger
        var isMusic = !navigator.userAgent.startsWith('ct.js') && options.music;
        var howl = new Howl({
            src: sounds,
            autoplay: false,
            preload: !isMusic,
            html5: isMusic,
            loop: options.loop,
            pool: options.poolSize || 5,

            onload: function () {
                if (!isMusic) {
                    ct.res.soundsLoaded++;
                }
            },
            onloaderror: function () {
                ct.res.soundsError++;
                howl.buggy = true;
                console.error('[ct.sound.howler] Oh no! We couldn\'t load ' +
                    (formats.wav || formats.mp3 || formats.ogg) + '!');
            }
        });
        if (isMusic) {
            ct.res.soundsLoaded++;
        }
        ct.res.sounds[name] = howl;
    };

    var set3Dparameters = (howl, opts, id) => {
        howl.pannerAttr({
            coneInnerAngle: opts.coneInnerAngle || 360,
            coneOuterAngle: opts.coneOuterAngle || 360,
            coneOuterGain: opts.coneOuterGain || 1,
            distanceModel: opts.distanceModel || 'linear',
            maxDistance: opts.maxDistance || defaultMaxDistance,
            refDistance: opts.refDistance || 1,
            rolloffFactor: opts.rolloffFactor || 1,
            panningModel: opts.panningModel || 'HRTF'
        }, id);
    };
    /**
     * Spawns a new sound and plays it.
     *
     * @param {string} name The name of a sound to be played
     * @param {object} [opts] Options object.
     * @param {Function} [cb] A callback, which is called when the sound finishes playing
     *
     * @returns {number} The ID of the created sound. This can be passed to Howler methods.
     */
    ct.sound.spawn = function spawn(name, opts, cb) {
        opts = opts || {};
        if (typeof opts === 'function') {
            cb = opts;
            opts = {};
        }
        var howl = ct.res.sounds[name];
        var id = howl.play();
        if (opts.loop) {
            howl.loop(true, id);
        }
        if (opts.volume !== void 0) {
            howl.volume(opts.volume, id);
        }
        if (opts.rate !== void 0) {
            howl.rate(opts.rate, id);
        }
        if (opts.x !== void 0 || opts.position) {
            if (opts.x !== void 0) {
                howl.pos(opts.x, opts.y || 0, opts.z || 0, id);
            } else {
                const copy = opts.position;
                howl.pos(copy.x, copy.y, opts.z || (ct.sound.useDepth ? copy.depth : 0), id);
            }
            set3Dparameters(howl, opts, id);
        }
        if (cb) {
            howl.once('end', cb, id);
        }
        return id;
    };

    /**
     * Stops playback of a sound, resetting its time to 0.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.stop = function stop(name, id) {
        if (ct.sound.playing(name, id)) {
            ct.res.sounds[name].stop(id);
        }
    };

    /**
     * Pauses playback of a sound or group, saving the seek of playback.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.pause = function pause(name, id) {
        ct.res.sounds[name].pause(id);
    };

    /**
     * Resumes a given sound, e.g. after pausing it.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {void}
     */
    ct.sound.resume = function resume(name, id) {
        ct.res.sounds[name].play(id);
    };
    /**
     * Returns whether a sound is currently playing,
     * either an exact sound (found by its ID) or any sound of a given name.
     *
     * @param {string} name The name of a sound
     * @param {number} [id] An optional ID of a particular sound
     * @returns {boolean} `true` if the sound is playing, `false` otherwise.
     */
    ct.sound.playing = function playing(name, id) {
        return ct.res.sounds[name].playing(id);
    };
    /**
     * Preloads a sound. This is usually applied to music files before playing
     * as they are not preloaded by default.
     *
     * @param {string} name The name of a sound
     * @returns {void}
     */
    ct.sound.load = function load(name) {
        ct.res.sounds[name].load();
    };


    /**
     * Changes/returns the volume of the given sound.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If empty, will return the existing volume.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {number} The current volume of the sound.
     */
    ct.sound.volume = function volume(name, volume, id) {
        return ct.res.sounds[name].volume(volume, id);
    };

    /**
     * Fades a sound to a given volume. Can affect either a specific instance or the whole group.
     *
     * @param {string} name The name of a sound to affect.
     * @param {number} newVolume The new volume from `0.0` to `1.0`.
     * @param {number} duration The duration of transition, in milliseconds.
     * @param {number} [id] If specified, then only the given sound instance is affected.
     *
     * @returns {void}
     */
    ct.sound.fade = function fade(name, newVolume, duration, id) {
        if (ct.sound.playing(name, id)) {
            var howl = ct.res.sounds[name],
                oldVolume = id ? howl.volume(id) : howl.volume;
            try {
                howl.fade(oldVolume, newVolume, duration, id);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('Could not reliably fade a sound, reason:', e);
                ct.sound.volume(name, newVolume, id);
            }
        }
    };

    /**
     * Moves the 3D listener to a new position.
     *
     * @see https://github.com/goldfire/howler.js#posx-y-z
     *
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.moveListener = function moveListener(x, y, z) {
        Howler.pos(x, y, z || 0);
    };

    /**
     * Moves a 3D sound to a new location
     *
     * @param {string} name The name of a sound to move
     * @param {number} id The ID of a particular sound.
     * Pass `null` if you want to affect all the sounds of a given name.
     * @param {number} x The new x coordinate
     * @param {number} y The new y coordinate
     * @param {number} [z] The new z coordinate
     *
     * @returns {void}
     */
    ct.sound.position = function position(name, id, x, y, z) {
        if (ct.sound.playing(name, id)) {
            var howl = ct.res.sounds[name],
                oldPosition = howl.pos(id);
            howl.pos(x, y, z || oldPosition[2], id);
        }
    };

    /**
     * Get/set the global volume for all sounds, relative to their own volume.
     * @param {number} [volume] The new volume from `0.0` to `1.0`.
     * If omitted, will return the current global volume.
     *
     * @returns {number} The current volume.
     */
    ct.sound.globalVolume = Howler.volume.bind(Howler);

    ct.sound.exists = function exists(name) {
        return (name in ct.res.sounds);
    };
})();

/* Based on https://pixijs.io/pixi-filters/docs/PIXI.filters */
/* Sandbox demo: https://pixijs.io/pixi-filters/tools/demo/ */

(() => {
  const filters = [
    'Adjustment',
    'AdvancedBloom',
    'Ascii',
    'Bevel',
    'Bloom',
    'BulgePinch',
    'ColorMap',
    'ColorOverlay',
    'ColorReplace',
    'Convolution',
    'CrossHatch',
    'CRT',
    'Dot',
    'DropShadow',
    'Emboss',
    'Glitch',
    'Glow',
    'Godray',
    'KawaseBlur',
    'MotionBlur',
    'MultiColorReplace',
    'OldFilm',
    'Outline',
    'Pixelate',
    'RadialBlur',
    'Reflection',
    'RGBSplit',
    'Shockwave',
    'SimpleLightmap',
    'TiltShift',
    'Twist',
    'ZoomBlur',
    //Built-in filters
    'Alpha',
    'Blur',
    'BlurPass',
    'ColorMatrix',
    'Displacement',
    'FXAA',
    'Noise'
  ];

  const addFilter = (target, fx) => {
    if (!target.filters) {
      target.filters = [fx];
    } else {
      target.filters.push(fx);
    }
    return fx;
  };

  const createFilter = (target, filter, ...args) => {
    let fx;
    let filterName = filter + 'Filter';
    if (filterName === 'BlurPassFilter') {
      filterName = 'BlurFilterPass';
    }
    if (args.length > 0) {
      fx = new PIXI.filters[filterName](...args);
    } else {
      fx = new PIXI.filters[filterName]();
    }
    return addFilter(target, fx);
  };

  ct.filters = {};

  for (const filter of filters) {
    ct.filters['add' + filter] = (target, ...args) =>
      createFilter(target, filter, ...args);
  }

  ct.filters.remove = (target, filter) => {
    for (const f in target.filters) {
      if (target.filters[f] === filter) {
        target.filters.splice(f, 1);
      }
    }
  };

  ct.filters.custom = (target, vertex, fragment, uniforms) => {
    const fx = new PIXI.Filter(vertex, fragment, uniforms);
    return addFilter(target, fx);
  }

})();

/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
ct.random = function random(x) {
    return Math.random() * x;
};
ct.u.ext(ct.random, {
    dice(...variants) {
        return variants[Math.floor(Math.random() * variants.length)];
    },
    histogram(...histogram) {
        const coeffs = [...histogram];
        let sumCoeffs = 0;
        for (let i = 0; i < coeffs.length; i++) {
            sumCoeffs += coeffs[i];
            if (i > 0) {
                coeffs[i] += coeffs[i - 1];
            }
        }
        const bucketPosition = Math.random() * sumCoeffs;
        var i;
        for (i = 0; i < coeffs.length; i++) {
            if (coeffs[i] > bucketPosition) {
                break;
            }
        }
        return i / coeffs.length + Math.random() / coeffs.length;
    },
    optimistic(exp) {
        return 1 - ct.random.pessimistic(exp);
    },
    pessimistic(exp) {
        exp = exp || 2;
        return Math.random() ** exp;
    },
    range(x1, x2) {
        return x1 + Math.random() * (x2 - x1);
    },
    deg() {
        return Math.random() * 360;
    },
    coord() {
        return [Math.floor(Math.random() * ct.width), Math.floor(Math.random() * ct.height)];
    },
    chance(x, y) {
        if (y) {
            return (Math.random() * y < x);
        }
        return (Math.random() * 100 < x);
    },
    from(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    // Mulberry32, by bryc from https://stackoverflow.com/a/47593316
    createSeededRandomizer(a) {
        return function seededRandomizer() {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
});
{
    const handle = {};
    handle.currentRootRandomizer = ct.random.createSeededRandomizer(456852);
    ct.random.seeded = function seeded() {
        return handle.currentRootRandomizer();
    };
    ct.random.setSeed = function setSeed(seed) {
        handle.currentRootRandomizer = ct.random.createSeededRandomizer(seed);
    };
    ct.random.setSeed(9323846264);
}

/* Based on https://github.com/luser/gamepadtest */

(function ctGamepad() {
    const standardMapping = {
        controllers: {},
        buttonsMapping: [
            'Button1',
            'Button2',
            'Button3',
            'Button4',
            'L1',
            'R1',
            'L2',
            'R2',
            'Select',
            'Start',
      // here, must have same name as in module.js
            'L3',
      //'LStickButton',
      // here, too...
            'R3',
      //'RStickButton',
      // up, down, left and right are all mapped as axes.
            'Up',
            'Down',
            'Left',
            'Right'

      // + a special button code `Any`, that requires special handling
        ],
        axesMapping: ['LStickX', 'LStickY', 'RStickX', 'RStickY']
    };

    const prefix = 'gamepad.';

    const setRegistry = function (key, value) {
        ct.inputs.registry[prefix + key] = value;
    };
    const getRegistry = function (key) {
        return ct.inputs.registry[prefix + key] || 0;
    };

    const getGamepads = function () {
        if (navigator.getGamepads) {
            return navigator.getGamepads();
        }
        return [];
    };

    const addGamepad = function (gamepad) {
        standardMapping.controllers[gamepad.index] = gamepad;
    };

    const scanGamepads = function () {
        const gamepads = getGamepads();
        for (let i = 0, len = gamepads.length; i < len; i++) {
            if (gamepads[i]) {
                const {controllers} = standardMapping;
                if (!(gamepads[i].index in controllers)) {
          // add new gamepad object
                    addGamepad(gamepads[i]);
                } else {
          // update gamepad object state
                    controllers[gamepads[i].index] = gamepads[i];
                }
            }
        }
    };

    const updateStatus = function () {
        scanGamepads();
        let j;
        const {controllers} = standardMapping;
        const {buttonsMapping} = standardMapping;
        const {axesMapping} = standardMapping;
        for (j in controllers) {
      /**
       * @type {Gamepad}
       */
            const controller = controllers[j];
            const buttonsLen = controller.buttons.length;

      // Reset the 'any button' input
            setRegistry('Any', 0);
      // loop through all the known button codes and update their state
            for (let i = 0; i < buttonsLen; i++) {
                setRegistry(buttonsMapping[i], controller.buttons[i].value);
        // update the 'any button', if needed
                setRegistry('Any', Math.max(getRegistry('Any'), controller.buttons[i].value));
                ct.gamepad.lastButton = buttonsMapping[i];
            }

      // loop through all the known axes and update their state
            const axesLen = controller.axes.length;
            for (let i = 0; i < axesLen; i++) {
                setRegistry(axesMapping[i], controller.axes[i]);
            }
        }
    };

    ct.gamepad = Object.assign(new PIXI.utils.EventEmitter(), {
        list: getGamepads(),
        connected(e) {
            ct.gamepad.emit('connected', e.gamepad, e);
            addGamepad(e.gamepad);
        },
        disconnected(e) {
            ct.gamepad.emit('disconnected', e.gamepad, e);
            delete standardMapping.controllers[e.gamepad.index];
        },
        getButton: code => {
            if (standardMapping.buttonsMapping.indexOf(code) === -1 && code !== 'Any') {
                throw new Error(`[ct.gamepad] Attempt to get the state of a non-existing button ${code}. A typo?`);
            }
            return getRegistry(code);
        },
        getAxis: code => {
            if (standardMapping.axesMapping.indexOf(code) === -1) {
                throw new Error(`[ct.gamepad] Attempt to get the state of a non-existing axis ${code}. A typo?`);
            }
            return getRegistry(code);
        },
        lastButton: null
    });

  // register events
    window.addEventListener('gamepadconnected', ct.gamepad.connected);
    window.addEventListener('gamepaddisconnected', ct.gamepad.disconnected);
  // register a ticker listener
    ct.pixiApp.ticker.add(updateStatus);
})();

(function ctVkeys() {
    ct.vkeys = {
        button(options) {
            var opts = ct.u.ext({
                key: 'Vk1',
                depth: 100,
                texNormal: -1,
                x: 128,
                y: 128,
                container: ct.room
            }, options || {});
            const copy = ct.templates.copy('VKEY', 0, 0, {
                opts: opts
            }, opts.container);
            if (typeof options.x === 'function' || typeof options.y === 'function') {
                copy.skipRealign = true;
            }
            return copy;
        },
        joystick(options) {
            var opts = ct.u.ext({
                key: 'Vjoy1',
                depth: 100,
                tex: -1,
                trackballTex: -1,
                x: 128,
                y: 128,
                container: ct.room
            }, options || {});
            const copy = ct.templates.copy('VJOYSTICK', 0, 0, {
                opts: opts
            }, opts.container);
            if (typeof options.x === 'function' || typeof options.y === 'function') {
                copy.skipRealign = true;
            }
            return copy;
        }
    };
})();

/* eslint-disable no-nested-ternary */
/* global CtTimer */

ct.tween = {
    /**
     * Creates a new tween effect and adds it to the game loop
     *
     * @param {Object} options An object with options:
     * @param {Object|Copy} options.obj An object to animate. All objects are supported.
     * @param {Object} options.fields A map with pairs `fieldName: newValue`.
     * Values must be of numerical type.
     * @param {Function} options.curve An interpolating function. You can write your own,
     * or use default ones (see methods in `ct.tween`). The default one is `ct.tween.ease`.
     * @param {Number} options.duration The duration of easing, in milliseconds.
     * @param {Number} options.useUiDelta If true, use ct.deltaUi instead of ct.delta.
     * The default is `false`.
     * @param {boolean} options.silent If true, will not throw errors if the animation
     * was interrupted.
     *
     * @returns {Promise} A promise which is resolved if the effect was fully played,
     * or rejected if it was interrupted manually by code, room switching or instance kill.
     * You can call a `stop()` method on this promise to interrupt it manually.
     */
    add(options) {
        var tween = {
            obj: options.obj,
            fields: options.fields || {},
            curve: options.curve || ct.tween.ease,
            duration: options.duration || 1000,
            timer: new CtTimer(this.duration, false, options.useUiDelta || false)
        };
        var promise = new Promise((resolve, reject) => {
            tween.resolve = resolve;
            tween.reject = reject;
            tween.starting = {};
            for (var field in tween.fields) {
                tween.starting[field] = tween.obj[field] || 0;
            }
            ct.tween.tweens.push(tween);
        });
        if (options.silent) {
            promise.catch(() => void 0);
            tween.timer.catch(() => void 0);
        }
        promise.stop = function stop() {
            tween.reject({
                code: 0,
                info: 'Stopped by game logic',
                from: 'ct.tween'
            });
        };
        return promise;
    },
    /**
     * Linear interpolation.
     * Here and below, these parameters are used:
     *
     * @param {Number} s Starting value
     * @param {Number} d The change of value to transition to, the Delta
     * @param {Number} a The current timing state, 0-1
     * @returns {Number} Interpolated value
     */
    linear(s, d, a) {
        return d * a + s;
    },
    ease(s, d, a) {
        a *= 2;
        if (a < 1) {
            return d / 2 * a * a + s;
        }
        a--;
        return -d / 2 * (a * (a - 2) - 1) + s;
    },
    easeInQuad(s, d, a) {
        return d * a * a + s;
    },
    easeOutQuad(s, d, a) {
        return -d * a * (a - 2) + s;
    },
    easeInCubic(s, d, a) {
        return d * a * a * a + s;
    },
    easeOutCubic(s, d, a) {
        a--;
        return d * (a * a * a + 1) + s;
    },
    easeInOutCubic(s, d, a) {
        a *= 2;
        if (a < 1) {
            return d / 2 * a * a * a + s;
        }
        a -= 2;
        return d / 2 * (a * a * a + 2) + s;
    },
    easeInOutQuart(s, d, a) {
        a *= 2;
        if (a < 1) {
            return d / 2 * a * a * a * a + s;
        }
        a -= 2;
        return -d / 2 * (a * a * a * a - 2) + s;
    },
    easeInQuart(s, d, a) {
        return d * a * a * a * a + s;
    },
    easeOutQuart(s, d, a) {
        a--;
        return -d * (a * a * a * a - 1) + s;
    },
    easeInCirc(s, d, a) {
        return -d * (Math.sqrt(1 - a * a) - 1) + s;
    },
    easeOutCirc(s, d, a) {
        a--;
        return d * Math.sqrt(1 - a * a) + s;
    },
    easeInOutCirc(s, d, a) {
        a *= 2;
        if (a < 1) {
            return -d / 2 * (Math.sqrt(1 - a * a) - 1) + s;
        }
        a -= 2;
        return d / 2 * (Math.sqrt(1 - a * a) + 1) + s;
    },
    easeInBack(s, d, a) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        var x = c3 * a * a * a - c1 * a * a;
        return d * x + s;
    },
    easeOutBack(s, d, a) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        var x = 1 + c3 * (a - 1) ** 3 + c1 * (a - 1) ** 2;
        return d * x + s;
    },
    easeInOutBack(s, d, a) {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        var x = a < 0.5 ?
            ((2 * a) ** 2 * ((c2 + 1) * 2 * a - c2)) / 2 :
            ((2 * a - 2) ** 2 * ((c2 + 1) * (a * 2 - 2) + c2) + 2) / 2;
        return d * x + s;
    },
    easeInElastic(s, d, a) {
        const c4 = (2 * Math.PI) / 3;
        var x = a === 0 ?
            0 :
            a === 1 ?
                1 :
                -(2 ** (10 * a - 10)) * Math.sin((a * 10 - 10.75) * c4);
        return d * x + s;
    },
    easeOutElastic(s, d, a) {
        const c4 = (2 * Math.PI) / 3;
        var x = a === 0 ?
            0 :
            a === 1 ?
                1 :
                2 ** (-10 * a) * Math.sin((a * 10 - 0.75) * c4) + 1;
        return d * x + s;
    },
    easeInOutElastic(s, d, a) {
        const c5 = (2 * Math.PI) / 4.5;
        var x = a === 0 ?
            0 :
            a === 1 ?
                1 :
                a < 0.5 ?
                    -(2 ** (20 * a - 10) * Math.sin((20 * a - 11.125) * c5)) / 2 :
                    (2 ** (-20 * a + 10) * Math.sin((20 * a - 11.125) * c5)) / 2 + 1;
        return d * x + s;
    },
    easeOutBounce(s, d, a) {
        const n1 = 7.5625;
        const d1 = 2.75;
        var x;
        if (a < 1 / d1) {
            x = n1 * a * a;
        } else if (a < 2 / d1) {
            x = n1 * (a -= 1.5 / d1) * a + 0.75;
        } else if (a < 2.5 / d1) {
            x = n1 * (a -= 2.25 / d1) * a + 0.9375;
        } else {
            x = n1 * (a -= 2.625 / d1) * a + 0.984375;
        }
        return d * x + s;
    },
    easeInBounce(s, d, a) {
        const n1 = 7.5625;
        const d1 = 2.75;
        var x;
        a = 1 - a;
        if (a < 1 / d1) {
            x = n1 * a * a;
        } else if (a < 2 / d1) {
            x = n1 * (a -= 1.5 / d1) * a + 0.75;
        } else if (a < 2.5 / d1) {
            x = n1 * (a -= 2.25 / d1) * a + 0.9375;
        } else {
            x = n1 * (a -= 2.625 / d1) * a + 0.984375;
        }
        return d * (1 - x) + s;
    },
    easeInOutBounce(s, d, a) {
        const n1 = 7.5625;
        const d1 = 2.75;
        var x, b;
        if (a < 0.5) {
            b = 1 - 2 * a;
        } else {
            b = 2 * a - 1;
        }
        if (b < 1 / d1) {
            x = n1 * b * b;
        } else if (b < 2 / d1) {
            x = n1 * (b -= 1.5 / d1) * b + 0.75;
        } else if (b < 2.5 / d1) {
            x = n1 * (b -= 2.25 / d1) * b + 0.9375;
        } else {
            x = n1 * (b -= 2.625 / d1) * b + 0.984375;
        }
        if (a < 0.5) {
            x = (1 - b) / 1;
        } else {
            x = (1 + b) / 1;
        }
        return d * x + s;
    },
    tweens: [],
    wait: ct.u.wait
};
ct.tween.easeInOutQuad = ct.tween.ease;

/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
var Nakama;
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@babel/runtime/helpers/asyncToGenerator.js":
/*!*****************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/asyncToGenerator.js ***!
  \*****************************************************************/
/***/ ((module) => {

eval("function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {\n  try {\n    var info = gen[key](arg);\n    var value = info.value;\n  } catch (error) {\n    reject(error);\n    return;\n  }\n\n  if (info.done) {\n    resolve(value);\n  } else {\n    Promise.resolve(value).then(_next, _throw);\n  }\n}\n\nfunction _asyncToGenerator(fn) {\n  return function () {\n    var self = this,\n        args = arguments;\n    return new Promise(function (resolve, reject) {\n      var gen = fn.apply(self, args);\n\n      function _next(value) {\n        asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"next\", value);\n      }\n\n      function _throw(err) {\n        asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"throw\", err);\n      }\n\n      _next(undefined);\n    });\n  };\n}\n\nmodule.exports = _asyncToGenerator;\n\n//# sourceURL=webpack://Nakama/./node_modules/@babel/runtime/helpers/asyncToGenerator.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/classCallCheck.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/classCallCheck.js ***!
  \***************************************************************/
/***/ ((module) => {

eval("function _classCallCheck(instance, Constructor) {\n  if (!(instance instanceof Constructor)) {\n    throw new TypeError(\"Cannot call a class as a function\");\n  }\n}\n\nmodule.exports = _classCallCheck;\n\n//# sourceURL=webpack://Nakama/./node_modules/@babel/runtime/helpers/classCallCheck.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/createClass.js":
/*!************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/createClass.js ***!
  \************************************************************/
/***/ ((module) => {

eval("function _defineProperties(target, props) {\n  for (var i = 0; i < props.length; i++) {\n    var descriptor = props[i];\n    descriptor.enumerable = descriptor.enumerable || false;\n    descriptor.configurable = true;\n    if (\"value\" in descriptor) descriptor.writable = true;\n    Object.defineProperty(target, descriptor.key, descriptor);\n  }\n}\n\nfunction _createClass(Constructor, protoProps, staticProps) {\n  if (protoProps) _defineProperties(Constructor.prototype, protoProps);\n  if (staticProps) _defineProperties(Constructor, staticProps);\n  return Constructor;\n}\n\nmodule.exports = _createClass;\n\n//# sourceURL=webpack://Nakama/./node_modules/@babel/runtime/helpers/createClass.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/helpers/defineProperty.js":
/*!***************************************************************!*\
  !*** ./node_modules/@babel/runtime/helpers/defineProperty.js ***!
  \***************************************************************/
/***/ ((module) => {

eval("function _defineProperty(obj, key, value) {\n  if (key in obj) {\n    Object.defineProperty(obj, key, {\n      value: value,\n      enumerable: true,\n      configurable: true,\n      writable: true\n    });\n  } else {\n    obj[key] = value;\n  }\n\n  return obj;\n}\n\nmodule.exports = _defineProperty;\n\n//# sourceURL=webpack://Nakama/./node_modules/@babel/runtime/helpers/defineProperty.js?");

/***/ }),

/***/ "./node_modules/@babel/runtime/regenerator/index.js":
/*!**********************************************************!*\
  !*** ./node_modules/@babel/runtime/regenerator/index.js ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("module.exports = __webpack_require__(/*! regenerator-runtime */ \"./node_modules/regenerator-runtime/runtime.js\");\n\n\n//# sourceURL=webpack://Nakama/./node_modules/@babel/runtime/regenerator/index.js?");

/***/ }),

/***/ "./node_modules/@heroiclabs/nakama-js/dist/nakama-js.esm.js":
/*!******************************************************************!*\
  !*** ./node_modules/@heroiclabs/nakama-js/dist/nakama-js.esm.js ***!
  \******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"Client\": () => (/* binding */ Client),\n/* harmony export */   \"DefaultSocket\": () => (/* binding */ DefaultSocket),\n/* harmony export */   \"Session\": () => (/* binding */ Session),\n/* harmony export */   \"WebSocketAdapterText\": () => (/* binding */ WebSocketAdapterText)\n/* harmony export */ });\nvar __create = Object.create;\nvar __defProp = Object.defineProperty;\nvar __getProtoOf = Object.getPrototypeOf;\nvar __hasOwnProp = Object.prototype.hasOwnProperty;\nvar __getOwnPropNames = Object.getOwnPropertyNames;\nvar __getOwnPropDesc = Object.getOwnPropertyDescriptor;\nvar __assign = Object.assign;\nvar __markAsModule = (target) => __defProp(target, \"__esModule\", {value: true});\nvar __commonJS = (callback, module) => () => {\n  if (!module) {\n    module = {exports: {}};\n    callback(module.exports, module);\n  }\n  return module.exports;\n};\nvar __exportStar = (target, module, desc) => {\n  __markAsModule(target);\n  if (module && typeof module === \"object\" || typeof module === \"function\") {\n    for (let key of __getOwnPropNames(module))\n      if (!__hasOwnProp.call(target, key) && key !== \"default\")\n        __defProp(target, key, {get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable});\n  }\n  return target;\n};\nvar __toModule = (module) => {\n  if (module && module.__esModule)\n    return module;\n  return __exportStar(__defProp(module != null ? __create(__getProtoOf(module)) : {}, \"default\", {value: module, enumerable: true}), module);\n};\nvar __async = (__this, __arguments, generator) => {\n  return new Promise((resolve, reject) => {\n    var fulfilled = (value) => {\n      try {\n        step(generator.next(value));\n      } catch (e) {\n        reject(e);\n      }\n    };\n    var rejected = (value) => {\n      try {\n        step(generator.throw(value));\n      } catch (e) {\n        reject(e);\n      }\n    };\n    var step = (result) => {\n      return result.done ? resolve(result.value) : Promise.resolve(result.value).then(fulfilled, rejected);\n    };\n    step((generator = generator.apply(__this, __arguments)).next());\n  });\n};\n\n// node_modules/whatwg-fetch/fetch.js\nvar require_fetch = __commonJS((exports) => {\n  (function(self2) {\n    \"use strict\";\n    if (self2.fetch) {\n      return;\n    }\n    var support = {\n      searchParams: \"URLSearchParams\" in self2,\n      iterable: \"Symbol\" in self2 && \"iterator\" in Symbol,\n      blob: \"FileReader\" in self2 && \"Blob\" in self2 && function() {\n        try {\n          new Blob();\n          return true;\n        } catch (e) {\n          return false;\n        }\n      }(),\n      formData: \"FormData\" in self2,\n      arrayBuffer: \"ArrayBuffer\" in self2\n    };\n    if (support.arrayBuffer) {\n      var viewClasses = [\n        \"[object Int8Array]\",\n        \"[object Uint8Array]\",\n        \"[object Uint8ClampedArray]\",\n        \"[object Int16Array]\",\n        \"[object Uint16Array]\",\n        \"[object Int32Array]\",\n        \"[object Uint32Array]\",\n        \"[object Float32Array]\",\n        \"[object Float64Array]\"\n      ];\n      var isDataView = function(obj) {\n        return obj && DataView.prototype.isPrototypeOf(obj);\n      };\n      var isArrayBufferView = ArrayBuffer.isView || function(obj) {\n        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;\n      };\n    }\n    function normalizeName(name) {\n      if (typeof name !== \"string\") {\n        name = String(name);\n      }\n      if (/[^a-z0-9\\-#$%&'*+.\\^_`|~]/i.test(name)) {\n        throw new TypeError(\"Invalid character in header field name\");\n      }\n      return name.toLowerCase();\n    }\n    function normalizeValue(value) {\n      if (typeof value !== \"string\") {\n        value = String(value);\n      }\n      return value;\n    }\n    function iteratorFor(items) {\n      var iterator = {\n        next: function() {\n          var value = items.shift();\n          return {done: value === void 0, value};\n        }\n      };\n      if (support.iterable) {\n        iterator[Symbol.iterator] = function() {\n          return iterator;\n        };\n      }\n      return iterator;\n    }\n    function Headers(headers) {\n      this.map = {};\n      if (headers instanceof Headers) {\n        headers.forEach(function(value, name) {\n          this.append(name, value);\n        }, this);\n      } else if (Array.isArray(headers)) {\n        headers.forEach(function(header) {\n          this.append(header[0], header[1]);\n        }, this);\n      } else if (headers) {\n        Object.getOwnPropertyNames(headers).forEach(function(name) {\n          this.append(name, headers[name]);\n        }, this);\n      }\n    }\n    Headers.prototype.append = function(name, value) {\n      name = normalizeName(name);\n      value = normalizeValue(value);\n      var oldValue = this.map[name];\n      this.map[name] = oldValue ? oldValue + \",\" + value : value;\n    };\n    Headers.prototype[\"delete\"] = function(name) {\n      delete this.map[normalizeName(name)];\n    };\n    Headers.prototype.get = function(name) {\n      name = normalizeName(name);\n      return this.has(name) ? this.map[name] : null;\n    };\n    Headers.prototype.has = function(name) {\n      return this.map.hasOwnProperty(normalizeName(name));\n    };\n    Headers.prototype.set = function(name, value) {\n      this.map[normalizeName(name)] = normalizeValue(value);\n    };\n    Headers.prototype.forEach = function(callback, thisArg) {\n      for (var name in this.map) {\n        if (this.map.hasOwnProperty(name)) {\n          callback.call(thisArg, this.map[name], name, this);\n        }\n      }\n    };\n    Headers.prototype.keys = function() {\n      var items = [];\n      this.forEach(function(value, name) {\n        items.push(name);\n      });\n      return iteratorFor(items);\n    };\n    Headers.prototype.values = function() {\n      var items = [];\n      this.forEach(function(value) {\n        items.push(value);\n      });\n      return iteratorFor(items);\n    };\n    Headers.prototype.entries = function() {\n      var items = [];\n      this.forEach(function(value, name) {\n        items.push([name, value]);\n      });\n      return iteratorFor(items);\n    };\n    if (support.iterable) {\n      Headers.prototype[Symbol.iterator] = Headers.prototype.entries;\n    }\n    function consumed(body) {\n      if (body.bodyUsed) {\n        return Promise.reject(new TypeError(\"Already read\"));\n      }\n      body.bodyUsed = true;\n    }\n    function fileReaderReady(reader) {\n      return new Promise(function(resolve, reject) {\n        reader.onload = function() {\n          resolve(reader.result);\n        };\n        reader.onerror = function() {\n          reject(reader.error);\n        };\n      });\n    }\n    function readBlobAsArrayBuffer(blob) {\n      var reader = new FileReader();\n      var promise = fileReaderReady(reader);\n      reader.readAsArrayBuffer(blob);\n      return promise;\n    }\n    function readBlobAsText(blob) {\n      var reader = new FileReader();\n      var promise = fileReaderReady(reader);\n      reader.readAsText(blob);\n      return promise;\n    }\n    function readArrayBufferAsText(buf) {\n      var view = new Uint8Array(buf);\n      var chars = new Array(view.length);\n      for (var i = 0; i < view.length; i++) {\n        chars[i] = String.fromCharCode(view[i]);\n      }\n      return chars.join(\"\");\n    }\n    function bufferClone(buf) {\n      if (buf.slice) {\n        return buf.slice(0);\n      } else {\n        var view = new Uint8Array(buf.byteLength);\n        view.set(new Uint8Array(buf));\n        return view.buffer;\n      }\n    }\n    function Body() {\n      this.bodyUsed = false;\n      this._initBody = function(body) {\n        this._bodyInit = body;\n        if (!body) {\n          this._bodyText = \"\";\n        } else if (typeof body === \"string\") {\n          this._bodyText = body;\n        } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {\n          this._bodyBlob = body;\n        } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {\n          this._bodyFormData = body;\n        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {\n          this._bodyText = body.toString();\n        } else if (support.arrayBuffer && support.blob && isDataView(body)) {\n          this._bodyArrayBuffer = bufferClone(body.buffer);\n          this._bodyInit = new Blob([this._bodyArrayBuffer]);\n        } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {\n          this._bodyArrayBuffer = bufferClone(body);\n        } else {\n          throw new Error(\"unsupported BodyInit type\");\n        }\n        if (!this.headers.get(\"content-type\")) {\n          if (typeof body === \"string\") {\n            this.headers.set(\"content-type\", \"text/plain;charset=UTF-8\");\n          } else if (this._bodyBlob && this._bodyBlob.type) {\n            this.headers.set(\"content-type\", this._bodyBlob.type);\n          } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {\n            this.headers.set(\"content-type\", \"application/x-www-form-urlencoded;charset=UTF-8\");\n          }\n        }\n      };\n      if (support.blob) {\n        this.blob = function() {\n          var rejected = consumed(this);\n          if (rejected) {\n            return rejected;\n          }\n          if (this._bodyBlob) {\n            return Promise.resolve(this._bodyBlob);\n          } else if (this._bodyArrayBuffer) {\n            return Promise.resolve(new Blob([this._bodyArrayBuffer]));\n          } else if (this._bodyFormData) {\n            throw new Error(\"could not read FormData body as blob\");\n          } else {\n            return Promise.resolve(new Blob([this._bodyText]));\n          }\n        };\n        this.arrayBuffer = function() {\n          if (this._bodyArrayBuffer) {\n            return consumed(this) || Promise.resolve(this._bodyArrayBuffer);\n          } else {\n            return this.blob().then(readBlobAsArrayBuffer);\n          }\n        };\n      }\n      this.text = function() {\n        var rejected = consumed(this);\n        if (rejected) {\n          return rejected;\n        }\n        if (this._bodyBlob) {\n          return readBlobAsText(this._bodyBlob);\n        } else if (this._bodyArrayBuffer) {\n          return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));\n        } else if (this._bodyFormData) {\n          throw new Error(\"could not read FormData body as text\");\n        } else {\n          return Promise.resolve(this._bodyText);\n        }\n      };\n      if (support.formData) {\n        this.formData = function() {\n          return this.text().then(decode2);\n        };\n      }\n      this.json = function() {\n        return this.text().then(JSON.parse);\n      };\n      return this;\n    }\n    var methods = [\"DELETE\", \"GET\", \"HEAD\", \"OPTIONS\", \"POST\", \"PUT\"];\n    function normalizeMethod(method) {\n      var upcased = method.toUpperCase();\n      return methods.indexOf(upcased) > -1 ? upcased : method;\n    }\n    function Request(input, options) {\n      options = options || {};\n      var body = options.body;\n      if (input instanceof Request) {\n        if (input.bodyUsed) {\n          throw new TypeError(\"Already read\");\n        }\n        this.url = input.url;\n        this.credentials = input.credentials;\n        if (!options.headers) {\n          this.headers = new Headers(input.headers);\n        }\n        this.method = input.method;\n        this.mode = input.mode;\n        if (!body && input._bodyInit != null) {\n          body = input._bodyInit;\n          input.bodyUsed = true;\n        }\n      } else {\n        this.url = String(input);\n      }\n      this.credentials = options.credentials || this.credentials || \"omit\";\n      if (options.headers || !this.headers) {\n        this.headers = new Headers(options.headers);\n      }\n      this.method = normalizeMethod(options.method || this.method || \"GET\");\n      this.mode = options.mode || this.mode || null;\n      this.referrer = null;\n      if ((this.method === \"GET\" || this.method === \"HEAD\") && body) {\n        throw new TypeError(\"Body not allowed for GET or HEAD requests\");\n      }\n      this._initBody(body);\n    }\n    Request.prototype.clone = function() {\n      return new Request(this, {body: this._bodyInit});\n    };\n    function decode2(body) {\n      var form = new FormData();\n      body.trim().split(\"&\").forEach(function(bytes) {\n        if (bytes) {\n          var split = bytes.split(\"=\");\n          var name = split.shift().replace(/\\+/g, \" \");\n          var value = split.join(\"=\").replace(/\\+/g, \" \");\n          form.append(decodeURIComponent(name), decodeURIComponent(value));\n        }\n      });\n      return form;\n    }\n    function parseHeaders(rawHeaders) {\n      var headers = new Headers();\n      var preProcessedHeaders = rawHeaders.replace(/\\r?\\n[\\t ]+/g, \" \");\n      preProcessedHeaders.split(/\\r?\\n/).forEach(function(line) {\n        var parts = line.split(\":\");\n        var key = parts.shift().trim();\n        if (key) {\n          var value = parts.join(\":\").trim();\n          headers.append(key, value);\n        }\n      });\n      return headers;\n    }\n    Body.call(Request.prototype);\n    function Response(bodyInit, options) {\n      if (!options) {\n        options = {};\n      }\n      this.type = \"default\";\n      this.status = options.status === void 0 ? 200 : options.status;\n      this.ok = this.status >= 200 && this.status < 300;\n      this.statusText = \"statusText\" in options ? options.statusText : \"OK\";\n      this.headers = new Headers(options.headers);\n      this.url = options.url || \"\";\n      this._initBody(bodyInit);\n    }\n    Body.call(Response.prototype);\n    Response.prototype.clone = function() {\n      return new Response(this._bodyInit, {\n        status: this.status,\n        statusText: this.statusText,\n        headers: new Headers(this.headers),\n        url: this.url\n      });\n    };\n    Response.error = function() {\n      var response = new Response(null, {status: 0, statusText: \"\"});\n      response.type = \"error\";\n      return response;\n    };\n    var redirectStatuses = [301, 302, 303, 307, 308];\n    Response.redirect = function(url, status) {\n      if (redirectStatuses.indexOf(status) === -1) {\n        throw new RangeError(\"Invalid status code\");\n      }\n      return new Response(null, {status, headers: {location: url}});\n    };\n    self2.Headers = Headers;\n    self2.Request = Request;\n    self2.Response = Response;\n    self2.fetch = function(input, init) {\n      return new Promise(function(resolve, reject) {\n        var request = new Request(input, init);\n        var xhr = new XMLHttpRequest();\n        xhr.onload = function() {\n          var options = {\n            status: xhr.status,\n            statusText: xhr.statusText,\n            headers: parseHeaders(xhr.getAllResponseHeaders() || \"\")\n          };\n          options.url = \"responseURL\" in xhr ? xhr.responseURL : options.headers.get(\"X-Request-URL\");\n          var body = \"response\" in xhr ? xhr.response : xhr.responseText;\n          resolve(new Response(body, options));\n        };\n        xhr.onerror = function() {\n          reject(new TypeError(\"Network request failed\"));\n        };\n        xhr.ontimeout = function() {\n          reject(new TypeError(\"Network request failed\"));\n        };\n        xhr.open(request.method, request.url, true);\n        if (request.credentials === \"include\") {\n          xhr.withCredentials = true;\n        } else if (request.credentials === \"omit\") {\n          xhr.withCredentials = false;\n        }\n        if (\"responseType\" in xhr && support.blob) {\n          xhr.responseType = \"blob\";\n        }\n        request.headers.forEach(function(value, name) {\n          xhr.setRequestHeader(name, value);\n        });\n        xhr.send(typeof request._bodyInit === \"undefined\" ? null : request._bodyInit);\n      });\n    };\n    self2.fetch.polyfill = true;\n  })(typeof self !== \"undefined\" ? self : exports);\n});\n\n// index.ts\nvar import_whatwg_fetch = __toModule(require_fetch());\n\n// node_modules/js-base64/base64.mjs\nvar _hasatob = typeof atob === \"function\";\nvar _hasbtoa = typeof btoa === \"function\";\nvar _hasBuffer = typeof Buffer === \"function\";\nvar _TD = typeof TextDecoder === \"function\" ? new TextDecoder() : void 0;\nvar _TE = typeof TextEncoder === \"function\" ? new TextEncoder() : void 0;\nvar b64ch = \"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\";\nvar b64chs = [...b64ch];\nvar b64tab = ((a) => {\n  let tab = {};\n  a.forEach((c, i) => tab[c] = i);\n  return tab;\n})(b64chs);\nvar b64re = /^(?:[A-Za-z\\d+\\/]{4})*?(?:[A-Za-z\\d+\\/]{2}(?:==)?|[A-Za-z\\d+\\/]{3}=?)?$/;\nvar _fromCC = String.fromCharCode.bind(String);\nvar _U8Afrom = typeof Uint8Array.from === \"function\" ? Uint8Array.from.bind(Uint8Array) : (it, fn = (x) => x) => new Uint8Array(Array.prototype.slice.call(it, 0).map(fn));\nvar _mkUriSafe = (src) => src.replace(/[+\\/]/g, (m0) => m0 == \"+\" ? \"-\" : \"_\").replace(/=+$/m, \"\");\nvar _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\\+\\/]/g, \"\");\nvar btoaPolyfill = (bin) => {\n  let u32, c0, c1, c2, asc = \"\";\n  const pad = bin.length % 3;\n  for (let i = 0; i < bin.length; ) {\n    if ((c0 = bin.charCodeAt(i++)) > 255 || (c1 = bin.charCodeAt(i++)) > 255 || (c2 = bin.charCodeAt(i++)) > 255)\n      throw new TypeError(\"invalid character found\");\n    u32 = c0 << 16 | c1 << 8 | c2;\n    asc += b64chs[u32 >> 18 & 63] + b64chs[u32 >> 12 & 63] + b64chs[u32 >> 6 & 63] + b64chs[u32 & 63];\n  }\n  return pad ? asc.slice(0, pad - 3) + \"===\".substring(pad) : asc;\n};\nvar _btoa = _hasbtoa ? (bin) => btoa(bin) : _hasBuffer ? (bin) => Buffer.from(bin, \"binary\").toString(\"base64\") : btoaPolyfill;\nvar _fromUint8Array = _hasBuffer ? (u8a) => Buffer.from(u8a).toString(\"base64\") : (u8a) => {\n  const maxargs = 4096;\n  let strs = [];\n  for (let i = 0, l = u8a.length; i < l; i += maxargs) {\n    strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));\n  }\n  return _btoa(strs.join(\"\"));\n};\nvar cb_utob = (c) => {\n  if (c.length < 2) {\n    var cc = c.charCodeAt(0);\n    return cc < 128 ? c : cc < 2048 ? _fromCC(192 | cc >>> 6) + _fromCC(128 | cc & 63) : _fromCC(224 | cc >>> 12 & 15) + _fromCC(128 | cc >>> 6 & 63) + _fromCC(128 | cc & 63);\n  } else {\n    var cc = 65536 + (c.charCodeAt(0) - 55296) * 1024 + (c.charCodeAt(1) - 56320);\n    return _fromCC(240 | cc >>> 18 & 7) + _fromCC(128 | cc >>> 12 & 63) + _fromCC(128 | cc >>> 6 & 63) + _fromCC(128 | cc & 63);\n  }\n};\nvar re_utob = /[\\uD800-\\uDBFF][\\uDC00-\\uDFFFF]|[^\\x00-\\x7F]/g;\nvar utob = (u) => u.replace(re_utob, cb_utob);\nvar _encode = _hasBuffer ? (s) => Buffer.from(s, \"utf8\").toString(\"base64\") : _TE ? (s) => _fromUint8Array(_TE.encode(s)) : (s) => _btoa(utob(s));\nvar encode = (src, urlsafe = false) => urlsafe ? _mkUriSafe(_encode(src)) : _encode(src);\nvar re_btou = /[\\xC0-\\xDF][\\x80-\\xBF]|[\\xE0-\\xEF][\\x80-\\xBF]{2}|[\\xF0-\\xF7][\\x80-\\xBF]{3}/g;\nvar cb_btou = (cccc) => {\n  switch (cccc.length) {\n    case 4:\n      var cp = (7 & cccc.charCodeAt(0)) << 18 | (63 & cccc.charCodeAt(1)) << 12 | (63 & cccc.charCodeAt(2)) << 6 | 63 & cccc.charCodeAt(3), offset = cp - 65536;\n      return _fromCC((offset >>> 10) + 55296) + _fromCC((offset & 1023) + 56320);\n    case 3:\n      return _fromCC((15 & cccc.charCodeAt(0)) << 12 | (63 & cccc.charCodeAt(1)) << 6 | 63 & cccc.charCodeAt(2));\n    default:\n      return _fromCC((31 & cccc.charCodeAt(0)) << 6 | 63 & cccc.charCodeAt(1));\n  }\n};\nvar btou = (b) => b.replace(re_btou, cb_btou);\nvar atobPolyfill = (asc) => {\n  asc = asc.replace(/\\s+/g, \"\");\n  if (!b64re.test(asc))\n    throw new TypeError(\"malformed base64.\");\n  asc += \"==\".slice(2 - (asc.length & 3));\n  let u24, bin = \"\", r1, r2;\n  for (let i = 0; i < asc.length; ) {\n    u24 = b64tab[asc.charAt(i++)] << 18 | b64tab[asc.charAt(i++)] << 12 | (r1 = b64tab[asc.charAt(i++)]) << 6 | (r2 = b64tab[asc.charAt(i++)]);\n    bin += r1 === 64 ? _fromCC(u24 >> 16 & 255) : r2 === 64 ? _fromCC(u24 >> 16 & 255, u24 >> 8 & 255) : _fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255);\n  }\n  return bin;\n};\nvar _atob = _hasatob ? (asc) => atob(_tidyB64(asc)) : _hasBuffer ? (asc) => Buffer.from(asc, \"base64\").toString(\"binary\") : atobPolyfill;\nvar _toUint8Array = _hasBuffer ? (a) => _U8Afrom(Buffer.from(a, \"base64\")) : (a) => _U8Afrom(_atob(a), (c) => c.charCodeAt(0));\nvar _decode = _hasBuffer ? (a) => Buffer.from(a, \"base64\").toString(\"utf8\") : _TD ? (a) => _TD.decode(_toUint8Array(a)) : (a) => btou(_atob(a));\nvar _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == \"-\" ? \"+\" : \"/\"));\nvar decode = (src) => _decode(_unURI(src));\n\n// api.gen.ts\nvar NakamaApi = class {\n  constructor(configuration) {\n    this.configuration = configuration;\n  }\n  doFetch(urlPath, method, queryParams, body, options) {\n    const urlQuery = \"?\" + Object.keys(queryParams).map((k) => {\n      if (queryParams[k] instanceof Array) {\n        return queryParams[k].reduce((prev, curr) => {\n          return prev + encodeURIComponent(k) + \"=\" + encodeURIComponent(curr) + \"&\";\n        }, \"\");\n      } else {\n        if (queryParams[k] != null) {\n          return encodeURIComponent(k) + \"=\" + encodeURIComponent(queryParams[k]) + \"&\";\n        }\n      }\n    }).join(\"\");\n    const fetchOptions = __assign(__assign({}, {method}), options);\n    fetchOptions.headers = __assign({}, options.headers);\n    const descriptor = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, \"withCredentials\");\n    if (!(descriptor == null ? void 0 : descriptor.set)) {\n      fetchOptions.credentials = \"cocos-ignore\";\n    }\n    if (this.configuration.bearerToken) {\n      fetchOptions.headers[\"Authorization\"] = \"Bearer \" + this.configuration.bearerToken;\n    } else if (this.configuration.username) {\n      fetchOptions.headers[\"Authorization\"] = \"Basic \" + encode(this.configuration.username + \":\" + this.configuration.password);\n    }\n    if (!Object.keys(fetchOptions.headers).includes(\"Accept\")) {\n      fetchOptions.headers[\"Accept\"] = \"application/json\";\n    }\n    if (!Object.keys(fetchOptions.headers).includes(\"Content-Type\")) {\n      fetchOptions.headers[\"Content-Type\"] = \"application/json\";\n    }\n    Object.keys(fetchOptions.headers).forEach((key) => {\n      if (!fetchOptions.headers[key]) {\n        delete fetchOptions.headers[key];\n      }\n    });\n    fetchOptions.body = body;\n    return Promise.race([\n      fetch(this.configuration.basePath + urlPath + urlQuery, fetchOptions).then((response) => {\n        if (response.status == 204) {\n          return response;\n        } else if (response.status >= 200 && response.status < 300) {\n          return response.json();\n        } else {\n          throw response;\n        }\n      }),\n      new Promise((_, reject) => setTimeout(reject, this.configuration.timeoutMs, \"Request timed out.\"))\n    ]);\n  }\n  healthcheck(options = {}) {\n    const urlPath = \"/healthcheck\";\n    const queryParams = {};\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  getAccount(options = {}) {\n    const urlPath = \"/v2/account\";\n    const queryParams = {};\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  updateAccount(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"PUT\", queryParams, _body, options);\n  }\n  authenticateApple(body, create, username, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/authenticate/apple\";\n    const queryParams = {\n      create,\n      username\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  authenticateCustom(body, create, username, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/authenticate/custom\";\n    const queryParams = {\n      create,\n      username\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  authenticateDevice(body, create, username, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/authenticate/device\";\n    const queryParams = {\n      create,\n      username\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  authenticateEmail(body, create, username, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/authenticate/email\";\n    const queryParams = {\n      create,\n      username\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  authenticateFacebook(body, create, username, sync, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/authenticate/facebook\";\n    const queryParams = {\n      create,\n      username,\n      sync\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  authenticateFacebookInstantGame(body, create, username, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/authenticate/facebookinstantgame\";\n    const queryParams = {\n      create,\n      username\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  authenticateGameCenter(body, create, username, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/authenticate/gamecenter\";\n    const queryParams = {\n      create,\n      username\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  authenticateGoogle(body, create, username, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/authenticate/google\";\n    const queryParams = {\n      create,\n      username\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  authenticateSteam(body, create, username, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/authenticate/steam\";\n    const queryParams = {\n      create,\n      username\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  linkApple(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/link/apple\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  linkCustom(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/link/custom\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  linkDevice(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/link/device\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  linkEmail(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/link/email\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  linkFacebook(body, sync, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/link/facebook\";\n    const queryParams = {\n      sync\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  linkFacebookInstantGame(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/link/facebookinstantgame\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  linkGameCenter(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/link/gamecenter\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  linkGoogle(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/link/google\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  linkSteam(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/link/steam\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  sessionRefresh(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/session/refresh\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  unlinkApple(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/unlink/apple\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  unlinkCustom(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/unlink/custom\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  unlinkDevice(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/unlink/device\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  unlinkEmail(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/unlink/email\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  unlinkFacebook(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/unlink/facebook\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  unlinkFacebookInstantGame(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/unlink/facebookinstantgame\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  unlinkGameCenter(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/unlink/gamecenter\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  unlinkGoogle(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/unlink/google\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  unlinkSteam(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/account/unlink/steam\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  listChannelMessages(channelId, limit, forward, cursor, options = {}) {\n    if (channelId === null || channelId === void 0) {\n      throw new Error(\"'channelId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/channel/{channelId}\".replace(\"{channelId}\", encodeURIComponent(String(channelId)));\n    const queryParams = {\n      limit,\n      forward,\n      cursor\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  event(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/event\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  deleteFriends(ids, usernames, options = {}) {\n    const urlPath = \"/v2/friend\";\n    const queryParams = {\n      ids,\n      usernames\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"DELETE\", queryParams, _body, options);\n  }\n  listFriends(limit, state, cursor, options = {}) {\n    const urlPath = \"/v2/friend\";\n    const queryParams = {\n      limit,\n      state,\n      cursor\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  addFriends(ids, usernames, options = {}) {\n    const urlPath = \"/v2/friend\";\n    const queryParams = {\n      ids,\n      usernames\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  blockFriends(ids, usernames, options = {}) {\n    const urlPath = \"/v2/friend/block\";\n    const queryParams = {\n      ids,\n      usernames\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  importFacebookFriends(body, reset, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/friend/facebook\";\n    const queryParams = {\n      reset\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  listGroups(name, cursor, limit, options = {}) {\n    const urlPath = \"/v2/group\";\n    const queryParams = {\n      name,\n      cursor,\n      limit\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  createGroup(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  deleteGroup(groupId, options = {}) {\n    if (groupId === null || groupId === void 0) {\n      throw new Error(\"'groupId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group/{groupId}\".replace(\"{groupId}\", encodeURIComponent(String(groupId)));\n    const queryParams = {};\n    let _body = null;\n    return this.doFetch(urlPath, \"DELETE\", queryParams, _body, options);\n  }\n  updateGroup(groupId, body, options = {}) {\n    if (groupId === null || groupId === void 0) {\n      throw new Error(\"'groupId' is a required parameter but is null or undefined.\");\n    }\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group/{groupId}\".replace(\"{groupId}\", encodeURIComponent(String(groupId)));\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"PUT\", queryParams, _body, options);\n  }\n  addGroupUsers(groupId, userIds, options = {}) {\n    if (groupId === null || groupId === void 0) {\n      throw new Error(\"'groupId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group/{groupId}/add\".replace(\"{groupId}\", encodeURIComponent(String(groupId)));\n    const queryParams = {\n      user_ids: userIds\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  banGroupUsers(groupId, userIds, options = {}) {\n    if (groupId === null || groupId === void 0) {\n      throw new Error(\"'groupId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group/{groupId}/ban\".replace(\"{groupId}\", encodeURIComponent(String(groupId)));\n    const queryParams = {\n      user_ids: userIds\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  demoteGroupUsers(groupId, userIds, options = {}) {\n    if (groupId === null || groupId === void 0) {\n      throw new Error(\"'groupId' is a required parameter but is null or undefined.\");\n    }\n    if (userIds === null || userIds === void 0) {\n      throw new Error(\"'userIds' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group/{groupId}/demote\".replace(\"{groupId}\", encodeURIComponent(String(groupId)));\n    const queryParams = {\n      user_ids: userIds\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  joinGroup(groupId, options = {}) {\n    if (groupId === null || groupId === void 0) {\n      throw new Error(\"'groupId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group/{groupId}/join\".replace(\"{groupId}\", encodeURIComponent(String(groupId)));\n    const queryParams = {};\n    let _body = null;\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  kickGroupUsers(groupId, userIds, options = {}) {\n    if (groupId === null || groupId === void 0) {\n      throw new Error(\"'groupId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group/{groupId}/kick\".replace(\"{groupId}\", encodeURIComponent(String(groupId)));\n    const queryParams = {\n      user_ids: userIds\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  leaveGroup(groupId, options = {}) {\n    if (groupId === null || groupId === void 0) {\n      throw new Error(\"'groupId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group/{groupId}/leave\".replace(\"{groupId}\", encodeURIComponent(String(groupId)));\n    const queryParams = {};\n    let _body = null;\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  promoteGroupUsers(groupId, userIds, options = {}) {\n    if (groupId === null || groupId === void 0) {\n      throw new Error(\"'groupId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group/{groupId}/promote\".replace(\"{groupId}\", encodeURIComponent(String(groupId)));\n    const queryParams = {\n      user_ids: userIds\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  listGroupUsers(groupId, limit, state, cursor, options = {}) {\n    if (groupId === null || groupId === void 0) {\n      throw new Error(\"'groupId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/group/{groupId}/user\".replace(\"{groupId}\", encodeURIComponent(String(groupId)));\n    const queryParams = {\n      limit,\n      state,\n      cursor\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  deleteLeaderboardRecord(leaderboardId, options = {}) {\n    if (leaderboardId === null || leaderboardId === void 0) {\n      throw new Error(\"'leaderboardId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/leaderboard/{leaderboardId}\".replace(\"{leaderboardId}\", encodeURIComponent(String(leaderboardId)));\n    const queryParams = {};\n    let _body = null;\n    return this.doFetch(urlPath, \"DELETE\", queryParams, _body, options);\n  }\n  listLeaderboardRecords(leaderboardId, ownerIds, limit, cursor, expiry, options = {}) {\n    if (leaderboardId === null || leaderboardId === void 0) {\n      throw new Error(\"'leaderboardId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/leaderboard/{leaderboardId}\".replace(\"{leaderboardId}\", encodeURIComponent(String(leaderboardId)));\n    const queryParams = {\n      ownerIds,\n      limit,\n      cursor,\n      expiry\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  writeLeaderboardRecord(leaderboardId, body, options = {}) {\n    if (leaderboardId === null || leaderboardId === void 0) {\n      throw new Error(\"'leaderboardId' is a required parameter but is null or undefined.\");\n    }\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/leaderboard/{leaderboardId}\".replace(\"{leaderboardId}\", encodeURIComponent(String(leaderboardId)));\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  listLeaderboardRecordsAroundOwner(leaderboardId, ownerId, limit, expiry, options = {}) {\n    if (leaderboardId === null || leaderboardId === void 0) {\n      throw new Error(\"'leaderboardId' is a required parameter but is null or undefined.\");\n    }\n    if (ownerId === null || ownerId === void 0) {\n      throw new Error(\"'ownerId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/leaderboard/{leaderboardId}/owner/{ownerId}\".replace(\"{leaderboardId}\", encodeURIComponent(String(leaderboardId))).replace(\"{ownerId}\", encodeURIComponent(String(ownerId)));\n    const queryParams = {\n      limit,\n      expiry\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  listMatches(limit, authoritative, label, minSize, maxSize, query, options = {}) {\n    const urlPath = \"/v2/match\";\n    const queryParams = {\n      limit,\n      authoritative,\n      label,\n      minSize,\n      maxSize,\n      query\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  deleteNotifications(ids, options = {}) {\n    const urlPath = \"/v2/notification\";\n    const queryParams = {\n      ids\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"DELETE\", queryParams, _body, options);\n  }\n  listNotifications(limit, cacheableCursor, options = {}) {\n    const urlPath = \"/v2/notification\";\n    const queryParams = {\n      limit,\n      cacheableCursor\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  rpcFunc2(id, payload, httpKey, options = {}) {\n    if (id === null || id === void 0) {\n      throw new Error(\"'id' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/rpc/{id}\".replace(\"{id}\", encodeURIComponent(String(id)));\n    const queryParams = {\n      payload,\n      httpKey\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  rpcFunc(id, body, httpKey, options = {}) {\n    if (id === null || id === void 0) {\n      throw new Error(\"'id' is a required parameter but is null or undefined.\");\n    }\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/rpc/{id}\".replace(\"{id}\", encodeURIComponent(String(id)));\n    const queryParams = {\n      httpKey\n    };\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  readStorageObjects(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/storage\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  writeStorageObjects(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/storage\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"PUT\", queryParams, _body, options);\n  }\n  deleteStorageObjects(body, options = {}) {\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/storage/delete\";\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"PUT\", queryParams, _body, options);\n  }\n  listStorageObjects(collection, userId, limit, cursor, options = {}) {\n    if (collection === null || collection === void 0) {\n      throw new Error(\"'collection' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/storage/{collection}\".replace(\"{collection}\", encodeURIComponent(String(collection)));\n    const queryParams = {\n      userId,\n      limit,\n      cursor\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  listStorageObjects2(collection, userId, limit, cursor, options = {}) {\n    if (collection === null || collection === void 0) {\n      throw new Error(\"'collection' is a required parameter but is null or undefined.\");\n    }\n    if (userId === null || userId === void 0) {\n      throw new Error(\"'userId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/storage/{collection}/{userId}\".replace(\"{collection}\", encodeURIComponent(String(collection))).replace(\"{userId}\", encodeURIComponent(String(userId)));\n    const queryParams = {\n      limit,\n      cursor\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  listTournaments(categoryStart, categoryEnd, startTime, endTime, limit, cursor, options = {}) {\n    const urlPath = \"/v2/tournament\";\n    const queryParams = {\n      categoryStart,\n      categoryEnd,\n      startTime,\n      endTime,\n      limit,\n      cursor\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  listTournamentRecords(tournamentId, ownerIds, limit, cursor, expiry, options = {}) {\n    if (tournamentId === null || tournamentId === void 0) {\n      throw new Error(\"'tournamentId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/tournament/{tournamentId}\".replace(\"{tournamentId}\", encodeURIComponent(String(tournamentId)));\n    const queryParams = {\n      ownerIds,\n      limit,\n      cursor,\n      expiry\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  writeTournamentRecord(tournamentId, body, options = {}) {\n    if (tournamentId === null || tournamentId === void 0) {\n      throw new Error(\"'tournamentId' is a required parameter but is null or undefined.\");\n    }\n    if (body === null || body === void 0) {\n      throw new Error(\"'body' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/tournament/{tournamentId}\".replace(\"{tournamentId}\", encodeURIComponent(String(tournamentId)));\n    const queryParams = {};\n    let _body = null;\n    _body = JSON.stringify(body || {});\n    return this.doFetch(urlPath, \"PUT\", queryParams, _body, options);\n  }\n  joinTournament(tournamentId, options = {}) {\n    if (tournamentId === null || tournamentId === void 0) {\n      throw new Error(\"'tournamentId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/tournament/{tournamentId}/join\".replace(\"{tournamentId}\", encodeURIComponent(String(tournamentId)));\n    const queryParams = {};\n    let _body = null;\n    return this.doFetch(urlPath, \"POST\", queryParams, _body, options);\n  }\n  listTournamentRecordsAroundOwner(tournamentId, ownerId, limit, expiry, options = {}) {\n    if (tournamentId === null || tournamentId === void 0) {\n      throw new Error(\"'tournamentId' is a required parameter but is null or undefined.\");\n    }\n    if (ownerId === null || ownerId === void 0) {\n      throw new Error(\"'ownerId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/tournament/{tournamentId}/owner/{ownerId}\".replace(\"{tournamentId}\", encodeURIComponent(String(tournamentId))).replace(\"{ownerId}\", encodeURIComponent(String(ownerId)));\n    const queryParams = {\n      limit,\n      expiry\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  getUsers(ids, usernames, facebookIds, options = {}) {\n    const urlPath = \"/v2/user\";\n    const queryParams = {\n      ids,\n      usernames,\n      facebookIds\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n  listUserGroups(userId, limit, state, cursor, options = {}) {\n    if (userId === null || userId === void 0) {\n      throw new Error(\"'userId' is a required parameter but is null or undefined.\");\n    }\n    const urlPath = \"/v2/user/{userId}/group\".replace(\"{userId}\", encodeURIComponent(String(userId)));\n    const queryParams = {\n      limit,\n      state,\n      cursor\n    };\n    let _body = null;\n    return this.doFetch(urlPath, \"GET\", queryParams, _body, options);\n  }\n};\n\n// session.ts\nvar Session = class {\n  constructor(token, created_at, expires_at, username, user_id, vars) {\n    this.token = token;\n    this.created_at = created_at;\n    this.expires_at = expires_at;\n    this.username = username;\n    this.user_id = user_id;\n    this.vars = vars;\n  }\n  isexpired(currenttime) {\n    return this.expires_at - currenttime < 0;\n  }\n  static restore(jwt) {\n    const createdAt = Math.floor(new Date().getTime() / 1e3);\n    const parts = jwt.split(\".\");\n    if (parts.length != 3) {\n      throw \"jwt is not valid.\";\n    }\n    const decoded = JSON.parse(atob(parts[1]));\n    const expiresAt = Math.floor(parseInt(decoded[\"exp\"]));\n    return new Session(jwt, createdAt, expiresAt, decoded[\"usn\"], decoded[\"uid\"], decoded[\"vrs\"]);\n  }\n};\n\n// web_socket_adapter.ts\nvar WebSocketAdapterText = class {\n  constructor() {\n    this._isConnected = false;\n  }\n  get onClose() {\n    return this._socket.onclose;\n  }\n  set onClose(value) {\n    this._socket.onclose = value;\n  }\n  get onError() {\n    return this._socket.onerror;\n  }\n  set onError(value) {\n    this._socket.onerror = value;\n  }\n  get onMessage() {\n    return this._socket.onmessage;\n  }\n  set onMessage(value) {\n    if (value) {\n      this._socket.onmessage = (evt) => {\n        const message = JSON.parse(evt.data);\n        value(message);\n      };\n    } else {\n      value = null;\n    }\n  }\n  get onOpen() {\n    return this._socket.onopen;\n  }\n  set onOpen(value) {\n    this._socket.onopen = value;\n  }\n  get isConnected() {\n    return this._isConnected;\n  }\n  connect(scheme, host, port, createStatus, token) {\n    const url = `${scheme}${host}:${port}/ws?lang=en&status=${encodeURIComponent(createStatus.toString())}&token=${encodeURIComponent(token)}`;\n    this._socket = new WebSocket(url);\n    this._isConnected = true;\n  }\n  close() {\n    this._isConnected = false;\n    this._socket.close();\n    this._socket = void 0;\n  }\n  send(msg) {\n    if (msg.match_data_send) {\n      msg.match_data_send.op_code = msg.match_data_send.op_code.toString();\n    }\n    this._socket.send(JSON.stringify(msg));\n  }\n};\n\n// utils.ts\nfunction b64EncodeUnicode(str) {\n  return encode(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(_match, p1) {\n    return String.fromCharCode(Number(\"0x\" + p1));\n  }));\n}\nfunction b64DecodeUnicode(str) {\n  return decodeURIComponent(decode(str).split(\"\").map(function(c) {\n    return \"%\" + (\"00\" + c.charCodeAt(0).toString(16)).slice(-2);\n  }).join(\"\"));\n}\n\n// socket.ts\nvar DefaultSocket = class {\n  constructor(host, port, useSSL = false, verbose = false, adapter = new WebSocketAdapterText()) {\n    this.host = host;\n    this.port = port;\n    this.useSSL = useSSL;\n    this.verbose = verbose;\n    this.adapter = adapter;\n    this.cIds = {};\n    this.nextCid = 1;\n  }\n  generatecid() {\n    const cid = this.nextCid.toString();\n    ++this.nextCid;\n    return cid;\n  }\n  connect(session, createStatus = false) {\n    if (this.adapter.isConnected) {\n      return Promise.resolve(session);\n    }\n    const scheme = this.useSSL ? \"wss://\" : \"ws://\";\n    this.adapter.connect(scheme, this.host, this.port, createStatus, session.token);\n    this.adapter.onClose = (evt) => {\n      this.ondisconnect(evt);\n    };\n    this.adapter.onError = (evt) => {\n      this.onerror(evt);\n    };\n    this.adapter.onMessage = (message) => {\n      if (this.verbose && window && window.console) {\n        console.log(\"Response: %o\", message);\n      }\n      if (message.cid == void 0) {\n        if (message.notifications) {\n          message.notifications.notifications.forEach((n) => {\n            n.content = n.content ? JSON.parse(n.content) : void 0;\n            this.onnotification(n);\n          });\n        } else if (message.match_data) {\n          message.match_data.data = message.match_data.data != null ? JSON.parse(b64DecodeUnicode(message.match_data.data)) : null;\n          message.match_data.op_code = parseInt(message.match_data.op_code);\n          this.onmatchdata(message.match_data);\n        } else if (message.match_presence_event) {\n          this.onmatchpresence(message.match_presence_event);\n        } else if (message.matchmaker_matched) {\n          this.onmatchmakermatched(message.matchmaker_matched);\n        } else if (message.status_presence_event) {\n          this.onstatuspresence(message.status_presence_event);\n        } else if (message.stream_presence_event) {\n          this.onstreampresence(message.stream_presence_event);\n        } else if (message.stream_data) {\n          this.onstreamdata(message.stream_data);\n        } else if (message.channel_message) {\n          message.channel_message.content = JSON.parse(message.channel_message.content);\n          this.onchannelmessage(message.channel_message);\n        } else if (message.channel_presence_event) {\n          this.onchannelpresence(message.channel_presence_event);\n        } else {\n          if (this.verbose && window && window.console) {\n            console.log(\"Unrecognized message received: %o\", message);\n          }\n        }\n      } else {\n        const executor = this.cIds[message.cid];\n        if (!executor) {\n          if (this.verbose && window && window.console) {\n            console.error(\"No promise executor for message: %o\", message);\n          }\n          return;\n        }\n        delete this.cIds[message.cid];\n        if (message.error) {\n          executor.reject(message.error);\n        } else {\n          executor.resolve(message);\n        }\n      }\n    };\n    return new Promise((resolve, reject) => {\n      this.adapter.onOpen = (evt) => {\n        if (this.verbose && window && window.console) {\n          console.log(evt);\n        }\n        resolve(session);\n      };\n      this.adapter.onError = (evt) => {\n        reject(evt);\n        this.adapter.close();\n      };\n    });\n  }\n  disconnect(fireDisconnectEvent = true) {\n    if (this.adapter.isConnected) {\n      this.adapter.close();\n    }\n    if (fireDisconnectEvent) {\n      this.ondisconnect({});\n    }\n  }\n  ondisconnect(evt) {\n    if (this.verbose && window && window.console) {\n      console.log(evt);\n    }\n  }\n  onerror(evt) {\n    if (this.verbose && window && window.console) {\n      console.log(evt);\n    }\n  }\n  onchannelmessage(channelMessage) {\n    if (this.verbose && window && window.console) {\n      console.log(channelMessage);\n    }\n  }\n  onchannelpresence(channelPresence) {\n    if (this.verbose && window && window.console) {\n      console.log(channelPresence);\n    }\n  }\n  onnotification(notification) {\n    if (this.verbose && window && window.console) {\n      console.log(notification);\n    }\n  }\n  onmatchdata(matchData) {\n    if (this.verbose && window && window.console) {\n      console.log(matchData);\n    }\n  }\n  onmatchpresence(matchPresence) {\n    if (this.verbose && window && window.console) {\n      console.log(matchPresence);\n    }\n  }\n  onmatchmakermatched(matchmakerMatched) {\n    if (this.verbose && window && window.console) {\n      console.log(matchmakerMatched);\n    }\n  }\n  onstatuspresence(statusPresence) {\n    if (this.verbose && window && window.console) {\n      console.log(statusPresence);\n    }\n  }\n  onstreampresence(streamPresence) {\n    if (this.verbose && window && window.console) {\n      console.log(streamPresence);\n    }\n  }\n  onstreamdata(streamData) {\n    if (this.verbose && window && window.console) {\n      console.log(streamData);\n    }\n  }\n  send(message) {\n    const untypedMessage = message;\n    return new Promise((resolve, reject) => {\n      if (!this.adapter.isConnected) {\n        reject(\"Socket connection has not been established yet.\");\n      } else {\n        if (untypedMessage.match_data_send) {\n          untypedMessage.match_data_send.data = b64EncodeUnicode(JSON.stringify(untypedMessage.match_data_send.data));\n          this.adapter.send(untypedMessage);\n          resolve();\n        } else {\n          if (untypedMessage.channel_message_send) {\n            untypedMessage.channel_message_send.content = JSON.stringify(untypedMessage.channel_message_send.content);\n          } else if (untypedMessage.channel_message_update) {\n            untypedMessage.channel_message_update.content = JSON.stringify(untypedMessage.channel_message_update.content);\n          }\n          const cid = this.generatecid();\n          this.cIds[cid] = {resolve, reject};\n          untypedMessage.cid = cid;\n          this.adapter.send(untypedMessage);\n        }\n      }\n      if (this.verbose && window && window.console) {\n        console.log(\"Sent message: %o\", untypedMessage);\n      }\n    });\n  }\n  addMatchmaker(query, minCount, maxCount, stringProperties, numericProperties) {\n    return __async(this, null, function* () {\n      const matchMakerAdd = {\n        matchmaker_add: {\n          min_count: minCount,\n          max_count: maxCount,\n          query,\n          string_properties: stringProperties,\n          numeric_properties: numericProperties\n        }\n      };\n      const response = yield this.send(matchMakerAdd);\n      return response.matchmaker_ticket;\n    });\n  }\n  createMatch() {\n    return __async(this, null, function* () {\n      const response = yield this.send({match_create: {}});\n      return response.match;\n    });\n  }\n  followUsers(userIds) {\n    return __async(this, null, function* () {\n      const response = yield this.send({status_follow: {user_ids: userIds}});\n      return response.status;\n    });\n  }\n  joinChat(target, type, persistence, hidden) {\n    return __async(this, null, function* () {\n      const response = yield this.send({\n        channel_join: {\n          target,\n          type,\n          persistence,\n          hidden\n        }\n      });\n      return response.channel;\n    });\n  }\n  joinMatch(match_id, token, metadata) {\n    return __async(this, null, function* () {\n      const join = {match_join: {metadata}};\n      if (token) {\n        join.match_join.token = token;\n      } else {\n        join.match_join.match_id = match_id;\n      }\n      const response = yield this.send(join);\n      return response.match;\n    });\n  }\n  leaveChat(channel_id) {\n    return this.send({channel_leave: {channel_id}});\n  }\n  leaveMatch(matchId) {\n    return this.send({match_leave: {match_id: matchId}});\n  }\n  removeChatMessage(channel_id, message_id) {\n    return __async(this, null, function* () {\n      const response = yield this.send({\n        channel_message_remove: {\n          channel_id,\n          message_id\n        }\n      });\n      return response.channel_message_ack;\n    });\n  }\n  removeMatchmaker(ticket) {\n    return this.send({matchmaker_remove: {ticket}});\n  }\n  rpc(id, payload, http_key) {\n    return __async(this, null, function* () {\n      const response = yield this.send({\n        rpc: {\n          id,\n          payload,\n          http_key\n        }\n      });\n      return response.rpc;\n    });\n  }\n  sendMatchState(matchId, opCode, data, presences) {\n    return __async(this, null, function* () {\n      return this.send({\n        match_data_send: {\n          match_id: matchId,\n          op_code: opCode,\n          data,\n          presences: presences != null ? presences : []\n        }\n      });\n    });\n  }\n  unfollowUsers(user_ids) {\n    return this.send({status_unfollow: {user_ids}});\n  }\n  updateChatMessage(channel_id, message_id, content) {\n    return __async(this, null, function* () {\n      const response = yield this.send({channel_message_update: {channel_id, message_id, content}});\n      return response.channel_message_ack;\n    });\n  }\n  updateStatus(status) {\n    return this.send({status_update: {status}});\n  }\n  writeChatMessage(channel_id, content) {\n    return __async(this, null, function* () {\n      const response = yield this.send({channel_message_send: {channel_id, content}});\n      return response.channel_message_ack;\n    });\n  }\n};\n\n// client.ts\nvar DEFAULT_HOST = \"127.0.0.1\";\nvar DEFAULT_PORT = \"7350\";\nvar DEFAULT_SERVER_KEY = \"defaultkey\";\nvar DEFAULT_TIMEOUT_MS = 7e3;\nvar Client = class {\n  constructor(serverkey = DEFAULT_SERVER_KEY, host = DEFAULT_HOST, port = DEFAULT_PORT, useSSL = false, timeout = DEFAULT_TIMEOUT_MS) {\n    this.serverkey = serverkey;\n    this.host = host;\n    this.port = port;\n    this.useSSL = useSSL;\n    this.timeout = timeout;\n    const scheme = useSSL ? \"https://\" : \"http://\";\n    const basePath = `${scheme}${host}:${port}`;\n    this.configuration = {\n      basePath,\n      username: serverkey,\n      password: \"\",\n      timeoutMs: timeout\n    };\n    this.apiClient = new NakamaApi(this.configuration);\n  }\n  addGroupUsers(session, groupId, ids) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.addGroupUsers(groupId, ids).then((response) => {\n      return response !== void 0;\n    });\n  }\n  addFriends(session, ids, usernames) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.addFriends(ids, usernames).then((response) => {\n      return response !== void 0;\n    });\n  }\n  authenticateApple(token, create, username, vars = new Map(), options = {}) {\n    const request = {\n      token,\n      vars\n    };\n    return this.apiClient.authenticateApple(request, create, username, options).then((apiSession) => {\n      return Session.restore(apiSession.token || \"\");\n    });\n  }\n  authenticateCustom(id, create, username, vars = new Map(), options = {}) {\n    const request = {\n      id,\n      vars\n    };\n    return this.apiClient.authenticateCustom(request, create, username, options).then((apiSession) => {\n      return Session.restore(apiSession.token || \"\");\n    });\n  }\n  authenticateDevice(id, create, username, vars) {\n    const request = {\n      id,\n      vars\n    };\n    return this.apiClient.authenticateDevice(request, create, username).then((apiSession) => {\n      return Session.restore(apiSession.token || \"\");\n    });\n  }\n  authenticateEmail(email, password, create, username, vars) {\n    const request = {\n      email,\n      password,\n      vars\n    };\n    return this.apiClient.authenticateEmail(request, create, username).then((apiSession) => {\n      return Session.restore(apiSession.token || \"\");\n    });\n  }\n  authenticateFacebookInstantGame(signedPlayerInfo, create, username, vars, options = {}) {\n    const request = {\n      signed_player_info: signedPlayerInfo,\n      vars\n    };\n    return this.apiClient.authenticateFacebookInstantGame({signed_player_info: request.signed_player_info, vars: request.vars}, create, username, options).then((apiSession) => {\n      return Session.restore(apiSession.token || \"\");\n    });\n  }\n  authenticateFacebook(token, create, username, sync, vars, options = {}) {\n    const request = {\n      token,\n      vars\n    };\n    return this.apiClient.authenticateFacebook(request, create, username, sync, options).then((apiSession) => {\n      return Session.restore(apiSession.token || \"\");\n    });\n  }\n  authenticateGoogle(token, create, username, vars, options = {}) {\n    const request = {\n      token,\n      vars\n    };\n    return this.apiClient.authenticateGoogle(request, create, username, options).then((apiSession) => {\n      return Session.restore(apiSession.token || \"\");\n    });\n  }\n  authenticateGameCenter(token, create, username, vars) {\n    const request = {\n      token,\n      vars\n    };\n    return this.apiClient.authenticateGameCenter(request, create, username).then((apiSession) => {\n      return Session.restore(apiSession.token || \"\");\n    });\n  }\n  authenticateSteam(token, create, username, vars) {\n    const request = {\n      token,\n      vars\n    };\n    return this.apiClient.authenticateSteam(request, create, username).then((apiSession) => {\n      return Session.restore(apiSession.token || \"\");\n    });\n  }\n  banGroupUsers(session, groupId, ids) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.banGroupUsers(groupId, ids).then((response) => {\n      return response !== void 0;\n    });\n  }\n  blockFriends(session, ids, usernames) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.blockFriends(ids, usernames).then((response) => {\n      return Promise.resolve(response != void 0);\n    });\n  }\n  createGroup(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.createGroup(request).then((response) => {\n      return Promise.resolve({\n        avatar_url: response.avatar_url,\n        create_time: response.create_time,\n        creator_id: response.creator_id,\n        description: response.description,\n        edge_count: response.edge_count ? Number(response.edge_count) : 0,\n        id: response.id,\n        lang_tag: response.lang_tag,\n        max_count: response.max_count ? Number(response.max_count) : 0,\n        metadata: response.metadata ? JSON.parse(response.metadata) : void 0,\n        name: response.name,\n        open: response.open,\n        update_time: response.update_time\n      });\n    });\n  }\n  createSocket(useSSL = false, verbose = false, adapter = new WebSocketAdapterText()) {\n    return new DefaultSocket(this.host, this.port, useSSL, verbose, adapter);\n  }\n  deleteFriends(session, ids, usernames) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.deleteFriends(ids, usernames).then((response) => {\n      return response !== void 0;\n    });\n  }\n  deleteGroup(session, groupId) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.deleteGroup(groupId).then((response) => {\n      return response !== void 0;\n    });\n  }\n  deleteNotifications(session, ids) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.deleteNotifications(ids).then((response) => {\n      return Promise.resolve(response != void 0);\n    });\n  }\n  deleteStorageObjects(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.deleteStorageObjects(request).then((response) => {\n      return Promise.resolve(response != void 0);\n    });\n  }\n  demoteGroupUsers(session, groupId, ids) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.demoteGroupUsers(groupId, ids);\n  }\n  emitEvent(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.event(request).then((response) => {\n      return Promise.resolve(response != void 0);\n    });\n  }\n  getAccount(session) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.getAccount();\n  }\n  importFacebookFriends(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.importFacebookFriends(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  getUsers(session, ids, usernames, facebookIds) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.getUsers(ids, usernames, facebookIds).then((response) => {\n      var result = {\n        users: []\n      };\n      if (response.users == null) {\n        return Promise.resolve(result);\n      }\n      response.users.forEach((u) => {\n        result.users.push({\n          avatar_url: u.avatar_url,\n          create_time: u.create_time,\n          display_name: u.display_name,\n          edge_count: u.edge_count ? Number(u.edge_count) : 0,\n          facebook_id: u.facebook_id,\n          gamecenter_id: u.gamecenter_id,\n          google_id: u.google_id,\n          id: u.id,\n          lang_tag: u.lang_tag,\n          location: u.location,\n          online: u.online,\n          steam_id: u.steam_id,\n          timezone: u.timezone,\n          update_time: u.update_time,\n          username: u.username,\n          metadata: u.metadata ? JSON.parse(u.metadata) : void 0\n        });\n      });\n      return Promise.resolve(result);\n    });\n  }\n  joinGroup(session, groupId) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.joinGroup(groupId, {}).then((response) => {\n      return response !== void 0;\n    });\n  }\n  joinTournament(session, tournamentId) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.joinTournament(tournamentId, {}).then((response) => {\n      return response !== void 0;\n    });\n  }\n  kickGroupUsers(session, groupId, ids) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.kickGroupUsers(groupId, ids).then((response) => {\n      return Promise.resolve(response != void 0);\n    });\n  }\n  leaveGroup(session, groupId) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.leaveGroup(groupId, {}).then((response) => {\n      return response !== void 0;\n    });\n  }\n  listChannelMessages(session, channelId, limit, forward, cursor) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listChannelMessages(channelId, limit, forward, cursor).then((response) => {\n      var result = {\n        messages: [],\n        next_cursor: response.next_cursor,\n        prev_cursor: response.prev_cursor\n      };\n      if (response.messages == null) {\n        return Promise.resolve(result);\n      }\n      response.messages.forEach((m) => {\n        result.messages.push({\n          channel_id: m.channel_id,\n          code: m.code ? Number(m.code) : 0,\n          create_time: m.create_time,\n          message_id: m.message_id,\n          persistent: m.persistent,\n          sender_id: m.sender_id,\n          update_time: m.update_time,\n          username: m.username,\n          content: m.content ? JSON.parse(m.content) : void 0,\n          group_id: m.group_id,\n          room_name: m.room_name,\n          user_id_one: m.user_id_one,\n          user_id_two: m.user_id_two\n        });\n      });\n      return Promise.resolve(result);\n    });\n  }\n  listGroupUsers(session, groupId, state, limit, cursor) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listGroupUsers(groupId, limit, state, cursor).then((response) => {\n      var result = {\n        group_users: [],\n        cursor: response.cursor\n      };\n      if (response.group_users == null) {\n        return Promise.resolve(result);\n      }\n      response.group_users.forEach((gu) => {\n        result.group_users.push({\n          user: {\n            avatar_url: gu.user.avatar_url,\n            create_time: gu.user.create_time,\n            display_name: gu.user.display_name,\n            edge_count: gu.user.edge_count ? Number(gu.user.edge_count) : 0,\n            facebook_id: gu.user.facebook_id,\n            gamecenter_id: gu.user.gamecenter_id,\n            google_id: gu.user.google_id,\n            id: gu.user.id,\n            lang_tag: gu.user.lang_tag,\n            location: gu.user.location,\n            online: gu.user.online,\n            steam_id: gu.user.steam_id,\n            timezone: gu.user.timezone,\n            update_time: gu.user.update_time,\n            username: gu.user.username,\n            metadata: gu.user.metadata ? JSON.parse(gu.user.metadata) : void 0\n          },\n          state: gu.state ? Number(gu.state) : 0\n        });\n      });\n      return Promise.resolve(result);\n    });\n  }\n  listUserGroups(session, userId, state, limit, cursor) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listUserGroups(userId, state, limit, cursor).then((response) => {\n      var result = {\n        user_groups: [],\n        cursor: response.cursor\n      };\n      if (response.user_groups == null) {\n        return Promise.resolve(result);\n      }\n      response.user_groups.forEach((ug) => {\n        result.user_groups.push({\n          group: {\n            avatar_url: ug.group.avatar_url,\n            create_time: ug.group.create_time,\n            creator_id: ug.group.creator_id,\n            description: ug.group.description,\n            edge_count: ug.group.edge_count ? Number(ug.group.edge_count) : 0,\n            id: ug.group.id,\n            lang_tag: ug.group.lang_tag,\n            max_count: ug.group.max_count,\n            metadata: ug.group.metadata ? JSON.parse(ug.group.metadata) : void 0,\n            name: ug.group.name,\n            open: ug.group.open,\n            update_time: ug.group.update_time\n          },\n          state: ug.state ? Number(ug.state) : 0\n        });\n      });\n      return Promise.resolve(result);\n    });\n  }\n  listGroups(session, name, cursor, limit) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listGroups(name, cursor, limit).then((response) => {\n      var result = {\n        groups: []\n      };\n      if (response.groups == null) {\n        return Promise.resolve(result);\n      }\n      result.cursor = response.cursor;\n      response.groups.forEach((ug) => {\n        result.groups.push({\n          avatar_url: ug.avatar_url,\n          create_time: ug.create_time,\n          creator_id: ug.creator_id,\n          description: ug.description,\n          edge_count: ug.edge_count ? Number(ug.edge_count) : 0,\n          id: ug.id,\n          lang_tag: ug.lang_tag,\n          max_count: ug.max_count,\n          metadata: ug.metadata ? JSON.parse(ug.metadata) : void 0,\n          name: ug.name,\n          open: ug.open,\n          update_time: ug.update_time\n        });\n      });\n      return Promise.resolve(result);\n    });\n  }\n  linkApple(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.linkApple(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  linkCustom(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.linkCustom(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  linkDevice(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.linkDevice(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  linkEmail(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.linkEmail(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  linkFacebook(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.linkFacebook(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  linkFacebookInstantGame(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.linkFacebookInstantGame(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  linkGoogle(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.linkGoogle(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  linkGameCenter(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.linkGameCenter(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  linkSteam(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.linkSteam(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  listFriends(session, state, limit, cursor) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listFriends(limit, state, cursor).then((response) => {\n      var result = {\n        friends: [],\n        cursor: response.cursor\n      };\n      if (response.friends == null) {\n        return Promise.resolve(result);\n      }\n      response.friends.forEach((f) => {\n        result.friends.push({\n          user: {\n            avatar_url: f.user.avatar_url,\n            create_time: f.user.create_time,\n            display_name: f.user.display_name,\n            edge_count: f.user.edge_count ? Number(f.user.edge_count) : 0,\n            facebook_id: f.user.facebook_id,\n            gamecenter_id: f.user.gamecenter_id,\n            google_id: f.user.google_id,\n            id: f.user.id,\n            lang_tag: f.user.lang_tag,\n            location: f.user.location,\n            online: f.user.online,\n            steam_id: f.user.steam_id,\n            timezone: f.user.timezone,\n            update_time: f.user.update_time,\n            username: f.user.username,\n            metadata: f.user.metadata ? JSON.parse(f.user.metadata) : void 0,\n            facebook_instant_game_id: f.user.facebook_instant_game_id\n          },\n          state: f.state\n        });\n      });\n      return Promise.resolve(result);\n    });\n  }\n  listLeaderboardRecords(session, leaderboardId, ownerIds, limit, cursor, expiry) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listLeaderboardRecords(leaderboardId, ownerIds, limit, cursor, expiry).then((response) => {\n      var list = {\n        next_cursor: response.next_cursor,\n        prev_cursor: response.prev_cursor,\n        owner_records: [],\n        records: []\n      };\n      if (response.owner_records != null) {\n        response.owner_records.forEach((o) => {\n          list.owner_records.push({\n            expiry_time: o.expiry_time,\n            leaderboard_id: o.leaderboard_id,\n            metadata: o.metadata ? JSON.parse(o.metadata) : void 0,\n            num_score: o.num_score ? Number(o.num_score) : 0,\n            owner_id: o.owner_id,\n            rank: o.rank ? Number(o.rank) : 0,\n            score: o.score ? Number(o.score) : 0,\n            subscore: o.subscore ? Number(o.subscore) : 0,\n            update_time: o.update_time,\n            username: o.username,\n            max_num_score: o.max_num_score ? Number(o.max_num_score) : 0\n          });\n        });\n      }\n      if (response.records != null) {\n        response.records.forEach((o) => {\n          list.records.push({\n            expiry_time: o.expiry_time,\n            leaderboard_id: o.leaderboard_id,\n            metadata: o.metadata ? JSON.parse(o.metadata) : void 0,\n            num_score: o.num_score ? Number(o.num_score) : 0,\n            owner_id: o.owner_id,\n            rank: o.rank ? Number(o.rank) : 0,\n            score: o.score ? Number(o.score) : 0,\n            subscore: o.subscore ? Number(o.subscore) : 0,\n            update_time: o.update_time,\n            username: o.username,\n            max_num_score: o.max_num_score ? Number(o.max_num_score) : 0\n          });\n        });\n      }\n      return Promise.resolve(list);\n    });\n  }\n  listLeaderboardRecordsAroundOwner(session, leaderboardId, ownerId, limit, expiry) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listLeaderboardRecordsAroundOwner(leaderboardId, ownerId, limit, expiry).then((response) => {\n      var list = {\n        next_cursor: response.next_cursor,\n        prev_cursor: response.prev_cursor,\n        owner_records: [],\n        records: []\n      };\n      if (response.owner_records != null) {\n        response.owner_records.forEach((o) => {\n          list.owner_records.push({\n            expiry_time: o.expiry_time,\n            leaderboard_id: o.leaderboard_id,\n            metadata: o.metadata ? JSON.parse(o.metadata) : void 0,\n            num_score: o.num_score ? Number(o.num_score) : 0,\n            owner_id: o.owner_id,\n            rank: o.rank ? Number(o.rank) : 0,\n            score: o.score ? Number(o.score) : 0,\n            subscore: o.subscore ? Number(o.subscore) : 0,\n            update_time: o.update_time,\n            username: o.username,\n            max_num_score: o.max_num_score ? Number(o.max_num_score) : 0\n          });\n        });\n      }\n      if (response.records != null) {\n        response.records.forEach((o) => {\n          list.records.push({\n            expiry_time: o.expiry_time,\n            leaderboard_id: o.leaderboard_id,\n            metadata: o.metadata ? JSON.parse(o.metadata) : void 0,\n            num_score: o.num_score ? Number(o.num_score) : 0,\n            owner_id: o.owner_id,\n            rank: o.rank ? Number(o.rank) : 0,\n            score: o.score ? Number(o.score) : 0,\n            subscore: o.subscore ? Number(o.subscore) : 0,\n            update_time: o.update_time,\n            username: o.username,\n            max_num_score: o.max_num_score ? Number(o.max_num_score) : 0\n          });\n        });\n      }\n      return Promise.resolve(list);\n    });\n  }\n  listMatches(session, limit, authoritative, label, minSize, maxSize, query) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listMatches(limit, authoritative, label, minSize, maxSize, query);\n  }\n  listNotifications(session, limit, cacheableCursor) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listNotifications(limit, cacheableCursor).then((response) => {\n      var result = {\n        cacheable_cursor: response.cacheable_cursor,\n        notifications: []\n      };\n      if (response.notifications == null) {\n        return Promise.resolve(result);\n      }\n      response.notifications.forEach((n) => {\n        result.notifications.push({\n          code: n.code ? Number(n.code) : 0,\n          create_time: n.create_time,\n          id: n.id,\n          persistent: n.persistent,\n          sender_id: n.sender_id,\n          subject: n.subject,\n          content: n.content ? JSON.parse(n.content) : void 0\n        });\n      });\n      return Promise.resolve(result);\n    });\n  }\n  listStorageObjects(session, collection, userId, limit, cursor) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listStorageObjects(collection, userId, limit, cursor).then((response) => {\n      var result = {\n        objects: [],\n        cursor: response.cursor\n      };\n      if (response.objects == null) {\n        return Promise.resolve(result);\n      }\n      response.objects.forEach((o) => {\n        result.objects.push({\n          collection: o.collection,\n          key: o.key,\n          permission_read: o.permission_read ? Number(o.permission_read) : 0,\n          permission_write: o.permission_write ? Number(o.permission_write) : 0,\n          value: o.value ? JSON.parse(o.value) : void 0,\n          version: o.version,\n          user_id: o.user_id,\n          create_time: o.create_time,\n          update_time: o.update_time\n        });\n      });\n      return Promise.resolve(result);\n    });\n  }\n  listTournaments(session, categoryStart, categoryEnd, startTime, endTime, limit, cursor) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listTournaments(categoryStart, categoryEnd, startTime, endTime, limit, cursor).then((response) => {\n      var list = {\n        cursor: response.cursor,\n        tournaments: []\n      };\n      if (response.tournaments != null) {\n        response.tournaments.forEach((o) => {\n          list.tournaments.push({\n            id: o.id,\n            title: o.title,\n            description: o.description,\n            duration: o.duration ? Number(o.duration) : 0,\n            category: o.category ? Number(o.category) : 0,\n            sort_order: o.sort_order ? Number(o.sort_order) : 0,\n            size: o.size ? Number(o.size) : 0,\n            max_size: o.max_size ? Number(o.max_size) : 0,\n            max_num_score: o.max_num_score ? Number(o.max_num_score) : 0,\n            can_enter: o.can_enter,\n            end_active: o.end_active ? Number(o.end_active) : 0,\n            next_reset: o.next_reset ? Number(o.next_reset) : 0,\n            metadata: o.metadata ? JSON.parse(o.metadata) : void 0,\n            create_time: o.create_time,\n            start_time: o.start_time,\n            end_time: o.end_time,\n            start_active: o.start_active\n          });\n        });\n      }\n      return Promise.resolve(list);\n    });\n  }\n  listTournamentRecords(session, tournamentId, ownerIds, limit, cursor, expiry) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listTournamentRecords(tournamentId, ownerIds, limit, cursor, expiry).then((response) => {\n      var list = {\n        next_cursor: response.next_cursor,\n        prev_cursor: response.prev_cursor,\n        owner_records: [],\n        records: []\n      };\n      if (response.owner_records != null) {\n        response.owner_records.forEach((o) => {\n          list.owner_records.push({\n            expiry_time: o.expiry_time,\n            leaderboard_id: o.leaderboard_id,\n            metadata: o.metadata ? JSON.parse(o.metadata) : void 0,\n            num_score: o.num_score ? Number(o.num_score) : 0,\n            owner_id: o.owner_id,\n            rank: o.rank ? Number(o.rank) : 0,\n            score: o.score ? Number(o.score) : 0,\n            subscore: o.subscore ? Number(o.subscore) : 0,\n            update_time: o.update_time,\n            username: o.username,\n            max_num_score: o.max_num_score ? Number(o.max_num_score) : 0\n          });\n        });\n      }\n      if (response.records != null) {\n        response.records.forEach((o) => {\n          list.records.push({\n            expiry_time: o.expiry_time,\n            leaderboard_id: o.leaderboard_id,\n            metadata: o.metadata ? JSON.parse(o.metadata) : void 0,\n            num_score: o.num_score ? Number(o.num_score) : 0,\n            owner_id: o.owner_id,\n            rank: o.rank ? Number(o.rank) : 0,\n            score: o.score ? Number(o.score) : 0,\n            subscore: o.subscore ? Number(o.subscore) : 0,\n            update_time: o.update_time,\n            username: o.username,\n            max_num_score: o.max_num_score ? Number(o.max_num_score) : 0\n          });\n        });\n      }\n      return Promise.resolve(list);\n    });\n  }\n  listTournamentRecordsAroundOwner(session, tournamentId, ownerId, limit, expiry) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.listTournamentRecordsAroundOwner(tournamentId, ownerId, limit, expiry).then((response) => {\n      var list = {\n        next_cursor: response.next_cursor,\n        prev_cursor: response.prev_cursor,\n        owner_records: [],\n        records: []\n      };\n      if (response.owner_records != null) {\n        response.owner_records.forEach((o) => {\n          list.owner_records.push({\n            expiry_time: o.expiry_time,\n            leaderboard_id: o.leaderboard_id,\n            metadata: o.metadata ? JSON.parse(o.metadata) : void 0,\n            num_score: o.num_score ? Number(o.num_score) : 0,\n            owner_id: o.owner_id,\n            rank: o.rank ? Number(o.rank) : 0,\n            score: o.score ? Number(o.score) : 0,\n            subscore: o.subscore ? Number(o.subscore) : 0,\n            update_time: o.update_time,\n            username: o.username,\n            max_num_score: o.max_num_score ? Number(o.max_num_score) : 0\n          });\n        });\n      }\n      if (response.records != null) {\n        response.records.forEach((o) => {\n          list.records.push({\n            expiry_time: o.expiry_time,\n            leaderboard_id: o.leaderboard_id,\n            metadata: o.metadata ? JSON.parse(o.metadata) : void 0,\n            num_score: o.num_score ? Number(o.num_score) : 0,\n            owner_id: o.owner_id,\n            rank: o.rank ? Number(o.rank) : 0,\n            score: o.score ? Number(o.score) : 0,\n            subscore: o.subscore ? Number(o.subscore) : 0,\n            update_time: o.update_time,\n            username: o.username,\n            max_num_score: o.max_num_score ? Number(o.max_num_score) : 0\n          });\n        });\n      }\n      return Promise.resolve(list);\n    });\n  }\n  promoteGroupUsers(session, groupId, ids) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.promoteGroupUsers(groupId, ids);\n  }\n  readStorageObjects(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.readStorageObjects(request).then((response) => {\n      var result = {objects: []};\n      if (response.objects == null) {\n        return Promise.resolve(result);\n      }\n      response.objects.forEach((o) => {\n        result.objects.push({\n          collection: o.collection,\n          key: o.key,\n          permission_read: o.permission_read ? Number(o.permission_read) : 0,\n          permission_write: o.permission_write ? Number(o.permission_write) : 0,\n          value: o.value ? JSON.parse(o.value) : void 0,\n          version: o.version,\n          user_id: o.user_id,\n          create_time: o.create_time,\n          update_time: o.update_time\n        });\n      });\n      return Promise.resolve(result);\n    });\n  }\n  rpc(session, id, input) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.rpcFunc(id, JSON.stringify(input)).then((response) => {\n      return Promise.resolve({\n        id: response.id,\n        payload: !response.payload ? void 0 : JSON.parse(response.payload)\n      });\n    });\n  }\n  rpcGet(id, session, httpKey, input) {\n    if (!httpKey || httpKey == \"\") {\n      this.configuration.bearerToken = session && session.token;\n    } else {\n      this.configuration.username = void 0;\n      this.configuration.bearerToken = void 0;\n    }\n    return this.apiClient.rpcFunc2(id, input && JSON.stringify(input) || \"\", httpKey).then((response) => {\n      this.configuration.username = this.serverkey;\n      return Promise.resolve({\n        id: response.id,\n        payload: !response.payload ? void 0 : JSON.parse(response.payload)\n      });\n    }).catch((err) => {\n      this.configuration.username = this.serverkey;\n      throw err;\n    });\n  }\n  unlinkApple(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.unlinkApple(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  unlinkCustom(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.unlinkCustom(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  unlinkDevice(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.unlinkDevice(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  unlinkEmail(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.unlinkEmail(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  unlinkFacebook(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.unlinkFacebook(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  unlinkFacebookInstantGame(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.unlinkFacebookInstantGame(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  unlinkGoogle(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.unlinkGoogle(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  unlinkGameCenter(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.unlinkGameCenter(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  unlinkSteam(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.unlinkSteam(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  updateAccount(session, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.updateAccount(request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  updateGroup(session, groupId, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.updateGroup(groupId, request).then((response) => {\n      return response !== void 0;\n    });\n  }\n  writeLeaderboardRecord(session, leaderboardId, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.writeLeaderboardRecord(leaderboardId, {\n      metadata: request.metadata ? JSON.stringify(request.metadata) : void 0,\n      score: request.score,\n      subscore: request.subscore\n    }).then((response) => {\n      return Promise.resolve({\n        expiry_time: response.expiry_time,\n        leaderboard_id: response.leaderboard_id,\n        metadata: response.metadata ? JSON.parse(response.metadata) : void 0,\n        num_score: response.num_score ? Number(response.num_score) : 0,\n        owner_id: response.owner_id,\n        score: response.score ? Number(response.score) : 0,\n        subscore: response.subscore ? Number(response.subscore) : 0,\n        update_time: response.update_time,\n        username: response.username,\n        max_num_score: response.max_num_score ? Number(response.max_num_score) : 0,\n        rank: response.rank ? Number(response.rank) : 0\n      });\n    });\n  }\n  writeStorageObjects(session, objects) {\n    this.configuration.bearerToken = session && session.token;\n    var request = {objects: []};\n    objects.forEach((o) => {\n      request.objects.push({\n        collection: o.collection,\n        key: o.key,\n        permission_read: o.permission_read,\n        permission_write: o.permission_write,\n        value: JSON.stringify(o.value),\n        version: o.version\n      });\n    });\n    return this.apiClient.writeStorageObjects(request);\n  }\n  writeTournamentRecord(session, tournamentId, request) {\n    this.configuration.bearerToken = session && session.token;\n    return this.apiClient.writeTournamentRecord(tournamentId, {\n      metadata: request.metadata ? JSON.stringify(request.metadata) : void 0,\n      score: request.score,\n      subscore: request.subscore\n    }).then((response) => {\n      return Promise.resolve({\n        expiry_time: response.expiry_time,\n        leaderboard_id: response.leaderboard_id,\n        metadata: response.metadata ? JSON.parse(response.metadata) : void 0,\n        num_score: response.num_score ? Number(response.num_score) : 0,\n        owner_id: response.owner_id,\n        score: response.score ? Number(response.score) : 0,\n        subscore: response.subscore ? Number(response.subscore) : 0,\n        update_time: response.update_time,\n        username: response.username,\n        max_num_score: response.max_num_score ? Number(response.max_num_score) : 0,\n        rank: response.rank ? Number(response.rank) : 0\n      });\n    });\n  }\n};\n\n\n\n//# sourceURL=webpack://Nakama/./node_modules/@heroiclabs/nakama-js/dist/nakama-js.esm.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("var NakamaWrapper = __webpack_require__(/*! ./nakama */ \"./src/nakama.js\").default;\n\nvar Nakama = new NakamaWrapper(\"104.198.111.154\", \"7350\", [\n  false\n][0]);\nNakama.initiate();\nmodule.exports = Nakama;\n\n//# sourceURL=webpack://Nakama/./src/index.js?");

/***/ }),

/***/ "./src/logger.js":
/*!***********************!*\
  !*** ./src/logger.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ _default)\n/* harmony export */ });\n/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\");\n/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/createClass */ \"./node_modules/@babel/runtime/helpers/createClass.js\");\n/* harmony import */ var _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__);\n\n\n\nvar _default = /*#__PURE__*/function () {\n  function _default() {\n    _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default()(this, _default);\n  }\n\n  _babel_runtime_helpers_createClass__WEBPACK_IMPORTED_MODULE_1___default()(_default, null, [{\n    key: \"log\",\n    value: function log(msg) {\n      var emoji = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';\n      var colour = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'black';\n\n      if ([\n        true\n      ][0]) {\n        console.log(\"%s %c\".concat(msg), emoji, \"color: \".concat(colour));\n      }\n    }\n  }, {\n    key: \"success\",\n    value: function success(msg) {\n      if ([\n        true\n      ][0]) {\n        console.log(\"%s \".concat(msg), '✔️');\n      }\n    }\n  }, {\n    key: \"warn\",\n    value: function warn(msg) {\n      if ([\n        true\n      ][0]) {\n        console.log(\"%s \".concat(msg), '⚠️');\n      }\n    }\n  }]);\n\n  return _default;\n}();\n\n\n\n//# sourceURL=webpack://Nakama/./src/logger.js?");

/***/ }),

/***/ "./src/nakama.js":
/*!***********************!*\
  !*** ./src/nakama.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Nakama)\n/* harmony export */ });\n/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime/regenerator */ \"./node_modules/@babel/runtime/regenerator/index.js\");\n/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime/helpers/asyncToGenerator */ \"./node_modules/@babel/runtime/helpers/asyncToGenerator.js\");\n/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime/helpers/classCallCheck */ \"./node_modules/@babel/runtime/helpers/classCallCheck.js\");\n/* harmony import */ var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime/helpers/defineProperty */ \"./node_modules/@babel/runtime/helpers/defineProperty.js\");\n/* harmony import */ var _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _heroiclabs_nakama_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @heroiclabs/nakama-js */ \"./node_modules/@heroiclabs/nakama-js/dist/nakama-js.esm.js\");\n/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! uuid */ \"./node_modules/uuid/dist/esm-browser/v4.js\");\n/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./logger */ \"./src/logger.js\");\n\n\n\n\n\n\n\n\nvar Nakama = function Nakama(clientHost, clientPort, useSSL) {\n  var _this = this;\n\n  _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_2___default()(this, Nakama);\n\n  _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_3___default()(this, \"initiate\", /*#__PURE__*/_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default()( /*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().mark(function _callee() {\n    return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().wrap(function _callee$(_context) {\n      while (1) {\n        switch (_context.prev = _context.next) {\n          case 0:\n            _context.next = 2;\n            return _this.checkSessionAndAuthenticate();\n\n          case 2:\n            _context.next = 4;\n            return _this.establishSocketConnection();\n\n          case 4:\n            _logger__WEBPACK_IMPORTED_MODULE_5__.default.log(\"ct.nakama has loaded!\", \"✨\");\n\n          case 5:\n          case \"end\":\n            return _context.stop();\n        }\n      }\n    }, _callee);\n  })));\n\n  _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_3___default()(this, \"checkSessionAndAuthenticate\", /*#__PURE__*/_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default()( /*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().mark(function _callee2() {\n    var nakamaAuthToken, session, currentTimeInSec;\n    return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().wrap(function _callee2$(_context2) {\n      while (1) {\n        switch (_context2.prev = _context2.next) {\n          case 0:\n            // Checks browser for session and authenticates with server\n            nakamaAuthToken = localStorage.getItem(\"nakamaAuthToken\");\n\n            if (!(nakamaAuthToken && nakamaAuthToken != \"\")) {\n              _context2.next = 15;\n              break;\n            }\n\n            _logger__WEBPACK_IMPORTED_MODULE_5__.default.log(\"Session Found\");\n            session = _heroiclabs_nakama_js__WEBPACK_IMPORTED_MODULE_4__.Session.restore(nakamaAuthToken);\n            currentTimeInSec = new Date() / 1000;\n\n            if (session.isexpired(currentTimeInSec)) {\n              _context2.next = 10;\n              break;\n            }\n\n            // Session valid so restore it\n            _this.session = session;\n            _logger__WEBPACK_IMPORTED_MODULE_5__.default.log(\"Session Restored\");\n            _context2.next = 13;\n            break;\n\n          case 10:\n            _logger__WEBPACK_IMPORTED_MODULE_5__.default.log(\"Session Expired\");\n            _context2.next = 13;\n            return _this.createSession();\n\n          case 13:\n            _context2.next = 17;\n            break;\n\n          case 15:\n            _context2.next = 17;\n            return _this.createSession();\n\n          case 17:\n            _logger__WEBPACK_IMPORTED_MODULE_5__.default.success(\"Authenticated Session\");\n\n          case 18:\n          case \"end\":\n            return _context2.stop();\n        }\n      }\n    }, _callee2);\n  })));\n\n  _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_3___default()(this, \"establishSocketConnection\", /*#__PURE__*/_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default()( /*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().mark(function _callee3() {\n    var trace;\n    return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().wrap(function _callee3$(_context3) {\n      while (1) {\n        switch (_context3.prev = _context3.next) {\n          case 0:\n            // Create connection to the server via websockets\n            trace = false; // TODO: understand what this does\n\n            _this.socket = _this.client.createSocket(_this.useSSL, trace);\n            _context3.next = 4;\n            return _this.socket.connect(_this.session);\n\n          case 4:\n            _logger__WEBPACK_IMPORTED_MODULE_5__.default.success(\"Established Websocket Connection\");\n\n          case 5:\n          case \"end\":\n            return _context3.stop();\n        }\n      }\n    }, _callee3);\n  })));\n\n  _babel_runtime_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_3___default()(this, \"createSession\", /*#__PURE__*/_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default()( /*#__PURE__*/_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().mark(function _callee4() {\n    var newUserId, nakamaSession;\n    return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default().wrap(function _callee4$(_context4) {\n      while (1) {\n        switch (_context4.prev = _context4.next) {\n          case 0:\n            _logger__WEBPACK_IMPORTED_MODULE_5__.default.log(\"Creating New Session\");\n            newUserId = (0,uuid__WEBPACK_IMPORTED_MODULE_6__.default)();\n            _context4.next = 4;\n            return _this.client.authenticateCustom(newUserId, true, newUserId);\n\n          case 4:\n            nakamaSession = _context4.sent;\n            localStorage.setItem(\"nakamaAuthToken\", nakamaSession.token);\n            _this.session = nakamaSession;\n            return _context4.abrupt(\"return\", _this.session);\n\n          case 8:\n          case \"end\":\n            return _context4.stop();\n        }\n      }\n    }, _callee4);\n  })));\n\n  this.useSSL = useSSL;\n  this.client = new _heroiclabs_nakama_js__WEBPACK_IMPORTED_MODULE_4__.Client(\"defaultkey\", clientHost, clientPort, this.useSSL);\n  this.session;\n  this.socket;\n  this.state = {};\n};\n\n\n\n//# sourceURL=webpack://Nakama/./src/nakama.js?");

/***/ }),

/***/ "./node_modules/regenerator-runtime/runtime.js":
/*!*****************************************************!*\
  !*** ./node_modules/regenerator-runtime/runtime.js ***!
  \*****************************************************/
/***/ ((module) => {

eval("/**\n * Copyright (c) 2014-present, Facebook, Inc.\n *\n * This source code is licensed under the MIT license found in the\n * LICENSE file in the root directory of this source tree.\n */\n\nvar runtime = (function (exports) {\n  \"use strict\";\n\n  var Op = Object.prototype;\n  var hasOwn = Op.hasOwnProperty;\n  var undefined; // More compressible than void 0.\n  var $Symbol = typeof Symbol === \"function\" ? Symbol : {};\n  var iteratorSymbol = $Symbol.iterator || \"@@iterator\";\n  var asyncIteratorSymbol = $Symbol.asyncIterator || \"@@asyncIterator\";\n  var toStringTagSymbol = $Symbol.toStringTag || \"@@toStringTag\";\n\n  function define(obj, key, value) {\n    Object.defineProperty(obj, key, {\n      value: value,\n      enumerable: true,\n      configurable: true,\n      writable: true\n    });\n    return obj[key];\n  }\n  try {\n    // IE 8 has a broken Object.defineProperty that only works on DOM objects.\n    define({}, \"\");\n  } catch (err) {\n    define = function(obj, key, value) {\n      return obj[key] = value;\n    };\n  }\n\n  function wrap(innerFn, outerFn, self, tryLocsList) {\n    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.\n    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;\n    var generator = Object.create(protoGenerator.prototype);\n    var context = new Context(tryLocsList || []);\n\n    // The ._invoke method unifies the implementations of the .next,\n    // .throw, and .return methods.\n    generator._invoke = makeInvokeMethod(innerFn, self, context);\n\n    return generator;\n  }\n  exports.wrap = wrap;\n\n  // Try/catch helper to minimize deoptimizations. Returns a completion\n  // record like context.tryEntries[i].completion. This interface could\n  // have been (and was previously) designed to take a closure to be\n  // invoked without arguments, but in all the cases we care about we\n  // already have an existing method we want to call, so there's no need\n  // to create a new function object. We can even get away with assuming\n  // the method takes exactly one argument, since that happens to be true\n  // in every case, so we don't have to touch the arguments object. The\n  // only additional allocation required is the completion record, which\n  // has a stable shape and so hopefully should be cheap to allocate.\n  function tryCatch(fn, obj, arg) {\n    try {\n      return { type: \"normal\", arg: fn.call(obj, arg) };\n    } catch (err) {\n      return { type: \"throw\", arg: err };\n    }\n  }\n\n  var GenStateSuspendedStart = \"suspendedStart\";\n  var GenStateSuspendedYield = \"suspendedYield\";\n  var GenStateExecuting = \"executing\";\n  var GenStateCompleted = \"completed\";\n\n  // Returning this object from the innerFn has the same effect as\n  // breaking out of the dispatch switch statement.\n  var ContinueSentinel = {};\n\n  // Dummy constructor functions that we use as the .constructor and\n  // .constructor.prototype properties for functions that return Generator\n  // objects. For full spec compliance, you may wish to configure your\n  // minifier not to mangle the names of these two functions.\n  function Generator() {}\n  function GeneratorFunction() {}\n  function GeneratorFunctionPrototype() {}\n\n  // This is a polyfill for %IteratorPrototype% for environments that\n  // don't natively support it.\n  var IteratorPrototype = {};\n  IteratorPrototype[iteratorSymbol] = function () {\n    return this;\n  };\n\n  var getProto = Object.getPrototypeOf;\n  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));\n  if (NativeIteratorPrototype &&\n      NativeIteratorPrototype !== Op &&\n      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {\n    // This environment has a native %IteratorPrototype%; use it instead\n    // of the polyfill.\n    IteratorPrototype = NativeIteratorPrototype;\n  }\n\n  var Gp = GeneratorFunctionPrototype.prototype =\n    Generator.prototype = Object.create(IteratorPrototype);\n  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;\n  GeneratorFunctionPrototype.constructor = GeneratorFunction;\n  GeneratorFunction.displayName = define(\n    GeneratorFunctionPrototype,\n    toStringTagSymbol,\n    \"GeneratorFunction\"\n  );\n\n  // Helper for defining the .next, .throw, and .return methods of the\n  // Iterator interface in terms of a single ._invoke method.\n  function defineIteratorMethods(prototype) {\n    [\"next\", \"throw\", \"return\"].forEach(function(method) {\n      define(prototype, method, function(arg) {\n        return this._invoke(method, arg);\n      });\n    });\n  }\n\n  exports.isGeneratorFunction = function(genFun) {\n    var ctor = typeof genFun === \"function\" && genFun.constructor;\n    return ctor\n      ? ctor === GeneratorFunction ||\n        // For the native GeneratorFunction constructor, the best we can\n        // do is to check its .name property.\n        (ctor.displayName || ctor.name) === \"GeneratorFunction\"\n      : false;\n  };\n\n  exports.mark = function(genFun) {\n    if (Object.setPrototypeOf) {\n      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);\n    } else {\n      genFun.__proto__ = GeneratorFunctionPrototype;\n      define(genFun, toStringTagSymbol, \"GeneratorFunction\");\n    }\n    genFun.prototype = Object.create(Gp);\n    return genFun;\n  };\n\n  // Within the body of any async function, `await x` is transformed to\n  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test\n  // `hasOwn.call(value, \"__await\")` to determine if the yielded value is\n  // meant to be awaited.\n  exports.awrap = function(arg) {\n    return { __await: arg };\n  };\n\n  function AsyncIterator(generator, PromiseImpl) {\n    function invoke(method, arg, resolve, reject) {\n      var record = tryCatch(generator[method], generator, arg);\n      if (record.type === \"throw\") {\n        reject(record.arg);\n      } else {\n        var result = record.arg;\n        var value = result.value;\n        if (value &&\n            typeof value === \"object\" &&\n            hasOwn.call(value, \"__await\")) {\n          return PromiseImpl.resolve(value.__await).then(function(value) {\n            invoke(\"next\", value, resolve, reject);\n          }, function(err) {\n            invoke(\"throw\", err, resolve, reject);\n          });\n        }\n\n        return PromiseImpl.resolve(value).then(function(unwrapped) {\n          // When a yielded Promise is resolved, its final value becomes\n          // the .value of the Promise<{value,done}> result for the\n          // current iteration.\n          result.value = unwrapped;\n          resolve(result);\n        }, function(error) {\n          // If a rejected Promise was yielded, throw the rejection back\n          // into the async generator function so it can be handled there.\n          return invoke(\"throw\", error, resolve, reject);\n        });\n      }\n    }\n\n    var previousPromise;\n\n    function enqueue(method, arg) {\n      function callInvokeWithMethodAndArg() {\n        return new PromiseImpl(function(resolve, reject) {\n          invoke(method, arg, resolve, reject);\n        });\n      }\n\n      return previousPromise =\n        // If enqueue has been called before, then we want to wait until\n        // all previous Promises have been resolved before calling invoke,\n        // so that results are always delivered in the correct order. If\n        // enqueue has not been called before, then it is important to\n        // call invoke immediately, without waiting on a callback to fire,\n        // so that the async generator function has the opportunity to do\n        // any necessary setup in a predictable way. This predictability\n        // is why the Promise constructor synchronously invokes its\n        // executor callback, and why async functions synchronously\n        // execute code before the first await. Since we implement simple\n        // async functions in terms of async generators, it is especially\n        // important to get this right, even though it requires care.\n        previousPromise ? previousPromise.then(\n          callInvokeWithMethodAndArg,\n          // Avoid propagating failures to Promises returned by later\n          // invocations of the iterator.\n          callInvokeWithMethodAndArg\n        ) : callInvokeWithMethodAndArg();\n    }\n\n    // Define the unified helper method that is used to implement .next,\n    // .throw, and .return (see defineIteratorMethods).\n    this._invoke = enqueue;\n  }\n\n  defineIteratorMethods(AsyncIterator.prototype);\n  AsyncIterator.prototype[asyncIteratorSymbol] = function () {\n    return this;\n  };\n  exports.AsyncIterator = AsyncIterator;\n\n  // Note that simple async functions are implemented on top of\n  // AsyncIterator objects; they just return a Promise for the value of\n  // the final result produced by the iterator.\n  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {\n    if (PromiseImpl === void 0) PromiseImpl = Promise;\n\n    var iter = new AsyncIterator(\n      wrap(innerFn, outerFn, self, tryLocsList),\n      PromiseImpl\n    );\n\n    return exports.isGeneratorFunction(outerFn)\n      ? iter // If outerFn is a generator, return the full iterator.\n      : iter.next().then(function(result) {\n          return result.done ? result.value : iter.next();\n        });\n  };\n\n  function makeInvokeMethod(innerFn, self, context) {\n    var state = GenStateSuspendedStart;\n\n    return function invoke(method, arg) {\n      if (state === GenStateExecuting) {\n        throw new Error(\"Generator is already running\");\n      }\n\n      if (state === GenStateCompleted) {\n        if (method === \"throw\") {\n          throw arg;\n        }\n\n        // Be forgiving, per 25.3.3.3.3 of the spec:\n        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume\n        return doneResult();\n      }\n\n      context.method = method;\n      context.arg = arg;\n\n      while (true) {\n        var delegate = context.delegate;\n        if (delegate) {\n          var delegateResult = maybeInvokeDelegate(delegate, context);\n          if (delegateResult) {\n            if (delegateResult === ContinueSentinel) continue;\n            return delegateResult;\n          }\n        }\n\n        if (context.method === \"next\") {\n          // Setting context._sent for legacy support of Babel's\n          // function.sent implementation.\n          context.sent = context._sent = context.arg;\n\n        } else if (context.method === \"throw\") {\n          if (state === GenStateSuspendedStart) {\n            state = GenStateCompleted;\n            throw context.arg;\n          }\n\n          context.dispatchException(context.arg);\n\n        } else if (context.method === \"return\") {\n          context.abrupt(\"return\", context.arg);\n        }\n\n        state = GenStateExecuting;\n\n        var record = tryCatch(innerFn, self, context);\n        if (record.type === \"normal\") {\n          // If an exception is thrown from innerFn, we leave state ===\n          // GenStateExecuting and loop back for another invocation.\n          state = context.done\n            ? GenStateCompleted\n            : GenStateSuspendedYield;\n\n          if (record.arg === ContinueSentinel) {\n            continue;\n          }\n\n          return {\n            value: record.arg,\n            done: context.done\n          };\n\n        } else if (record.type === \"throw\") {\n          state = GenStateCompleted;\n          // Dispatch the exception by looping back around to the\n          // context.dispatchException(context.arg) call above.\n          context.method = \"throw\";\n          context.arg = record.arg;\n        }\n      }\n    };\n  }\n\n  // Call delegate.iterator[context.method](context.arg) and handle the\n  // result, either by returning a { value, done } result from the\n  // delegate iterator, or by modifying context.method and context.arg,\n  // setting context.delegate to null, and returning the ContinueSentinel.\n  function maybeInvokeDelegate(delegate, context) {\n    var method = delegate.iterator[context.method];\n    if (method === undefined) {\n      // A .throw or .return when the delegate iterator has no .throw\n      // method always terminates the yield* loop.\n      context.delegate = null;\n\n      if (context.method === \"throw\") {\n        // Note: [\"return\"] must be used for ES3 parsing compatibility.\n        if (delegate.iterator[\"return\"]) {\n          // If the delegate iterator has a return method, give it a\n          // chance to clean up.\n          context.method = \"return\";\n          context.arg = undefined;\n          maybeInvokeDelegate(delegate, context);\n\n          if (context.method === \"throw\") {\n            // If maybeInvokeDelegate(context) changed context.method from\n            // \"return\" to \"throw\", let that override the TypeError below.\n            return ContinueSentinel;\n          }\n        }\n\n        context.method = \"throw\";\n        context.arg = new TypeError(\n          \"The iterator does not provide a 'throw' method\");\n      }\n\n      return ContinueSentinel;\n    }\n\n    var record = tryCatch(method, delegate.iterator, context.arg);\n\n    if (record.type === \"throw\") {\n      context.method = \"throw\";\n      context.arg = record.arg;\n      context.delegate = null;\n      return ContinueSentinel;\n    }\n\n    var info = record.arg;\n\n    if (! info) {\n      context.method = \"throw\";\n      context.arg = new TypeError(\"iterator result is not an object\");\n      context.delegate = null;\n      return ContinueSentinel;\n    }\n\n    if (info.done) {\n      // Assign the result of the finished delegate to the temporary\n      // variable specified by delegate.resultName (see delegateYield).\n      context[delegate.resultName] = info.value;\n\n      // Resume execution at the desired location (see delegateYield).\n      context.next = delegate.nextLoc;\n\n      // If context.method was \"throw\" but the delegate handled the\n      // exception, let the outer generator proceed normally. If\n      // context.method was \"next\", forget context.arg since it has been\n      // \"consumed\" by the delegate iterator. If context.method was\n      // \"return\", allow the original .return call to continue in the\n      // outer generator.\n      if (context.method !== \"return\") {\n        context.method = \"next\";\n        context.arg = undefined;\n      }\n\n    } else {\n      // Re-yield the result returned by the delegate method.\n      return info;\n    }\n\n    // The delegate iterator is finished, so forget it and continue with\n    // the outer generator.\n    context.delegate = null;\n    return ContinueSentinel;\n  }\n\n  // Define Generator.prototype.{next,throw,return} in terms of the\n  // unified ._invoke helper method.\n  defineIteratorMethods(Gp);\n\n  define(Gp, toStringTagSymbol, \"Generator\");\n\n  // A Generator should always return itself as the iterator object when the\n  // @@iterator function is called on it. Some browsers' implementations of the\n  // iterator prototype chain incorrectly implement this, causing the Generator\n  // object to not be returned from this call. This ensures that doesn't happen.\n  // See https://github.com/facebook/regenerator/issues/274 for more details.\n  Gp[iteratorSymbol] = function() {\n    return this;\n  };\n\n  Gp.toString = function() {\n    return \"[object Generator]\";\n  };\n\n  function pushTryEntry(locs) {\n    var entry = { tryLoc: locs[0] };\n\n    if (1 in locs) {\n      entry.catchLoc = locs[1];\n    }\n\n    if (2 in locs) {\n      entry.finallyLoc = locs[2];\n      entry.afterLoc = locs[3];\n    }\n\n    this.tryEntries.push(entry);\n  }\n\n  function resetTryEntry(entry) {\n    var record = entry.completion || {};\n    record.type = \"normal\";\n    delete record.arg;\n    entry.completion = record;\n  }\n\n  function Context(tryLocsList) {\n    // The root entry object (effectively a try statement without a catch\n    // or a finally block) gives us a place to store values thrown from\n    // locations where there is no enclosing try statement.\n    this.tryEntries = [{ tryLoc: \"root\" }];\n    tryLocsList.forEach(pushTryEntry, this);\n    this.reset(true);\n  }\n\n  exports.keys = function(object) {\n    var keys = [];\n    for (var key in object) {\n      keys.push(key);\n    }\n    keys.reverse();\n\n    // Rather than returning an object with a next method, we keep\n    // things simple and return the next function itself.\n    return function next() {\n      while (keys.length) {\n        var key = keys.pop();\n        if (key in object) {\n          next.value = key;\n          next.done = false;\n          return next;\n        }\n      }\n\n      // To avoid creating an additional object, we just hang the .value\n      // and .done properties off the next function object itself. This\n      // also ensures that the minifier will not anonymize the function.\n      next.done = true;\n      return next;\n    };\n  };\n\n  function values(iterable) {\n    if (iterable) {\n      var iteratorMethod = iterable[iteratorSymbol];\n      if (iteratorMethod) {\n        return iteratorMethod.call(iterable);\n      }\n\n      if (typeof iterable.next === \"function\") {\n        return iterable;\n      }\n\n      if (!isNaN(iterable.length)) {\n        var i = -1, next = function next() {\n          while (++i < iterable.length) {\n            if (hasOwn.call(iterable, i)) {\n              next.value = iterable[i];\n              next.done = false;\n              return next;\n            }\n          }\n\n          next.value = undefined;\n          next.done = true;\n\n          return next;\n        };\n\n        return next.next = next;\n      }\n    }\n\n    // Return an iterator with no values.\n    return { next: doneResult };\n  }\n  exports.values = values;\n\n  function doneResult() {\n    return { value: undefined, done: true };\n  }\n\n  Context.prototype = {\n    constructor: Context,\n\n    reset: function(skipTempReset) {\n      this.prev = 0;\n      this.next = 0;\n      // Resetting context._sent for legacy support of Babel's\n      // function.sent implementation.\n      this.sent = this._sent = undefined;\n      this.done = false;\n      this.delegate = null;\n\n      this.method = \"next\";\n      this.arg = undefined;\n\n      this.tryEntries.forEach(resetTryEntry);\n\n      if (!skipTempReset) {\n        for (var name in this) {\n          // Not sure about the optimal order of these conditions:\n          if (name.charAt(0) === \"t\" &&\n              hasOwn.call(this, name) &&\n              !isNaN(+name.slice(1))) {\n            this[name] = undefined;\n          }\n        }\n      }\n    },\n\n    stop: function() {\n      this.done = true;\n\n      var rootEntry = this.tryEntries[0];\n      var rootRecord = rootEntry.completion;\n      if (rootRecord.type === \"throw\") {\n        throw rootRecord.arg;\n      }\n\n      return this.rval;\n    },\n\n    dispatchException: function(exception) {\n      if (this.done) {\n        throw exception;\n      }\n\n      var context = this;\n      function handle(loc, caught) {\n        record.type = \"throw\";\n        record.arg = exception;\n        context.next = loc;\n\n        if (caught) {\n          // If the dispatched exception was caught by a catch block,\n          // then let that catch block handle the exception normally.\n          context.method = \"next\";\n          context.arg = undefined;\n        }\n\n        return !! caught;\n      }\n\n      for (var i = this.tryEntries.length - 1; i >= 0; --i) {\n        var entry = this.tryEntries[i];\n        var record = entry.completion;\n\n        if (entry.tryLoc === \"root\") {\n          // Exception thrown outside of any try block that could handle\n          // it, so set the completion value of the entire function to\n          // throw the exception.\n          return handle(\"end\");\n        }\n\n        if (entry.tryLoc <= this.prev) {\n          var hasCatch = hasOwn.call(entry, \"catchLoc\");\n          var hasFinally = hasOwn.call(entry, \"finallyLoc\");\n\n          if (hasCatch && hasFinally) {\n            if (this.prev < entry.catchLoc) {\n              return handle(entry.catchLoc, true);\n            } else if (this.prev < entry.finallyLoc) {\n              return handle(entry.finallyLoc);\n            }\n\n          } else if (hasCatch) {\n            if (this.prev < entry.catchLoc) {\n              return handle(entry.catchLoc, true);\n            }\n\n          } else if (hasFinally) {\n            if (this.prev < entry.finallyLoc) {\n              return handle(entry.finallyLoc);\n            }\n\n          } else {\n            throw new Error(\"try statement without catch or finally\");\n          }\n        }\n      }\n    },\n\n    abrupt: function(type, arg) {\n      for (var i = this.tryEntries.length - 1; i >= 0; --i) {\n        var entry = this.tryEntries[i];\n        if (entry.tryLoc <= this.prev &&\n            hasOwn.call(entry, \"finallyLoc\") &&\n            this.prev < entry.finallyLoc) {\n          var finallyEntry = entry;\n          break;\n        }\n      }\n\n      if (finallyEntry &&\n          (type === \"break\" ||\n           type === \"continue\") &&\n          finallyEntry.tryLoc <= arg &&\n          arg <= finallyEntry.finallyLoc) {\n        // Ignore the finally entry if control is not jumping to a\n        // location outside the try/catch block.\n        finallyEntry = null;\n      }\n\n      var record = finallyEntry ? finallyEntry.completion : {};\n      record.type = type;\n      record.arg = arg;\n\n      if (finallyEntry) {\n        this.method = \"next\";\n        this.next = finallyEntry.finallyLoc;\n        return ContinueSentinel;\n      }\n\n      return this.complete(record);\n    },\n\n    complete: function(record, afterLoc) {\n      if (record.type === \"throw\") {\n        throw record.arg;\n      }\n\n      if (record.type === \"break\" ||\n          record.type === \"continue\") {\n        this.next = record.arg;\n      } else if (record.type === \"return\") {\n        this.rval = this.arg = record.arg;\n        this.method = \"return\";\n        this.next = \"end\";\n      } else if (record.type === \"normal\" && afterLoc) {\n        this.next = afterLoc;\n      }\n\n      return ContinueSentinel;\n    },\n\n    finish: function(finallyLoc) {\n      for (var i = this.tryEntries.length - 1; i >= 0; --i) {\n        var entry = this.tryEntries[i];\n        if (entry.finallyLoc === finallyLoc) {\n          this.complete(entry.completion, entry.afterLoc);\n          resetTryEntry(entry);\n          return ContinueSentinel;\n        }\n      }\n    },\n\n    \"catch\": function(tryLoc) {\n      for (var i = this.tryEntries.length - 1; i >= 0; --i) {\n        var entry = this.tryEntries[i];\n        if (entry.tryLoc === tryLoc) {\n          var record = entry.completion;\n          if (record.type === \"throw\") {\n            var thrown = record.arg;\n            resetTryEntry(entry);\n          }\n          return thrown;\n        }\n      }\n\n      // The context.catch method must only be called with a location\n      // argument that corresponds to a known catch block.\n      throw new Error(\"illegal catch attempt\");\n    },\n\n    delegateYield: function(iterable, resultName, nextLoc) {\n      this.delegate = {\n        iterator: values(iterable),\n        resultName: resultName,\n        nextLoc: nextLoc\n      };\n\n      if (this.method === \"next\") {\n        // Deliberately forget the last sent value so that we don't\n        // accidentally pass it on to the delegate.\n        this.arg = undefined;\n      }\n\n      return ContinueSentinel;\n    }\n  };\n\n  // Regardless of whether this script is executing as a CommonJS module\n  // or not, return the runtime object so that we can declare the variable\n  // regeneratorRuntime in the outer scope, which allows this module to be\n  // injected easily by `bin/regenerator --include-runtime script.js`.\n  return exports;\n\n}(\n  // If this script is executing as a CommonJS module, use module.exports\n  // as the regeneratorRuntime namespace. Otherwise create a new empty\n  // object. Either way, the resulting object will be used to initialize\n  // the regeneratorRuntime variable at the top of this file.\n   true ? module.exports : 0\n));\n\ntry {\n  regeneratorRuntime = runtime;\n} catch (accidentalStrictMode) {\n  // This module should not be running in strict mode, so the above\n  // assignment should always work unless something is misconfigured. Just\n  // in case runtime.js accidentally runs in strict mode, we can escape\n  // strict mode using a global Function call. This could conceivably fail\n  // if a Content Security Policy forbids using Function, but in that case\n  // the proper solution is to fix the accidental strict mode problem. If\n  // you've misconfigured your bundler to force strict mode and applied a\n  // CSP to forbid Function, and you're not willing to fix either of those\n  // problems, please detail your unique predicament in a GitHub issue.\n  Function(\"r\", \"regeneratorRuntime = r\")(runtime);\n}\n\n\n//# sourceURL=webpack://Nakama/./node_modules/regenerator-runtime/runtime.js?");

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/regex.js":
/*!*****************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/regex.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i);\n\n//# sourceURL=webpack://Nakama/./node_modules/uuid/dist/esm-browser/regex.js?");

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/rng.js":
/*!***************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/rng.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ rng)\n/* harmony export */ });\n// Unique ID creation requires a high quality random # generator. In the browser we therefore\n// require the crypto API and do not support built-in fallback to lower quality random number\n// generators (like Math.random()).\nvar getRandomValues;\nvar rnds8 = new Uint8Array(16);\nfunction rng() {\n  // lazy load so that environments that need to polyfill have a chance to do so\n  if (!getRandomValues) {\n    // getRandomValues needs to be invoked in a context where \"this\" is a Crypto implementation. Also,\n    // find the complete implementation of crypto (msCrypto) on IE11.\n    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);\n\n    if (!getRandomValues) {\n      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');\n    }\n  }\n\n  return getRandomValues(rnds8);\n}\n\n//# sourceURL=webpack://Nakama/./node_modules/uuid/dist/esm-browser/rng.js?");

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/stringify.js":
/*!*********************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/stringify.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _validate_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./validate.js */ \"./node_modules/uuid/dist/esm-browser/validate.js\");\n\n/**\n * Convert array of 16 byte values to UUID string format of the form:\n * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX\n */\n\nvar byteToHex = [];\n\nfor (var i = 0; i < 256; ++i) {\n  byteToHex.push((i + 0x100).toString(16).substr(1));\n}\n\nfunction stringify(arr) {\n  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;\n  // Note: Be careful editing this code!  It's been tuned for performance\n  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434\n  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one\n  // of the following:\n  // - One or more input array values don't map to a hex octet (leading to\n  // \"undefined\" in the uuid)\n  // - Invalid input values for the RFC `version` or `variant` fields\n\n  if (!(0,_validate_js__WEBPACK_IMPORTED_MODULE_0__.default)(uuid)) {\n    throw TypeError('Stringified UUID is invalid');\n  }\n\n  return uuid;\n}\n\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (stringify);\n\n//# sourceURL=webpack://Nakama/./node_modules/uuid/dist/esm-browser/stringify.js?");

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/v4.js":
/*!**************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/v4.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _rng_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./rng.js */ \"./node_modules/uuid/dist/esm-browser/rng.js\");\n/* harmony import */ var _stringify_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./stringify.js */ \"./node_modules/uuid/dist/esm-browser/stringify.js\");\n\n\n\nfunction v4(options, buf, offset) {\n  options = options || {};\n  var rnds = options.random || (options.rng || _rng_js__WEBPACK_IMPORTED_MODULE_0__.default)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`\n\n  rnds[6] = rnds[6] & 0x0f | 0x40;\n  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided\n\n  if (buf) {\n    offset = offset || 0;\n\n    for (var i = 0; i < 16; ++i) {\n      buf[offset + i] = rnds[i];\n    }\n\n    return buf;\n  }\n\n  return (0,_stringify_js__WEBPACK_IMPORTED_MODULE_1__.default)(rnds);\n}\n\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (v4);\n\n//# sourceURL=webpack://Nakama/./node_modules/uuid/dist/esm-browser/v4.js?");

/***/ }),

/***/ "./node_modules/uuid/dist/esm-browser/validate.js":
/*!********************************************************!*\
  !*** ./node_modules/uuid/dist/esm-browser/validate.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _regex_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./regex.js */ \"./node_modules/uuid/dist/esm-browser/regex.js\");\n\n\nfunction validate(uuid) {\n  return typeof uuid === 'string' && _regex_js__WEBPACK_IMPORTED_MODULE_0__.default.test(uuid);\n}\n\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (validate);\n\n//# sourceURL=webpack://Nakama/./node_modules/uuid/dist/esm-browser/validate.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	Nakama = __webpack_exports__;
/******/ 	
/******/ })()
;/**
 * @typedef {ITextureOptions}
 * @property {} []
 */

(function resAddon(ct) {
    const loadingScreen = document.querySelector('.ct-aLoadingScreen'),
          loadingBar = loadingScreen.querySelector('.ct-aLoadingBar');
    const dbFactory = window.dragonBones ? dragonBones.PixiFactory.factory : null;
    /**
     * A utility object that manages and stores textures and other entities
     * @namespace
     */
    ct.res = {
        sounds: {},
        textures: {},
        skeletons: {},
        /**
         * Loads and executes a script by its URL
         * @param {string} url The URL of the script file, with its extension.
         * Can be relative or absolute.
         * @returns {Promise<void>}
         * @async
         */
        loadScript(url = ct.u.required('url', 'ct.res.loadScript')) {
            var script = document.createElement('script');
            script.src = url;
            const promise = new Promise((resolve, reject) => {
                script.onload = () => {
                    resolve();
                };
                script.onerror = () => {
                    reject();
                };
            });
            document.getElementsByTagName('head')[0].appendChild(script);
            return promise;
        },
        /**
         * Loads an individual image as a named ct.js texture.
         * @param {string} url The path to the source image.
         * @param {string} name The name of the resulting ct.js texture
         * as it will be used in your code.
         * @param {ITextureOptions} textureOptions Information about texture's axis
         * and collision shape.
         * @returns {Promise<Array<PIXI.Texture>>}
         */
        loadTexture(url = ct.u.required('url', 'ct.res.loadTexture'), name = ct.u.required('name', 'ct.res.loadTexture'), textureOptions = {}) {
            const loader = new PIXI.Loader();
            loader.add(url, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load image ${url}`));
                });
            })
            .then(resources => {
                const tex = [resources[url].texture];
                tex.shape = tex[0].shape = textureOptions.shape || {};
                tex[0].defaultAnchor = new PIXI.Point(
                    textureOptions.anchor.x || 0,
                    textureOptions.anchor.x || 0
                );
                ct.res.textures[name] = tex;
                return tex;
            });
        },
        /**
         * Loads a skeleton made in DragonBones into the game
         * @param {string} ske Path to the _ske.json file that contains
         * the armature and animations.
         * @param {string} tex Path to the _tex.json file that describes the atlas
         * with a skeleton's textures.
         * @param {string} png Path to the _tex.png atlas that contains
         * all the textures of the skeleton.
         * @param {string} name The name of the skeleton as it will be used in ct.js game
         */
        loadDragonBonesSkeleton(ske, tex, png, name = ct.u.required('name', 'ct.res.loadDragonBonesSkeleton')) {
            const dbf = dragonBones.PixiFactory.factory;
            const loader = new PIXI.Loader();
            loader
                .add(ske, ske)
                .add(tex, tex)
                .add(png, png);
            return new Promise((resolve, reject) => {
                loader.load(() => {
                    resolve();
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load skeleton with _ske.json: ${ske}, _tex.json: ${tex}, _tex.png: ${png}.`));
                });
            }).then(() => {
                dbf.parseDragonBonesData(loader.resources[ske].data);
                dbf.parseTextureAtlasData(
                    loader.resources[tex].data,
                    loader.resources[png].texture
                );
                // eslint-disable-next-line id-blacklist
                ct.res.skeletons[name] = loader.resources[ske].data;
            });
        },
        /**
         * Loads a Texture Packer compatible .json file with its source image,
         * adding ct.js textures to the game.
         * @param {string} url The path to the JSON file that describes the atlas' textures.
         * @returns {Promise<Array<string>>} A promise that resolves into an array
         * of all the loaded textures.
         */
        loadAtlas(url = ct.u.required('url', 'ct.res.loadAtlas')) {
            const loader = new PIXI.Loader();
            loader.add(url, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load atlas ${url}`));
                });
            })
            .then(resources => {
                const sheet = resources[url].spritesheet;
                for (const animation in sheet.animations) {
                    const tex = sheet.animations[animation];
                    const animData = sheet.data.animations;
                    for (let i = 0, l = animData[animation].length; i < l; i++) {
                        const a = animData[animation],
                              f = a[i];
                        tex[i].shape = sheet.data.frames[f].shape;
                    }
                    tex.shape = tex[0].shape || {};
                    ct.res.textures[animation] = tex;
                }
                return Object.keys(sheet.animations);
            });
        },
        /**
         * Loads a bitmap font by its XML file.
         * @param {string} url The path to the XML file that describes the bitmap fonts.
         * @param {string} name The name of the font.
         * @returns {Promise<string>} A promise that resolves into the font's name
         * (the one you've passed with `name`).
         */
        loadBitmapFont(url = ct.u.required('url', 'ct.res.loadBitmapFont'), name = ct.u.required('name', 'ct.res.loadBitmapFont')) {
            const loader = new PIXI.Loader();
            loader.add(name, url);
            return new Promise((resolve, reject) => {
                loader.load((loader, resources) => {
                    resolve(resources);
                });
                loader.onError.add(() => {
                    reject(new Error(`[ct.res] Could not load bitmap font ${url}`));
                });
            });
        },
        loadGame() {
            // !! This method is intended to be filled by ct.IDE and be executed
            // exactly once at game startup. Don't put your code here.
            const changeProgress = percents => {
                loadingScreen.setAttribute('data-progress', percents);
                loadingBar.style.width = percents + '%';
            };

            const atlases = [["./img/a0.json"]][0];
            const tiledImages = [{"bg":{"source":"./img/t0.png","shape":{"type":"rect","top":0,"bottom":64,"left":0,"right":64},"anchor":{"x":0,"y":0}}}][0];
            const sounds = [[]][0];
            const bitmapFonts = [{}][0];
            const dbSkeletons = [[]][0]; // DB means DragonBones

            if (sounds.length && !ct.sound) {
                throw new Error('[ct.res] No sound system found. Make sure you enable one of the `sound` catmods. If you don\'t need sounds, remove them from your ct.js project.');
            }

            const totalAssets = atlases.length;
            let assetsLoaded = 0;
            const loadingPromises = [];

            loadingPromises.push(...atlases.map(atlas =>
                ct.res.loadAtlas(atlas)
                .then(texturesNames => {
                    assetsLoaded++;
                    changeProgress(assetsLoaded / totalAssets * 100);
                    return texturesNames;
                })));

            for (const name in tiledImages) {
                loadingPromises.push(ct.res.loadTexture(
                    tiledImages[name].source,
                    name,
                    {
                        anchor: tiledImages[name].anchor,
                        shape: tiledImages[name].shape
                    }
                ));
            }
            for (const font in bitmapFonts) {
                loadingPromises.push(ct.res.loadBitmapFont(bitmapFonts[font], font));
            }
            for (const skel of dbSkeletons) {
                ct.res.loadDragonBonesSkeleton(...skel);
            }

            for (const sound of sounds) {
                ct.sound.init(sound.name, {
                    wav: sound.wav || false,
                    mp3: sound.mp3 || false,
                    ogg: sound.ogg || false
                }, {
                    poolSize: sound.poolSize,
                    music: sound.isMusic
                });
            }

            /*@res@*/
            

            Promise.all(loadingPromises)
            .then(() => {
                Object.defineProperty(ct.templates.Copy.prototype, 'cgroup', {
    set: function (value) {
        this.$cgroup = value;
    },
    get: function () {
        return this.$cgroup;
    }
});
Object.defineProperty(ct.templates.Copy.prototype, 'moveContinuous', {
    value: function (cgroup, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
        }
        return ct.place.moveAlong(this, this.direction, this.speed * ct.delta, cgroup, precision);
    }
});

Object.defineProperty(ct.templates.Copy.prototype, 'moveContinuousByAxes', {
    value: function (cgroup, precision) {
        if (this.gravity) {
            this.hspeed += this.gravity * ct.delta * Math.cos(this.gravityDir * Math.PI / 180);
            this.vspeed += this.gravity * ct.delta * Math.sin(this.gravityDir * Math.PI / 180);
        }
        return ct.place.moveByAxes(
            this,
            this.hspeed * ct.delta,
            this.vspeed * ct.delta,
            cgroup,
            precision
        );
    }
});

Object.defineProperty(ct.templates.Tilemap.prototype, 'enableCollisions', {
    value: function (cgroup) {
        ct.place.enableTilemapCollisions(this, cgroup);
    }
});
ct.pointer.setupListeners();

                loadingScreen.classList.add('hidden');
                ct.pixiApp.ticker.add(ct.loop);
                ct.rooms.forceSwitch(ct.rooms.starting);
            })
            .catch(console.error);
        },
        /*
         * Gets a pixi.js texture from a ct.js' texture name,
         * so that it can be used in pixi.js objects.
         * @param {string|-1} name The name of the ct.js texture, or -1 for an empty texture
         * @param {number} [frame] The frame to extract
         * @returns {PIXI.Texture|Array<PIXI.Texture>} If `frame` was specified,
         * returns a single PIXI.Texture. Otherwise, returns an array
         * with all the frames of this ct.js' texture.
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTexture(name, frame) {
            if (frame === null) {
                frame = void 0;
            }
            if (name === -1) {
                if (frame !== void 0) {
                    return PIXI.Texture.EMPTY;
                }
                return [PIXI.Texture.EMPTY];
            }
            if (!(name in ct.res.textures)) {
                throw new Error(`Attempt to get a non-existent texture ${name}`);
            }
            const tex = ct.res.textures[name];
            if (frame !== void 0) {
                return tex[frame];
            }
            return tex;
        },
        /*
         * Returns the collision shape of the given texture.
         * @param {string|-1} name The name of the ct.js texture, or -1 for an empty collision shape
         * @returns {object}
         *
         * @note Formatted as a non-jsdoc comment as it requires a better ts declaration
         * than the auto-generated one
         */
        getTextureShape(name) {
            if (name === -1) {
                return {};
            }
            if (!(name in ct.res.textures)) {
                throw new Error(`Attempt to get a shape of a non-existent texture ${name}`);
            }
            return ct.res.textures[name].shape;
        },
        /**
         * Creates a DragonBones skeleton, ready to be added to your copies.
         * @param {string} name The name of the skeleton asset
         * @param {string} [skin] Optional; allows you to specify the used skin
         * @returns {object} The created skeleton
         */
        makeSkeleton(name, skin) {
            const r = ct.res.skeletons[name],
                  skel = dbFactory.buildArmatureDisplay('Armature', r.name, skin);
            skel.ctName = name;
            skel.on(dragonBones.EventObject.SOUND_EVENT, function skeletonSound(event) {
                if (ct.sound.exists(event.name)) {
                    ct.sound.spawn(event.name);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn(`Skeleton ${skel.ctName} tries to play a non-existing sound ${event.name} at animation ${skel.animation.lastAnimationName}`);
                }
            });
            return skel;
        }
    };

    ct.res.loadGame();
})(ct);

/**
 * A collection of content that was made inside ct.IDE.
 * @type {any}
 */
ct.content = JSON.parse(["{}"][0] || '{}');

function rotate(array) {
    var result = [];
    array.forEach(function (a, i, aa) {
        a.forEach(function (b, j, bb) {
            result[bb.length - j - 1] = result[bb.length - j - 1] || [];
            result[bb.length - j - 1][i] = b;
        });
    });
    result = result.reverse()
    return result;
}

function swap(obj, key1, key2) {
   [obj[key1], obj[key2]] = [obj[key2], obj[key1]];
}

Object.defineProperties(Array.prototype, {
    count: {
        value: function(value) {
            return this.filter(x => x==value).length;
        }
    }
});

function changeColor(colorFilter,r=1,g=1,b=1,a=1){
    colorFilter.red = r
    colorFilter.green = g
    colorFilter.blue = b
    colorFilter.alpha = a
    return true;
}

Number.prototype.between = function(a, b, round=false) {
    let min = Math.min(a, b),
        max = Math.max(a, b);
    if (round){
        min = Math.floor(min)
        max = Math.ceil(max)
    }
    return this > min && this < max;
};

const toValue = (i,match_id=Nakama.state.match.match_id) => {
    let n = Number("0x"+match_id[i])
    return (Number("0x"+match_id[i])+1)/16
}

const toFixed = (n,size) => {
    return n.toLocaleString('en-US', {//this is the function that formats the numbers
      minimumIntegerDigits: size, //change this to your minimum length
      useGrouping: false
    })
};
async function getMatches(){
    Nakama.state.loading = true
    return (await Nakama.client.listMatches(Nakama.session)).matches
}

/* Enable listeners AFTER joining match */
async function enableListeners(match_id){
    Nakama.socket.onmatchdata = (data) => {
        switch (data.op_code) {
            case 1: /* Introductions from older players */
                if (data.data === Nakama.session.user_id){
                    Nakama.client.getUsers(Nakama.session, data.presence.user_id)
                        .then((users)=>addPlayer(data.presence.user_id,users.users[0].username))
                        .then(() => console.log(`Greeted by ${Nakama.state.player[data.presence.user_id]}! (Number of players: ${Object.keys(Nakama.state.players).length})`))
                    
                }
                break;
            case 2: /* Walls */
                let d = data.data.split(":")
                let wall = ct.room.board.grid[d[0]][d[1]]
                wall.enabled = d[2]==="1"
                wall.enable_mode()
                break;
            case 3: /* Moves */
                console.log("Got move!")
                ct.room.coin.checkActions(data.data)
                break;
            case 4: /* Bump */
                let player_card = ct.templates.list["Match_Card"].filter((x) => x.user_id === data.presence.user_id)[0]
                if (data.data==1){
                    console.log(`${Nakama.state.players[data.presence.user_id]} (${data.presence.user_id}) bumped!`)
                    player_card.bumpFlash()
                } else if (data.data==0){
                    console.log(`${Nakama.state.players[data.presence.user_id]} (${data.presence.user_id}) NO BUMP!`)
                    player_card.glow.color = player_card.glow.color_default
                }

                break;
            default: console.log(data)
        }
    }
    Nakama.socket.onmatchpresence = (data) => {
        console.log(data)
        if (data.joins){
            data.joins.forEach((player) => {
                addPlayer(player.user_id);
                
                console.log(`Welcome ${player.user_id}! (Number of players: ${Nakama.state.players.length})`)
                console.log(Nakama.socket.sendMatchState(match_id, 1, player.user_id))
            })
        } else if (data.leaves) {
            data.leaves.forEach((player) => {
                delete Nakama.state.players[player.user_id]
                ct.room.name==="Game"?ct.room.updateCards("bye"):null
                console.log(`Bye-bye ${player.user_id}! (Number of players: ${Nakama.state.players.length})`)
            })
        }
    }
}

async function leaveMatch(){
    return Nakama.state.match ? Nakama.socket.leaveMatch(Nakama.state.match.match_id).then(() => Nakama.state.match = null) : null
}

async function joinMatch(match_id){
    console.log(Nakama.state.maxPlayers === Nakama.state.players.length)
    return enableListeners(match_id)
                .then((_) => Nakama.socket.joinMatch(match_id)
                .then((x) => {Nakama.state.match=x; return x})
                /*
                .then((x) => {
                    if (){
                        throw new Error('Max Players Reached!')
                    } else { /* We already got what we needed out of x, so returning it is useless atm. Keeping for posterity./
                        return x 
                    }
                })
                .catch((e) => {console.log(e);leaveMatch()})
                */
                .then((_) => Nakama.client.getUsers(Nakama.session, Nakama.session.user_id).then((users)=>{console.log([users,"me"]);addPlayer(Nakama.session.user_id,users.users[0].username)}))
                )
}

function addPlayer(player_id,username,overwrite=false){
    console.log(player_id,username, typeof username,overwrite)
    console.log(Object.keys(Nakama.state.players).includes(player_id),overwrite)
    let r = Object.keys(Nakama.state.players).includes(player_id) ? ((overwrite || Nakama.state.players[player_id] === undefined )?Nakama.state.players[player_id]=username:false) : Nakama.state.players[player_id]=username
    console.log(Nakama.state.players)
    ct.room.name==="Game"?ct.room.updateCards("hi"):null
    return r
}

function stateToAction(n){
    let code = [Math.floor(n/3)-1, (n%3)-1]
    console.log(`>>>>${code[0]}>>>>${code[1]}`)
    let obj = {
        MoveX: {
            value: Math.floor(n/3)-1,
            pressed: Math.abs(Math.floor(n/3)-1)!==0
        },
        MoveY: {
            value: (n%3)-1,
            pressed: ((n%3)-1)!==0
        }
    }
    
    console.log(Object.assign({}, obj))
    console.log(`>>>>${code[0]}>>>>${code[1]}`)
    console.log(`>>>>${Math.floor(n/3)-1}>>>>${(n%3)-1}`)
    return obj
}

function actionToState(obj){
    return ((obj.MoveX.value+1)*3) + (obj.MoveY.value+1)
}

Nakama.state.loading = false
Nakama.state.match = null
Nakama.state.players = {}
Nakama.state.turn = 0
Nakama.state.debug = true
Nakama.state.maxPlayers = 1
Nakama.state.orient = [false,false] /* True means oriented incorrectly */
;
