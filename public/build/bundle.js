
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    let sq;
    let size;

    function playMove(squares) {

        let moves = [];
        sq = squares.slice();
        size = sq.length;

        for(var i = 0; i < sq.length; i++) {
            var row = sq[i];
            for(var j = 0; j < row.length; j++) {
                if (sq[i][j] === '-')
                    moves.push({value: squareValue(i,j), move: [i,j]});
            }
        }

        moves.sort((a,b) => b.value - a.value);

        if (moves.length === size*size)
            return {x: Math.round(size/2)-1, y:  Math.round(size/2)-1}; // AI plays the first move

        return {x: moves[0].move[0], y:  moves[0].move[1]};
    }

    function squareValue(x, y) {
        var c, k, len1, ref, str, total;
        total = 0;
        ref = ["X", "O"];
        for (k = 0, len1 = ref.length; k < len1; k++) {
          c = ref[k];
          sq[x][y] = c;
          str = from_to(x, y - 5, 0, +1, 11); //vertical
          total += row_value(str, c);
          str = from_to(x - 5, y, +1, 0, 11); //horizontal
          total += row_value(str, c);
          str = from_to(x - 5, y - 5, +1, +1, 11); //diagonal
          total += row_value(str, c);
          str = from_to(x + 5, y - 5, -1, +1, 11); //diagonal
          total += row_value(str, c);
        }
        sq[x][y] = "-"; // undo move
        return total;
     }

    function from_to(x, y, step_x, step_y, len) {
        var k, ref, str;
        str = "";
        for (k = 0, ref = len; (0 <= ref ? k < ref : k > ref); 0 <= ref ? ++k : --k) {
          if ((x >= 0 && x < size) && (y >= 0 && y < size)) {
            str += sq[x][y];
          }
          x += step_x;
          y += step_y;
        }
        return str;
    }

    function row_value(str, c) {
        var f, i;
        str = str.replace(/_/g, '-');
        f = (c === "O") ? 1 : 0;
        if ((i = str.search(c + c + c + c + c)) !== -1) {
          return 100000 + f * 10000;
        }
        if ((i = str.search(c + c + c + c)) !== -1) {
          if (str[i - 1] === "-" && str[i + 4] === "-") {
            return 10000 + f * 10000;
          }
          if (str[i - 1] === "-" || str[i + 4] === "-") {
            return 900 + f * 500;
          }
          return 0;
        }
        if ((i = str.search(c + c + c + "-" + c + "|" + c + "-" + c + c + c)) !== -1) {
          return 800 + f * 500;
        }
        if ((i = str.search(c + c + c)) !== -1) {
          if (str.slice(i - 2, i) === "--" && str.slice(i + 3, i + 5) === "--") {
            return 1000 + f * 1000;
          }
          if (str.slice(i - 2, i) === "--" || str.slice(i + 3, i + 5) === "--") {
            return 300 + f * 100;
          }
          return 0;
        }
        if ((i = str.search(c + c + '-' + c)) !== -1 || (i = str.search(c + '-' + c + c)) !== -1) {
          if (str.slice(i - 2, i) === "--" && str.slice(i + 4, i + 6) === "--") {
            return 800 + f * 100;
          }
          if (str.slice(i - 2, i) === "--" || str.slice(i + 4, i + 6) === "--") {
            return 500 + f * 100;
          }
          return 0;
        }
        if ((i = str.search('--' + c + c + '--')) !== -1) {
          return 100 + f * 100;
        }
        return 0;
    }

    /* --- End of AI ------- */

    function checkFive (x, y, squares) {
        var i, str, xs, ys;

        if (x === -1)
            return []; // not played yet

        sq = squares.slice();  

        let c = sq[x][y]; // last played (X or O)

        //console.log("c: " + c);

        let winner_row = [];
        
        xs = x - 5;
        if (xs < 0) {
          xs = 0;
        }
        ys = y - 5;
        if (ys < 0) {
          ys = 0;
        }
        str = from_to(x, y - 5, 0, +1, 11); //vertical
        if ((i = str.search(c + c + c + c + c)) !== -1) {
          winner_row = [x, ys + i, x, ys + i + 4];
        }
        str = from_to(x - 5, y, +1, 0, 11); //horizontal
        if ((i = str.search(c + c + c + c + c)) !== -1) {
          winner_row = [xs + i, y, xs + i + 4, y];
        }
        if ((x - 5) <= 0 || (y - 5) <= 0) {
          xs = x > y ? x - y : 0;
          ys = y > x ? y - x : 0;
        }
        str = from_to(x - 5, y - 5, +1, +1, 11); //diagonal
        if ((i = str.search(c + c + c + c + c)) !== -1) {
          winner_row = [xs + i, ys + i, xs + i + 4, ys + i + 4];
        }
        xs = x + 5;
        ys = y - 5 < 0 ? 0 : y - 5;
        if ((x + 5) >= 19 || (y - 5) <= 0) {
          xs = (19 - x) > y ? x + y : 19;
          ys = y > (19 - x) ? y - (19 - x) : 0;
        }
        str = from_to(x + 5, y - 5, -1, +1, 11); //diagonal
        if ((i = str.search(c + c + c + c + c)) !== -1) {
          winner_row = [xs - i, ys + i, xs - i - 4, ys + i + 4];
        }
        
        return winnerLineAllSquares(winner_row);    
        
      }

    function winnerLineAllSquares(line) {

        if (line.length !== 4)
            return [];

        let x_step = 0;

        if (line[2] - line[0] > 0)
            x_step = +1;
        
        if (line[2] - line[0] < 0)
            x_step = -1;
        
        let y_step = 0;

        if (line[3] - line[1] > 0)
            y_step = +1;
        
        if (line[3] - line[1] < 0)
            y_step = -1;

        let wLine = [line[0], line[1]];
        
        for (let k = 2; k < 8; k+=2 ) {
            wLine[k]   = wLine[k-2] + x_step;
            wLine[k+1] = wLine[k-1] + y_step;
        }

        wLine[8] = line[2];
        wLine[9] = line[3];

        return wLine;

    }

    function checkDraw(squares) {

      let moves = [];
      sq = squares.slice();
      size = sq.length;

      for(var i = 0; i < sq.length; i++) {
          var row = sq[i];
          for(var j = 0; j < row.length; j++) {
              if (sq[i][j] === '-')
                  moves.push({value: 0, move: [i,j]});
          }
      }

      if (moves.length === 0)
        return true;
      else
        return false;
      
    }

    var AI = /*#__PURE__*/Object.freeze({
        __proto__: null,
        playMove: playMove,
        checkFive: checkFive,
        checkDraw: checkDraw
    });

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const vw = writable(window.visualViewport.width);
    const vh = writable(window.visualViewport.height);
    const gameBackground = writable("#202020");
    const gameLineColor = writable("#606060");

    /* Jos värien keskiarvo on tumma niin valkoinen, päinvastoin niin musta. */
    const gameMarkColor = derived(
    	gameBackground,
    	$gameBackground => {
            let colors = [$gameBackground.slice(1,3), $gameBackground.slice(3,5), $gameBackground.slice(5,7)];
            colors = colors.map(c => parseInt(c,16));
            let sum = colors.reduce((partialSum, a) => partialSum + a, 0);
            return (sum/3 < 127) ? "white" : "black";
        }
    );

    /* src\Square.svelte generated by Svelte v3.47.0 */
    const file$3 = "src\\Square.svelte";

    // (25:4) {#if text === 'X'}
    function create_if_block_1(ctx) {
    	let line0;
    	let line1;

    	const block = {
    		c: function create() {
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			attr_dev(line0, "opacity", "0.6");
    			attr_dev(line0, "stroke", /*$gameMarkColor*/ ctx[6]);
    			attr_dev(line0, "stroke-width", "12%");
    			attr_dev(line0, "x1", "20%");
    			attr_dev(line0, "y1", "20%");
    			attr_dev(line0, "x2", "80%");
    			attr_dev(line0, "y2", "80%");
    			attr_dev(line0, "class", "svelte-14ulk1k");
    			toggle_class(line0, "anim", /*anim*/ ctx[2]);
    			add_location(line0, file$3, 25, 8, 734);
    			attr_dev(line1, "opacity", "0.6");
    			attr_dev(line1, "stroke", /*$gameMarkColor*/ ctx[6]);
    			attr_dev(line1, "stroke-width", "12%");
    			attr_dev(line1, "x1", "80%");
    			attr_dev(line1, "y1", "20%");
    			attr_dev(line1, "x2", "20%");
    			attr_dev(line1, "y2", "80%");
    			attr_dev(line1, "class", "svelte-14ulk1k");
    			toggle_class(line1, "anim", /*anim*/ ctx[2]);
    			add_location(line1, file$3, 26, 8, 868);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line0, anchor);
    			insert_dev(target, line1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$gameMarkColor*/ 64) {
    				attr_dev(line0, "stroke", /*$gameMarkColor*/ ctx[6]);
    			}

    			if (dirty & /*anim*/ 4) {
    				toggle_class(line0, "anim", /*anim*/ ctx[2]);
    			}

    			if (dirty & /*$gameMarkColor*/ 64) {
    				attr_dev(line1, "stroke", /*$gameMarkColor*/ ctx[6]);
    			}

    			if (dirty & /*anim*/ 4) {
    				toggle_class(line1, "anim", /*anim*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line0);
    			if (detaching) detach_dev(line1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(25:4) {#if text === 'X'}",
    		ctx
    	});

    	return block;
    }

    // (29:4) {#if text === 'O'}
    function create_if_block$1(ctx) {
    	let circle;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "fill", "none");
    			attr_dev(circle, "opacity", "0.6");
    			attr_dev(circle, "stroke", /*$gameMarkColor*/ ctx[6]);
    			attr_dev(circle, "stroke-width", "12%");
    			attr_dev(circle, "cx", "50%");
    			attr_dev(circle, "cy", "50%");
    			attr_dev(circle, "r", "30%");
    			attr_dev(circle, "class", "svelte-14ulk1k");
    			toggle_class(circle, "anim", /*anim*/ ctx[2]);
    			add_location(circle, file$3, 29, 8, 1041);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$gameMarkColor*/ 64) {
    				attr_dev(circle, "stroke", /*$gameMarkColor*/ ctx[6]);
    			}

    			if (dirty & /*anim*/ 4) {
    				toggle_class(circle, "anim", /*anim*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(29:4) {#if text === 'O'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let animate;
    	let t;
    	let button;
    	let svg;
    	let if_block0_anchor;
    	let mounted;
    	let dispose;
    	let if_block0 = /*text*/ ctx[0] === 'X' && create_if_block_1(ctx);
    	let if_block1 = /*text*/ ctx[0] === 'O' && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			animate = svg_element("animate");
    			t = space();
    			button = element("button");
    			svg = svg_element("svg");
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			if (if_block1) if_block1.c();
    			attr_dev(animate, "attributeType", "XML");
    			attr_dev(animate, "attributeName", "stroke");
    			attr_dev(animate, "values", "blue;green;blue");
    			attr_dev(animate, "dur", "0.5s");
    			attr_dev(animate, "repeatCount", "1");
    			add_location(animate, file$3, 18, 0, 366);
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$3, 23, 4, 639);
    			attr_dev(button, "class", "square svelte-14ulk1k");
    			set_style(button, "width", /*size*/ ctx[3] + "px");
    			set_style(button, "height", /*size*/ ctx[3] + "px");
    			set_style(button, "background", /*$gameBackground*/ ctx[4]);
    			set_style(button, "border-color", /*$gameLineColor*/ ctx[5]);
    			add_location(button, file$3, 22, 0, 490);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, animate, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			if (if_block0) if_block0.m(svg, null);
    			append_dev(svg, if_block0_anchor);
    			if (if_block1) if_block1.m(svg, null);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*onClick*/ ctx[1])) /*onClick*/ ctx[1].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (/*text*/ ctx[0] === 'X') {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(svg, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*text*/ ctx[0] === 'O') {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(svg, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*size*/ 8) {
    				set_style(button, "width", /*size*/ ctx[3] + "px");
    			}

    			if (dirty & /*size*/ 8) {
    				set_style(button, "height", /*size*/ ctx[3] + "px");
    			}

    			if (dirty & /*$gameBackground*/ 16) {
    				set_style(button, "background", /*$gameBackground*/ ctx[4]);
    			}

    			if (dirty & /*$gameLineColor*/ 32) {
    				set_style(button, "border-color", /*$gameLineColor*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(animate);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(button);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $gameBackground;
    	let $gameLineColor;
    	let $gameMarkColor;
    	validate_store(gameBackground, 'gameBackground');
    	component_subscribe($$self, gameBackground, $$value => $$invalidate(4, $gameBackground = $$value));
    	validate_store(gameLineColor, 'gameLineColor');
    	component_subscribe($$self, gameLineColor, $$value => $$invalidate(5, $gameLineColor = $$value));
    	validate_store(gameMarkColor, 'gameMarkColor');
    	component_subscribe($$self, gameMarkColor, $$value => $$invalidate(6, $gameMarkColor = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Square', slots, []);
    	let { text = '' } = $$props;
    	let { onClick } = $$props;
    	let { anim = false } = $$props;
    	let { size } = $$props;

    	//$: console.log($gameMarkColor);
    	let testValue = 2;

    	const writable_props = ['text', 'onClick', 'anim', 'size'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Square> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('onClick' in $$props) $$invalidate(1, onClick = $$props.onClick);
    		if ('anim' in $$props) $$invalidate(2, anim = $$props.anim);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		vw,
    		vh,
    		gameBackground,
    		gameLineColor,
    		gameMarkColor,
    		text,
    		onClick,
    		anim,
    		size,
    		testValue,
    		$gameBackground,
    		$gameLineColor,
    		$gameMarkColor
    	});

    	$$self.$inject_state = $$props => {
    		if ('text' in $$props) $$invalidate(0, text = $$props.text);
    		if ('onClick' in $$props) $$invalidate(1, onClick = $$props.onClick);
    		if ('anim' in $$props) $$invalidate(2, anim = $$props.anim);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('testValue' in $$props) testValue = $$props.testValue;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, onClick, anim, size, $gameBackground, $gameLineColor, $gameMarkColor];
    }

    class Square extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { text: 0, onClick: 1, anim: 2, size: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Square",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onClick*/ ctx[1] === undefined && !('onClick' in props)) {
    			console.warn("<Square> was created without expected prop 'onClick'");
    		}

    		if (/*size*/ ctx[3] === undefined && !('size' in props)) {
    			console.warn("<Square> was created without expected prop 'size'");
    		}
    	}

    	get text() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClick() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get anim() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set anim(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Square>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Square>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Resizebutton.svelte generated by Svelte v3.47.0 */

    const { console: console_1$2 } = globals;
    const file$2 = "src\\Resizebutton.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let svg;
    	let line0;
    	let line1;
    	let line2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			line2 = svg_element("line");
    			attr_dev(line0, "opacity", "0.6");
    			attr_dev(line0, "stroke", /*$gameBackground*/ ctx[2]);
    			attr_dev(line0, "stroke-width", "12%");
    			attr_dev(line0, "x1", "10%");
    			attr_dev(line0, "y1", "90%");
    			attr_dev(line0, "x2", "90%");
    			attr_dev(line0, "y2", "10%");
    			add_location(line0, file$2, 43, 8, 1187);
    			attr_dev(line1, "opacity", "0.6");
    			attr_dev(line1, "stroke", /*$gameBackground*/ ctx[2]);
    			attr_dev(line1, "stroke-width", "12%");
    			attr_dev(line1, "x1", "40%");
    			attr_dev(line1, "y1", "90%");
    			attr_dev(line1, "x2", "90%");
    			attr_dev(line1, "y2", "40%");
    			add_location(line1, file$2, 44, 8, 1299);
    			attr_dev(line2, "opacity", "0.6");
    			attr_dev(line2, "stroke", /*$gameBackground*/ ctx[2]);
    			attr_dev(line2, "stroke-width", "12%");
    			attr_dev(line2, "x1", "70%");
    			attr_dev(line2, "y1", "90%");
    			attr_dev(line2, "x2", "90%");
    			attr_dev(line2, "y2", "70%");
    			add_location(line2, file$2, 45, 8, 1411);
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$2, 40, 4, 939);
    			set_style(button, "top", /*top*/ ctx[0] + 8 + "px");
    			set_style(button, "left", /*left*/ ctx[1] + 8 + "px");
    			set_style(button, "color", /*$gameBackground*/ ctx[2]);
    			set_style(button, "width", 12 + "px");
    			set_style(button, "height", 12 + "px");
    			attr_dev(button, "class", "svelte-1xx9mh4");
    			add_location(button, file$2, 39, 0, 806);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    			append_dev(svg, line2);

    			if (!mounted) {
    				dispose = listen_dev(button, "mousedown", /*startDrag*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$gameBackground*/ 4) {
    				attr_dev(line0, "stroke", /*$gameBackground*/ ctx[2]);
    			}

    			if (dirty & /*$gameBackground*/ 4) {
    				attr_dev(line1, "stroke", /*$gameBackground*/ ctx[2]);
    			}

    			if (dirty & /*$gameBackground*/ 4) {
    				attr_dev(line2, "stroke", /*$gameBackground*/ ctx[2]);
    			}

    			if (dirty & /*top*/ 1) {
    				set_style(button, "top", /*top*/ ctx[0] + 8 + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				set_style(button, "left", /*left*/ ctx[1] + 8 + "px");
    			}

    			if (dirty & /*$gameBackground*/ 4) {
    				set_style(button, "color", /*$gameBackground*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $gameBackground;
    	validate_store(gameBackground, 'gameBackground');
    	component_subscribe($$self, gameBackground, $$value => $$invalidate(2, $gameBackground = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Resizebutton', slots, []);
    	let { size = 620 } = $$props;
    	let { top = size } = $$props;
    	let { left = size } = $$props;
    	let { resized = size } = $$props;
    	let top2 = size;
    	let left2 = size;
    	let started = false;

    	function startDrag(e) {
    		started = true;
    		window.addEventListener('mousemove', handleMousemove);
    		window.addEventListener('mouseup', stopDrag);
    	}

    	function handleMousemove(e) {
    		if (started) {
    			left2 += e.movementX;
    			top2 += e.movementY;
    			$$invalidate(4, resized = Math.min(top2, left2));
    		}
    	}

    	function stopDrag(e) {
    		console.log(`Mouse up: ${e.x}, ${e.y}`);
    		started = false;
    		window.removeEventListener("mousemove", handleMousemove);
    		window.removeEventListener('mouseup', stopDrag);
    	}

    	const writable_props = ['size', 'top', 'left', 'resized'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Resizebutton> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(5, size = $$props.size);
    		if ('top' in $$props) $$invalidate(0, top = $$props.top);
    		if ('left' in $$props) $$invalidate(1, left = $$props.left);
    		if ('resized' in $$props) $$invalidate(4, resized = $$props.resized);
    	};

    	$$self.$capture_state = () => ({
    		gameBackground,
    		size,
    		top,
    		left,
    		resized,
    		top2,
    		left2,
    		started,
    		startDrag,
    		handleMousemove,
    		stopDrag,
    		$gameBackground
    	});

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(5, size = $$props.size);
    		if ('top' in $$props) $$invalidate(0, top = $$props.top);
    		if ('left' in $$props) $$invalidate(1, left = $$props.left);
    		if ('resized' in $$props) $$invalidate(4, resized = $$props.resized);
    		if ('top2' in $$props) top2 = $$props.top2;
    		if ('left2' in $$props) left2 = $$props.left2;
    		if ('started' in $$props) started = $$props.started;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [top, left, $gameBackground, startDrag, resized, size];
    }

    class Resizebutton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { size: 5, top: 0, left: 1, resized: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Resizebutton",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get size() {
    		throw new Error("<Resizebutton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Resizebutton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Resizebutton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Resizebutton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<Resizebutton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Resizebutton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get resized() {
    		throw new Error("<Resizebutton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set resized(value) {
    		throw new Error("<Resizebutton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Game.svelte generated by Svelte v3.47.0 */

    const { console: console_1$1 } = globals;
    const file$1 = "src\\Game.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (162:4) {#if winner === 'X' || winner === 'O'}
    function create_if_block(ctx) {
    	let svg;
    	let line_1;
    	let animate;
    	let animate_values_value;
    	let line_1_x__value;
    	let line_1_y__value;
    	let line_1_x__value_1;
    	let line_1_y__value_1;
    	let line_1_stroke_width_value;
    	let svg_height_value;
    	let svg_width_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			line_1 = svg_element("line");
    			animate = svg_element("animate");
    			attr_dev(animate, "attributeType", "XML");
    			attr_dev(animate, "values", animate_values_value = /*winner*/ ctx[1] === 'X' ? "green;blue" : "blue;green");
    			attr_dev(animate, "attributeName", "stroke");
    			attr_dev(animate, "dur", "0.5s");
    			attr_dev(animate, "repeatCount", "5");
    			add_location(animate, file$1, 166, 12, 5501);
    			attr_dev(line_1, "class", "path--");
    			attr_dev(line_1, "x1", line_1_x__value = /*line*/ ctx[4][0]);
    			attr_dev(line_1, "y1", line_1_y__value = /*line*/ ctx[4][1]);
    			attr_dev(line_1, "x2", line_1_x__value_1 = /*line*/ ctx[4][2]);
    			attr_dev(line_1, "y2", line_1_y__value_1 = /*line*/ ctx[4][3]);
    			attr_dev(line_1, "stroke", /*$gameMarkColor*/ ctx[10]);
    			attr_dev(line_1, "opacity", "0.6");
    			attr_dev(line_1, "stroke-width", line_1_stroke_width_value = /*squareSize*/ ctx[6] / 3);
    			attr_dev(line_1, "stroke-linecap", "round");
    			add_location(line_1, file$1, 163, 8, 5285);
    			attr_dev(svg, "height", svg_height_value = /*bSize*/ ctx[0] * /*squareSize*/ ctx[6]);
    			attr_dev(svg, "width", svg_width_value = /*bSize*/ ctx[0] * /*squareSize*/ ctx[6]);
    			attr_dev(svg, "class", "svelte-1ag8sq8");
    			add_location(svg, file$1, 162, 4, 5215);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, line_1);
    			append_dev(line_1, animate);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*winner*/ 2 && animate_values_value !== (animate_values_value = /*winner*/ ctx[1] === 'X' ? "green;blue" : "blue;green")) {
    				attr_dev(animate, "values", animate_values_value);
    			}

    			if (dirty & /*line*/ 16 && line_1_x__value !== (line_1_x__value = /*line*/ ctx[4][0])) {
    				attr_dev(line_1, "x1", line_1_x__value);
    			}

    			if (dirty & /*line*/ 16 && line_1_y__value !== (line_1_y__value = /*line*/ ctx[4][1])) {
    				attr_dev(line_1, "y1", line_1_y__value);
    			}

    			if (dirty & /*line*/ 16 && line_1_x__value_1 !== (line_1_x__value_1 = /*line*/ ctx[4][2])) {
    				attr_dev(line_1, "x2", line_1_x__value_1);
    			}

    			if (dirty & /*line*/ 16 && line_1_y__value_1 !== (line_1_y__value_1 = /*line*/ ctx[4][3])) {
    				attr_dev(line_1, "y2", line_1_y__value_1);
    			}

    			if (dirty & /*$gameMarkColor*/ 1024) {
    				attr_dev(line_1, "stroke", /*$gameMarkColor*/ ctx[10]);
    			}

    			if (dirty & /*squareSize*/ 64 && line_1_stroke_width_value !== (line_1_stroke_width_value = /*squareSize*/ ctx[6] / 3)) {
    				attr_dev(line_1, "stroke-width", line_1_stroke_width_value);
    			}

    			if (dirty & /*bSize, squareSize*/ 65 && svg_height_value !== (svg_height_value = /*bSize*/ ctx[0] * /*squareSize*/ ctx[6])) {
    				attr_dev(svg, "height", svg_height_value);
    			}

    			if (dirty & /*bSize, squareSize*/ 65 && svg_width_value !== (svg_width_value = /*bSize*/ ctx[0] * /*squareSize*/ ctx[6])) {
    				attr_dev(svg, "width", svg_width_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(162:4) {#if winner === 'X' || winner === 'O'}",
    		ctx
    	});

    	return block;
    }

    // (177:2) {#each row as square, j}
    function create_each_block_1(ctx) {
    	let square;
    	let current;

    	function func() {
    		return /*func*/ ctx[16](/*i*/ ctx[25], /*j*/ ctx[28]);
    	}

    	square = new Square({
    			props: {
    				onClick: func,
    				text: /*squares*/ ctx[2][/*i*/ ctx[25]][/*j*/ ctx[28]] === '-'
    				? ''
    				: /*changeXO*/ ctx[12](/*squares*/ ctx[2][/*i*/ ctx[25]][/*j*/ ctx[28]]),
    				anim: /*i*/ ctx[25] == /*lastMove*/ ctx[3].x && /*j*/ ctx[28] == /*lastMove*/ ctx[3].y && /*visible*/ ctx[7]
    				? true
    				: false,
    				size: /*squareSize*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(square.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(square, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const square_changes = {};

    			if (dirty & /*squares*/ 4) square_changes.text = /*squares*/ ctx[2][/*i*/ ctx[25]][/*j*/ ctx[28]] === '-'
    			? ''
    			: /*changeXO*/ ctx[12](/*squares*/ ctx[2][/*i*/ ctx[25]][/*j*/ ctx[28]]);

    			if (dirty & /*lastMove, visible*/ 136) square_changes.anim = /*i*/ ctx[25] == /*lastMove*/ ctx[3].x && /*j*/ ctx[28] == /*lastMove*/ ctx[3].y && /*visible*/ ctx[7]
    			? true
    			: false;

    			if (dirty & /*squareSize*/ 64) square_changes.size = /*squareSize*/ ctx[6];
    			square.$set(square_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(square.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(square.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(square, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(177:2) {#each row as square, j}",
    		ctx
    	});

    	return block;
    }

    // (175:4) {#each squares as row, i}
    function create_each_block(ctx) {
    	let div;
    	let current;
    	let each_value_1 = /*row*/ ctx[23];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "board-row svelte-1ag8sq8");
    			add_location(div, file$1, 175, 2, 6047);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*markMove, squares, changeXO, lastMove, visible, squareSize*/ 6348) {
    				each_value_1 = /*row*/ ctx[23];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(175:4) {#each squares as row, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let resizebutton;
    	let updating_resized;
    	let current;
    	let if_block = (/*winner*/ ctx[1] === 'X' || /*winner*/ ctx[1] === 'O') && create_if_block(ctx);
    	let each_value = /*squares*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	function resizebutton_resized_binding(value) {
    		/*resizebutton_resized_binding*/ ctx[17](value);
    	}

    	let resizebutton_props = {
    		top: /*bSize*/ ctx[0] * /*squareSize*/ ctx[6],
    		left: /*bSize*/ ctx[0] * /*squareSize*/ ctx[6]
    	};

    	if (/*resizedSize*/ ctx[5] !== void 0) {
    		resizebutton_props.resized = /*resizedSize*/ ctx[5];
    	}

    	resizebutton = new Resizebutton({
    			props: resizebutton_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(resizebutton, 'resized', resizebutton_resized_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			create_component(resizebutton.$$.fragment);
    			attr_dev(div, "class", "wrapper svelte-1ag8sq8");
    			set_style(div, "background-color", /*$gameBackground*/ ctx[9]);
    			set_style(div, "width", /*bSize*/ ctx[0] * /*squareSize*/ ctx[6] + 39 + "px");
    			set_style(div, "border-color", /*borderColor*/ ctx[8]);
    			add_location(div, file$1, 160, 0, 5038);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t1);
    			mount_component(resizebutton, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*winner*/ ctx[1] === 'X' || /*winner*/ ctx[1] === 'O') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*squares, markMove, changeXO, lastMove, visible, squareSize*/ 6348) {
    				each_value = /*squares*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const resizebutton_changes = {};
    			if (dirty & /*bSize, squareSize*/ 65) resizebutton_changes.top = /*bSize*/ ctx[0] * /*squareSize*/ ctx[6];
    			if (dirty & /*bSize, squareSize*/ 65) resizebutton_changes.left = /*bSize*/ ctx[0] * /*squareSize*/ ctx[6];

    			if (!updating_resized && dirty & /*resizedSize*/ 32) {
    				updating_resized = true;
    				resizebutton_changes.resized = /*resizedSize*/ ctx[5];
    				add_flush_callback(() => updating_resized = false);
    			}

    			resizebutton.$set(resizebutton_changes);

    			if (!current || dirty & /*$gameBackground*/ 512) {
    				set_style(div, "background-color", /*$gameBackground*/ ctx[9]);
    			}

    			if (!current || dirty & /*bSize, squareSize*/ 65) {
    				set_style(div, "width", /*bSize*/ ctx[0] * /*squareSize*/ ctx[6] + 39 + "px");
    			}

    			if (!current || dirty & /*borderColor*/ 256) {
    				set_style(div, "border-color", /*borderColor*/ ctx[8]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(resizebutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(resizebutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			destroy_component(resizebutton);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function doPost() {
    	fetch('http://localhost:3001/api/position/', {
    		method: 'POST',
    		headers: { 'Content-Type': 'application/json' },
    		body: JSON.stringify({ foo: "bar" })
    	}).then(response => response.json()).then(result => console.log(result));
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let squareSize;
    	let $gameBackground;
    	let $gameMarkColor;
    	validate_store(gameBackground, 'gameBackground');
    	component_subscribe($$self, gameBackground, $$value => $$invalidate(9, $gameBackground = $$value));
    	validate_store(gameMarkColor, 'gameMarkColor');
    	component_subscribe($$self, gameMarkColor, $$value => $$invalidate(10, $gameMarkColor = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Game', slots, []);
    	let { winner = '' } = $$props;
    	let { bSize = 15 } = $$props;
    	let squares = Array(bSize).fill().map(() => Array(bSize).fill("-"));
    	let winnerLine = [];
    	let lastMove = { x: 0, y: 0 };
    	let visible = false;
    	let humanPlaysFirstMove = false;
    	let line = [0, 0, 0, 0];
    	let switchXO = false;
    	let background = '#777';

    	gameBackground.subscribe(value => {
    		background = value;
    	});

    	let borderColor = '#abc';

    	gameLineColor.subscribe(value => {
    		$$invalidate(8, borderColor = value);
    	});

    	let resizedSize = 620;

    	function markMove(x, y) {
    		if (winner !== '') return; // game over
    		if (squares[x][y] !== '-') return; // square played   
    		$$invalidate(2, squares[x][y] = 'X', squares);
    		$$invalidate(3, lastMove = { x, y });
    		$$invalidate(15, winnerLine = checkFive(x, y, squares));
    		console.log("winnerLine: " + winnerLine);
    		if (winnerLine.length > 0) return;
    		console.log("Tasuri? " + checkDraw(squares));

    		if (checkDraw(squares)) {
    			$$invalidate(1, winner = "Tasapeli");
    			return;
    		}

    		playAI();
    	} //background = "#251";    

    	async function testNode() {
    		let str = "";
    		squares.forEach(r => r.forEach(s => str += s));
    		console.log(str.length);
    		console.log(...squares[0]);

    		fetch("http://localhost:3001/api/position/" + str).then(response => response.json()).then(data => {
    			console.log(data);
    		}).catch(error => {
    			console.log(error);
    			return [];
    		});
    	}

    	function playAI() {
    		console.log("AI plays...");
    		testNode();
    		doPost();
    		if (winner !== '') return; // game over
    		let move = playMove(squares.slice());
    		$$invalidate(2, squares[move.x][move.y] = 'O', squares);
    		$$invalidate(3, lastMove = { x: move.x, y: move.y });
    		$$invalidate(15, winnerLine = checkFive(move.x, move.y, squares));
    		console.log("winnerLine: " + winnerLine);
    		console.log("Tasuri? " + checkDraw(squares));
    		if (checkDraw(squares)) $$invalidate(1, winner = "Tasapeli");
    	}

    	function newGame(size = 15) {
    		$$invalidate(0, bSize = size);
    		$$invalidate(2, squares = Array(bSize).fill().map(() => Array(bSize).fill("-")));
    		$$invalidate(15, winnerLine = []);
    		$$invalidate(1, winner = '');
    		humanPlaysFirstMove = humanPlaysFirstMove ? false : true;

    		//console.log("bSize: " + bSize);
    		if (humanPlaysFirstMove === false) {
    			let move = playMove(squares.slice());
    			$$invalidate(2, squares[move.x][move.y] = 'O', squares);
    			$$invalidate(3, lastMove = { x: move.x, y: move.y });
    		}
    	}

    	function showLastMove() {
    		$$invalidate(7, visible = true);

    		setTimeout(
    			() => {
    				$$invalidate(7, visible = false);
    			},
    			500
    		);
    	}

    	function changeXO(mark) {
    		// stupid AI play always as 'O', so we have to change it this way  
    		if (switchXO === true) return mark === 'X' ? 'O' : 'X'; else return mark;
    	}

    	const writable_props = ['winner', 'bSize'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	const func = (i, j) => markMove(i, j);

    	function resizebutton_resized_binding(value) {
    		resizedSize = value;
    		$$invalidate(5, resizedSize);
    	}

    	$$self.$$set = $$props => {
    		if ('winner' in $$props) $$invalidate(1, winner = $$props.winner);
    		if ('bSize' in $$props) $$invalidate(0, bSize = $$props.bSize);
    	};

    	$$self.$capture_state = () => ({
    		AI,
    		Square,
    		Resizebutton,
    		fade,
    		beforeUpdate,
    		afterUpdate,
    		vw,
    		gameBackground,
    		gameLineColor,
    		gameMarkColor,
    		App,
    		winner,
    		bSize,
    		squares,
    		winnerLine,
    		lastMove,
    		visible,
    		humanPlaysFirstMove,
    		line,
    		switchXO,
    		background,
    		borderColor,
    		resizedSize,
    		markMove,
    		testNode,
    		doPost,
    		playAI,
    		newGame,
    		showLastMove,
    		changeXO,
    		squareSize,
    		$gameBackground,
    		$gameMarkColor
    	});

    	$$self.$inject_state = $$props => {
    		if ('winner' in $$props) $$invalidate(1, winner = $$props.winner);
    		if ('bSize' in $$props) $$invalidate(0, bSize = $$props.bSize);
    		if ('squares' in $$props) $$invalidate(2, squares = $$props.squares);
    		if ('winnerLine' in $$props) $$invalidate(15, winnerLine = $$props.winnerLine);
    		if ('lastMove' in $$props) $$invalidate(3, lastMove = $$props.lastMove);
    		if ('visible' in $$props) $$invalidate(7, visible = $$props.visible);
    		if ('humanPlaysFirstMove' in $$props) humanPlaysFirstMove = $$props.humanPlaysFirstMove;
    		if ('line' in $$props) $$invalidate(4, line = $$props.line);
    		if ('switchXO' in $$props) switchXO = $$props.switchXO;
    		if ('background' in $$props) background = $$props.background;
    		if ('borderColor' in $$props) $$invalidate(8, borderColor = $$props.borderColor);
    		if ('resizedSize' in $$props) $$invalidate(5, resizedSize = $$props.resizedSize);
    		if ('squareSize' in $$props) $$invalidate(6, squareSize = $$props.squareSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*resizedSize, bSize*/ 33) {
    			//$: squareSize = (Math.floor(resizedSize/20)%2 === 0) ? Math.floor(resizedSize/20) + 1 : Math.floor(resizedSize/20);
    			//$: squareSize = Math.floor($vw/50 - 1) + Math.floor($vw/50)%2; // make it to be an odd number
    			//$: squareSize = resizedSize/20
    			$$invalidate(6, squareSize = Math.round(resizedSize / bSize) % 2 === 0
    			? Math.round(resizedSize / bSize) + 1
    			: Math.round(resizedSize / bSize));
    		}

    		if ($$self.$$.dirty & /*resizedSize, squareSize, bSize*/ 97) {
    			console.log("Resized: " + resizedSize + " " + squareSize + " " + Math.floor(resizedSize / bSize) % 2);
    		}

    		if ($$self.$$.dirty & /*winnerLine, squareSize, line, squares, lastMove*/ 32860) {
    			if (winnerLine.length > 0) {
    				let ss = squareSize;
    				$$invalidate(4, line[0] = Math.floor(winnerLine[1] * ss + ss / 2 + 1), line);
    				$$invalidate(4, line[1] = Math.floor(winnerLine[0] * ss + ss / 2 + 1), line);
    				$$invalidate(4, line[2] = Math.floor(winnerLine[9] * ss + ss / 2 + 1), line);
    				$$invalidate(4, line[3] = Math.floor(winnerLine[8] * ss + ss / 2 + 1), line);
    				console.log("line: " + line);
    				console.log("ss: " + ss);
    				$$invalidate(1, winner = squares[lastMove.x][lastMove.y]);
    				console.log("GAME OVER");
    			}
    		}
    	};

    	return [
    		bSize,
    		winner,
    		squares,
    		lastMove,
    		line,
    		resizedSize,
    		squareSize,
    		visible,
    		borderColor,
    		$gameBackground,
    		$gameMarkColor,
    		markMove,
    		changeXO,
    		newGame,
    		showLastMove,
    		winnerLine,
    		func,
    		resizebutton_resized_binding
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			winner: 1,
    			bSize: 0,
    			newGame: 13,
    			showLastMove: 14
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get winner() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set winner(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bSize() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bSize(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get newGame() {
    		return this.$$.ctx[13];
    	}

    	set newGame(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showLastMove() {
    		return this.$$.ctx[14];
    	}

    	set showLastMove(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.47.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let meta;
    	let html;
    	let t0;
    	let div0;
    	let h10;
    	let t2;
    	let main;
    	let div1;
    	let fieldset;
    	let legend;
    	let t4;
    	let table;
    	let tr0;
    	let th0;
    	let t6;
    	let th1;
    	let t8;
    	let tr1;
    	let td0;
    	let t9_value = /*score*/ ctx[3].X + "";
    	let t9;
    	let t10;
    	let td1;
    	let t11_value = /*score*/ ctx[3].O + "";
    	let t11;
    	let t12;
    	let br;
    	let t13;
    	let p0;

    	let t14_value = (/*win*/ ctx[0] === ''
    	? "Sinun vuorosi"
    	: "Voittaja: " + /*win*/ ctx[0]) + "";

    	let t14;
    	let t15;
    	let button0;
    	let t16;
    	let button0_disabled_value;
    	let t17;
    	let button1;
    	let t19;
    	let div2;
    	let game;
    	let updating_winner;
    	let t20;
    	let div5;
    	let h11;
    	let t22;
    	let div3;
    	let input0;
    	let t23;
    	let label0;
    	let t25;
    	let div4;
    	let input1;
    	let t26;
    	let label1;
    	let t28;
    	let p1;
    	let t29;
    	let t30;
    	let t31;
    	let button2;
    	let t33;
    	let button3;
    	let t35;
    	let input2;
    	let current;
    	let mounted;
    	let dispose;

    	function game_winner_binding(value) {
    		/*game_winner_binding*/ ctx[7](value);
    	}

    	let game_props = { bSize: /*boardSize*/ ctx[1] };

    	if (/*win*/ ctx[0] !== void 0) {
    		game_props.winner = /*win*/ ctx[0];
    	}

    	game = new Game({ props: game_props, $$inline: true });
    	binding_callbacks.push(() => bind(game, 'winner', game_winner_binding));
    	/*game_binding*/ ctx[8](game);

    	const block = {
    		c: function create() {
    			meta = element("meta");
    			html = element("html");
    			t0 = space();
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Ristinolla";
    			t2 = space();
    			main = element("main");
    			div1 = element("div");
    			fieldset = element("fieldset");
    			legend = element("legend");
    			legend.textContent = "Pelitilanne";
    			t4 = space();
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "X";
    			t6 = space();
    			th1 = element("th");
    			th1.textContent = "O";
    			t8 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			t9 = text(t9_value);
    			t10 = space();
    			td1 = element("td");
    			t11 = text(t11_value);
    			t12 = space();
    			br = element("br");
    			t13 = space();
    			p0 = element("p");
    			t14 = text(t14_value);
    			t15 = space();
    			button0 = element("button");
    			t16 = text("Uusi peli");
    			t17 = space();
    			button1 = element("button");
    			button1.textContent = "Viime siirto";
    			t19 = space();
    			div2 = element("div");
    			create_component(game.$$.fragment);
    			t20 = space();
    			div5 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Asetukset";
    			t22 = space();
    			div3 = element("div");
    			input0 = element("input");
    			t23 = space();
    			label0 = element("label");
    			label0.textContent = "Tausta";
    			t25 = space();
    			div4 = element("div");
    			input1 = element("input");
    			t26 = space();
    			label1 = element("label");
    			label1.textContent = "Reuna";
    			t28 = space();
    			p1 = element("p");
    			t29 = text("Väri: ");
    			t30 = text(/*color2*/ ctx[4]);
    			t31 = space();
    			button2 = element("button");
    			button2.textContent = "++";
    			t33 = space();
    			button3 = element("button");
    			button3.textContent = "--";
    			t35 = space();
    			input2 = element("input");
    			document.title = "Ristinolla";
    			attr_dev(meta, "name", "robots");
    			attr_dev(meta, "content", "noindex nofollow");
    			add_location(meta, file, 39, 1, 889);
    			attr_dev(html, "lang", "fi");
    			add_location(html, file, 40, 1, 941);
    			attr_dev(h10, "class", "svelte-i1ayeq");
    			add_location(h10, file, 44, 1, 1002);
    			attr_dev(div0, "class", "header svelte-i1ayeq");
    			add_location(div0, file, 43, 0, 979);
    			attr_dev(legend, "align", "center");
    			attr_dev(legend, "class", "svelte-i1ayeq");
    			add_location(legend, file, 50, 3, 1133);
    			attr_dev(th0, "class", "svelte-i1ayeq");
    			add_location(th0, file, 53, 6, 1224);
    			attr_dev(th1, "class", "svelte-i1ayeq");
    			add_location(th1, file, 54, 6, 1242);
    			attr_dev(tr0, "class", "svelte-i1ayeq");
    			add_location(tr0, file, 52, 4, 1212);
    			attr_dev(td0, "id", "xscore");
    			attr_dev(td0, "class", "scores svelte-i1ayeq");
    			add_location(td0, file, 57, 6, 1281);
    			attr_dev(td1, "id", "oscore");
    			attr_dev(td1, "class", "scores svelte-i1ayeq");
    			add_location(td1, file, 58, 6, 1334);
    			attr_dev(tr1, "class", "svelte-i1ayeq");
    			add_location(tr1, file, 56, 4, 1269);
    			attr_dev(table, "class", "scores svelte-i1ayeq");
    			add_location(table, file, 51, 3, 1184);
    			attr_dev(br, "class", "svelte-i1ayeq");
    			add_location(br, file, 61, 3, 1408);
    			attr_dev(p0, "class", "svelte-i1ayeq");
    			add_location(p0, file, 62, 3, 1417);
    			attr_dev(fieldset, "class", "svelte-i1ayeq");
    			add_location(fieldset, file, 49, 2, 1118);
    			button0.disabled = button0_disabled_value = /*win*/ ctx[0] !== '' ? false : true;
    			attr_dev(button0, "class", "svelte-i1ayeq");
    			add_location(button0, file, 65, 2, 1547);
    			attr_dev(button1, "class", "svelte-i1ayeq");
    			add_location(button1, file, 66, 2, 1661);
    			attr_dev(div1, "class", "left svelte-i1ayeq");
    			set_style(div1, "background", /*color2*/ ctx[4] + "55");
    			set_style(div1, "color", "black");
    			add_location(div1, file, 48, 1, 1044);
    			attr_dev(div2, "class", "middle svelte-i1ayeq");
    			add_location(div2, file, 69, 1, 1736);
    			attr_dev(h11, "class", "svelte-i1ayeq");
    			add_location(h11, file, 74, 2, 1949);
    			attr_dev(input0, "type", "color");
    			attr_dev(input0, "id", "head");
    			attr_dev(input0, "name", "head");
    			attr_dev(input0, "class", "svelte-i1ayeq");
    			add_location(input0, file, 76, 3, 1981);
    			attr_dev(label0, "for", "head");
    			attr_dev(label0, "class", "svelte-i1ayeq");
    			add_location(label0, file, 78, 3, 2053);
    			attr_dev(div3, "class", "svelte-i1ayeq");
    			add_location(div3, file, 75, 2, 1971);
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "id", "body");
    			attr_dev(input1, "name", "body");
    			attr_dev(input1, "class", "svelte-i1ayeq");
    			add_location(input1, file, 81, 3, 2111);
    			attr_dev(label1, "for", "body");
    			attr_dev(label1, "class", "svelte-i1ayeq");
    			add_location(label1, file, 83, 3, 2183);
    			attr_dev(div4, "class", "svelte-i1ayeq");
    			add_location(div4, file, 80, 2, 2101);
    			attr_dev(p1, "class", "svelte-i1ayeq");
    			add_location(p1, file, 85, 2, 2228);
    			attr_dev(button2, "class", "svelte-i1ayeq");
    			add_location(button2, file, 86, 2, 2253);
    			attr_dev(button3, "class", "svelte-i1ayeq");
    			add_location(button3, file, 87, 2, 2340);
    			attr_dev(input2, "type", "range");
    			attr_dev(input2, "min", "5");
    			attr_dev(input2, "max", "30");
    			attr_dev(input2, "class", "svelte-i1ayeq");
    			add_location(input2, file, 88, 2, 2427);
    			attr_dev(div5, "class", "right svelte-i1ayeq");
    			set_style(div5, "background", /*color2*/ ctx[4] + "55");
    			set_style(div5, "color", "black");
    			add_location(div5, file, 73, 1, 1874);
    			attr_dev(main, "class", "svelte-i1ayeq");
    			add_location(main, file, 47, 0, 1035);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, meta);
    			append_dev(document.head, html);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h10);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, fieldset);
    			append_dev(fieldset, legend);
    			append_dev(fieldset, t4);
    			append_dev(fieldset, table);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t6);
    			append_dev(tr0, th1);
    			append_dev(table, t8);
    			append_dev(table, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, t9);
    			append_dev(tr1, t10);
    			append_dev(tr1, td1);
    			append_dev(td1, t11);
    			append_dev(fieldset, t12);
    			append_dev(fieldset, br);
    			append_dev(fieldset, t13);
    			append_dev(fieldset, p0);
    			append_dev(p0, t14);
    			append_dev(div1, t15);
    			append_dev(div1, button0);
    			append_dev(button0, t16);
    			append_dev(div1, t17);
    			append_dev(div1, button1);
    			append_dev(main, t19);
    			append_dev(main, div2);
    			mount_component(game, div2, null);
    			append_dev(main, t20);
    			append_dev(main, div5);
    			append_dev(div5, h11);
    			append_dev(div5, t22);
    			append_dev(div5, div3);
    			append_dev(div3, input0);
    			set_input_value(input0, /*color2*/ ctx[4]);
    			append_dev(div3, t23);
    			append_dev(div3, label0);
    			append_dev(div5, t25);
    			append_dev(div5, div4);
    			append_dev(div4, input1);
    			set_input_value(input1, /*color1*/ ctx[5]);
    			append_dev(div4, t26);
    			append_dev(div4, label1);
    			append_dev(div5, t28);
    			append_dev(div5, p1);
    			append_dev(p1, t29);
    			append_dev(p1, t30);
    			append_dev(div5, t31);
    			append_dev(div5, button2);
    			append_dev(div5, t33);
    			append_dev(div5, button3);
    			append_dev(div5, t35);
    			append_dev(div5, input2);
    			set_input_value(input2, /*boardSize*/ ctx[1]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[6], false, false, false),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*gameRef*/ ctx[2].showLastMove)) /*gameRef*/ ctx[2].showLastMove.apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[9]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[10]),
    					listen_dev(button2, "click", /*click_handler_1*/ ctx[11], false, false, false),
    					listen_dev(button3, "click", /*click_handler_2*/ ctx[12], false, false, false),
    					listen_dev(input2, "change", /*input2_change_input_handler*/ ctx[13]),
    					listen_dev(input2, "input", /*input2_change_input_handler*/ ctx[13])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*score*/ 8) && t9_value !== (t9_value = /*score*/ ctx[3].X + "")) set_data_dev(t9, t9_value);
    			if ((!current || dirty & /*score*/ 8) && t11_value !== (t11_value = /*score*/ ctx[3].O + "")) set_data_dev(t11, t11_value);

    			if ((!current || dirty & /*win*/ 1) && t14_value !== (t14_value = (/*win*/ ctx[0] === ''
    			? "Sinun vuorosi"
    			: "Voittaja: " + /*win*/ ctx[0]) + "")) set_data_dev(t14, t14_value);

    			if (!current || dirty & /*win*/ 1 && button0_disabled_value !== (button0_disabled_value = /*win*/ ctx[0] !== '' ? false : true)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (!current || dirty & /*color2*/ 16) {
    				set_style(div1, "background", /*color2*/ ctx[4] + "55");
    			}

    			const game_changes = {};
    			if (dirty & /*boardSize*/ 2) game_changes.bSize = /*boardSize*/ ctx[1];

    			if (!updating_winner && dirty & /*win*/ 1) {
    				updating_winner = true;
    				game_changes.winner = /*win*/ ctx[0];
    				add_flush_callback(() => updating_winner = false);
    			}

    			game.$set(game_changes);

    			if (dirty & /*color2*/ 16) {
    				set_input_value(input0, /*color2*/ ctx[4]);
    			}

    			if (dirty & /*color1*/ 32) {
    				set_input_value(input1, /*color1*/ ctx[5]);
    			}

    			if (!current || dirty & /*color2*/ 16) set_data_dev(t30, /*color2*/ ctx[4]);

    			if (dirty & /*boardSize*/ 2) {
    				set_input_value(input2, /*boardSize*/ ctx[1]);
    			}

    			if (!current || dirty & /*color2*/ 16) {
    				set_style(div5, "background", /*color2*/ ctx[4] + "55");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(meta);
    			detach_dev(html);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);
    			/*game_binding*/ ctx[8](null);
    			destroy_component(game);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let win = '';
    	let boardSize = 18;
    	let gameRef;
    	let score = { X: 0, O: 0 };
    	let color2 = "#222222";
    	let color1 = "#777777";

    	function viewportResize() {
    		vw.set(window.visualViewport.width);
    		vh.set(window.visualViewport.height);
    	}

    	function changeSize() {
    		$$invalidate(1, boardSize += 1);
    		gameRef.newGame(boardSize);
    	}

    	window.visualViewport.addEventListener('resize', viewportResize);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => gameRef.newGame(boardSize);

    	function game_winner_binding(value) {
    		win = value;
    		$$invalidate(0, win);
    	}

    	function game_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			gameRef = $$value;
    			$$invalidate(2, gameRef);
    		});
    	}

    	function input0_input_handler() {
    		color2 = this.value;
    		$$invalidate(4, color2);
    	}

    	function input1_input_handler() {
    		color1 = this.value;
    		$$invalidate(5, color1);
    	}

    	const click_handler_1 = () => {
    		$$invalidate(1, boardSize += 1);
    		gameRef.newGame(boardSize);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(1, boardSize -= 1);
    		gameRef.newGame(boardSize);
    	};

    	function input2_change_input_handler() {
    		boardSize = to_number(this.value);
    		$$invalidate(1, boardSize);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Game,
    		gameBackground,
    		gameLineColor,
    		vw,
    		vh,
    		win,
    		boardSize,
    		gameRef,
    		score,
    		color2,
    		color1,
    		viewportResize,
    		changeSize
    	});

    	$$self.$inject_state = $$props => {
    		if ('win' in $$props) $$invalidate(0, win = $$props.win);
    		if ('boardSize' in $$props) $$invalidate(1, boardSize = $$props.boardSize);
    		if ('gameRef' in $$props) $$invalidate(2, gameRef = $$props.gameRef);
    		if ('score' in $$props) $$invalidate(3, score = $$props.score);
    		if ('color2' in $$props) $$invalidate(4, color2 = $$props.color2);
    		if ('color1' in $$props) $$invalidate(5, color1 = $$props.color1);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color2*/ 16) {
    			gameBackground.set(color2);
    		}

    		if ($$self.$$.dirty & /*color1*/ 32) {
    			gameLineColor.set(color1);
    		}

    		if ($$self.$$.dirty & /*color1*/ 32) {
    			console.log(color1);
    		}

    		if ($$self.$$.dirty & /*gameRef, boardSize*/ 6) {
    			if (gameRef !== undefined) gameRef.newGame(boardSize);
    		}

    		if ($$self.$$.dirty & /*win, score*/ 9) {
    			if (win === 'X') {
    				$$invalidate(3, score.X++, score);
    			}
    		}

    		if ($$self.$$.dirty & /*win, score*/ 9) {
    			if (win === 'O') {
    				$$invalidate(3, score.O++, score);
    			}
    		}
    	};

    	return [
    		win,
    		boardSize,
    		gameRef,
    		score,
    		color2,
    		color1,
    		click_handler,
    		game_winner_binding,
    		game_binding,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler_1,
    		click_handler_2,
    		input2_change_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body	
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
