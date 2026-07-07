// utils/legalVocabulary.ts

export interface VocabularyEntry {
  english: string;
  hindi: string;
  transliteration: string;
  meaning: string;
}

export const LEGAL_VOCABULARY: VocabularyEntry[] = [
  {
    english: "Affidavit",
    hindi: "शपथ पत्र",
    transliteration: "Shapath Patra",
    meaning: "A written statement confirmed by oath or affirmation, for use as evidence in court.",
  },
  {
    english: "Adjournment",
    hindi: "स्थगन",
    transliteration: "Sthagan",
    meaning: "Postponing a court session or hearing to a future date.",
  },
  {
    english: "Plaint",
    hindi: "वाद-पत्र",
    transliteration: "Vaad-patra",
    meaning: "A formal written statement of case presented by a plaintiff to initiate a civil suit.",
  },
  {
    english: "Written Statement",
    hindi: "लिखित कथन / जवाब दावा",
    transliteration: "Likhit Kathan / Jawab Dawa",
    meaning: "The defendant's formal written reply to the allegations raised in the plaintiff's plaint.",
  },
  {
    english: "Petitioner",
    hindi: "याचिकाकर्ता",
    transliteration: "Yachikakarta",
    meaning: "The party who presents a petition or appeal to the court.",
  },
  {
    english: "Respondent",
    hindi: "प्रत्यर्थी",
    transliteration: "Pratyarthi",
    meaning: "The party against whom a petition is filed or appeal is brought.",
  },
  {
    english: "Defendant",
    hindi: "प्रतिवादी",
    transliteration: "Prativadi",
    meaning: "An individual, company, or institution sued or accused in a court of law.",
  },
  {
    english: "Plaintiff",
    hindi: "वादी",
    transliteration: "Vaadi",
    meaning: "A person who brings a case against another in a court of law.",
  },
  {
    english: "Injunction",
    hindi: "व्यादेश / रोक",
    transliteration: "Vyadesh / Rok",
    meaning: "A judicial order that restrains a person from beginning or continuing an action.",
  },
  {
    english: "Caveat",
    hindi: "केविएट याचिका",
    transliteration: "Caveat Yachika",
    meaning: "A formal notice to a court requesting that no action be taken without hearing the caveator first.",
  },
  {
    english: "Execution Petition",
    hindi: "निष्पादन याचिका",
    transliteration: "Nishpadan Yachika",
    meaning: "An application made to the court to enforce a decree or judgment passed.",
  },
  {
    english: "Power of Attorney",
    hindi: "मुख्तारनामा / पावर ऑफ अटॉर्नी",
    transliteration: "Mukhtarnama / Power of Attorney",
    meaning: "A legal document authorizing someone to act on another's behalf.",
  },
  {
    english: "Vakalatnama",
    hindi: "वकालतनामा",
    transliteration: "Vakalatnama",
    meaning: "A document by which an advocate is authorized to represent a litigant in court.",
  },
  {
    english: "Exemption",
    hindi: "छूट याचिका",
    transliteration: "Choot Yachika",
    meaning: "An application seeking excuse from personal appearance in court.",
  },
  {
    english: "Bail",
    hindi: "जमानत",
    transliteration: "Jamanat",
    meaning: "The temporary release of an accused person awaiting trial, sometimes on condition that a sum of money or security is lodged.",
  },
  {
    english: "Cognizable",
    hindi: "संज्ञेय",
    transliteration: "Sangney",
    meaning: "An offense for which a police officer has the authority to make an arrest without a warrant.",
  },
  {
    english: "Compoundable",
    hindi: "शमनीय",
    transliteration: "Shamneeya",
    meaning: "Offenses where the parties can compromise or settle instead of continuing trial.",
  },
  {
    english: "Decree",
    hindi: "डिक्री / आज्ञाप्ति",
    transliteration: "Decree / Aagyapti",
    meaning: "The formal expression of an adjudication which conclusively determines the rights of the parties.",
  },
  {
    english: "Ex-parte",
    hindi: "एकपक्षीय",
    transliteration: "Ek-paksheeya",
    meaning: "Proceedings conducted for the benefit of, or on application of, only one party without notice to the other.",
  },
  {
    english: "Jurisdiction",
    hindi: "क्षेत्राधिकार",
    transliteration: "Kshetradhikar",
    meaning: "The official authority of a court to administer justice or hear a case within defined limits.",
  },
];
