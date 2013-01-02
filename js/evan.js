/**
 * Top-Level Library Namespace
 */
/*global exports, require */
/** @namespace */
var evan = {},
    dessert,
    troop;

// adding Node.js dependencies
if (typeof exports === 'object' && typeof require === 'function') {
    dessert = require('dessert-0.2.1').dessert;
    troop = require('troop-0.2.1').troop;
}