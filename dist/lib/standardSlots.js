"use strict";
/**
 * Standard slot types for the NaturalLanguageCommander
 * @module standardSlots
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const moment = require("moment-timezone");
// TODO: Make this configurable.
/** The timezone to use for relative dates. */
const TIMEZONE = "America/Los_Angeles";
const DATE_FORMATS = [
    "M/D/YYYY",
    "M-D-YYYY",
    "MMM D YYYY",
    "MMM D, YYYY",
    "MMMM D YYYY",
    "MMMM D, YYYY",
    "YYYY-M-D"
];
/** Commands to cancel a question. */
exports.NEVERMIND = {
    type: "NEVERMIND",
    matcher: ["nevermind", "never mind", "cancel", "exit", "back", "quit"]
};
/** A string of any length. */
exports.STRING = {
    type: "STRING",
    // Everything comes in as a string.
    matcher: _.identity
};
/** A string with only one word. */
exports.WORD = {
    type: "WORD",
    matcher: _.identity,
    baseMatcher: "\\w+"
};
// Only tries to match a single run of numbers and valid formatters.
const numberBaseMatcher = "[\\d,]+(?:\\.[\\d,]+)?";
function numberMatcher(text) {
    // Strip formatting commas.
    text = text.replace(/,/g, "");
    // Try to convert the string to a number.
    const maybeNumber = _.toNumber(text);
    // _.toNumber returns NaN if not a number.
    return isNaN(maybeNumber) ? undefined : maybeNumber;
}
/** A number */
exports.NUMBER = {
    type: "NUMBER",
    matcher: numberMatcher,
    baseMatcher: numberBaseMatcher
};
/** A number in dollars. */
exports.CURRENCY = {
    type: "CURRENCY",
    matcher: (text) => {
        if (text[0] === "$") {
            text = text.slice(1);
        }
        return numberMatcher(text);
    },
    baseMatcher: "\\$?" + numberBaseMatcher
};
exports.DATE = {
    type: "DATE",
    matcher: (dateString) => {
        /*
         * Realitive dates.
         */
        if (dateString === "today") {
            return moment()
                .tz(TIMEZONE)
                .startOf("day");
        }
        if (dateString === "tomorrow") {
            return moment()
                .tz(TIMEZONE)
                .startOf("day")
                .add(1, "day");
        }
        if (dateString === "yesterday") {
            return moment()
                .tz(TIMEZONE)
                .startOf("day")
                .subtract(1, "day");
        }
        /*
         * Specific dates.
         */
        // Try parsing the date with moment.
        const parsedDate = moment(dateString, DATE_FORMATS, true);
        // Retun the date if it's valid.
        if (parsedDate.isValid()) {
            return parsedDate;
        }
    }
};
exports.SLACK_NAME = {
    type: "SLACK_NAME",
    // Names start with @.
    matcher: /^@\w+/i,
    baseMatcher: "@\\w+"
};
exports.SLACK_ROOM = {
    type: "SLACK_ROOM",
    // Rooms start with #, but names work too.
    matcher: /^[#@]\w+/i,
    baseMatcher: "[#@]\\w+"
};
//# sourceMappingURL=standardSlots.js.map