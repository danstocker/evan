/*global troop, sntls, e$, module, test, expect, ok, equal, strictEqual, notStrictEqual, deepEqual, raises */
(function () {
    "use strict";

    module("Evented");

    var eventSpace = e$.EventSpace.create(),

        EventedStaticClass = troop.Base.extend()
            .addTrait(e$.Evented)
            .setEventSpace(eventSpace)
            .setEventPath('test>path'.toPath())
            .addMethods({
                init: function (path) {
                    e$.Evented.init.call(this);
                    this.setEventPath(path);
                }
            }),

        EventedClass = troop.Base.extend()
            .addTrait(e$.Evented)
            .addMethods({
                init: function (path) {
                    e$.Evented.init.call(this);
                    this
                        .setEventSpace(e$.EventSpace.create())
                        .setEventPath(path);
                }
            });

    test("Event path setter", function () {
        var evented = EventedClass.create('test>path'.toPath()),
            eventPath = 'foo>bar>baz'.toPath();

        evented.setEventPath(eventPath);

        strictEqual(evented.eventPath, eventPath, "should set event path");
    });

    test("Relative event path setter", function () {
        raises(function () {
            EventedStaticClass.create('foo>bar'.toPath());
        }, "should raise exception on path not relative to static path");

        var evented = EventedStaticClass.create('test>path>foo'.toPath());

        equal(evented.eventPath.toString(), 'test>path>foo', "should set relative event path");
    });

    test("Static subscription", function () {
        expect(3);

        function eventHandler() {}

        e$.EventSpace.addMocks({
            subscribeTo: function (eventName, eventPath, handler) {
                equal(eventName, 'myEvent', "should call EventSpace subscription with event name");
                equal(eventPath.toString(), 'test>path', "should pass event path to subscription method");
                strictEqual(handler, eventHandler, "should pass event handler function to subscription method");
            }
        });

        EventedStaticClass.subscribeTo('myEvent', eventHandler);

        e$.EventSpace.removeMocks();
    });

    test("Instance level subscription", function () {
        expect(3);

        var evented = EventedClass.create('test>path>foo>bar'.toPath());

        function eventHandler() {}

        e$.EventSpace.addMocks({
            subscribeTo: function (eventName, eventPath, handler) {
                equal(eventName, 'myEvent', "should call EventSpace subscription with event name");
                ok(eventPath.toString(), 'test>path>foo>bar',
                    "should pass event path to subscription method");
                strictEqual(handler, eventHandler, "should pass event handler function to subscription method");
            }
        });

        evented.subscribeTo('myEvent', eventHandler);

        e$.EventSpace.removeMocks();
    });

    test("Static unsubscription", function () {
        expect(3);

        function eventHandler() {}

        e$.EventSpace.addMocks({
            unsubscribeFrom: function (eventName, eventPath, handler) {
                equal(eventName, 'myEvent', "should call EventSpace unsubscription with event name");
                equal(eventPath.toString(), 'test>path', "should pass event path to unsubscription method");
                strictEqual(handler, eventHandler, "should pass event handler function to unsubscription method");
            }
        });

        EventedStaticClass.unsubscribeFrom('myEvent', eventHandler);

        e$.EventSpace.removeMocks();
    });

    test("Instance level unsubscription", function () {
        expect(3);

        var evented = EventedClass.create('test>path>foo>bar'.toPath());

        function eventHandler() {}

        e$.EventSpace.addMocks({
            unsubscribeFrom: function (eventName, eventPath, handler) {
                equal(eventName, 'myEvent', "should call EventSpace unsubscription with event name");
                equal(eventPath.toString(), 'test>path>foo>bar',
                    "should pass event path to unsubscription method");
                strictEqual(handler, eventHandler, "should pass event handler function to unsubscription method");
            }
        });

        evented.unsubscribeFrom('myEvent', eventHandler);

        e$.EventSpace.removeMocks();
    });

    test("Static one time subscription", function () {
        expect(3);

        function eventHandler() {}

        e$.EventSpace.addMocks({
            subscribeToUntilTriggered: function (eventName, eventPath, handler) {
                equal(eventName, 'myEvent', "should call EventSpace subscription with event name");
                equal(eventPath.toString(), 'test>path',
                    "should pass event path to subscription method");
                strictEqual(handler, eventHandler, "should pass event handler function to subscription method");
            }
        });

        EventedStaticClass.subscribeToUntilTriggered('myEvent', eventHandler);

        e$.EventSpace.removeMocks();
    });

    test("Instance level one time subscription", function () {
        expect(3);

        var evented = EventedClass.create('test>path>foo>bar'.toPath());

        function eventHandler() {}

        e$.EventSpace.addMocks({
            subscribeToUntilTriggered: function (eventName, eventPath, handler) {
                equal(eventName, 'myEvent', "should call EventSpace subscription with event name");
                equal(eventPath.toString(), 'test>path>foo>bar',
                    "should pass event path to subscription method");
                strictEqual(handler, eventHandler, "should pass event handler function to subscription method");
            }
        });

        evented.subscribeToUntilTriggered('myEvent', eventHandler);

        e$.EventSpace.removeMocks();
    });

    test("Static delegation", function () {
        expect(4);

        function eventHandler() {}

        e$.EventSpace.addMocks({
            delegateSubscriptionTo: function (eventName, capturePath, delegatePath, handler) {
                equal(eventName, 'myEvent', "should call EventSpace delegation with event name");
                equal(capturePath.toString(), 'test>path',
                    "should pass capture path to delegation method");
                equal(delegatePath.toString(), 'test>path>foo',
                    "should pass delegate path to delegation method");
                strictEqual(handler, eventHandler, "should pass event handler function to subscription method");
            }
        });

        EventedStaticClass.delegateSubscriptionTo('myEvent', 'test>path>foo'.toPath(), eventHandler);

        e$.EventSpace.removeMocks();
    });

    test("Instance level delegation", function () {
        expect(4);

        var evented = EventedClass.create('test>path>foo>bar'.toPath());

        function eventHandler() {}

        e$.EventSpace.addMocks({
            delegateSubscriptionTo: function (eventName, capturePath, delegatePath, handler) {
                equal(eventName, 'myEvent', "should call EventSpace delegation with event name");
                equal(capturePath.toString(), 'test>path>foo>bar',
                    "should pass capture path to delegation method");
                equal(delegatePath.toString(), 'test>path>foo>bar>hello>world',
                    "should pass delegate path to delegation method");
                strictEqual(handler, eventHandler, "should pass event handler function to subscription method");
            }
        });

        evented.delegateSubscriptionTo('myEvent', 'test>path>foo>bar>hello>world'.toPath(), eventHandler);

        e$.EventSpace.removeMocks();
    });

    test("Spawning event", function () {
        expect(1);

        var evented = EventedClass.create('test>path>foo>bar'.toPath());

        evented.addMocks({
            _prepareEvent: function (event) {
                strictEqual(event.eventSpace, evented.eventSpace, "should set event space of spawned event");
            }
        });

        evented.spawnEvent('event-name');
    });

    test("Triggering events", function () {
        var triggeredPaths = [],
            evented = EventedStaticClass.create('test>path>foo'.toPath());

        // subscribing handlers
        function eventHandler(event) {
            triggeredPaths.push(event.currentPath.toString());
        }

        EventedStaticClass.subscribeTo('myEvent', eventHandler);
        evented.subscribeTo('myEvent', eventHandler);

        evented.triggerSync('myEvent');

        deepEqual(triggeredPaths, ['test>path>foo', 'test>path'],
            "should hit both instance and static subscriptions");

        EventedStaticClass.unsubscribeFrom('myEvent');
        evented.unsubscribeFrom('myEvent');
    });

    test("Broadcasting", function () {
        var triggeredPaths,
            evented1 = EventedStaticClass.create('test>path>foo'.toPath()),
            evented2 = EventedStaticClass.create('test>path>bar'.toPath());

        // subscribing handlers
        function eventHandler(event) {
            triggeredPaths.push(event.currentPath.toString());
        }

        EventedStaticClass.subscribeTo('myEvent', eventHandler);
        evented1.subscribeTo('myEvent', eventHandler);
        evented2.subscribeTo('myEvent', eventHandler);

        // broadcasting on instance
        triggeredPaths = [];
        evented1.broadcastSync('myEvent');
        deepEqual(
            triggeredPaths.sort(),
            ['test>path', 'test>path>foo'],
            "should hit instance and static subscriptions when broadcasting on class"
        );

        // broadcasting on class
        triggeredPaths = [];
        EventedStaticClass.broadcastSync('myEvent');
        deepEqual(
            triggeredPaths.sort(),
            ['test>path', 'test>path>bar', 'test>path>foo'],
            "should hit all instance subscriptions when broadcasting on instance"
        );

        EventedStaticClass.unsubscribeFrom('myEvent');
        evented1.unsubscribeFrom('myEvent');
        evented2.unsubscribeFrom('myEvent');
    });
}());