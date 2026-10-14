/**
 * Indian Legal Drafting - Hindi Transliteration & Keyboard Layouts Engine
 * Supports:
 * 1. Phonetic (हिंग्लिश / ध्वन्यात्मक): Natural English typing -> Devanagari Unicode
 * 2. Remington GAIL / Kruti Dev 010: High Court & District Court Typewriter Layout
 * 3. InScript: Official Government of India Devanagari Standard
 */

// 1. High-Priority Legal, Judicial & Everyday Vocabulary Dictionary
export const HINDI_DICTIONARY: Record<string, string> = {
  // Court & Judicial System
  court: "कोर्ट",
  highcourt: "हाई कोर्ट",
  supremecourt: "सुप्रीम कोर्ट",
  districtcourt: "जिला न्यायालय",
  judge: "न्यायाधीश",
  judgement: "निर्णय",
  nyayalaya: "न्यायालय",
  adalat: "अदालत",
  yachika: "याचिका",
  aavedan: "आवेदन",
  prarthana: "प्रार्थना",
  shapath: "शपथ",
  shapathpatra: "शपथपत्र",
  halafnama: "हलफनामा",
  affidavit: "हलफनामा",
  zamanat: "जमानत",
  jamanat: "जमानत",
  bail: "जमानत",
  aropi: "आरोपी",
  vakil: "वकील",
  vakeel: "वकील",
  advocate: "अधिवक्ता",
  adhivakta: "अधिवक्ता",
  vakalatnama: "वकालतनामा",
  kanoon: "कानून",
  kanun: "कानून",
  dhara: "धारा",
  adhiniyam: "अधिनियम",
  sanhita: "संहिता",
  police: "पुलिस",
  thana: "थाना",
  mukadma: "मुकदमा",
  faisla: "फैसला",
  aadesh: "आदेश",
  tareekh: "तारीख",
  tarikh: "तारीख",
  peshi: "पेशी",
  gavah: "गवाह",
  saboot: "सबूत",
  bayan: "बयान",
  karyavahi: "कार्रवाई",
  nirnay: "निर्णय",
  dharohar: "धरोहर",
  hinsa: "हिंसा",
  dosh: "दोष",
  doshi: "दोषी",
  nirdosh: "निर्दोष",
  kramank: "क्रमांक",
  vivaran: "विवरण",
  satya: "सत्य",
  satyapan: "सत्यापन",
  satyapit: "सत्यापित",
  deponent: "शपथकर्ता",
  shapathkarta: "शपथकर्ता",
  applicant: "आवेदक",
  aavedak: "आवेदक",
  accused: "अभियुक्त",
  abhiyukt: "अभियुक्त",
  respondent: "उत्तरदाता",
  uttardata: "उत्तरदाता",
  petitioner: "याचिकाकर्ता",
  yachikakarta: "याचिकाकर्ता",
  versus: "बनाम",
  banam: "बनाम",
  vs: "बनाम",
  notice: "नोटिस",
  jurmana: "जुर्माना",
  dand: "दंड",
  karyalay: "कार्यालय",

  // Top Indian States & Court Locations
  bharat: "भारत",
  india: "इंडिया",
  delhi: "दिल्ली",
  newdelhi: "नई दिल्ली",
  rajasthan: "राजस्थान",
  haryana: "हरियाणा",
  punjab: "पंजाब",
  uttarpradesh: "उत्तर प्रदेश",
  bihar: "बिहार",
  mumbai: "मुंबई",
  bombay: "बॉम्बे",
  kolkata: "कोलकाता",
  calcutta: "कलकत्ता",
  allahabad: "इलाहाबाद",
  prayagraj: "प्रयागराज",
  jaipur: "जयपुर",
  jodhpur: "जोधपुर",
  chandigarh: "चंडीगढ़",
  shri: "श्री",
  shrimati: "श्रीमती",
  kumar: "कुमार",
  singh: "सिंह",
  sharma: "शर्मा",
  verma: "वर्मा",
  gupta: "गुप्ता",
  yadav: "यादव",
  mangal: "मंगल",
  krutidev: "कृतिदेव",
  kurtidev: "कृतिदेव",
  chanakya: "चाणक्य",
  aparajita: "अपराजिता",

  // Common Hindi Pronouns, Verbs & Connectors
  namaste: "नमस्ते",
  namaskar: "नमस्कार",
  mera: "मेरा",
  meri: "मेरी",
  mere: "मेरे",
  aap: "आप",
  aapka: "आपका",
  aapki: "आपकी",
  aapke: "आपके",
  hum: "हम",
  hamara: "हमारा",
  hamari: "हमारी",
  hamare: "हमारे",
  yeh: "यह",
  ye: "ये",
  voh: "वह",
  woh: "वह",
  ve: "वे",
  kya: "क्या",
  kyun: "क्यों",
  kyon: "क्यों",
  kab: "कब",
  kahan: "कहाँ",
  kaise: "कैसे",
  kaun: "कौन",
  kitna: "कितना",
  nahi: "नहीं",
  nahin: "नहीं",
  hai: "है",
  hain: "हैं",
  hoon: "हूँ",
  tha: "था",
  thi: "थी",
  the: "थे",
  hoga: "होगा",
  hogi: "होगी",
  honge: "होंगे",
  kar: "कर",
  karna: "करना",
  kiya: "किया",
  diya: "दिया",
  liya: "लिया",
  gaya: "गया",
  gaye: "गए",
  gayi: "गई",
  raha: "रहा",
  rahe: "रहे",
  rahi: "रही",
  aur: "और",
  tatha: "तथा",
  evam: "एवं",
  ya: "या",
  lekin: "लेकिन",
  parantu: "परंतु",
  kintu: "किंतु",
  kyonki: "क्योंकि",
  isliye: "इसलिए",
  yadi: "यदि",
  toh: "तो",
  bhi: "भी",
  hi: "ही",
  tak: "तक",
  se: "से",
  ko: "को",
  ka: "का",
  ke: "के",
  ki: "की",
  mein: "में",
  main: "मैं",
  par: "पर",
  sab: "सब",
  sabhi: "सभी",
  kuch: "कुछ",
  kuchh: "कुछ",
  bahut: "बहुत",
  accha: "अच्छा",
  achha: "अच्छा",
  bada: "बड़ा",
  chota: "छोटा",
  din: "दिन",
  aaj: "आज",
  kal: "कल",
  samay: "समय",
  varsh: "वर्ष",
  saal: "साल",
  mahina: "महीना",
};

// Vowels at initial / standalone syllable positions
const VOWEL_INITIAL: Record<string, string> = {
  aa: "आ",
  a: "अ",
  ii: "ई",
  ee: "ई",
  i: "इ",
  uu: "ऊ",
  oo: "ऊ",
  u: "उ",
  ri: "ऋ",
  ai: "ऐ",
  ae: "ऐ",
  au: "औ",
  ou: "औ",
  e: "ए",
  o: "ओ",
  am: "अं",
  an: "अं",
  ah: "अः",
};

// Vowel matras attached to consonants
const VOWEL_MATRA: Record<string, string> = {
  aa: "ा",
  a: "",
  ii: "ी",
  ee: "ी",
  i: "ि",
  uu: "ू",
  oo: "ू",
  u: "ु",
  ri: "ृ",
  ai: "ै",
  ae: "ै",
  au: "ौ",
  ou: "ौ",
  e: "े",
  o: "ो",
  am: "ं",
  an: "ं",
  ah: "ः",
};

// Consonant phonetic mappings ordered by decreasing length for greedy matching
const CONSONANTS: [string, string][] = [
  ["chh", "छ"],
  ["kh", "ख"],
  ["gh", "घ"],
  ["jh", "झ"],
  ["Th", "ठ"],
  ["Dh", "ढ"],
  ["th", "थ"],
  ["dh", "ध"],
  ["ph", "फ"],
  ["bh", "भ"],
  ["shh", "ष"],
  ["sh", "श"],
  ["ch", "च"],
  ["tr", "त्र"],
  ["gy", "ज्ञ"],
  ["shr", "श्र"],
  ["ksh", "क्ष"],
  ["ng", "ङ"],
  ["ny", "ञ"],
  ["k", "क"],
  ["g", "ग"],
  ["c", "क"],
  ["j", "ज"],
  ["T", "ट"],
  ["D", "ड"],
  ["N", "ण"],
  ["t", "त"],
  ["d", "द"],
  ["n", "न"],
  ["p", "प"],
  ["f", "फ़"],
  ["b", "ब"],
  ["m", "म"],
  ["y", "य"],
  ["r", "र"],
  ["l", "ल"],
  ["v", "व"],
  ["w", "व"],
  ["s", "स"],
  ["h", "ह"],
  ["z", "ज़"],
  ["q", "क़"],
  ["x", "क्स"],
];

/**
 * Transliterates an English word / token into Hindi Devanagari script.
 */
export function transliterateWord(input: string): string {
  if (!input) return "";
  const lower = input.toLowerCase();

  // 1. Direct dictionary match
  if (HINDI_DICTIONARY[lower]) {
    return HINDI_DICTIONARY[lower];
  }

  // 2. Algorithmic transliteration
  let result = "";
  let i = 0;
  const len = input.length;

  while (i < len) {
    const prevChar = i > 0 ? input[i - 1] : "";
    const isAtStartOrVowel = i === 0 || "aeiouAEIOU".includes(prevChar);

    if (isAtStartOrVowel) {
      const two = lower.slice(i, i + 2);
      if (VOWEL_INITIAL[two]) {
        result += VOWEL_INITIAL[two];
        i += 2;
        continue;
      }
      const one = lower.slice(i, i + 1);
      if (VOWEL_INITIAL[one]) {
        result += VOWEL_INITIAL[one];
        i += 1;
        continue;
      }
    }

    // Match consonant
    let matchedConsonant: string | null = null;
    let matchedLen = 0;
    for (const [eng, hin] of CONSONANTS) {
      if (input.slice(i, i + eng.length).toLowerCase() === eng.toLowerCase()) {
        matchedConsonant = hin;
        matchedLen = eng.length;
        break;
      }
    }

    if (matchedConsonant) {
      i += matchedLen;

      // Check vowel matra lookahead
      let matchedMatra: string | null = null;
      let matraLen = 0;
      const nextTwo = lower.slice(i, i + 2);
      const nextOne = lower.slice(i, i + 1);

      if (VOWEL_MATRA[nextTwo] !== undefined) {
        matchedMatra = VOWEL_MATRA[nextTwo];
        matraLen = 2;
      } else if (VOWEL_MATRA[nextOne] !== undefined) {
        matchedMatra = VOWEL_MATRA[nextOne];
        matraLen = 1;
      }

      if (matchedMatra !== null) {
        result += matchedConsonant + matchedMatra;
        i += matraLen;
      } else {
        if (i < len) {
          // Halant between consonants
          result += matchedConsonant + "\u094D";
        } else {
          // Standalone consonant at end
          result += matchedConsonant;
        }
      }
    } else {
      result += input[i];
      i++;
    }
  }

  return result;
}

// 2. Remington GAIL / Kruti Dev 010 Typewriter Mapping
export const REMINGTON_MAP: Record<string, string> = {
  // Lowercase keys
  q: "फ",
  w: "ू", // \u0942 (badi u matra)
  e: "म",
  r: "त",
  t: "ज",
  y: "ल",
  u: "न",
  i: "प",
  o: "व",
  p: "च",
  "[": "ख",
  "]": ",",
  a: "ं", // \u0902 (anusvara)
  s: "े", // \u0947 (e matra)
  d: "क",
  f: "ि", // \u093F (choti i matra)
  g: "ह",
  h: "ी", // \u0940 (badi i matra)
  j: "र",
  k: "ा", // \u093E (aa matra)
  l: "स",
  ";": "य",
  "'": "श",
  z: "्", // \u094D (halant)
  x: "ग",
  c: "ब",
  v: "अ",
  b: "इ",
  n: "द",
  m: "उ",
  ",": "ए",
  ".": "ण",
  "/": "ध",

  // Uppercase (Shifted) keys
  Q: "फ्",
  W: "ॅ",
  E: "म्",
  R: "त्",
  T: "ज्",
  Y: "ल्",
  U: "न्",
  I: "प्",
  O: "व्",
  P: "च्",
  "{": "ख्",
  "}": "।",
  A: "।", // \u0964 (purna viram)
  S: "ै", // \u0948 (ai matra)
  D: "क्",
  F: "थ",
  G: "ळ",
  H: "भ",
  J: "श्र",
  K: "ज्ञ",
  L: "स्",
  ":": "रू",
  '"': "ष",
  Z: "र्", // reph
  X: "ग्",
  C: "ब्",
  V: "ट",
  B: "ठ",
  N: "छ",
  M: "ड",
  "<": "ढ",
  ">": "झ",
  "?": "घ",

  // Numbers
  "0": "०",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
};

// 3. Official Government InScript Standard Mapping
export const INSCRIPT_MAP: Record<string, string> = {
  q: "ौ",
  w: "ै",
  e: "ा",
  r: "ी",
  t: "ू",
  y: "ब",
  u: "ह",
  i: "ग",
  o: "द",
  p: "ज",
  "[": "ड",
  "]": "़",
  a: "ो",
  s: "े",
  d: "्",
  f: "ि",
  g: "ु",
  h: "प",
  j: "र",
  k: "क",
  l: "त",
  ";": "च",
  "'": "ट",
  z: "े",
  x: "ं",
  c: "म",
  v: "न",
  b: "व",
  n: "ल",
  m: "स",
  ",": ",",
  ".": "।",

  // Shifted keys
  Q: "औ",
  W: "ऐ",
  E: "आ",
  R: "ई",
  T: "ऊ",
  Y: "भ",
  U: "ङ",
  I: "घ",
  O: "ध",
  P: "झ",
  "{": "ढ",
  "}": "ञ",
  A: "ओ",
  S: "ए",
  D: "अ",
  F: "इ",
  G: "उ",
  H: "फ",
  J: "ऋ",
  K: "ख",
  L: "थ",
  ":": "छ",
  '"': "ठ",
  X: "ँ",
  C: "ण",
  V: "न",
  B: "श",
  N: "ष",
  M: "श",
  "<": "ष",
  ">": "।",
  "?": "?",
};

export type HindiTypingMode = "phonetic" | "remington" | "inscript" | "off";
