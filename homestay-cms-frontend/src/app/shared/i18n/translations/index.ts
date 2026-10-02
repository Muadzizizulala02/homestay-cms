import type { Lang } from '../i18n.service';
import { BOOKING } from './booking';
import { COMMON } from './common';
import { HOME } from './home';
import { INFO } from './info';
import { ROOMS } from './rooms';

export interface TranslationSet {
  en: Record<string, string>;
  ms: Record<string, string>;
}

const SETS: TranslationSet[] = [COMMON, HOME, ROOMS, BOOKING, INFO];

/** Merged UI dictionary. Each page area owns one file; keys are prefixed by area (e.g. "home.*"). */
export const DICTIONARY: Record<Lang, Record<string, string>> = {
  en: Object.assign({}, ...SETS.map((set) => set.en)),
  ms: Object.assign({}, ...SETS.map((set) => set.ms)),
};
