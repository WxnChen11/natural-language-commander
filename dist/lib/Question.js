"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Represents a registered question. */
class Question {
    constructor(parentNlc, questionData) {
        this.questionData = questionData;
        this.JUST_THE_SLOT_UTTERANCE = ["{Slot}"];
        // Set up a new NLC instance, with access to the parent slot types.
        this.nlc = parentNlc.clone();
        this.name = this.questionData.name;
        // Register the cancel intent first, so it matches first.
        if (this.questionData.cancelCallback) {
            this.nlc.registerIntent(this.cancelIntent);
        }
        // Register an intent for the question.
        this.nlc.registerIntent(this.questionIntent);
    }
    ask(data) {
        this.questionData.questionCallback(data);
    }
    /**
     * Check an answer against the question matcher.
     */
    answer(answer, data) {
        let commandPromise;
        // Handle the command, passing along data only if specified.
        if (data === undefined) {
            commandPromise = this.nlc.handleCommand(answer);
        }
        else {
            commandPromise = this.nlc.handleCommand(data, answer);
        }
        return commandPromise.catch(() => {
            // Handle the failure.
            this.questionData.failCallback(data);
            // Rethrow to pass the error along.
            throw new Error();
        });
    }
    /** A standard intent pulled from the question intent. */
    get questionIntent() {
        const utterances = this.questionData.utterances || this.JUST_THE_SLOT_UTTERANCE;
        return {
            utterances,
            intent: this.name,
            slots: [
                {
                    name: "Slot",
                    type: this.questionData.slotType
                }
            ],
            callback: this.questionData.successCallback
        };
    }
    /** An intent for cancelling the question. */
    get cancelIntent() {
        const utterances = this.questionData.utterances || this.JUST_THE_SLOT_UTTERANCE;
        return {
            intent: "CANCEL",
            slots: [
                {
                    name: "Slot",
                    type: "NEVERMIND"
                }
            ],
            utterances: this.JUST_THE_SLOT_UTTERANCE,
            callback: this.questionData.cancelCallback
        };
    }
}
exports.default = Question;
//# sourceMappingURL=Question.js.map