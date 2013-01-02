/**
 * Event Space
 *
 * Events traverse within a confined event space.
 */
/*global dessert, troop, evan */
troop.promise('evan.EventSpace', function () {
    var base = troop.Base,
        self;

    dessert.addTypes({
        isEventSpace: function (expr) {
            return self.isPrototypeOf(expr);
        },

        isEventSpaceOptional: function (expr) {
            return typeof expr === 'undefined' ||
                   self.isPrototypeOf(expr);
        }
    });

    self = evan.EventSpace = base.extend()
        .addMethod({
            /**
             * Adds subscription registry.
             * @constructor
             */
            init: function () {
                this
                    .addConstant({
                        /**
                         * Object serving as lookup for subscribed paths.
                         */
                        registry: {}
                    });
            }
        })
        .addPrivateMethod({
            /**
             * Bubbles an event up the path.
             * @param eventPath {EventPath}
             * @param eventName {string}
             * @param [data] {*}
             * @private
             */
            _bubble: function (eventPath, eventName, data) {
                var handlers = this.registry[eventPath.asString], // all handlers associated with path
                    i, handler, result;

                if (handlers && handlers.hasOwnProperty(eventName)) {
                    // obtaining actual list of handlers for path/eventName
                    handlers = handlers[eventName];

                    // iterating over subscribed functions
                    for (i = 0; i < handlers.length; i++) {
                        handler = handlers[i];
                        result = handler.call(this, {
                            target: eventPath.asString,
                            name  : eventName
                        }, data);

                        if (result === false) {
                            // iteration stops here and prevents further bubbling
                            return;
                        }
                    }
                }

                if (eventPath.asArray.length) {
                    this._bubble(eventPath.shrink(), eventName, data);
                }
            }
        })
        .addMethod({
            /**
             * Triggers event.
             * @param eventPath {string|string[]|EventPath} Path on which to trigger event.
             * @param eventName {string} Name of event to be triggered.
             * @param [data] {object} Extra data to be passed along with event to handlers.
             */
            trigger: function (eventPath, eventName, data) {
                if (!dessert.isEventPath(eventPath, true)) {
                    eventPath = evan.EventPath.create(eventPath);
                }

                this._bubble(eventPath, eventName, data);

                return this;
            },

            on: function () {

            },

            off: function () {

            },

            one: function () {

            }
        });

    return self;
});