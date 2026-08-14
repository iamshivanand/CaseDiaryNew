// utils/documentTemplates.ts

export interface VakalatnamaData {
  courtName: string;
  suitNumber: string;
  caseYear: string;
  parties: string;
  clientName: string;
  advocateName: string;
  advocateEnrollment: string;
  advocateAddress: string;
}

export const getBlankDocumentHtml = (isHindi: boolean = false): string => {
  return `
    <div style="font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.6; color: #000000; min-height: 500px;">
      <p style="text-align: center; font-weight: bold; font-size: 15pt; margin-bottom: 18pt;">
        ${isHindi ? "प्रारूप / दस्तावेज़ (Custom Draft)" : "DRAFT DOCUMENT"}
      </p>
      <p style="text-align: left; margin-bottom: 12px;">
        ${isHindi ? "यहाँ अपना विधिक दस्तावेज़ लिखना प्रारंभ करें..." : "Start typing your legal document content here..."}
      </p>
    </div>
  `;
};

export interface AdjournmentData {
  courtName: string;
  caseNumber: string;
  parties: string;
  nextHearingDate: string;
  reason: string;
  advocateName: string;
}

export interface BailData {
  courtName: string;
  policeStation: string;
  firNumber: string;
  firYear: string;
  underSection: string;
  accusedName: string;
  groundOfBail: string;
  advocateName: string;
}

export interface AffidavitData {
  courtName: string;
  caseNumber: string;
  parties: string;
  deponentName: string;
  deponentAge: string;
  deponentAddress: string;
  facts: string;
}

export interface WrittenStatementData {
  courtName: string;
  caseNumber: string;
  parties: string;
  respondentName: string;
  preliminaryObjections: string;
  replyOnMerits: string;
  advocateName: string;
}

export interface LegalNoticeData {
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
  noticeSubject: string;
  noticeFacts: string;
  demandText: string;
  advocateName: string;
  advocateEnrollment: string;
  advocateAddress: string;
}

export interface CaveatData {
  courtName: string;
  caveatorName: string;
  caveatorAddress: string;
  expectedOppositePartyName: string;
  expectedOppositePartyAddress: string;
  subjectMatter: string;
  advocateName: string;
  advocateEnrollment: string;
  advocateAddress: string;
}

export interface InjunctionData {
  courtName: string;
  caseNumber: string;
  parties: string;
  applicantName: string;
  injunctionFacts: string;
  restraintPrayer: string;
  advocateName: string;
}

export interface PlaintData {
  courtName: string;
  caseNumber: string;
  caseYear: string;
  parties: string;
  plaintiffName: string;
  defendantName: string;
  valuation: string;
  suitFacts: string;
  prayerText: string;
  advocateName: string;
}

export interface RejoinderData {
  courtName: string;
  caseNumber: string;
  caseYear: string;
  parties: string;
  replyPoints: string;
  advocateName: string;
}

export interface ExecutionPetitionData {
  courtName: string;
  caseNumber: string;
  caseYear: string;
  decreeHolder: string;
  judgmentDebtor: string;
  decreeDate: string;
  decreetalAmount: string;
  satisfactionDetails: string;
  reliefSought: string;
  advocateName: string;
}

export interface AnticipatoryBailData {
  courtName: string;
  policeStation: string;
  firNumber: string;
  firYear: string;
  underSection: string;
  applicantName: string;
  apprehensionReason: string;
  grounds: string;
  advocateName: string;
}

export interface PrivateComplaintData {
  courtName: string;
  complainantName: string;
  complainantAddress: string;
  accusedName: string;
  accusedAddress: string;
  incidentDate: string;
  incidentFacts: string;
  offences: string;
  advocateName: string;
}

export interface FirQuashingData {
  courtName: string;
  policeStation: string;
  firNumber: string;
  firYear: string;
  applicantName: string;
  groundsOfQuashing: string;
  advocateName: string;
}

export interface ExemptionData {
  courtName: string;
  caseNumber: string;
  caseYear: string;
  parties: string;
  accusedName: string;
  excuseReason: string;
  advocateName: string;
}

export interface ChequeBounceData {
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
  chequeNumber: string;
  chequeDate: string;
  bankName: string;
  chequeAmount: string;
  dishonorDate: string;
  dishonorReason: string;
  noticeDate: string;
  demandPeriod: string;
  advocateName: string;
  advocateEnrollment: string;
  advocateAddress: string;
}

export interface ArbitrationSec9Data {
  courtName: string;
  parties: string;
  agreementDate: string;
  disputeDetails: string;
  interimRelief: string;
  advocateName: string;
}

export interface ConsumerComplaintData {
  forumName: string;
  complainantName: string;
  oppositePartyName: string;
  productDetails: string;
  costAmount: string;
  deficiencyDetails: string;
  compensationSought: string;
  advocateName: string;
}

export interface RentAgreementData {
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  tenantAddress: string;
  propertyAddress: string;
  rentAmount: string;
  securityDeposit: string;
  termMonths: string;
  agreementDate: string;
  witness1: string;
  witness2: string;
}

export interface PowerOfAttorneyData {
  principalName: string;
  principalAddress: string;
  attorneyName: string;
  attorneyAddress: string;
  powersGranted: string;
  executionDate: string;
  witness1: string;
  witness2: string;
}

// 1. VAKALATNAMA
export const getVakalatnamaHtml = (
  data: VakalatnamaData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">स्थान: जिला न्यायालय</span></h2>
<p class="case-details" style="text-align: center; margin-bottom: 12px;"><b>वाद संख्या: ${data.suitNumber || "__________"} वर्ष ${data.caseYear || "2026"}</b></p>
<p class="party-details" style="text-align: center; margin-bottom: 16px;"><b>मामले में: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 16pt; margin-bottom: 20px;"><b>वकालतनामा</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">मैं/हम, <b>${data.clientName}</b>, एतद्द्वारा अधिवक्ता <b>${data.advocateName}</b> (पंजीकरण संख्या: ${data.advocateEnrollment || "__________"}) को उपरोक्त मामले में मेरी/हमारी पैरवी करने, आवेदन प्रस्तुत करने, समझौता करने और सभी आवश्यक विधिक कार्यवाही करने हेतु अपना अधिवक्ता नियुक्त करता हूँ/करते हैं।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">उक्त अधिवक्ता द्वारा किया गया प्रत्येक सद्भावनापूर्ण कार्य मुझे/हमें स्वीकार्य एवं बाध्यकारी होगा।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">आज दिनांक ______ माह ________________ 2026 को हस्ताक्षरित किया गया।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्वीकर्ता / अधिवक्ता:</b><br/>${data.advocateName}</td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>हस्ताक्षर मुवक्किल / निष्पादक:</b><br/>${data.clientName}</td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">AT DISTRICT COURTS</span></h2>
<p class="case-details" style="text-align: center; margin-bottom: 12px;"><b>SUIT / CASE NO: ${data.suitNumber || "__________"} OF ${data.caseYear || "2026"}</b></p>
<p class="party-details" style="text-align: center; margin-bottom: 16px;"><b>IN THE MATTER OF: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 16pt; margin-bottom: 20px;"><b>VAKALATNAMA</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">I/We, <b>${data.clientName}</b>, do hereby appoint and authorize <b>${data.advocateName}</b> (Enrollment No: ${data.advocateEnrollment || "__________"}), Advocate, hereinafter called the Advocate, to appear, plead, act and represent me/us in the above-mentioned matter and to conduct all proceedings related thereto.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">The Advocate is authorized to sign applications, petitions, compromises, withdrawals, and file documents on my/our behalf. All acts done by the said Advocate in good faith shall be binding on me/us.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">Signed and executed on this ______ day of ________________, 2026.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>ACCEPTED / ADVOCATE:</b><br/>${data.advocateName}</td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>EXECUTANT / CLIENT:</b><br/>${data.clientName}</td></tr></table>`;
};

// 2. ADJOURNMENT APPLICATION
export const getAdjournmentHtml = (
  data: AdjournmentData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">स्थान: जिला न्यायालय</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>वाद संख्या: ${data.caseNumber || "__________"}</b><br/><b>पक्षकार: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>स्थगन हेतु प्रार्थना पत्र</b></h1>
<p class="body-text" style="margin-bottom: 10px;"><b>सादर निवेदन है:</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. यह कि उपरोक्त मामला आज इस माननीय न्यायालय के समक्ष सुनवाई/साक्ष्य हेतु नियत है।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">2. यह कि प्रार्थी के अधिवक्ता आज न्यायालय में उपस्थित होने में असमर्थ हैं क्योंकि: <b>${data.reason || "अपरिहार्य कारण/अस्वस्थता"}</b>।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 16px;">3. यह कि आज अनुपस्थिति जानबूझकर नहीं है बल्कि उपरोक्त अपरिहार्य कारणों से है। स्थगन से विपक्षी दल को कोई अपूरणीय क्षति नहीं होगी।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>प्रार्थना:</b><br/>अतः माननीय न्यायालय से प्रार्थना है कि मामले को किसी अन्य तिथि पर स्थगित करने की कृपा करें।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>दिनांक: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>द्वारा अधिवक्ता:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">AT DISTRICT COURTS</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>In re: ${data.parties.toUpperCase()}</b><br/><b>Case No: ${data.caseNumber || "__________"}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>APPLICATION FOR ADJOURNMENT ON BEHALF OF THE APPLICANT</b></h1>
<p class="body-text" style="margin-bottom: 10px;"><b>MOST RESPECTFULLY SHOWETH:</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. That the above-captioned matter is listed before this Hon'ble Court today for hearing/evidence.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">2. That the Counsel for the applicant is unable to assist this Court today due to: <b>${data.reason || "personal difficulty / illness"}</b>.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 16px;">3. That the non-appearance of the Counsel today is completely unintentional. No prejudice would be caused to either party if adjourned.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>PRAYER:</b><br/>It is, therefore, prayed that this Hon'ble Court may be pleased to adjourn the matter to any convenient date.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Dated: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Filed By Counsel:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 3. REGULAR BAIL (Sec 439 CrPC)
export const getBailHtml = (data: BailData, isHindi = false): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय सत्र न्यायाधीश, ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="border: 1px solid #9ca3af; padding: 10px; margin-bottom: 16px;"><b>राज्य बनाम ${data.accusedName.toUpperCase()}</b><br/>प्राथमिकी संख्या: ${data.firNumber || "__________"} वर्ष: ${data.firYear || "2026"}<br/>धारा: ${data.underSection || "__________"}<br/>थाना: ${data.policeStation || "__________"}</p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>जमानत आवेदन अंतर्गत धारा 439 दंड प्रक्रिया संहिता</b></h1>
<p class="body-text" style="margin-bottom: 10px;"><b>सादर निवेदन है:</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. यह कि पुलिस ने आवेदक को उपरोक्त प्राथमिकी के सिलसिले में झूठा फंसाया है और वह न्यायिक हिरासत में है।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">2. यह कि आवेदक निर्दोष है और इस अपराध से उसका कोई संबंध नहीं है।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 16px;">3. जमानत के मुख्य आधार: <b>${data.groundOfBail || "जांच पूरी हो चुकी है और आवेदक कानून का पालन करने वाला नागरिक है।"}</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>प्रार्थना:</b><br/>अतः माननीय न्यायालय से प्रार्थना है कि आवेदक को जमानत पर रिहा करने का आदेश देने की कृपा करें।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्थान: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>द्वारा अधिवक्ता:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF THE SESSIONS JUDGE, ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="border: 1px solid #9ca3af; padding: 10px; margin-bottom: 16px;"><b>State Vs. ${data.accusedName.toUpperCase()}</b><br/>F.I.R. No: ${data.firNumber || "__________"} / ${data.firYear || "2026"}<br/>U/Sec: ${data.underSection || "__________"}<br/>Police Station: ${data.policeStation || "__________"}</p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>APPLICATION UNDER SECTION 439 OF Cr.P.C. FOR GRANT OF BAIL</b></h1>
<p class="body-text" style="margin-bottom: 10px;"><b>MOST RESPECTFULLY SHOWETH:</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. That the applicant/accused has been falsely implicated in the above F.I.R. and is currently in custody.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">2. That the applicant/accused is a law-abiding citizen and no recovery is pending at his instance.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 16px;">3. Key grounds for bail: <b>${data.groundOfBail || "investigation is complete and the trial is likely to take considerable time."}</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>PRAYER:</b><br/>It is, therefore, prayed that this Hon'ble Court may be pleased to release the applicant on regular bail.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Place: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Through Counsel:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 4. SUPPORTING AFFIDAVIT
export const getAffidavitHtml = (
  data: AffidavitData,
  isHindi = false
): string => {
  const factsList = data.facts
    ? data.facts
        .split("\n")
        .filter((fact) => fact.trim() !== "")
        .map(
          (fact, idx) =>
            `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">${idx + 1}. ${isHindi ? "यह कि" : "That"} ${fact.trim()}</p>`
        )
        .join("\n")
    : `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. ${isHindi ? "यह कि साथ में प्रस्तुत आवेदन की सभी बातें सही हैं।" : "That the contents of the accompanying application are true and correct."}</p>`;

  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">स्थान: जिला न्यायालय</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>वाद संख्या: ${data.caseNumber || "__________"}</b><br/><b>पक्षकार: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>शपथ पत्र (हलफनामा)</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">मैं, <b>${data.deponentName}</b>, आयु लगभग ${data.deponentAge || "___"} वर्ष, निवासी: ${data.deponentAddress || "__________"}, शपथपूर्वक घोषणा करता हूँ:</p>
${factsList}
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 24px; margin-bottom: 24px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>दिनांक: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>शपथकर्ता (DEPONENT)</b></td></tr></table>
<p class="section-title" style="font-weight: bold; margin-bottom: 8px;"><b>सत्यापन:</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 16px;">सत्यापित किया जाता है कि उपरोक्त शपथ पत्र की सभी बातें मेरे निजी ज्ञान एवं विश्वास के अनुसार सत्य हैं, इसमें कोई तथ्य छुपाया नहीं गया है।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 24px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्थान: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>शपथकर्ता (DEPONENT)</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">AT DISTRICT COURTS</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>Case No: ${data.caseNumber || "__________"}</b><br/><b>In re: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>SUPPORTING AFFIDAVIT</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">I, <b>${data.deponentName}</b>, aged about ${data.deponentAge || "___"} years, residing at ${data.deponentAddress || "__________"}, do hereby solemnly affirm and state on oath:</p>
${factsList}
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 24px; margin-bottom: 24px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Dated: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>DEPONENT</b></td></tr></table>
<p class="section-title" style="font-weight: bold; margin-bottom: 8px;"><b>VERIFICATION:</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 16px;">Verified at _______________ on this ______ day of ________________, 2026, that the contents of the above affidavit are true and correct to the best of my knowledge.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 24px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Place: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>DEPONENT</b></td></tr></table>`;
};

// 5. WRITTEN STATEMENT
export const getWrittenStatementHtml = (
  data: WrittenStatementData,
  isHindi = false
): string => {
  const objectionsList = data.preliminaryObjections
    ? data.preliminaryObjections
        .split("\n")
        .filter((p) => p.trim() !== "")
        .map(
          (p, idx) =>
            `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">${idx + 1}. ${isHindi ? "यह कि" : "That"} ${p.trim()}</p>`
        )
        .join("\n")
    : `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. ${isHindi ? "यह कि वादी का वाद कानूनन चलने योग्य नहीं है।" : "That the suit is not maintainable under law."}</p>`;

  const replyList = data.replyOnMerits
    ? data.replyOnMerits
        .split("\n")
        .filter((p) => p.trim() !== "")
        .map(
          (p, idx) =>
            `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">${idx + 1}. ${isHindi ? "यह कि वाद पत्र के पैरा का उत्तर अस्वीकार किया जाता है..." : "That paragraph contents are denied..."} ${p.trim()}</p>`
        )
        .join("\n")
    : `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. ${isHindi ? "यह कि पैरा 1 के तथ्य अस्वीकार किए जाते हैं।" : "That paragraph 1 contents are denied."}</p>`;

  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">स्थान: जिला न्यायालय</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>वाद संख्या: ${data.caseNumber || "__________"}</b><br/><b>पक्षकार: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>लिखित कथन (जवाब दावा) प्रतिवादी की ओर से</b></h1>
<p class="body-text" style="margin-bottom: 10px;">प्रतिवादी <b>${data.respondentName}</b> निम्नानुसार निवेदन करता है:</p>
<p class="section-title" style="font-weight: bold; margin-bottom: 8px;"><b>प्रारंभिक आपत्तियां:</b></p>
${objectionsList}
<p class="section-title" style="font-weight: bold; margin-bottom: 8px;"><b>तथ्यों का उत्तर (मेरिट्स पर):</b></p>
${replyList}
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्थान: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>प्रतिवादी के वकील:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">AT DISTRICT COURTS</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>Case No: ${data.caseNumber || "__________"}</b><br/><b>In re: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>WRITTEN STATEMENT ON BEHALF OF THE RESPONDENT</b></h1>
<p class="body-text" style="margin-bottom: 10px;">The Respondent, <b>${data.respondentName}</b>, submits:</p>
<p class="section-title" style="font-weight: bold; margin-bottom: 8px;"><b>PRELIMINARY OBJECTIONS:</b></p>
${objectionsList}
<p class="section-title" style="font-weight: bold; margin-bottom: 8px;"><b>REPLY ON MERITS:</b></p>
${replyList}
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Place: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel for Respondent:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 6. LEGAL NOTICE
export const getLegalNoticeHtml = (
  data: LegalNoticeData,
  isHindi = false
): string => {
  const factsHtml = data.noticeFacts
    ? data.noticeFacts
        .split("\n")
        .filter((p) => p.trim() !== "")
        .map((p, idx) => `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">${idx + 1}. ${p.trim()}</p>`)
        .join("\n")
    : `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. Under instructions from my client, I hereby serve you with this notice.</p>`;

  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>${data.advocateName.toUpperCase()}</b><br/><span style="font-size: 11pt;">अधिवक्ता, उच्च न्यायालय एवं जिला न्यायालय</span></h2>
<p class="body-text" style="margin-bottom: 12px;"><b>संदर्भ संख्या:</b> LN/2026/______ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>दिनांक:</b> ${new Date().toLocaleDateString("en-IN")}</p>
<p class="body-text" style="margin-bottom: 14px;"><b>सेवा में,</b><br/><b>${data.receiverName}</b><br/>${data.receiverAddress}</p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>विषय: कानूनी नोटिस (LEGAL NOTICE) मवक्किल ${data.senderName.toUpperCase()} की ओर से</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">महोदय/महोदया,<br/>अपने मवक्किल <b>${data.senderName}</b>, निवासी: ${data.senderAddress} के निर्देशानुसार, मैं आपको निम्नानुसार कानूनी नोटिस भेज रहा हूँ:</p>
${factsHtml}
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">अतः मैं आपसे अनुरोध करता हूँ कि नोटिस प्राप्ति के 15 दिनों के भीतर <b>${data.demandText || "हमारे मवक्किल की शर्तों का पालन करें"}</b>, अन्यथा कानूनी कार्यवाही शुरू की जाएगी।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्थान: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>भवदीय / अधिवक्ता:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>${data.advocateName.toUpperCase()}</b><br/><span style="font-size: 11pt;">Advocate, High Court & District Courts</span></h2>
<p class="body-text" style="margin-bottom: 12px;"><b>Ref No:</b> LN/2026/______ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Date:</b> ${new Date().toLocaleDateString("en-IN")}</p>
<p class="body-text" style="margin-bottom: 14px;"><b>TO:</b><br/><b>${data.receiverName}</b><br/>${data.receiverAddress}</p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>SUBJECT: LEGAL NOTICE ON BEHALF OF CLIENT ${data.senderName.toUpperCase()}</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">Sir/Madam,<br/>Under instructions and on behalf of my client, <b>${data.senderName}</b>, residing at ${data.senderAddress}, I hereby serve you with this legal notice:</p>
${factsHtml}
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">Therefore, I call upon you to <b>${data.demandText || "comply with the terms immediately"}</b> within 15 days from receipt of this notice.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Place: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Yours faithfully / Advocate:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 7. CAVEAT PETITION (Sec 148A CPC)
export const getCaveatHtml = (data: CaveatData, isHindi = false): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">स्थान: जिला न्यायालय</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>कैविएटर: ${data.caveatorName.toUpperCase()}</b> बनाम <b>विपक्षी: ${data.expectedOppositePartyName.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>कैविएट याचिका अंतर्गत धारा 148क सिविल प्रक्रिया संहिता, 1908</b></h1>
<p class="body-text" style="margin-bottom: 10px;"><b>सादर निवेदन है:</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. यह कि कैविएटर को आशंका है कि विपक्षी दल इस न्यायालय में मामला दायर कर सकता है: <b>${data.subjectMatter || "संपत्ति या सेवा विवाद"}</b>。</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 16px;">2. यह कि कैविएटर का उक्त मामले में सुनवाई का अधिकार है।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>प्रार्थना:</b><br/>अतः प्रार्थना है कि कैविएटर को पूर्व सूचना दिए बिना विपक्षी दल के किसी भी आवेदन पर कोई एकपक्षीय आदेश पारित न किया जाए।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>दिनांक: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>कैविएटर के वकील:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">AT DISTRICT COURTS</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>Caveator: ${data.caveatorName.toUpperCase()}</b> VS <b>Opposite Party: ${data.expectedOppositePartyName.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>CAVEAT PETITION UNDER SECTION 148A OF THE CODE OF CIVIL PROCEDURE, 1908</b></h1>
<p class="body-text" style="margin-bottom: 10px;"><b>MOST RESPECTFULLY SHOWETH:</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. That the Caveator expects that the Expected Opposite Party may file a suit or application against the Caveator regarding: <b>${data.subjectMatter || "property or service disputes"}</b>.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 16px;">2. That the Caveator has a right to appear and oppose any such interim application.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>PRAYER:</b><br/>It is, therefore, prayed that no ex-parte interim relief or stay be granted against the Caveator without giving prior notice.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Dated: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel for Caveator:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 8. TEMPORARY INJUNCTION (Order 39 R 1/2)
export const getInjunctionHtml = (
  data: InjunctionData,
  isHindi = false
): string => {
  const factsHtml = data.injunctionFacts
    ? data.injunctionFacts
        .split("\n")
        .filter((p) => p.trim() !== "")
        .map(
          (p, idx) =>
            `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">${idx + 1}. ${isHindi ? "यह कि" : "That"} ${p.trim()}</p>`
        )
        .join("\n")
    : `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. ${isHindi ? "यह कि वादी के पक्ष में एक मजबूत मामला बनता है।" : "That the Plaintiff has a strong prima facie case."}</p>`;

  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">स्थान: जिला न्यायालय</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>वाद संख्या: ${data.caseNumber || "__________"}</b><br/><b>पक्षकार: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>अस्थाई निषेधाज्ञा हेतु आवेदन अंतर्गत आदेश 39 नियम 1 व 2 सिविल प्रक्रिया संहिता</b></h1>
<p class="body-text" style="margin-bottom: 10px;">आवेदक <b>${data.applicantName}</b> निम्नानुसार निवेदन करता है:</p>
${factsHtml}
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>प्रार्थना:</b><br/>अतः प्रार्थना है कि विपक्षी दल को रोकने हेतु अस्थाई निषेधाज्ञा आदेश पारित करने की कृपा करें: <b>${data.restraintPrayer || "संपत्ति में कोई तीसरा पक्ष हित पैदा करने से"}</b>。</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>दिनांक: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>आवेदक के वकील:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">AT DISTRICT COURTS</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>Case No: ${data.caseNumber || "__________"}</b><br/><b>In re: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>APPLICATION UNDER ORDER XXXIX RULES 1 & 2 OF C.P.C. FOR TEMPORARY INJUNCTION</b></h1>
<p class="body-text" style="margin-bottom: 10px;"><b>MOST RESPECTFULLY SHOWETH:</b></p>
${factsHtml}
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>PRAYER:</b><br/>It is prayed that this Hon'ble Court may grant temporary injunction restraining the opposite party from: <b>${data.restraintPrayer || "creating third-party interest"}</b>.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Dated: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel for Applicant:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 9. PLAINT (Order 7 CPC)
export const getPlaintHtml = (data: PlaintData, isHindi = false): string => {
  const factsList = data.suitFacts
    ? data.suitFacts
        .split("\n")
        .filter((f) => f.trim() !== "")
        .map(
          (f, idx) =>
            `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">${idx + 1}. ${isHindi ? "यह कि" : "That"} ${f.trim()}</p>`
        )
        .join("\n")
    : `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. ${isHindi ? "यह कि वादी मुकदमे का स्वामी है।" : "That the Plaintiff is the rightful owner."}</p>`;

  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>न्यायालय श्रीमान सिविल जज, ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>दीवानी वाद संख्या: ____________ वर्ष ${data.caseYear || "2026"}</b><br/><b>${data.plaintiffName} बनाम ${data.defendantName}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>वाद पत्र (PLAINT) अंतर्गत आदेश 7 नियम 1 स.प्र.सं.</b></h1>
<p class="body-text" style="margin-bottom: 10px;">वादी निम्नानुसार निवेदन करता है:</p>
${factsList}
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;"><b>मूल्यांकन:</b> रु ${data.valuation || "__________"} किया गया है और उचित कोर्ट फीस अदा की गई है।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>प्रार्थना:</b><br/>अतः वादी प्रार्थना करता है कि निम्नलिखित डिक्री पारित करें: <b>${data.prayerText || "वादी के पक्ष में डिक्री दी जाए"}</b>。</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>दिनांक: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>वादी के वकील:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF THE CIVIL JUDGE, ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>CIVIL SUIT NO: ____________ OF ${data.caseYear || "2026"}</b><br/><b>${data.plaintiffName} VS ${data.defendantName}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>SUIT FOR DECREE (PLAINT) UNDER ORDER VII RULE 1 C.P.C.</b></h1>
<p class="body-text" style="margin-bottom: 10px;">The Plaintiff most respectfully submits:</p>
${factsList}
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;"><b>Valuation:</b> Suit is valued at Rs. ${data.valuation || "__________"} and requisite court fee has been affixed.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>PRAYER:</b><br/>It is prayed that this Hon'ble Court may pass a decree in favor of the Plaintiff for: <b>${data.prayerText || "grant of relief sought"}</b>.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Dated: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel for Plaintiff:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 10. REJOINDER
export const getRejoinderHtml = (
  data: RejoinderData,
  isHindi = false
): string => {
  const pointsList = data.replyPoints
    ? data.replyPoints
        .split("\n")
        .filter((p) => p.trim() !== "")
        .map(
          (p, idx) =>
            `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">${idx + 1}. ${isHindi ? "यह कि" : "That"} ${p.trim()}</p>`
        )
        .join("\n")
    : `<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. ${isHindi ? "यह कि लिखित कथन के सभी प्रतिकूल कथनों से इंकार किया जाता है।" : "That all adverse allegations are denied."}</p>`;

  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">स्थान: जिला न्यायालय</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>वाद संख्या: ${data.caseNumber || "__________"}</b><br/><b>पक्षकार: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>प्रत्युत्तर (REJOINDER) वादी की ओर से</b></h1>
${pointsList}
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्थान: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>वादी के वकील:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">AT DISTRICT COURTS</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>SUIT NO: ${data.caseNumber || "__________"}</b><br/><b>Parties: ${data.parties.toUpperCase()}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>REPLICATION / REJOINDER ON BEHALF OF PLAINTIFF</b></h1>
${pointsList}
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Place: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel for Plaintiff:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 11. EXECUTION PETITION
export const getExecutionHtml = (
  data: ExecutionPetitionData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय श्रीमान सिविल जज, ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>निष्पादन संख्या: ____________ वर्ष ${data.caseYear || "2026"}</b><br/><b>${data.decreeHolder} बनाम ${data.judgmentDebtor}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>निष्पादन याचिका अंतर्गत आदेश 21 नियम 11 स.प्र.सं.</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. यह कि न्यायालय ने दिनांक <b>${data.decreeDate || "__________"}</b> को रु <b>${data.decreetalAmount || "__________"}</b> की डिक्री पारित की थी।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">2. यह कि ऋणी ने अभी तक भुगतान नहीं किया है।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>प्रार्थना:</b><br/>अतः प्रार्थना है कि ऋणी की संपत्ति की कुर्की एवं बिक्री करके डिक्री का निष्पादन कराने की कृपा करें: <b>${data.reliefSought || "डिक्री राशि वसूल की जाए"}</b>。</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>दिनांक: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>द्वारा डिक्रीदार:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF ${data.courtName.toUpperCase()}</b><br/><span style="font-size: 11pt;">AT DISTRICT COURTS</span></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>EXECUTION PETITION NO: ____________ OF ${data.caseYear || "2026"}</b><br/><b>${data.decreeHolder} VS ${data.judgmentDebtor}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>EXECUTION PETITION UNDER ORDER XXI RULE 11 C.P.C.</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. That a decree was passed in favor of Decree Holder on <b>${data.decreeDate || "__________"}</b> for Rs. <b>${data.decreetalAmount || "__________"}</b>.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">2. That the Judgment Debtor has not satisfied the decree.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>PRAYER:</b><br/>It is prayed that this Court execute the decree by attachment and sale of debtor properties: <b>${data.reliefSought || "realization of decreetal amount"}</b>.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Dated: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel for Decree Holder:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 12. ANTICIPATORY BAIL
export const getAnticipatoryBailHtml = (
  data: AnticipatoryBailData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय सत्र न्यायाधीश, ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="border: 1px solid #9ca3af; padding: 10px; margin-bottom: 16px;"><b>आवेदक: ${data.applicantName.toUpperCase()} बनाम राज्य</b><br/>प्राथमिकी: ${data.firNumber || "__________"} / ${data.firYear || "2026"}<br/>थाना: ${data.policeStation || "__________"}</p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>अग्रिम जमानत हेतु आवेदन अंतर्गत धारा 438 दंड प्रक्रिया संहिता</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. यह कि आवेदक को आशंका है कि उसे उपरोक्त प्राथमिकी में गिरफ्तार किया जा सकता है: <b>${data.apprehensionReason || "राजनीतिक प्रतिद्वंद्विता"}</b>。</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">2. आधार: <b>${data.grounds || "आवेदक जांच में सहयोग करने को तैयार है।"}</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>प्रार्थना:</b><br/>अतः प्रार्थना है कि गिरफ्तारी की स्थिति में आवेदक को जमानत पर रिहा करने का निर्देश दें।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>दिनांक: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>द्वारा आवेदक:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF THE SESSIONS JUDGE, ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="border: 1px solid #9ca3af; padding: 10px; margin-bottom: 16px;"><b>Applicant: ${data.applicantName.toUpperCase()} VS State</b><br/>F.I.R. No: ${data.firNumber || "__________"} / ${data.firYear || "2026"}<br/>Police Station: ${data.policeStation || "__________"}</p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>APPLICATION UNDER SECTION 438 OF Cr.P.C. FOR ANTICIPATORY BAIL</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. That the applicant apprehends arrest in the above FIR: <b>${data.apprehensionReason || "false complaint"}</b>.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">2. Grounds: <b>${data.grounds || "applicant is willing to cooperate with investigation."}</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>PRAYER:</b><br/>It is prayed that the applicant be released on anticipatory bail in the event of arrest.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Dated: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel for Applicant:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 13. PRIVATE COMPLAINT
export const getPrivateComplaintHtml = (
  data: PrivateComplaintData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय मुख्य न्यायिक मजिस्ट्रेट, ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>शिकायतकर्ता: ${data.complainantName}</b> बनाम <b>अभियुक्त: ${data.accusedName}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>निजी परिवाद अंतर्गत धारा 200 दंड प्रक्रिया संहिता</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. यह कि अभियुक्त ने निम्नलिखित अपराध किया है: <b>${data.offences || "धोखाधड़ी / मारपीट"}</b>。</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>प्रार्थना:</b><br/>अतः प्रार्थना है कि अभियुक्त को समन कर दंडित करने की कृपा करें।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्थान: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>परिवादी के वकील:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF CHIEF JUDICIAL MAGISTRATE, ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>Complainant: ${data.complainantName}</b> VS <b>Accused: ${data.accusedName}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>PRIVATE COMPLAINT UNDER SECTION 200 Cr.P.C.</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. That the accused has committed offences under: <b>${data.offences || "cheating / assault"}</b>.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;"><b>PRAYER:</b><br/>It is prayed that accused be summoned and tried in accordance with law.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Place: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel for Complainant:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 14. FIR QUASHING
export const getFirQuashingHtml = (
  data: FirQuashingData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष उच्च न्यायालय, ${data.courtName.toUpperCase()}</b></h2>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>याचिका अंतर्गत धारा 482 दंड प्रक्रिया संहिता (प्राथमिकी निरस्तीकरण)</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. यह कि याचिकाकर्ता प्राथमिकी संख्या ${data.firNumber || "__________"} / ${data.firYear || "2026"}, थाना ${data.policeStation || "__________"} को निरस्त करने की प्रार्थना करता है।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">2. आधार: <b>${data.groundsOfQuashing || "पक्षकारों के बीच सौहार्दपूर्ण समझौता हो गया है।"}</b></p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्थान: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>याचिकाकर्ता के वकील:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE HIGH COURT OF JUDICATURE AT ${data.courtName.toUpperCase()}</b></h2>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>PETITION UNDER SECTION 482 Cr.P.C. FOR QUASHING OF F.I.R.</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. That the petitioner prays for quashing of FIR No. ${data.firNumber || "__________"} / ${data.firYear || "2026"}, P.S. ${data.policeStation || "__________"}.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">2. Grounds: <b>${data.groundsOfQuashing || "matter settled amicably between parties."}</b></p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Place: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel for Petitioner:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 15. EXEMPTION APPLICATION
export const getExemptionHtml = (
  data: ExemptionData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>मामला संख्या: ${data.caseNumber || "__________"}</b><br/><b>राज्य बनाम ${data.accusedName}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>व्यक्तिगत उपस्थिति से छूट हेतु प्रार्थना पत्र (धारा 317 दं.प्र.सं.)</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">1. यह कि अभियुक्त ${data.accusedName} आज निम्नलिखित कारण से न्यायालय में उपस्थित होने में असमर्थ है: <b>${data.excuseReason || "अचानक अस्वस्थता / बाहर होना"}</b>。</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>दिनांक: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>अभियुक्त के वकील:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF ${data.courtName.toUpperCase()}</b></h2>
<p class="case-details" style="margin-bottom: 12px;"><b>Case No: ${data.caseNumber || "__________"}</b><br/><b>State Vs. ${data.accusedName}</b></p>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>APPLICATION FOR EXEMPTION FROM PERSONAL APPEARANCE (SEC 317 CrPC)</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">1. That the accused ${data.accusedName} is unable to appear today due to: <b>${data.excuseReason || "sudden illness / out of station"}</b>.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Dated: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel for Accused:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 16. CHEQUE BOUNCE NOTICE
export const getChequeBounceHtml = (
  data: ChequeBounceData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>मांग नोटिस धारा 138 नेगोशिएबल इंस्ट्रूमेंट्स एक्ट के अंतर्गत</b></h1>
<p class="body-text" style="margin-bottom: 12px;"><b>सेवा में:</b> ${data.receiverName}, ${data.receiverAddress}</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. चेक संख्या: ${data.chequeNumber || "__________"} दिनांक ${data.chequeDate || "__________"} राशि रु. ${data.chequeAmount || "__________"} बैंक ${data.bankName || "__________"} दिनांक ${data.dishonorDate || "__________"} को अनादरित हो गया।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">2. आपसे अनुरोध है कि नोटिस प्राप्ति के 15 दिनों के भीतर चेक राशि का भुगतान करें।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्थान: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>अधिवक्ता:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>DEMAND NOTICE UNDER SECTION 138 OF NEGOTIABLE INSTRUMENTS ACT</b></h1>
<p class="body-text" style="margin-bottom: 12px;"><b>TO:</b> ${data.receiverName}, ${data.receiverAddress}</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 12px;">1. Cheque No: ${data.chequeNumber || "__________"} dated ${data.chequeDate || "__________"} for Rs. ${data.chequeAmount || "__________"} drawn on ${data.bankName || "__________"} was dishonored on ${data.dishonorDate || "__________"}.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">2. You are called upon to pay the cheque amount within 15 days of receipt of this notice.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Place: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Advocate:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 17. ARBITRATION SEC 9
export const getArbitrationSec9Html = (
  data: ArbitrationSec9Data,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष न्यायालय वाणिज्यिक न्यायाधीश, ${data.courtName.toUpperCase()}</b></h2>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>आवेदन अंतर्गत धारा 9 मध्यस्थता एवं सुलह अधिनियम, 1996</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">1. मांगी गई अंतरिम राहत: <b>${data.interimRelief || "मध्यस्थता लंबित रहने तक संपत्तियों की सुरक्षा।"}</b></p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्थान: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>अधिवक्ता:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>IN THE COURT OF COMMERCIAL JUDGE, ${data.courtName.toUpperCase()}</b></h2>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>APPLICATION UNDER SECTION 9 OF ARBITRATION & CONCILIATION ACT, 1996</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">1. Interim relief sought: <b>${data.interimRelief || "protection of assets pending arbitration."}</b></p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Place: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 18. CONSUMER COMPLAINT
export const getConsumerComplaintHtml = (
  data: ConsumerComplaintData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>समक्ष जिला उपभोक्ता विवाद निवारण आयोग, ${data.forumName.toUpperCase()}</b></h2>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>उपभोक्ता परिवाद अंतर्गत उपभोक्ता संरक्षण अधिनियम, 2019</b></h1>
<p class="body-text" style="margin-bottom: 12px;">परिवादी: <b>${data.complainantName}</b> बनाम विपक्षी: <b>${data.oppositePartyName}</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">सेवा में कमी: <b>${data.deficiencyDetails || "दोषपूर्ण उत्पाद / सेवा में विफलता"}</b>。</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>स्थान: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>परिवादी के वकील:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
  }
  return `<h2 class="court-header" style="text-align: center; font-size: 14pt; margin-bottom: 12px;"><b>BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION, ${data.forumName.toUpperCase()}</b></h2>
<h1 class="title" style="text-align: center; font-size: 15pt; margin-bottom: 18px;"><b>CONSUMER COMPLAINT UNDER CONSUMER PROTECTION ACT, 2019</b></h1>
<p class="body-text" style="margin-bottom: 12px;">Complainant: <b>${data.complainantName}</b> VS Opposite Party: <b>${data.oppositePartyName}</b></p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">Deficiency: <b>${data.deficiencyDetails || "defective product / service failure"}</b>.</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Place: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Counsel:</b><br/><b>${data.advocateName.toUpperCase()}</b></td></tr></table>`;
};

// 19. RENT AGREEMENT
export const getRentAgreementHtml = (
  data: RentAgreementData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h1 class="title" style="text-align: center; font-size: 16pt; margin-bottom: 20px;"><b>किरायानामा (RENT / LEASE AGREEMENT)</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">यह किरायानामा मकान मालिक <b>${data.landlordName}</b> तथा किराएदार <b>${data.tenantName}</b> के बीच संपत्ति: ${data.propertyAddress} के संबंध में निष्पादित किया गया।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">मासिक किराया: रु. ${data.rentAmount || "__________"}/माह। सुरक्षा निधि: रु. ${data.securityDeposit || "__________"}।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>मकान मालिक:</b><br/>${data.landlordName}</td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>किराएदार:</b><br/>${data.tenantName}</td></tr></table>`;
  }
  return `<h1 class="title" style="text-align: center; font-size: 16pt; margin-bottom: 20px;"><b>RENT / LEASE AGREEMENT</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">This agreement made between Landlord <b>${data.landlordName}</b> and Tenant <b>${data.tenantName}</b> for property: ${data.propertyAddress}.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">Rent: Rs. ${data.rentAmount || "__________"}/month. Security Deposit: Rs. ${data.securityDeposit || "__________"}।</p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Landlord:</b><br/>${data.landlordName}</td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>Tenant:</b><br/>${data.tenantName}</td></tr></table>`;
};

// 20. POWER OF ATTORNEY
export const getPowerOfAttorneyHtml = (
  data: PowerOfAttorneyData,
  isHindi = false
): string => {
  if (isHindi) {
    return `<h1 class="title" style="text-align: center; font-size: 16pt; margin-bottom: 20px;"><b>सामान्य पावर ऑफ अटॉर्नी (GENERAL POWER OF ATTORNEY)</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">सर्वसाधारण को विदित हो कि मैं, <b>${data.principalName}</b>, एतद्द्वारा <b>${data.attorneyName}</b> को अपना कानूनी पावर ऑफ अटॉर्नी नियुक्त करता हूँ।</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">प्रदत्त अधिकार: <b>${data.powersGranted || "संपत्ति का प्रबंधन, अदालती मामलों की पैरवी तथा दस्तावेजों पर हस्ताक्षर करना।"}</b></p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>साक्षी: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>निष्पादक / मुख्तार:</b><br/><b>${data.principalName}</b></td></tr></table>`;
  }
  return `<h1 class="title" style="text-align: center; font-size: 16pt; margin-bottom: 20px;"><b>GENERAL POWER OF ATTORNEY</b></h1>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 14px;">KNOW ALL MEN BY THESE PRESENTS that I, <b>${data.principalName}</b>, do hereby appoint <b>${data.attorneyName}</b> as my true and lawful Attorney.</p>
<p class="body-text" style="text-align: justify; text-indent: 36px; line-height: 1.8; margin-bottom: 24px;">Powers granted: <b>${data.powersGranted || "to manage property, file court cases and sign documents."}</b></p>
<table style="width: 100%; border: none; border-collapse: collapse; margin-top: 36px; margin-bottom: 12px;"><tr><td style="width: 50%; border: none; padding: 0; text-align: left; vertical-align: bottom;"><b>Witness: ____________</b></td><td style="width: 50%; border: none; padding: 0; text-align: right; vertical-align: bottom;"><b>EXECUTANT / PRINCIPAL:</b><br/><b>${data.principalName}</b></td></tr></table>`;
};
