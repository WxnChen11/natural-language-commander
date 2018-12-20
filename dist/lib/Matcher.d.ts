import { ISlotType, IIntent } from "./nlcInterfaces";
/**
 * Matches a utterance and slots against a command.
 */
declare class Matcher {
    private slotTypes;
    intent: IIntent;
    /** The utterance used to set up the Matcher, for finding to remove. */
    originalUtterance: string;
    /** The regexp used to match against a command. */
    private regExp;
    /** Map of the intent's slot names to slot types. */
    private slotMapping;
    /**
     * Set up a new matcher for an intent's utterance.
     * @param slotTypes - a reference to the set up slotTypes for the NLC instance.
     * @param intent - The intent this matcher is for.
     * @param utterance - The utterance this matcher is for.
     */
    constructor(slotTypes: {
        [name: string]: ISlotType;
    }, intent: IIntent, utterance: string);
    /**
     * Check if the matcher matches a command.
     * @param command - the command to match against.
     * @returns An ordered array of slot matches. Undefined if no match.
     */
    check(command: string): any[];
    /**
     * For any word in the utterance that has common misspellings, replace it with
     * a group that catches them.
     * @param utterance - The utterance.
     * @returns the utterance with replacements.
     */
    private replaceCommonMispellings;
    /** Replace runs of spaces with the space character, for better matching. */
    private replaceSpacesForRegexp;
    /** Escape braces that would cause a problem with regular expressions. */
    private replaceBracesForRegexp;
    /**
     * Replace a solt with a regex capture group.
     */
    private repaceSlotWithCaptureGroup;
    /**
     * Check text for a slotType match.
     * @param slotText - The text to match against.
     * @param slotType - The slotType name
     * @returns undefined if no match, otherwise the return value of the slot type transform.
     */
    private checkSlotMatch;
    /**
     * Check the slot text against the slot regular expression, and return the text if it matches.
     */
    private getRegexpSlot;
    /**
     * Check if the string matches the slotType, and return the type's string if it does.
     */
    private getStringSlot;
    /**
     * Check if the string matches the slotType function, and return the function's return value if it does.
     */
    private getFunctionSlotType;
    /**
     * Check if the string is contained in the string array, and return it if it does.
     */
    private getListSlotType;
    /**
     * Get the slot values in the order specified by an intent.
     * @param slotMapping - The slot values mapped to their names.
     * @returns The ordered array of slot values.
     */
    private getOrderedSlots;
}
export default Matcher;
