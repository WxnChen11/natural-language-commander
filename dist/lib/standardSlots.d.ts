/**
 * Standard slot types for the NaturalLanguageCommander
 * @module standardSlots
 */
import { ISlotType } from "./nlcInterfaces";
/** Commands to cancel a question. */
export declare const NEVERMIND: ISlotType;
/** A string of any length. */
export declare const STRING: ISlotType;
/** A string with only one word. */
export declare const WORD: ISlotType;
/** A number */
export declare const NUMBER: ISlotType;
/** A number in dollars. */
export declare const CURRENCY: ISlotType;
export declare const DATE: ISlotType;
export declare const SLACK_NAME: ISlotType;
export declare const SLACK_ROOM: ISlotType;
