"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const commonMistakes_1 = require("./commonMistakes");
/**
 * Matches a utterance and slots against a command.
 */
class Matcher {
    /**
     * Set up a new matcher for an intent's utterance.
     * @param slotTypes - a reference to the set up slotTypes for the NLC instance.
     * @param intent - The intent this matcher is for.
     * @param utterance - The utterance this matcher is for.
     */
    constructor(slotTypes, intent, utterance) {
        this.slotTypes = slotTypes;
        this.intent = intent;
        this.originalUtterance = utterance;
        const slots = this.intent.slots;
        const slotMapping = [];
        // Handle slot replacement.
        if (slots && slots.length) {
            // A lazy regexp that looks for words in curly braces.
            // Don't use global, so it checks the new utterance fresh every time.
            const slotRegexp = /{(\w+?)}/;
            const names = _.map(slots, "name");
            let matchIndex;
            // Loop while there are still slots left.
            while ((matchIndex = utterance.search(slotRegexp)) !== -1) {
                /** The name of the slot, not including the braces. */
                const slotName = utterance.match(slotRegexp)[1];
                /** The length of the whole slot match. */
                const matchLength = utterance.match(slotRegexp)[0].length;
                // Check if the slot name matches the intent's slot names.
                if (_.includes(names, slotName)) {
                    // Find where in the slot names array this slot is.
                    const slotIndex = names.indexOf(slotName);
                    // Find the matching intent slot.
                    const slot = slots[slotIndex];
                    // Find the matching slot type.
                    const slotType = this.slotTypes[slot.type];
                    // Handle bad slot type.
                    if (!slotType) {
                        throw new Error(`NLC: slot type ${slot.type} does not exist!`);
                    }
                    // Update the utterance.
                    utterance = this.repaceSlotWithCaptureGroup(utterance, slotType, matchIndex, matchLength);
                    // Record the match ordering for this slot in the utterance.
                    slotMapping.push(slot);
                }
                else {
                    // Throw an error so the user knows they used a bad slot.
                    // TODO: Handle intentional slot-looking charater runs with escaping or something?
                    throw new Error(`NLC: slot "${slotName}" not included in slots ${JSON.stringify(names)} for ${intent.intent}!`);
                }
            }
        }
        // Do some regex-readying on the utterance.
        utterance = this.replaceCommonMispellings(utterance);
        utterance = this.replaceSpacesForRegexp(utterance);
        utterance = this.replaceBracesForRegexp(utterance);
        // Add the start carat, so this only matches the start of commands,
        // which helps with collisions.
        utterance = "^\\s*" + utterance;
        // Compile the regular expression, ignore case.
        this.regExp = new RegExp(utterance, "i");
        // Store the mapping for later retrieval.
        this.slotMapping = slotMapping;
    }
    /**
     * Check if the matcher matches a command.
     * @param command - the command to match against.
     * @returns An ordered array of slot matches. Undefined if no match.
     */
    check(command) {
        /** The matches for the slots. */
        const matches = command.match(this.regExp);
        // If the command didn't match, failure.
        if (!matches) {
            return;
        }
        // If it matched, and there are no slots, success!
        // Return an empty slotMapping, so the function returns truthy.
        if (this.slotMapping.length === 0) {
            return [];
        }
        // Remove the first, global match, we don't need it.
        matches.shift();
        // Flag if there was a bad match.
        let badMatch = false;
        /** Map the slotNames to the matched data. */
        const matchedSlots = {};
        // Check each slot to see if it matches.
        _.forEach(this.slotMapping, (slot, i) => {
            const slotText = matches[i];
            const slotData = this.checkSlotMatch(slotText, slot.type);
            // If the slot didn't match, note the bad match, and exit early.
            // Allow the value 0 to match.
            if (slotData === undefined || slotData === "") {
                badMatch = true;
                return false;
            }
            // Associate the slot data with the name.
            matchedSlots[slot.name] = slotData;
        });
        // If there were no bad maches, return the slots. Otherwise return nothing.
        if (!badMatch) {
            return this.getOrderedSlots(matchedSlots);
        }
    }
    // ==============================
    // Constructor methods
    // ==============================
    /**
     * For any word in the utterance that has common misspellings, replace it with
     * a group that catches them.
     * @param utterance - The utterance.
     * @returns the utterance with replacements.
     */
    replaceCommonMispellings(utterance) {
        // Split utterance into words, removing duplicates.
        const words = _.chain(utterance)
            .words()
            .uniq()
            .value();
        _.forEach(words, word => {
            // Get the mistake checker, if there is one.
            const mistakeReplacement = commonMistakes_1.default(word);
            if (mistakeReplacement) {
                // Replace all instances of the word with the replacement, if there is one.
                utterance = utterance.replace(new RegExp(word, "ig"), mistakeReplacement);
            }
        });
        return utterance;
    }
    /** Replace runs of spaces with the space character, for better matching. */
    replaceSpacesForRegexp(utterance) {
        return _.replace(utterance, /\s+/g, "\\s+");
    }
    /** Escape braces that would cause a problem with regular expressions. */
    replaceBracesForRegexp(utterance) {
        utterance
            .replace("[", "\\[")
            .replace("]", "\\]")
            .replace("(", "\\(")
            .replace(")", "\\)");
        return utterance;
    }
    /**
     * Replace a solt with a regex capture group.
     */
    repaceSlotWithCaptureGroup(utterance, slotType, matchIndex, matchLength) {
        // Find the end of the slot name (accounting for braces).
        const lastIndex = matchIndex + matchLength;
        const matcher = slotType.baseMatcher || ".+";
        // Replace the slot with a generic capture group.
        return `${utterance.slice(0, matchIndex)}(${matcher})${utterance.slice(lastIndex)}`;
    }
    // ==============================
    // Check methods
    // ==============================
    /**
     * Check text for a slotType match.
     * @param slotText - The text to match against.
     * @param slotType - The slotType name
     * @returns undefined if no match, otherwise the return value of the slot type transform.
     */
    checkSlotMatch(slotText, slotTypeName) {
        // Handle unknown slot types.
        if (!this.slotTypes[slotTypeName]) {
            throw new Error(`NLC: Slot Type ${slotTypeName} not found!`);
        }
        const slotType = this.slotTypes[slotTypeName];
        const slotOptions = slotType.matcher;
        // Match the slot based on the type.
        if (_.isRegExp(slotOptions)) {
            return this.getRegexpSlot(slotText, slotOptions);
        }
        if (_.isString(slotOptions)) {
            return this.getStringSlot(slotText, slotOptions);
        }
        if (_.isArray(slotOptions)) {
            return this.getListSlotType(slotText, slotOptions);
        }
        return this.getFunctionSlotType(slotText, slotOptions);
    }
    /**
     * Check the slot text against the slot regular expression, and return the text if it matches.
     */
    getRegexpSlot(slotText, slotType) {
        if (slotType.test(slotText)) {
            return slotText;
        }
    }
    /**
     * Check if the string matches the slotType, and return the type's string if it does.
     */
    getStringSlot(slotText, slotType) {
        if (slotText.toLowerCase() === slotType) {
            return slotText;
        }
    }
    /**
     * Check if the string matches the slotType function, and return the function's return value if it does.
     */
    getFunctionSlotType(slotText, slotType) {
        return slotType(slotText);
    }
    /**
     * Check if the string is contained in the string array, and return it if it does.
     */
    getListSlotType(slotText, slotType) {
        if (_.includes(slotType, slotText.toLowerCase())) {
            return slotText;
        }
    }
    /**
     * Get the slot values in the order specified by an intent.
     * @param slotMapping - The slot values mapped to their names.
     * @returns The ordered array of slot values.
     */
    getOrderedSlots(slotMapping) {
        // Loop through the intent's slot ordering.
        return _.map(this.intent.slots, (slot) => {
            // Add the slot values in order.
            return slotMapping[slot.name];
        });
    }
}
exports.default = Matcher;
//# sourceMappingURL=Matcher.js.map