"use strict";
const _ = require("lodash");
const Deferred_1 = require("./lib/Deferred");
const Matcher_1 = require("./lib/Matcher");
const Question_1 = require("./lib/Question");
const constants_1 = require("./lib/constants");
// Use setImmediate in node and FF, or the slower setTimeout otherwise,
// to delay a resolve so it is always async.
const delay = typeof setImmediate === "function" ? setImmediate : setTimeout;
/** Holds registered natural language commands. */
class NaturalLanguageCommander {
    /**
     * Sets up the nlc instance with the default stop types.
     */
    constructor() {
        /**
         * Add a custom slot type. Bound to this.
         * @param slotType
         */
        this.addSlotType = (slotType) => {
            // Don't allow users to overwrite slot types.
            if (this.slotTypes[slotType.type]) {
                throw new Error(`NLC: Slot Type ${slotType} already exists!`);
            }
            // Get the matcher, so the ts type guards work.
            const matcher = slotType.matcher;
            // Lowercase the slot type matcher.
            if (_.isString(matcher)) {
                slotType.matcher = matcher.toLowerCase();
            }
            else if (_.isArray(matcher)) {
                slotType.matcher = _.map(matcher, (option) => option.toLowerCase());
            }
            // Save the new type.
            this.slotTypes[slotType.type] = slotType;
        };
        /**
         * Remove a custom slot type by name. Throws an error if any existing intents
         * rely on the slot type.
         * @param slotTypeName
         */
        this.removeSlotType = (slotTypeName) => {
            const intentUsingSlotType = _.find(this.intents, intent => {
                const slotTypes = _.map(intent.slots || [], slot => slot.type);
                return _.includes(slotTypes, slotTypeName);
            });
            if (intentUsingSlotType) {
                throw new Error(`NLC: You can't remove the ${slotTypeName} Slot Type while the ${intentUsingSlotType.intent} intent relies on it.`);
            }
            delete this.slotTypes[slotTypeName];
        };
        /**
         * Register an intent. Bound to this.
         * @param intent
         * @returns true if added, false if the intent name already exists.
         */
        this.registerIntent = (intent) => {
            // Don't allow duplicate intents.
            if (this.doesIntentExist(intent.intent)) {
                return false;
            }
            // Push in the intent.
            this.intents.push(intent);
            // Record the intent name for checking for duplicates.
            this.intentNames.push(intent.intent);
            // Push in the utterance matchers.
            _.forEach(intent.utterances, (utterance) => {
                this.matchers.push(new Matcher_1.default(this.slotTypes, intent, utterance));
            });
            return true;
        };
        /**
         * De-register an intent. Bound to this.
         * @param intentName
         * @returns true if removed, false if the intent doesn't exist.
         */
        this.deregisterIntent = (intentName) => {
            if (!this.doesIntentExist(intentName)) {
                return false;
            }
            // Remove the name from the name list.
            this.intentNames = _.reject(this.intentNames, name => name === intentName);
            // Remove the intent.
            this.intents = _.reject(this.intents, { intent: intentName });
            // Remove matchers for the intent.
            this.matchers = _.reject(this.matchers, matcher => matcher.intent.intent === intentName);
            return true;
        };
        /**
         * Register a question. Bound to this.
         * @param intent
         * @returns true if added, false if the intent name already exists.
         */
        this.registerQuestion = (questionData) => {
            // Don't allow duplicate intents.
            if (this.doesIntentExist(questionData.name)) {
                return false;
            }
            // Record the question name for checking for duplicates.
            this.intentNames.push(questionData.name);
            // Set up the question.
            this.questions[questionData.name] = new Question_1.default(this, questionData);
            return true;
        };
        /**
         * De-register a question. Bound to this.
         * @param questionName
         * @returns true if removed, false if the question doesn't exist.
         */
        this.deregisterQuestion = (questionName) => {
            if (!this.doesIntentExist(questionName)) {
                return false;
            }
            // Remove from the namelist.
            this.intentNames = _.reject(this.intentNames, name => name === questionName);
            // Remove from the questions dictionary.
            delete this.questions[questionName];
            return true;
        };
        this.slotTypes = {};
        this.intentNames = [];
        this.intents = [];
        this.questions = {};
        this.activeQuestions = {};
        this.matchers = [];
        // Noop the notFoundCallback.
        this.notFoundCallback = () => { };
        // Add the standard slot types.
        // _.forOwn(standardSlots, this.addSlotType);
    }
    /**
     * Register a callback to be called when a command doesn't match.
     * Isn't called when an answer command doesn't match, since that is handled
     * elsewhere.
     * @param data - Arbitrary data to pass to the callback.
     * @param callback - Callback to run on failure. Optionally passed data from handleCommand.
     */
    registerNotFound(callback) {
        this.notFoundCallback = callback;
    }
    /**
     * Get a fresh copy of this instance of NLC, but with the same slotTypes
     * already registered.
     * @returns the fresh instance.
     */
    clone() {
        const nlc = new NaturalLanguageCommander();
        nlc.slotTypes = this.slotTypes;
        return nlc;
    }
    /**
     * Add an utterance to an existing intent.
     * @param intentName - The name of the intent to add to.
     * @param utterance - The utterance string to add.
     * @returns False if the intent was not found or the utterance already exists. Otherwise true.
     */
    addUtterance(intentName, utterance) {
        // Get the intent by name.
        const intent = _.find(this.intents, (intent) => intent.intent === intentName);
        // If not found, return.
        if (!intent) {
            return false;
        }
        // If the utterance already exists, return false.
        if (_.includes(intent.utterances, utterance)) {
            return false;
        }
        // Add the utterance to the intent.
        intent.utterances.push(utterance);
        // Add the utterance to the matchers list.
        this.matchers.push(new Matcher_1.default(this.slotTypes, intent, utterance));
        return true;
    }
    /**
     * Remove an utterance from an existing intent.
     * @param intentName - The name of the intent to add to.
     * @param utterance - The utterance string to add.
     * @returns False if the intent was not found or the utterance does not exist. Otherwise true.
     */
    removeUtterance(intentName, utterance) {
        // Get the intent by name.
        const intent = _.find(this.intents, (intent) => intent.intent === intentName);
        // If not found, return.
        if (!intent) {
            return false;
        }
        // If the utterance does not exist, return false.
        if (!_.includes(intent.utterances, utterance)) {
            return false;
        }
        // Remove the utterance from the intent.
        intent.utterances = _.reject(intent.utterances, intentUtterance => intentUtterance === utterance);
        // Remove matchers for the intent.
        this.matchers = _.reject(this.matchers, matcher => matcher.originalUtterance === utterance);
        return true;
    }
    handleCommand(dataOrCommandOrOptions, command) {
        const deferred = new Deferred_1.default();
        // Handle overload.
        let data;
        let userId;
        if (_.isString(dataOrCommandOrOptions) && !command) {
            // 2nd signature.
            command = dataOrCommandOrOptions;
        }
        else if (command) {
            // 1st signature.
            data = dataOrCommandOrOptions;
        }
        else {
            // 3rd signature.
            command = dataOrCommandOrOptions.command;
            data = dataOrCommandOrOptions.data;
            userId = dataOrCommandOrOptions.userId;
        }
        if (!_.isString(command)) {
            throw new Error(`NLC: ${command} must be a string!`);
        }
        // Clean up the input.
        command = this.cleanCommand(command);
        // Delay to ensure this is async.
        delay(() => {
            const commandResult = this.handleNormalCommand(data, command);
            // If the command was successful:
            if (commandResult && commandResult.length > 0) {
                // Resolve with the intent name, for logging.
                deferred.resolve(commandResult);
                return;
            }
            // If not successful, check if there's an active question for the user.
            if (this.getActiveQuestion(userId)) {
                // If there is one, answer it and handle the deferred in there.
                this.handleQuestionAnswer(deferred, data, command, userId);
            }
            else {
                // Otherwise call the not found handler, since there was no match.
                this.notFoundCallback(data);
                // Also reject the promise for logging.
                deferred.reject();
            }
        });
        return deferred.promise;
    }
    ask(optionsOrQuestion) {
        const deferred = new Deferred_1.default();
        // Handle overload.
        let data;
        let userId;
        let questionName;
        if (_.isString(optionsOrQuestion)) {
            questionName = optionsOrQuestion;
        }
        else {
            userId = optionsOrQuestion.userId;
            data = optionsOrQuestion.data;
            questionName = optionsOrQuestion.question;
        }
        // Pull the question from the list of registered questions.
        const question = this.questions[questionName];
        // If the question exists, make it active.
        if (question) {
            // Make the question active.
            this.setActiveQuestion(userId, question);
        }
        // Delay for async.
        delay(() => {
            if (question) {
                // Ask the question after a delay.
                question.ask(data || userId);
                // Resolve.
                deferred.resolve(true);
            }
            else {
                // Reject the promise if the question isn't set up.
                deferred.reject(false);
            }
        });
        return deferred.promise;
    }
    /**
     * Cleans up a command for processing.
     * @param command - the user's command.
     */
    cleanCommand(command) {
        return (command
            // Replace smart single quotes.
            .replace(/[\u2018\u2019]/g, "'")
            // Replace smart double quotes.
            .replace(/[\u201C\u201D]/g, '"')
            .trim());
    }
    doesIntentExist(intentName) {
        return _.includes(this.intentNames, intentName);
    }
    /**
     * Look up the active question for a user (if any). If the userId is undefined,
     * check the anonymous user.
     */
    getActiveQuestion(userId) {
        return this.activeQuestions[userId || constants_1.ANONYMOUS];
    }
    /**
     * Set the active question for a user.
     */
    setActiveQuestion(userId, question) {
        this.activeQuestions[userId || constants_1.ANONYMOUS] = question;
    }
    /**
     * Deactive a question once the user has answered it.
     */
    finishQuestion(userId) {
        this.setActiveQuestion(userId, undefined);
    }
    /** Handle a command for an active question. */
    handleQuestionAnswer(deferred, data, command, userId) {
        // If this user has an active question, grab it.
        const question = this.getActiveQuestion(userId);
        const questionName = question.name;
        // Finish the question before the answer is processed, in case the answer
        // kicks off another question.
        this.finishQuestion(userId);
        // Try to answer the question with the command.
        question
            .answer(command, data || userId)
            .then(() => {
            // If the answer matched, resolve with the question name.
            deferred.resolve(questionName);
        })
            .catch(() => {
            this.finishQuestion(userId);
            // If the answer failed, reject with the question name, so any
            // logger knows what question failed.
            deferred.reject(questionName);
        });
    }
    /** Handle a command normally. */
    handleNormalCommand(data, command) {
        let matchesAndSlots = {};
        let shouldAddWholeMatches = true;
        // Handle a normal command.
        _.forEach(this.matchers, (matcher) => {
            /** Flag if there was a match */
            let foundMatchName;
            let foundSlots;
            /** The slots from the match or [], if the match was found. */
            const matchResults = matcher.check(command);
            // If matchResults is undefined, the match failed.
            if (matchResults) {
                const orderedSlots = matchResults.slots;
                const wholeMatch = matchResults.whole_match;
                if (data) {
                    // Add the data as the first arg, if specified.
                    orderedSlots.unshift(data);
                }
                // Call the callback with the slot values in order.
                matcher.intent.callback.apply(null, orderedSlots);
                foundSlots = orderedSlots;
                // Flag that a match was found.
                foundMatchName = matcher.intent.intent;
                // First encounter of an non-whole match, wipe map
                if (!wholeMatch && shouldAddWholeMatches) {
                    matchesAndSlots = {};
                    shouldAddWholeMatches = false;
                }
                if (!wholeMatch || (wholeMatch && shouldAddWholeMatches)) {
                    const slots_length = foundSlots.reduce((a, c) => a + c ? c.length : 0, 0);
                    let old_slots_length = 0;
                    if (matchesAndSlots.foundMatchName) {
                        old_slots_length = matchesAndSlots.foundMatchName.slots.reduce((a, c) => a + c ? c.length : 0, 0);
                    }
                    if (!matchesAndSlots.foundMatchName || slots_length < old_slots_length) {
                        matchesAndSlots[foundMatchName] = foundSlots;
                    }
                }
            }
        });
        return _.map(matchesAndSlots, (slots, name) => ({ name, slots }));
    }
}
module.exports = NaturalLanguageCommander;
//# sourceMappingURL=NaturalLanguageCommander.js.map