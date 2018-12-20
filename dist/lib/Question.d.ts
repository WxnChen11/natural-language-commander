import NaturalLanguageCommander = require("../NaturalLanguageCommander");
import { IQuestion } from "./nlcInterfaces";
/** Represents a registered question. */
declare class Question {
    private questionData;
    name: string;
    private nlc;
    private JUST_THE_SLOT_UTTERANCE;
    constructor(parentNlc: NaturalLanguageCommander, questionData: IQuestion);
    ask(data: any): void;
    /**
     * Check an answer against the question matcher.
     */
    answer(answer: string, data: any): Promise<string>;
    /** A standard intent pulled from the question intent. */
    private readonly questionIntent;
    /** An intent for cancelling the question. */
    private readonly cancelIntent;
}
export default Question;
