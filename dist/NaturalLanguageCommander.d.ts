import { ISlotType, IHandleCommandOptions, IAskOptions, IIntent, IQuestion } from "./lib/nlcInterfaces";
/** Holds registered natural language commands. */
declare class NaturalLanguageCommander {
    /** List of registered slot types. */
    private slotTypes;
    private intentNames;
    private intents;
    private questions;
    private activeQuestions;
    private matchers;
    private notFoundCallback;
    /**
     * Sets up the nlc instance with the default stop types.
     */
    constructor();
    /**
     * Add a custom slot type. Bound to this.
     * @param slotType
     */
    addSlotType: (slotType: ISlotType) => void;
    /**
     * Remove a custom slot type by name. Throws an error if any existing intents
     * rely on the slot type.
     * @param slotTypeName
     */
    removeSlotType: (slotTypeName: string) => void;
    /**
     * Register an intent. Bound to this.
     * @param intent
     * @returns true if added, false if the intent name already exists.
     */
    registerIntent: (intent: IIntent) => boolean;
    /**
     * De-register an intent. Bound to this.
     * @param intentName
     * @returns true if removed, false if the intent doesn't exist.
     */
    deregisterIntent: (intentName: string) => boolean;
    /**
     * Register a question. Bound to this.
     * @param intent
     * @returns true if added, false if the intent name already exists.
     */
    registerQuestion: (questionData: IQuestion) => boolean;
    /**
     * De-register a question. Bound to this.
     * @param questionName
     * @returns true if removed, false if the question doesn't exist.
     */
    deregisterQuestion: (questionName: string) => boolean;
    /**
     * Register a callback to be called when a command doesn't match.
     * Isn't called when an answer command doesn't match, since that is handled
     * elsewhere.
     * @param data - Arbitrary data to pass to the callback.
     * @param callback - Callback to run on failure. Optionally passed data from handleCommand.
     */
    registerNotFound(callback: (data?: any) => void): void;
    /**
     * Get a fresh copy of this instance of NLC, but with the same slotTypes
     * already registered.
     * @returns the fresh instance.
     */
    clone(): NaturalLanguageCommander;
    /**
     * Add an utterance to an existing intent.
     * @param intentName - The name of the intent to add to.
     * @param utterance - The utterance string to add.
     * @returns False if the intent was not found or the utterance already exists. Otherwise true.
     */
    addUtterance(intentName: string, utterance: string): boolean;
    /**
     * Remove an utterance from an existing intent.
     * @param intentName - The name of the intent to add to.
     * @param utterance - The utterance string to add.
     * @returns False if the intent was not found or the utterance does not exist. Otherwise true.
     */
    removeUtterance(intentName: string, utterance: string): boolean;
    /**
     * Handle a user's command by checking for a matching intent, and calling that intent's callback.
     * @param data - Arbitrary data to pass to the callback.
     * @param command - The command to match against.
     * @param userId - any unqiue identifier for a user.
     * @returns a promise resolved with the name of the matched intent, or rejected if no match.
     * If the user had an active question, resolved or rejected with the name of the question intent.
     */
    handleCommand(data: any, command: string): Promise<string>;
    handleCommand(command: string): Promise<string>;
    handleCommand(options: IHandleCommandOptions): Promise<string>;
    /**
     * Have NLC listen ask a question and listen for an answer for a given user.
     * Calling this while a question is active for the user replace the old question.
     * @param question - An intent name from a question intent.
     * @param options.data - arbitrary data to pass along.
     * @param options.userId - any unqiue identifier for a user.
     * @param options.question - An intent name from a question intent.
     * @returns false if questionName not found, true otherwise.
     */
    ask(options: IAskOptions): Promise<boolean>;
    ask(question: string): Promise<boolean>;
    /**
     * Cleans up a command for processing.
     * @param command - the user's command.
     */
    private cleanCommand;
    private doesIntentExist;
    /**
     * Look up the active question for a user (if any). If the userId is undefined,
     * check the anonymous user.
     */
    private getActiveQuestion;
    /**
     * Set the active question for a user.
     */
    private setActiveQuestion;
    /**
     * Deactive a question once the user has answered it.
     */
    private finishQuestion;
    /** Handle a command for an active question. */
    private handleQuestionAnswer;
    /** Handle a command normally. */
    private handleNormalCommand;
}
export = NaturalLanguageCommander;
