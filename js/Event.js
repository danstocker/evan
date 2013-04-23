/**
 * Event
 *
 * An event is an object that may traverse in an event space.
 * Events carry all information regarding their position & properties.
 */
/*global dessert, troop, sntls, evan */
troop.promise(evan, 'Event', function () {
    "use strict";

    /**
     * @class evan.Event
     * @extends troop.Base
     */
    evan.Event = troop.Base.extend()
        .addPrivateMethod(/** @lends evan.Event */{
            /**
             * Creates a new event instance and prepares it to be triggered.
             * @param {*} data Custom event data
             * @param {sntls.Path} targetPath
             * @return {evan.Event}
             * @private
             */
            _spawnMainBroadcastEvent: function (data, targetPath) {
                return evan.Event.create(this.eventSpace, this.eventName)
                    .setBroadcastPath(targetPath)
                    .setTargetPath(targetPath)
                    .setData(data);
            },

            /**
             * Creates a new event instance and prepares it to be broadcast.
             * Broadcast events do not bubble.
             * @param {*} data Custom event data - first argument  because its bound
             * version is used in collection mapping.
             * @param {sntls.Path} broadcastPath
             * @param {sntls.Path} targetPath
             * @return {evan.Event}
             * @private
             */
            _spawnBroadcastEvent: function (data, broadcastPath, targetPath) {
                return evan.Event.create(this.eventSpace, this.eventName)
                    .allowBubbling(false)
                    .setBroadcastPath(broadcastPath)
                    .setTargetPath(targetPath)
                    .setData(data);
            },

            /**
             * Resets event properties
             * @return {evan.Event}
             * @private
             */
            _reset: function () {
                this.currentPath = undefined;
                this.originalPath = undefined;
                this.broadcastPath = undefined;
                this.data = undefined;

                return this;
            }
        })
        .addMethod(/** @lends evan.Event */{
            /**
             * @name evan.Event.create
             * @return {evan.Event}
             */

            /**
             * @param {evan.EventSpace} eventSpace Event space associated with event
             * @param {string} eventName Event name
             */
            init: function (eventSpace, eventName) {
                dessert
                    .isEventSpace(eventSpace)
                    .isString(eventName);

                this
                    .addConstant(/** @lends evan.Event */{
                        /**
                         * @type {string}
                         * @constant
                         */
                        eventName: eventName,

                        /**
                         * @type {evan.EventSpace}
                         * @constant
                         */
                        eventSpace: eventSpace
                    })
                    .addPublic(/** @lends evan.Event */{
                        /**
                         * Whether the current event can bubble
                         * @type {boolean}
                         */
                        canBubble: true,

                        /**
                         * Custom user data to be carried by the event
                         * @type {*}
                         */
                        data: undefined,

                        /**
                         * Path reflecting current state of bubbling
                         * @type {evan.EventPath}
                         */
                        currentPath: undefined,

                        /**
                         * Path on which the event was originally triggered
                         * @type {sntls.Path}
                         */
                        originalPath: undefined,

                        /**
                         * Reference to the original target path if
                         * the event was triggered as part of a broadcast.
                         * @type {sntls.Path}
                         */
                        broadcastPath: undefined
                    });
            },

            /**
             * Clones event and sets its currentPath property to
             * the one specified by the argument.
             * @param {evan.EventPath} [currentPath]
             * @return {evan.Event}
             */
            clone: function (currentPath) {
                dessert.isEventPathOptional(currentPath, "Invalid current event path");

                var /**evan.Event*/ result = evan.Event.create(this.eventSpace, this.eventName);

                result.originalPath = this.originalPath;
                result.currentPath = currentPath ?
                    currentPath.clone() :
                    this.currentPath.clone();
                result.broadcastPath = this.broadcastPath;
                result.data = this.data;

                return result;
            },

            /**
             * Sets whether the event can bubble
             * @param {boolean} value Bubbling flag
             * @return {evan.Event}
             */
            allowBubbling: function (value) {
                dessert.isBoolean(value);
                this.canBubble = value;
                return this;
            },

            /**
             * Assigns paths to the event.
             * @param {sntls.Path} targetPath Path on which to trigger event.
             * @return {evan.Event}
             */
            setTargetPath: function (targetPath) {
                dessert.isPath(targetPath, "Invalid target path");
                this.originalPath = targetPath;
                this.currentPath = targetPath.clone().asArray.toEventPath();
                return this;
            },

            /**
             * Assigns a broadcast path to the event.
             * @param {sntls.Path} broadcastPath Path associated with broadcasting.
             * @return {evan.Event}
             */
            setBroadcastPath: function (broadcastPath) {
                dessert.isPath(broadcastPath, "Invalid broadcast path");
                this.broadcastPath = broadcastPath;
                return this;
            },

            /**
             * Assigns custom data to the event.
             * @param {*} [data] Extra data to be passed along with event to handlers.
             * @return {evan.Event}
             */
            setData: function (data) {
                this.data = data;
                return this;
            },

            /**
             * Triggers event.
             * Event handlers are assumed to be synchronous. Event properties change
             * between stages of bubbling, hence holding on to an event instance in an async handler
             * may not reflect the current paths and data carried.
             * @param {sntls.Path} targetPath Path on which to trigger event.
             * @param {*} [data] Extra data to be passed along with event to handlers.
             * @return {evan.Event}
             */
            triggerSync: function (targetPath, data) {
                // preparing event for trigger
                if (targetPath) {
                    this
                        .setTargetPath(targetPath)
                        .setData(data);
                }

                dessert.assert(this.currentPath, "Event is not ready to be triggered");

                // bubbling and calling handlers
                while (this.currentPath.asArray.length) {
                    if (this.eventSpace.callHandlers(this) === false || !this.canBubble) {
                        // bubbling was deliberately stopped or event can't bubble
                        break;
                    } else {
                        this.currentPath.shrink();
                    }
                }

                // resetting path properties
                this._reset();

                return this;
            },

            /**
             * Broadcasts the event to all subscribed paths branching from the specified path.
             * Events spawned by a broadcast do not bubble except for the one that is triggered
             * on the specified broadcast path. It is necessary for delegates to react to
             * broadcasts.
             * @param {sntls.Path} broadcastPath Target root for broadcast
             * @param {*} [data] Extra data to be passed along with event to handlers.
             * @return {evan.Event}
             */
            broadcastSync: function (broadcastPath, data) {
                var eventSpace = this.eventSpace,
                    subscribedPaths = eventSpace.getPathsUnder(this.eventName, broadcastPath),
                    broadcastEvents = subscribedPaths.map(
                        this._spawnBroadcastEvent.bind(this, data, broadcastPath),
                        evan.EventCollection
                    ),
                    mainEvent = this._spawnMainBroadcastEvent(data, broadcastPath);

                // triggering all affected events
                broadcastEvents
                    .setItem('main', mainEvent)
                    .triggerSync();

                return this;
            }
        });
});

troop.promise(evan, 'EventCollection', function () {
    "use strict";

    /**
     * @name evan.EventCollection.create
     * @return {evan.EventCollection}
     */

    /**
     * @class evan.EventCollection
     * @extends sntls.Collection
     * @extends evan.Event
     */
    evan.EventCollection = sntls.Collection.of(evan.Event);
});

(function () {
    "use strict";

    dessert.addTypes(/** @lends dessert */{
        isEvent: function (expr) {
            return evan.Event.isBaseOf(expr);
        },

        isEventOptional: function (expr) {
            return typeof expr === 'undefined' ||
                   evan.Event.isBaseOf(expr);
        }
    });
}());
