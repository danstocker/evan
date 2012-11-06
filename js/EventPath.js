/**
 * Event Path
 *
 * Path that points to an event target.
 */
/*global troop, evan */
troop.promise('evan.EventPath', function () {
    var base = troop.Base,
        self;

    self = evan.EventPath = base.extend()
        .addConstant({
            RE_PATH_SEPARATOR: /\./
        })
        .addMethod({
            /**
             * @constructor
             * @path {string|string[]}
             */
            init: function (path) {
                if (self.isPrototypeOf(path)) {
                    return path;
                }

                var isArray = path instanceof Array,
                    sPath = isArray ? path.join('.') : path,
                    aPath = isArray ? path : path.split(self.RE_PATH_SEPARATOR);

                this.addConstant({
                    asArray: aPath,
                    asString: sPath,
                    length: aPath.length
                });
            },

            /**
             * Matches path to current path.
             * @param path {EventPath}
             * @return {boolean}
             */
            match: function (path) {
                return this.asString === path.asString;
            },

            /**
             * Decreases path length by one.
             * @return {EventPath} New event path instance.
             */
            shrink: function () {
                return self.create(this.asArray.slice(0, -1));
            }
        });

    return self;
});
