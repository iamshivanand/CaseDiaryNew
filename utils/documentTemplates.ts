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

/**
 * Shared CSS styles for standard Indian litigation ledger sheet print setups.
 * Configured specifically for Legal page size (8.5in x 14in).
 */
const getSharedStyles = (isHindi: boolean): string => {
  return `
    <style>
      @page {
        size: 8.5in 14in;
        margin: 1.5in 1.0in 1.2in 1.0in;
      }
      body {
        font-family: ${
          isHindi
            ? "'Noto Sans Devanagari', 'Mangal', 'Lohit Devanagari', sans-serif"
            : "'Times New Roman', Times, serif"
        };
        font-size: 13pt;
        line-height: 1.8;
        color: #000;
        text-align: justify;
      }
      .title {
        text-align: center;
        font-weight: bold;
        font-size: 15pt;
        text-transform: uppercase;
        margin-bottom: 20px;
        text-decoration: underline;
      }
      .court-header {
        text-align: center;
        font-weight: bold;
        font-size: 14pt;
        margin-bottom: 30px;
        line-height: 1.6;
      }
      .case-details {
        margin-bottom: 25px;
        font-weight: bold;
      }
      .party-details {
        margin-bottom: 25px;
        font-weight: bold;
        text-align: center;
      }
      .body-text {
        text-indent: 0.5in;
        margin-bottom: 15px;
      }
      .section-title {
        font-weight: bold;
        text-decoration: underline;
        margin-top: 25px;
        margin-bottom: 10px;
      }
      .signatures {
        margin-top: 50px;
        display: flex;
        justify-content: space-between;
      }
      .signature-box {
        width: 45%;
        text-align: center;
        border-top: 1px dotted #000;
        padding-top: 5px;
        font-size: 11pt;
      }
      .advocate-details {
        margin-top: 40px;
        font-size: 11pt;
        border-top: 1px solid #000;
        padding-top: 10px;
      }
      .letterhead {
        text-align: center;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
        margin-bottom: 30px;
      }
      .letterhead-title {
        font-size: 18pt;
        font-weight: bold;
      }
      .address-block {
        margin-bottom: 25px;
      }
      .subject {
        font-weight: bold;
        margin-bottom: 25px;
      }
    </style>
  `;
};

// ==========================================
// 1. VAKALATNAMA
// ==========================================
export const getVakalatnamaHtml = (data: VakalatnamaData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}<br/>
            स्थान: जिला न्यायालय
          </div>
          <div class="case-details">
            वाद संख्या: ${data.suitNumber || "__________"} वर्ष ${data.caseYear || "2026"}
          </div>
          <div class="party-details">
            मामले में:<br/>
            ${data.parties.toUpperCase()}
          </div>
          <div class="title">वकालतनामा</div>
          <div class="body-text">
            मैं/हम, <strong>${data.clientName}</strong>, एतद्द्वारा अधिवक्ता <strong>${data.advocateName}</strong> (पंजीकरण संख्या: ${data.advocateEnrollment || "__________"}) को उपरोक्त मामले में मेरी/हमारी पैरवी करने, आवेदन प्रस्तुत करने, समझौता करने और सभी आवश्यक विधिक कार्यवाही करने हेतु अपना अधिवक्ता नियुक्त करता हूँ/करते हैं।
          </div>
          <div class="body-text">
            उक्त अधिवक्ता द्वारा किया गया प्रत्येक सद्भावनापूर्ण कार्य मुझे/हमें स्वीकार्य एवं बाध्यकारी होगा।
          </div>
          <div class="body-text">
            आज दिनांक ______ माह ________________ 2026 को हस्ताक्षरित किया गया।
          </div>
          <div class="signatures">
            <div class="signature-box" style="padding-top: 40px; border-top: 1px solid #000;">
              स्वीकर्ता / अधिवक्ता
            </div>
            <div class="signature-box" style="padding-top: 40px; border-top: 1px solid #000;">
              हस्ताक्षर मुवक्किल / निष्पादक
            </div>
          </div>
          <div class="advocate-details">
            <strong>अधिवक्ता विवरण:</strong><br/>
            नाम: ${data.advocateName}<br/>
            पंजीकरण संख्या: ${data.advocateEnrollment || "लागू नहीं"}<br/>
            कार्यालय पता: ${data.advocateAddress || "लागू नहीं"}
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF ${data.courtName.toUpperCase()}<br/>
          AT DISTRICT COURTS
        </div>
        <div class="case-details">
          SUIT / CASE NO: ${data.suitNumber || "__________"} OF ${data.caseYear || "2026"}
        </div>
        <div class="party-details">
          IN THE MATTER OF:<br/>
          ${data.parties.toUpperCase()}
        </div>
        <div class="title">VAKALATNAMA</div>
        <div class="body-text">
          I/We, <strong>${data.clientName}</strong>, do hereby appoint and authorize 
          <strong>${data.advocateName}</strong> (Enrollment No: ${data.advocateEnrollment || "__________"}), Advocate, 
          hereinafter called the Advocate, to appear, plead, act and represent me/us in the above-mentioned 
          matter and to conduct all proceedings related thereto.
        </div>
        <div class="body-text">
          The Advocate is authorized to sign applications, petitions, compromises, withdrawals, 
          and file documents on my/our behalf. All acts done by the said Advocate in good faith shall be binding on me/us.
        </div>
        <div class="body-text">
          Signed and executed on this ______ day of ________________, 2026.
        </div>
        <div class="signatures">
          <div class="signature-box" style="padding-top: 40px; border-top: 1px solid #000;">
            ACCEPTED / SIGNED BEFORE ME<br/><strong>ADVOCATE</strong>
          </div>
          <div class="signature-box" style="padding-top: 40px; border-top: 1px solid #000;">
            <strong>EXECUTANT / CLIENT</strong>
          </div>
        </div>
        <div class="advocate-details">
          <strong>Advocate Credentials:</strong><br/>
          Name: ${data.advocateName}<br/>
          Enrollment No: ${data.advocateEnrollment || "N/A"}<br/>
          Office Address: ${data.advocateAddress || "N/A"}
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 2. ADJOURNMENT APPLICATION
// ==========================================
export const getAdjournmentHtml = (data: AdjournmentData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}<br/>
            स्थान: जिला न्यायालय
          </div>
          <div class="case-details">
            वाद संख्या: ${data.caseNumber || "__________"}<br/>
            पक्षकार: ${data.parties.toUpperCase()}
          </div>
          <div class="title">स्थगन हेतु प्रार्थना पत्र</div>
          <div class="body-text"><strong>सादर निवेदन है:</strong></div>
          <div class="body-text">
            1. यह कि उपरोक्त मामला आज इस माननीय न्यायालय के समक्ष सुनवाई/साक्ष्य हेतु नियत है।
          </div>
          <div class="body-text">
            2. यह कि प्रार्थी के अधिवक्ता आज न्यायालय में उपस्थित होने में असमर्थ हैं क्योंकि: <strong>${data.reason || "अपरिहार्य कारण/अस्वस्थता"}</strong>।
          </div>
          <div class="body-text">
            3. यह कि आज अनुपस्थिति जानबूझकर नहीं है बल्कि उपरोक्त अपरिहार्य कारणों से है। स्थगन से विपक्षी दल को कोई अपूरणीय क्षति नहीं होगी।
          </div>
          <div class="body-text">
            <strong>प्रार्थना:</strong><br/>
            अतः माननीय न्यायालय से प्रार्थना है कि मामले को किसी अन्य तिथि पर स्थगित करने की कृपा करें।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा अधिवक्ता:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF ${data.courtName.toUpperCase()}<br/>
          AT DISTRICT COURTS
        </div>
        <div class="parties-section" style="font-weight: bold; margin-bottom: 25px;">
          In re:<br/>${data.parties.toUpperCase()}<br/>Case No: ${data.caseNumber || "__________"}
        </div>
        <div class="title">APPLICATION FOR ADJOURNMENT ON BEHALF OF THE APPLICANT</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text">
          1. That the above-captioned matter is listed before this Hon'ble Court today for hearing/evidence.
        </div>
        <div class="body-text">
          2. That the Counsel for the applicant is unable to assist this Court today due to: <strong>${data.reason || "personal difficulty / illness"}</strong>.
        </div>
        <div class="body-text">
          3. That the non-appearance of the Counsel today is completely unintentional. No prejudice would be caused to either party if adjourned.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is, therefore, prayed that this Hon'ble Court may be pleased to adjourn the matter to any convenient date.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Filed By:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Applicant
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 3. REGULAR BAIL (Sec 439 CrPC)
// ==========================================
export const getBailHtml = (data: BailData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय सत्र न्यायाधीश, ${data.courtName.toUpperCase()}
          </div>
          <div class="case-details" style="border: 1px solid #000; padding: 10px;">
            राज्य बनाम ${data.accusedName.toUpperCase()}<br/>
            प्राथमिकी संख्या: ${data.firNumber || "__________"} वर्ष: ${data.firYear || "2026"}<br/>
            धारा: ${data.underSection || "__________"}<br/>
            थाना: ${data.policeStation || "__________"}
          </div>
          <div class="title">जमानत आवेदन अंतर्गत धारा 439 दंड प्रक्रिया संहिता</div>
          <div class="body-text"><strong>सादर निवेदन है:</strong></div>
          <div class="body-text">
            1. यह कि पुलिस ने आवेदक को उपरोक्त प्राथमिकी के सिलसिले में झूठा फंसाया है और वह न्यायिक हिरासत में है।
          </div>
          <div class="body-text">
            2. यह कि आवेदक निर्दोष है और इस अपराध से उसका कोई संबंध नहीं है।
          </div>
          <div class="body-text">
            3. जमानत के मुख्य आधार: <strong>${data.groundOfBail || "जांच पूरी हो चुकी है और आवेदक कानून का पालन करने वाला नागरिक है।"}</strong>।
          </div>
          <div class="body-text">
            <strong>प्रार्थना:</strong><br/>
            अतः माननीय न्यायालय से प्रार्थना है कि आवेदक को जमानत पर रिहा करने का आदेश देने की कृपा करें।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा अधिवक्ता:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF THE SESSIONS JUDGE, ${data.courtName.toUpperCase()}
        </div>
        <div class="case-details" style="border: 1px solid #000; padding: 10px; margin-bottom: 25px;">
          State &nbsp; Vs. &nbsp; ${data.accusedName.toUpperCase()}<br/>
          F.I.R. No: ${data.firNumber || "__________"} / ${data.firYear || "2026"}<br/>
          U/Sec: ${data.underSection || "__________"}<br/>
          Police Station: ${data.policeStation || "__________"}
        </div>
        <div class="title">APPLICATION UNDER SECTION 439 OF Cr.P.C. FOR GRANT OF BAIL</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text">
          1. That the applicant/accused has been falsely implicated in the above F.I.R. and is currently in custody.
        </div>
        <div class="body-text">
          2. That the applicant/accused is a law-abiding citizen and no recovery is pending at his instance.
        </div>
        <div class="body-text">
          3. Key grounds for bail: <strong>${data.groundOfBail || "investigation is complete and the trial is likely to take considerable time."}</strong>.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is, therefore, prayed that this Hon'ble Court may be pleased to release the applicant on regular bail.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Applicant
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 4. SUPPORTING AFFIDAVIT
// ==========================================
export const getAffidavitHtml = (data: AffidavitData, isHindi = false): string => {
  const factsList = data.facts
    ? data.facts
        .split('\n')
        .filter((fact) => fact.trim() !== '')
        .map((fact, idx) => `<div>${idx + 1}. ${isHindi ? "यह कि" : "That"} ${fact.trim()}</div>`)
        .join('\n')
    : `<div>1. ${isHindi ? "यह कि साथ में प्रस्तुत आवेदन की सभी बातें सही हैं।" : "That the contents of the accompanying application are true and correct."}</div>`;

  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}<br/>
            स्थान: जिला न्यायालय
          </div>
          <div class="case-details">
            वाद संख्या: ${data.caseNumber || "__________"}<br/>
            पक्षकार: ${data.parties.toUpperCase()}
          </div>
          <div class="title">शपथ पत्र (हलफनामा)</div>
          <div class="body-text">
            मैं, <strong>${data.deponentName}</strong>, आयु लगभग ${data.deponentAge || "___"} वर्ष, निवासी: ${data.deponentAddress || "__________"}, शपथपूर्वक घोषणा करता हूँ:
          </div>
          <div class="body-text" style="padding-left: 0.3in;">
            ${factsList}
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              ________________________<br/>
              <strong>शपथकर्ता (DEPONENT)</strong>
            </div>
          </div>
          <div class="section-title" style="margin-top: 30px;">सत्यापन:</div>
          <div class="body-text">
            सत्यापित किया जाता है कि उपरोक्त शपथ पत्र की सभी बातें मेरे निजी ज्ञान एवं विश्वास के अनुसार सत्य हैं, इसमें कोई तथ्य छुपाया नहीं गया है। आज दिनांक ____________ स्थान ____________ पर सत्यापित किया।
          </div>
          <div style="text-align: right; margin-top: 20px;">
            <strong>शपथकर्ता (DEPONENT)</strong>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF ${data.courtName.toUpperCase()}<br/>
          AT DISTRICT COURTS
        </div>
        <div class="parties-section" style="font-weight: bold; margin-bottom: 25px;">
          Case No: ${data.caseNumber || "__________"}<br/>In re: ${data.parties.toUpperCase()}
        </div>
        <div class="title">SUPPORTING AFFIDAVIT</div>
        <div class="body-text">
          I, <strong>${data.deponentName}</strong>, aged about ${data.deponentAge || "___"} years, 
          residing at ${data.deponentAddress || "__________"}, do hereby solemnly affirm and state on oath:
        </div>
        <div class="body-text" style="padding-left: 0.3in;">
          ${factsList}
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            ________________________<br/><strong>DEPONENT</strong>
          </div>
        </div>
        <div class="section-title" style="margin-top: 30px;">VERIFICATION:</div>
        <div class="body-text">
          Verified at _______________ on this ______ day of ________________, 2026, 
          that the contents of the above affidavit are true and correct to the best of my knowledge.
        </div>
        <div style="text-align: right; margin-top: 20px;">
          <strong>DEPONENT</strong>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 5. WRITTEN STATEMENT
// ==========================================
export const getWrittenStatementHtml = (data: WrittenStatementData, isHindi = false): string => {
  const objectionsList = data.preliminaryObjections
    ? data.preliminaryObjections
        .split('\n')
        .filter((p) => p.trim() !== '')
        .map((p, idx) => `<div>${idx + 1}. ${isHindi ? "यह कि" : "That"} ${p.trim()}</div>`)
        .join('\n')
    : `<div>1. ${isHindi ? "यह कि वादी का वाद कानूनन चलने योग्य नहीं है।" : "That the suit is not maintainable under law."}</div>`;

  const replyList = data.replyOnMerits
    ? data.replyOnMerits
        .split('\n')
        .filter((p) => p.trim() !== '')
        .map((p, idx) => `<div>${idx + 1}. ${isHindi ? "यह कि वाद पत्र के पैरा का उत्तर अस्वीकार किया जाता है..." : "That paragraph contents are denied..."} ${p.trim()}</div>`)
        .join('\n')
    : `<div>1. ${isHindi ? "यह कि पैरा 1 के तथ्य अस्वीकार किए जाते हैं।" : "That paragraph 1 contents are denied."}</div>`;

  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}<br/>
            स्थान: जिला न्यायालय
          </div>
          <div class="case-details">
            वाद संख्या: ${data.caseNumber || "__________"}<br/>
            पक्षकार: ${data.parties.toUpperCase()}
          </div>
          <div class="title">लिखित कथन (जवाब दावा) प्रतिवादी की ओर से</div>
          <div class="body-text">प्रतिवादी <strong>${data.respondentName}</strong> निम्नानुसार निवेदन करता है:</div>
          
          <div class="section-title">प्रारंभिक आपत्तियां:</div>
          <div class="body-text" style="padding-left: 0.3in;">${objectionsList}</div>

          <div class="section-title">तथ्यों का उत्तर (मेरिट्स पर):</div>
          <div class="body-text" style="padding-left: 0.3in;">${replyList}</div>

          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा अधिवक्ता:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong><br/>प्रतिवादी के वकील
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF ${data.courtName.toUpperCase()}<br/>
          AT DISTRICT COURTS
        </div>
        <div class="parties-section" style="font-weight: bold; margin-bottom: 25px;">
          Case No: ${data.caseNumber || "__________"}<br/>In re: ${data.parties.toUpperCase()}
        </div>
        <div class="title">WRITTEN STATEMENT ON BEHALF OF THE RESPONDENT</div>
        <div class="body-text">The Respondent, <strong>${data.respondentName}</strong>, submits:</div>
        
        <div class="section-title">PRELIMINARY OBJECTIONS:</div>
        <div class="body-text" style="padding-left: 0.3in;">${objectionsList}</div>

        <div class="section-title">REPLY ON MERITS:</div>
        <div class="body-text" style="padding-left: 0.3in;">${replyList}</div>

        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Filed Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Respondent
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 6. LEGAL NOTICE
// ==========================================
export const getLegalNoticeHtml = (data: LegalNoticeData, isHindi = false): string => {
  const factsHtml = data.noticeFacts
    ? data.noticeFacts
        .split('\n')
        .filter((p) => p.trim() !== '')
        .map((p, idx) => `<p>${idx + 1}. ${p.trim()}</p>`)
        .join('\n')
    : `<p>1. Under instructions from my client, I hereby serve you with this notice.</p>`;

  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="letterhead">
            <div class="letterhead-title">${data.advocateName.toUpperCase()}</div>
            <div>अधिवक्ता, उच्च न्यायालय एवं जिला न्यायालय</div>
            <div style="font-size: 10pt;">
              पंजीकरण: ${data.advocateEnrollment || "लागू नहीं"} | कार्यालय: ${data.advocateAddress || "लागू नहीं"}
            </div>
          </div>
          <div class="address-block">
            <strong>संदर्भ संख्या:</strong> LN/2026/______ <span style="float: right;"><strong>दिनांक:</strong> ${new Date().toLocaleDateString("en-IN")}</span>
          </div>
          <div class="address-block">
            <strong>सेवा में,</strong><br/>
            <strong>${data.receiverName}</strong><br/>
            ${data.receiverAddress}
          </div>
          <div class="subject">
            विषय: कानूनी नोटिस (LEGAL NOTICE) मवक्किल ${data.senderName.toUpperCase()} की ओर से
          </div>
          <div class="body-text">
            महोदय/महोदया,<br/>
            अपने मवक्किल <strong>${data.senderName}</strong>, निवासी: ${data.senderAddress} के निर्देशानुसार, मैं आपको निम्नानुसार कानूनी नोटिस भेज रहा हूँ:
          </div>
          <div class="body-text">${factsHtml}</div>
          <div class="body-text">
            अतः मैं आपसे अनुरोध करता हूँ कि नोटिस प्राप्ति के 15 दिनों के भीतर <strong>${data.demandText || "हमारे मवक्किल की शर्तों का पालन करें"}</strong>, अन्यथा मेरे मवक्किल के पास आपके विरुद्ध कानूनी कार्यवाही शुरू करने के अतिरिक्त कोई विकल्प नहीं होगा।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              भवदीय,<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong><br/>अधिवक्ता
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="letterhead">
          <div class="letterhead-title">${data.advocateName.toUpperCase()}</div>
          <div>Advocate, High Court & District Courts</div>
          <div style="font-size: 10pt;">
            Enrollment No: ${data.advocateEnrollment || "N/A"} | Office Address: ${data.advocateAddress || "N/A"}
          </div>
        </div>
        <div class="address-block">
          <strong>Ref No:</strong> LN/2026/______ <span style="float: right;"><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</span>
        </div>
        <div class="address-block">
          <strong>TO:</strong><br/><strong>${data.receiverName}</strong><br/>${data.receiverAddress}
        </div>
        <div class="subject">
          SUBJECT: LEGAL NOTICE ON BEHALF OF CLIENT ${data.senderName.toUpperCase()}
        </div>
        <div class="body-text">
          Sir/Madam,<br/>
          Under instructions and on behalf of my client, <strong>${data.senderName}</strong>, 
          residing at ${data.senderAddress}, I hereby serve you with this legal notice:
        </div>
        <div class="body-text">${factsHtml}</div>
        <div class="body-text">
          Therefore, I call upon you to <strong>${data.demandText || "comply with the terms immediately"}</strong> 
          within 15 days from receipt of this notice, failing which my client shall initiate legal proceedings at your cost.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Yours faithfully,<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Advocate
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 7. CAVEAT PETITION (Sec 148A CPC)
// ==========================================
export const getCaveatHtml = (data: CaveatData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}<br/>
            स्थान: जिला न्यायालय
          </div>
          <div class="parties-section">
            <strong>केविएटर (कैविएटर):</strong><br/>
            <strong>${data.caveatorName.toUpperCase()}</strong>, निवासी: ${data.caveatorAddress}<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ...केविएटर (कैविएटर)<br/>
            बनाम<br/>
            <strong>${data.expectedOppositePartyName.toUpperCase()}</strong>, निवासी: ${data.expectedOppositePartyAddress}<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ...विपक्षी दल
          </div>
          <div class="title">कैविएट याचिका अंतर्गत धारा 148क सिविल प्रक्रिया संहिता, 1908</div>
          <div class="body-text"><strong>सादर निवेदन है:</strong></div>
          <div class="body-text">
            1. यह कि कैविएटर को आशंका है कि विपक्षी दल इस न्यायालय में निम्नलिखित मामले के संबंध में कोई वाद/अपील दायर कर सकता है: <strong>${data.subjectMatter || "संपत्ति या सेवा विवाद"}</strong>।
          </div>
          <div class="body-text">
            2. यह कि कैविएटर का उक्त मामले में सुनवाई का अधिकार है।
          </div>
          <div class="body-text">
            <strong>प्रार्थना:</strong><br/>
            अतः प्रार्थना है कि कैविएटर को पूर्व सूचना दिए बिना विपक्षी दल के किसी भी आवेदन पर कोई एकपक्षीय आदेश या स्थगन आदेश पारित न किया जाए।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा कैविएटर:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong><br/>कैविएटर के वकील
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF ${data.courtName.toUpperCase()}<br/>
          AT DISTRICT COURTS
        </div>
        <div class="parties-section" style="font-weight: bold; margin-bottom: 25px;">
          <strong>IN THE MATTER OF:</strong><br/>
          <strong>${data.caveatorName.toUpperCase()}</strong>, residing at ${data.caveatorAddress} &nbsp;&nbsp;&nbsp;... CAVEATOR<br/>
          VERSUS<br/>
          <strong>${data.expectedOppositePartyName.toUpperCase()}</strong>, residing at ${data.expectedOppositePartyAddress} &nbsp;&nbsp;&nbsp;... OPPOSITE PARTY
        </div>
        <div class="title">CAVEAT PETITION UNDER SECTION 148A OF THE CODE OF CIVIL PROCEDURE, 1908</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text">
          1. That the Caveator expects that the Expected Opposite Party may file a suit, appeal, or application against the Caveator regarding: <strong>${data.subjectMatter || "property or service disputes"}</strong>.
        </div>
        <div class="body-text">
          2. That the Caveator has a right to appear and oppose any such interim application.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is, therefore, prayed that no ex-parte interim relief or stay be granted against the Caveator without giving prior notice.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Filed By:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Caveator
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 8. TEMPORARY INJUNCTION (Order 39 R 1/2)
// ==========================================
export const getInjunctionHtml = (data: InjunctionData, isHindi = false): string => {
  const factsHtml = data.injunctionFacts
    ? data.injunctionFacts
        .split('\n')
        .filter((p) => p.trim() !== '')
        .map((p, idx) => `<div>${idx + 1}. ${isHindi ? "यह कि" : "That"} ${p.trim()}</div>`)
        .join('\n')
    : `<div>1. ${isHindi ? "यह कि वादी के पक्ष में एक मजबूत मामला बनता है।" : "That the Plaintiff has a strong prima facie case."}</div>`;

  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}<br/>
            स्थान: जिला न्यायालय
          </div>
          <div class="case-details">
            वाद संख्या: ${data.caseNumber || "__________"}<br/>
            पक्षकार: ${data.parties.toUpperCase()}
          </div>
          <div class="title">अस्थाई निषेधाज्ञा हेतु आवेदन अंतर्गत आदेश 39 नियम 1 व 2 सिविल प्रक्रिया संहिता</div>
          <div class="body-text">आवेदक <strong>${data.applicantName}</strong> निम्नानुसार निवेदन करता है:</div>
          <div class="body-text" style="padding-left: 0.3in;">${factsHtml}</div>
          <div class="body-text">
            यह कि यदि विपक्षी दल को रोका नहीं गया, तो आवेदक को अपूरणीय क्षति होगी जिसे धन के रूप में मुआवजा नहीं दिया जा सकता।
          </div>
          <div class="body-text">
            <strong>प्रार्थना:</strong><br/>
            अतः प्रार्थना है कि मुकदमे के लंबित रहने के दौरान विपक्षी दल को निम्नलिखित कार्य करने से रोकने हेतु अस्थाई निषेधाज्ञा आदेश पारित करने की कृपा करें: <strong>${data.restraintPrayer || "संपत्ति में कोई तीसरा पक्ष हित पैदा करने या निर्माण करने से"}</strong>।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा आवेदक:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong><br/>आवेदक के वकील
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF ${data.courtName.toUpperCase()}<br/>
          AT DISTRICT COURTS
        </div>
        <div class="parties-section" style="font-weight: bold; margin-bottom: 25px;">
          Case No: ${data.caseNumber || "__________"}<br/>In re: ${data.parties.toUpperCase()}
        </div>
        <div class="title">APPLICATION UNDER ORDER XXXIX RULES 1 & 2 OF C.P.C. FOR TEMPORARY INJUNCTION</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text" style="padding-left: 0.3in;">${factsHtml}</div>
        <div class="body-text">
          That the balance of convenience lies in favor of the Applicant, and he shall suffer irreparable injury if stay is not granted.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is prayed that this Hon'ble Court may grant temporary injunction restraining the opposite party from: <strong>${data.restraintPrayer || "creating third-party interest or altering status quo"}</strong>.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Applicant Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Applicant
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 9. PLAINT (Order 7 CPC)
// ==========================================
export const getPlaintHtml = (data: PlaintData, isHindi = false): string => {
  const factsList = data.suitFacts
    ? data.suitFacts
        .split('\n')
        .filter((f) => f.trim() !== '')
        .map((f, idx) => `<div>${idx + 1}. ${isHindi ? "यह कि" : "That"} ${f.trim()}</div>`)
        .join('\n')
    : `<div>1. ${isHindi ? "यह कि वादी मुकदमे का स्वामी है।" : "That the Plaintiff is the rightful owner."}</div>`;

  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            न्यायालय श्रीमान सिविल जज (वरिष्ठ संवर्ग), ${data.courtName.toUpperCase()}
          </div>
          <div class="case-details">
            दीवानी वाद संख्या: ____________ वर्ष ${data.caseYear || "2026"}
          </div>
          <div class="party-details">
            <strong>${data.plaintiffName}</strong> बनाम <strong>${data.defendantName}</strong>
          </div>
          <div class="title">वाद पत्र (PLAINT) अंतर्गत आदेश 7 नियम 1 स.प्र.सं.</div>
          <div class="body-text">वादी निम्नानुसार निवेदन करता है:</div>
          <div class="body-text" style="padding-left: 0.3in;">${factsList}</div>
          <div class="body-text">
            <strong>मूल्यांकन और कोर्ट फीस:</strong> यह कि मुकदमे का मूल्यांकन रु ${data.valuation || "__________"} किया गया है और उचित कोर्ट फीस अदा कर दी गई है।
          </div>
          <div class="body-text">
            <strong>प्रार्थना:</strong><br/>
            अतः वादी प्रार्थना करता है कि निम्नलिखित आदेश/डिक्री पारित करने की कृपा करें: <strong>${data.prayerText || "वादी के पक्ष में डिक्री दी जाए"}</strong>।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा वादी:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong><br/>वादी के वकील
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF THE CIVIL JUDGE (SR. DIVISION), ${data.courtName.toUpperCase()}
        </div>
        <div class="case-details">
          CIVIL SUIT NO: ____________ OF ${data.caseYear || "2026"}
        </div>
        <div class="party-details">
          <strong>${data.plaintiffName}</strong> &nbsp; VS &nbsp; <strong>${data.defendantName}</strong>
        </div>
        <div class="title">SUIT FOR DECREE (PLAINT) UNDER ORDER VII RULE 1 C.P.C.</div>
        <div class="body-text">The Plaintiff most respectfully submits:</div>
        <div class="body-text" style="padding-left: 0.3in;">${factsList}</div>
        <div class="body-text">
          <strong>Valuation and Court Fee:</strong> That the suit is valued at Rs. ${data.valuation || "__________"} and requisite court fee has been affixed.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is prayed that this Hon'ble Court may pass a decree in favor of the Plaintiff for: <strong>${data.prayerText || "grant of relief sought"}</strong>.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Plaintiff Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Plaintiff
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 10. REPLICATION / REJOINDER
// ==========================================
export const getRejoinderHtml = (data: RejoinderData, isHindi = false): string => {
  const pointsList = data.replyPoints
    ? data.replyPoints
        .split('\n')
        .filter((p) => p.trim() !== '')
        .map((p, idx) => `<div>${idx + 1}. ${isHindi ? "यह कि" : "That"} ${p.trim()}</div>`)
        .join('\n')
    : `<div>1. ${isHindi ? "यह कि लिखित कथन के सभी प्रतिकूल कथनों से इंकार किया जाता है।" : "That all adverse allegations in the Written Statement are denied."}</div>`;

  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}<br/>
            स्थान: जिला न्यायालय
          </div>
          <div class="case-details">
            दीवानी वाद संख्या: ${data.caseNumber || "__________"} वर्ष: ${data.caseYear || "2026"}<br/>
            पक्षकार: ${data.parties.toUpperCase()}
          </div>
          <div class="title">प्रत्युत्तर / प्रत्युत्तर पत्र (REJOINDER/REPLICATION) वादी की ओर से</div>
          <div class="body-text">वादी प्रतिवादी के लिखित कथन के जवाब में निम्नानुसार प्रस्तुत करता है:</div>
          <div class="body-text" style="padding-left: 0.3in;">${pointsList}</div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा वादी:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong><br/>वादी के वकील
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF ${data.courtName.toUpperCase()}<br/>
          AT DISTRICT COURTS
        </div>
        <div class="case-details">
          SUIT NO: ${data.caseNumber || "__________"} OF ${data.caseYear || "2026"}<br/>
          parties: ${data.parties.toUpperCase()}
        </div>
        <div class="title">REPLICATION / REJOINDER ON BEHALF OF PLAINTIFF</div>
        <div class="body-text">The Plaintiff submits as under in reply to the Written Statement:</div>
        <div class="body-text" style="padding-left: 0.3in;">${pointsList}</div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Plaintiff Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Plaintiff
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 11. EXECUTION PETITION (Order 21 CPC)
// ==========================================
export const getExecutionHtml = (data: ExecutionPetitionData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय श्रीमान सिविल जज, ${data.courtName.toUpperCase()}
          </div>
          <div class="case-details">
            निष्पादन संख्या: ____________ वर्ष ${data.caseYear || "2026"}
          </div>
          <div class="party-details">
            <strong>${data.decreeHolder}</strong> (डिक्रीदार) बनाम <strong>${data.judgmentDebtor}</strong> (ऋणी)
          </div>
          <div class="title">निष्पादन याचिका अंतर्गत आदेश 21 नियम 11 स.प्र.सं.</div>
          <div class="body-text"><strong>सादर निवेदन है:</strong></div>
          <div class="body-text">
            1. यह कि न्यायालय ने दिनांक <strong>${data.decreeDate || "__________"}</strong> को डिक्रीदार के पक्ष में रु <strong>${data.decreetalAmount || "__________"}</strong> की डिक्री पारित की थी।
          </div>
          <div class="body-text">
            2. यह कि ऋणी ने अभी तक डिक्री राशि का भुगतान नहीं किया है। भुगतान का विवरण: <strong>${data.satisfactionDetails || "शून्य / भुगतान नहीं मिला"}</strong>।
          </div>
          <div class="body-text">
            <strong>प्रार्थना (मांगी गई सहायता):</strong><br/>
            अतः प्रार्थना है कि ऋणी की संपत्ति की कुर्की एवं बिक्री करके डिक्री का निष्पादन कराने की कृपा करें: <strong>${data.reliefSought || "डिक्री राशि वसूल की जाए"}</strong>।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा डिक्रीदार:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF ${data.courtName.toUpperCase()}<br/>
          AT DISTRICT COURTS
        </div>
        <div class="case-details">
          EXECUTION PETITION NO: ____________ OF ${data.caseYear || "2026"}
        </div>
        <div class="party-details">
          <strong>${data.decreeHolder}</strong> (Decree Holder) VS <strong>${data.judgmentDebtor}</strong> (Judgment Debtor)
        </div>
        <div class="title">EXECUTION PETITION UNDER ORDER XXI RULE 11 C.P.C.</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text">
          1. That a decree was passed in favor of the Decree Holder on <strong>${data.decreeDate || "__________"}</strong> for Rs. <strong>${data.decreetalAmount || "__________"}</strong>.
        </div>
        <div class="body-text">
          2. That the Judgment Debtor has not satisfied the decree. Satisfaction status: <strong>${data.satisfactionDetails || "un-satisfied"}</strong>.
        </div>
        <div class="body-text">
          <strong>PRAYER / RELIEF SOUGHT:</strong><br/>
          It is prayed that this Court execute the decree by attachment and sale of the debtor's properties: <strong>${data.reliefSought || "realization of decreetal amount"}</strong>.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Decree Holder Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Decree Holder
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 12. ANTICIPATORY BAIL (Sec 438 CrPC)
// ==========================================
export const getAnticipatoryBailHtml = (data: AnticipatoryBailData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय सत्र न्यायाधीश, ${data.courtName.toUpperCase()}
          </div>
          <div class="case-details" style="border: 1px solid #000; padding: 10px;">
            आवेदक: <strong>${data.applicantName.toUpperCase()}</strong> बनाम राज्य<br/>
            प्राथमिकी संख्या: ${data.firNumber || "__________"} / वर्ष: ${data.firYear || "2026"}<br/>
            धारा: ${data.underSection || "__________"}<br/>
            थाना: ${data.policeStation || "__________"}
          </div>
          <div class="title">अग्रिम जमानत हेतु आवेदन अंतर्गत धारा 438 दंड प्रक्रिया संहिता</div>
          <div class="body-text"><strong>सादर निवेदन है:</strong></div>
          <div class="body-text">
            1. यह कि आवेदक को आशंका है कि उसे उपरोक्त प्राथमिकी में गिरफ्तार किया जा सकता है, जो कि दुर्भावनापूर्ण है। गिरफ्तारी की आशंका का कारण: <strong>${data.apprehensionReason || "राजनीतिक प्रतिद्वंद्विता / झूठी शिकायत"}</strong>।
          </div>
          <div class="body-text">
            2. अग्रिम जमानत के मुख्य आधार: <strong>${data.grounds || "आवेदक समाज का प्रतिष्ठित व्यक्ति है और वह जांच में सहयोग करने को तैयार है।"}</strong>।
          </div>
          <div class="body-text">
            <strong>प्रार्थना:</strong><br/>
            अतः प्रार्थना है कि आवेदक को गिरफ्तार किए जाने की स्थिति में उसे जमानत पर रिहा करने का निर्देश देने की कृपा करें।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा आवेदक:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF THE SESSIONS JUDGE, ${data.courtName.toUpperCase()}
        </div>
        <div class="case-details" style="border: 1px solid #000; padding: 10px; margin-bottom: 25px;">
          Applicant: <strong>${data.applicantName.toUpperCase()}</strong> VS State<br/>
          F.I.R. No: ${data.firNumber || "__________"} / ${data.firYear || "2026"}<br/>
          U/Sec: ${data.underSection || "__________"}<br/>
          Police Station: ${data.policeStation || "__________"}
        </div>
        <div class="title">APPLICATION UNDER SECTION 438 OF Cr.P.C. FOR ANTICIPATORY BAIL</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text">
          1. That the applicant apprehends arrest in the above FIR, which is filed with mala fide intentions. Reason: <strong>${data.apprehensionReason || "personal rivalry / false complaint"}</strong>.
        </div>
        <div class="body-text">
          2. Grounds: <strong>${data.grounds || "applicant is a law-abiding citizen and willing to cooperate with the investigation."}</strong>.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is prayed that in the event of arrest, the applicant be released on bail.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Applicant
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 13. PRIVATE COMPLAINT (Sec 200 CrPC)
// ==========================================
export const getPrivateComplaintHtml = (data: PrivateComplaintData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय मुख्य न्यायिक मजिस्ट्रेट, ${data.courtName.toUpperCase()}
          </div>
          <div class="parties-section">
            <strong>${data.complainantName.toUpperCase()}</strong>, निवासी: ${data.complainantAddress} &nbsp;&nbsp;...परिवादी<br/>
            बनाम<br/>
            <strong>${data.accusedName.toUpperCase()}</strong>, निवासी: ${data.accusedAddress} &nbsp;&nbsp;...आरोपी
          </div>
          <div class="title">परिवाद पत्र (COMPLAINT) अंतर्गत धारा 200 दंड प्रक्रिया संहिता</div>
          <div class="body-text"><strong>सादर निवेदन है:</strong></div>
          <div class="body-text">
            1. यह कि आरोपी ने दिनांक <strong>${data.incidentDate || "__________"}</strong> को परिवादी के साथ घटना को अंजाम दिया। घटना का विवरण: <strong>${data.incidentFacts || "मारपीट/गाली गलौज"}</strong>।
          </div>
          <div class="body-text">
            2. यह कि आरोपी ने <strong>${data.offences || "धारा 323, 504, 506 आईपीसी"}</strong> के अंतर्गत दंडनीय अपराध किया है।
          </div>
          <div class="body-text">
            <strong>प्रार्थना:</strong><br/>
            अतः प्रार्थना है कि आरोपी के खिलाफ संज्ञान लेकर उसे तलब करने एवं दंडित करने की कृपा करें।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा परिवादी:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE, ${data.courtName.toUpperCase()}
        </div>
        <div class="parties-section" style="font-weight: bold; margin-bottom: 25px;">
          <strong>${data.complainantName.toUpperCase()}</strong>, residing at ${data.complainantAddress} &nbsp;&nbsp;... COMPLAINANT<br/>
          VERSUS<br/>
          <strong>${data.accusedName.toUpperCase()}</strong>, residing at ${data.accusedAddress} &nbsp;&nbsp;... ACCUSED
        </div>
        <div class="title">COMPLAINT UNDER SECTION 200 OF THE CODE OF CRIMINAL PROCEDURE</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text">
          1. That the Accused committed illegal acts on <strong>${data.incidentDate || "__________"}</strong>. incident facts: <strong>${data.incidentFacts || "assault and criminal intimidation"}</strong>.
        </div>
        <div class="body-text">
          2. That the acts constitute offences under: <strong>${data.offences || "Sections 323, 504, 506 IPC"}</strong>.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is prayed that the Accused be summoned and prosecuted in accordance with law.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Complainant Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Complainant
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 14. FIR QUASHING PETITION (Sec 482 CrPC)
// ==========================================
export const getFirQuashingHtml = (data: FirQuashingData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष माननीय उच्च न्यायालय, ${data.courtName.toUpperCase()}
          </div>
          <div class="case-details">
            याचिका संख्या: ____________ वर्ष 2026<br/>
            आवेदक: <strong>${data.applicantName.toUpperCase()}</strong> बनाम राज्य
          </div>
          <div class="title">एफआईआर निरस्तीकरण याचिका अंतर्गत धारा 482 दंड प्रक्रिया संहिता</div>
          <div class="body-text"><strong>सादर निवेदन है:</strong></div>
          <div class="body-text">
            1. यह कि विपक्षी ने पुलिस थाना <strong>${data.policeStation || "__________"}</strong> में प्राथमिकी संख्या <strong>${data.firNumber || "__________"}</strong> वर्ष <strong>${data.firYear || "__________"}</strong> दर्ज कराई है, जो पूर्णतः निराधार है।
          </div>
          <div class="body-text">
            2. निरस्तीकरण के मुख्य आधार: <strong>${data.groundsOfQuashing || "पारिवारिक विवाद को आपराधिक रंग दिया गया है, कोई संज्ञेय अपराध नहीं बनता है।"}</strong>।
          </div>
          <div class="body-text">
            <strong>प्रार्थना:</strong><br/>
            अतः प्रार्थना है कि न्याय के हित में उक्त प्राथमिकी को निरस्त करने की कृपा करें।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा आवेदक:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE HIGH COURT OF ${data.courtName.toUpperCase()}
        </div>
        <div class="case-details" style="margin-bottom: 25px;">
          CRIMINAL REVISION / PETITION NO: ____________ OF 2026<br/>
          Applicant: <strong>${data.applicantName.toUpperCase()}</strong> VS State
        </div>
        <div class="title">PETITION UNDER SECTION 482 Cr.P.C. FOR QUASHING OF F.I.R.</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text">
          1. That FIR No: <strong>${data.firNumber || "__________"} / ${data.firYear || "2026"}</strong> was registered at Police Station: <strong>${data.policeStation || "__________"}</strong> maliciously.
        </div>
        <div class="body-text">
          2. Grounds: <strong>${data.groundsOfQuashing || "frivolous allegations, commercial dispute turned into criminal case."}</strong>.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is prayed that this Hon'ble Court may be pleased to quash the FIR and all proceedings arising out of it.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Applicant
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 15. EXEMPTION APPLICATION (Sec 205/317)
// ==========================================
export const getExemptionHtml = (data: ExemptionData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय श्रीमान ${data.courtName.toUpperCase()}<br/>
            स्थान: जिला न्यायालय
          </div>
          <div class="case-details">
            वाद संख्या: ${data.caseNumber || "__________"} वर्ष: ${data.caseYear || "2026"}<br/>
            पक्षकार: ${data.parties.toUpperCase()}
          </div>
          <div class="title">व्यक्तिगत उपस्थिति से छूट हेतु आवेदन अंतर्गत धारा 205/317 दंड प्रक्रिया संहिता</div>
          <div class="body-text"><strong>सादर निवेदन है:</strong></div>
          <div class="body-text">
            1. यह कि आरोपी <strong>${data.accusedName}</strong> आज न्यायालय के समक्ष उपस्थित होने में असमर्थ है।
          </div>
          <div class="body-text">
            2. अनुपस्थिति का कारण: <strong>${data.excuseReason || "स्वास्थ्य खराब होना / चिकित्सा उपचार"}</strong>।
          </div>
          <div class="body-text">
            3. यह कि आरोपी के अधिवक्ता आज न्यायालय में उपस्थित हैं और पैरवी करने को तैयार हैं।
          </div>
          <div class="body-text">
            <strong>प्रार्थना:</strong><br/>
            अतः प्रार्थना है कि आरोपी की आज की व्यक्तिगत उपस्थिति माफ करने की कृपा करें।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा आरोपी:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF ${data.courtName.toUpperCase()}<br/>
          AT DISTRICT COURTS
        </div>
        <div class="case-details">
          Case No: ${data.caseNumber || "__________"} OF ${data.caseYear || "2026"}<br/>
          parties: ${data.parties.toUpperCase()}
        </div>
        <div class="title">APPLICATION UNDER SECTION 205/317 OF Cr.P.C. FOR EXEMPTION FROM PERSONAL APPEARANCE</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text">
          1. That the Accused, <strong>${data.accusedName}</strong>, is unable to attend the Court today.
        </div>
        <div class="body-text">
          2. Reason: <strong>${data.excuseReason || "medical indisposition / travel constraints"}</strong>.
        </div>
        <div class="body-text">
          3. That the Counsel for the accused is present and ready to represent on behalf of the accused.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is prayed that this Court may exempt the accused from personal appearance for today.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Accused
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 16. CHEQUE BOUNCE NOTICE (Sec 138 NI Act)
// ==========================================
export const getChequeBounceHtml = (data: ChequeBounceData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="letterhead">
            <div class="letterhead-title">${data.advocateName.toUpperCase()}</div>
            <div>अधिवक्ता, उच्च न्यायालय एवं जिला न्यायालय</div>
            <div style="font-size: 10pt;">
              पंजीकरण: ${data.advocateEnrollment || "लागू नहीं"} | कार्यालय: ${data.advocateAddress || "लागू नहीं"}
            </div>
          </div>
          <div class="address-block">
            <strong>दिनांक:</strong> ${data.noticeDate || new Date().toLocaleDateString("en-IN")}
          </div>
          <div class="address-block">
            <strong>सेवा में,</strong><br/>
            <strong>${data.receiverName}</strong><br/>
            ${data.receiverAddress}
          </div>
          <div class="subject">
            विषय: कानूनी नोटिस (LEGAL NOTICE) अंतर्गत धारा 138 नेगोशिएबल इंस्ट्रूमेंट्स एक्ट (चेक बाउंस नोटिस)
          </div>
          <div class="body-text">
            महोदय/महोदया,<br/>
            अपने मवक्किल <strong>${data.senderName}</strong> के निर्देशानुसार, मैं आपको निम्नानुसार नोटिस प्रेषित कर रहा हूँ:
          </div>
          <div class="body-text">
            1. यह कि आपने अपने दायित्वों के तहत मेरे मवक्किल को बैंक <strong>${data.bankName || "__________"}</strong> का चेक संख्या <strong>${data.chequeNumber || "__________"}</strong> दिनांक <strong>${data.chequeDate || "__________"}</strong> मूल्य रु <strong>${data.chequeAmount || "__________"}</strong> जारी किया था।
          </div>
          <div class="body-text">
            2. यह कि मेरे मवक्किल ने उक्त चेक को बैंक में प्रस्तुत किया तो वह दिनांक <strong>${data.dishonorDate || "__________"}</strong> को निम्नलिखित कारण से बाउंस हो गया: <strong>${data.dishonorReason || "अपर्याप्त राशि (funds insufficient)"}</strong>।
          </div>
          <div class="body-text">
            अतः मैं आपको चेतावनी देता हूँ कि नोटिस प्राप्ति के 15 दिनों के भीतर उक्त चेक की राशि का भुगतान सुनिश्चित करें, अन्यथा आपके विरुद्ध दीवानी एवं आपराधिक मुकदमा दायर किया जाएगा।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              भवदीय,<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong><br/>अधिवक्ता
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="letterhead">
          <div class="letterhead-title">${data.advocateName.toUpperCase()}</div>
          <div>Advocate, High Court & District Courts</div>
          <div style="font-size: 10pt;">
            Enrollment: ${data.advocateEnrollment || "N/A"} | Address: ${data.advocateAddress || "N/A"}
          </div>
        </div>
        <div class="address-block">
          <strong>Date:</strong> ${data.noticeDate || new Date().toLocaleDateString("en-IN")}
        </div>
        <div class="address-block">
          <strong>TO:</strong><br/><strong>${data.receiverName}</strong><br/>${data.receiverAddress}
        </div>
        <div class="subject">
          SUBJECT: LEGAL DEMAND NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881
        </div>
        <div class="body-text">
          Sir/Madam,<br/>
          Under instructions from my client, <strong>${data.senderName}</strong>, I serve you with this notice:
        </div>
        <div class="body-text">
          1. That you issued Cheque No: <strong>${data.chequeNumber || "__________"}</strong> dated <strong>${data.chequeDate || "__________"}</strong> drawn on <strong>${data.bankName || "__________"}</strong> for Rs. <strong>${data.chequeAmount || "__________"}</strong>.
        </div>
        <div class="body-text">
          2. That the cheque was dishonored on <strong>${data.dishonorDate || "__________"}</strong> due to: <strong>${data.dishonorReason || "Funds Insufficient"}</strong>.
        </div>
        <div class="body-text">
          Therefore, I call upon you to pay the cheque amount within 15 days of this notice, failing which legal proceedings under Section 138 of the NI Act shall be initiated.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Yours faithfully,<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Advocate
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 17. ARBITRATION SECTION 9 PETITION
// ==========================================
export const getArbitrationSec9Html = (data: ArbitrationSec9Data, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष न्यायालय श्रीमान जिला न्यायाधीश, ${data.courtName.toUpperCase()}
          </div>
          <div class="case-details">
            मध्यस्थता याचिका संख्या: ____________ वर्ष 2026<br/>
            पक्षकार: ${data.parties.toUpperCase()}
          </div>
          <div class="title">याचिका अंतर्गत धारा 9 मध्यस्थता एवं सुलह अधिनियम, 1996</div>
          <div class="body-text"><strong>सादर निवेदन है:</strong></div>
          <div class="body-text">
            1. यह कि पक्षकारों के बीच दिनांक <strong>${data.agreementDate || "__________"}</strong> को समझौता हुआ था जिसमें मध्यस्थता खंड शामिल है।
          </div>
          <div class="body-text">
            2. यह कि पक्षकारों के बीच गंभीर विवाद उत्पन्न हो गया है। विवाद का विवरण: <strong>${data.disputeDetails || "भुगतान का भुगतान न करना"}</strong>।
          </div>
          <div class="body-text">
            <strong>प्रार्थना (अंतरिम राहत):</strong><br/>
            अतः प्रार्थना है कि मध्यस्थता कार्यवाही शुरू होने तक निम्नलिखित अंतरिम राहत प्रदान करने की कृपा करें: <strong>${data.interimRelief || "संपत्ति की सुरक्षा / यथास्थिति बनाए रखना"}</strong>।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा याचिकाकर्ता:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          IN THE COURT OF THE DISTRICT JUDGE, ${data.courtName.toUpperCase()}
        </div>
        <div class="case-details" style="margin-bottom: 25px;">
          ARBITRATION PETITION NO: ____________ OF 2026<br/>
          parties: ${data.parties.toUpperCase()}
        </div>
        <div class="title">PETITION UNDER SECTION 9 OF THE ARBITRATION AND CONCILIATION ACT, 1996 FOR INTERIM PROTECTION</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text">
          1. That an agreement dated <strong>${data.agreementDate || "__________"}</strong> was entered into containing an arbitration clause.
        </div>
        <div class="body-text">
          2. That disputes arose between the parties. Details: <strong>${data.disputeDetails || "non-payment of outstanding dues"}</strong>.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is prayed that pending arbitration, interim protection be granted for: <strong>${data.interimRelief || "restraining opposite party from selling assets"}</strong>.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Petitioner
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 18. CONSUMER COMPLAINT
// ==========================================
export const getConsumerComplaintHtml = (data: ConsumerComplaintData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="court-header">
            समक्ष जिला उपभोक्ता विवाद निवारण आयोग, ${data.forumName.toUpperCase()}
          </div>
          <div class="case-details">
            उपभोक्ता शिकायत संख्या: ____________ वर्ष 2026
          </div>
          <div class="party-details">
            <strong>${data.complainantName}</strong> (शिकायतकर्ता) बनाम <strong>${data.oppositePartyName}</strong> (विपक्षी)
          </div>
          <div class="title">शिकायत पत्र अंतर्गत उपभोक्ता संरक्षण अधिनियम, 2019</div>
          <div class="body-text"><strong>सादर निवेदन है:</strong></div>
          <div class="body-text">
            1. यह कि शिकायतकर्ता ने विपक्षी से <strong>${data.productDetails || "सामान / सेवा"}</strong> मूल्य रु <strong>${data.costAmount || "__________"}</strong> में खरीदा था।
          </div>
          <div class="body-text">
            2. यह कि विपक्षी ने सेवा में कमी (deficiency in service) की है। विवरण: <strong>${data.deficiencyDetails || "खराब उत्पाद / गारंटी का पालन न करना"}</strong>।
          </div>
          <div class="body-text">
            <strong>प्रार्थना:</strong><br/>
            अतः प्रार्थना है कि विपक्षी को धन वापस करने तथा मानसिक प्रताड़ना हेतु मुआवजा देने का आदेश दें: <strong>${data.compensationSought || "रु 50,000 मुआवजा दिया जाए"}</strong>।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              द्वारा शिकायतकर्ता:<br/><br/>
              ________________________<br/>
              <strong>${data.advocateName.toUpperCase()}</strong>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="court-header">
          BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION, ${data.forumName.toUpperCase()}
        </div>
        <div class="case-details">
          COMPLAINT NO: ____________ OF 2026
        </div>
        <div class="party-details">
          <strong>${data.complainantName}</strong> (Complainant) VS <strong>${data.oppositePartyName}</strong> (Opposite Party)
        </div>
        <div class="title">COMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019</div>
        <div class="body-text"><strong>MOST RESPECTFULLY SHOWETH:</strong></div>
        <div class="body-text">
          1. That the Complainant purchased <strong>${data.productDetails || "goods/services"}</strong> for Rs. <strong>${data.costAmount || "__________"}</strong> from the Opposite Party.
        </div>
        <div class="body-text">
          2. That there is a deficiency of service on the part of the Opposite Party. Details: <strong>${data.deficiencyDetails || "defective product / failure to repair"}</strong>.
        </div>
        <div class="body-text">
          <strong>PRAYER:</strong><br/>
          It is prayed that the Opposite Party be ordered to refund the amount and pay compensation of: <strong>${data.compensationSought || "Rs. 50,000 for mental agony"}</strong>.
        </div>
        <div class="signatures">
          <div style="width: 100%; text-align: right; margin-top: 40px;">
            Complainant Through Counsel:<br/><br/>
            ________________________<br/>
            <strong>${data.advocateName.toUpperCase()}</strong><br/>Counsel for Complainant
          </div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 19. RENT AGREEMENT
// ==========================================
export const getRentAgreementHtml = (data: RentAgreementData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="title">किरायानामा (RENT AGREEMENT)</div>
          <div class="body-text">
            यह किरायानामा आज दिनांक <strong>${data.agreementDate || "__________"}</strong> को मकान मालिक <strong>${data.landlordName}</strong>, निवासी: ${data.landlordAddress} (प्रथम पक्ष) तथा किरायेदार <strong>${data.tenantName}</strong>, निवासी: ${data.tenantAddress} (द्वितीय पक्ष) के बीच निष्पादित किया गया।
          </div>
          <div class="body-text"><strong>नियम एवं शर्तें निम्नानुसार हैं:</strong></div>
          <div class="body-text">
            1. यह कि किराये की संपत्ति पता: <strong>${data.propertyAddress}</strong> है, जिसका मासिक किराया रु <strong>${data.rentAmount}</strong> तय किया गया है।
          </div>
          <div class="body-text">
            2. यह कि किरायेदार ने मकान मालिक को सुरक्षा राशि के रूप में रु <strong>${data.securityDeposit}</strong> अग्रिम भुगतान किया है।
          </div>
          <div class="body-text">
            3. यह समझौता <strong>${data.termMonths || "11"}</strong> महीनों की अवधि के लिए वैध होगा।
          </div>
          <div class="signatures">
            <div>
              मकान मालिक (Landlord)<br/><br/>
              ________________________
            </div>
            <div>
              किरायेदार (Tenant)<br/><br/>
              ________________________
            </div>
          </div>
          <div class="signatures" style="margin-top: 30px;">
            <div>गवाह 1: ${data.witness1 || "__________"}</div>
            <div>गवाह 2: ${data.witness2 || "__________"}</div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="title">RENT AGREEMENT</div>
        <div class="body-text">
          This Rent Agreement is executed on this <strong>${data.agreementDate || "__________"}</strong> by and between <strong>${data.landlordName}</strong>, residing at ${data.landlordAddress} (Landlord / First Party) and <strong>${data.tenantName}</strong>, residing at ${data.tenantAddress} (Tenant / Second Party).
        </div>
        <div class="body-text"><strong>TERMS AND CONDITIONS:</strong></div>
        <div class="body-text">
          1. That the Landlord lets out the property situated at: <strong>${data.propertyAddress}</strong> at a monthly rent of Rs. <strong>${data.rentAmount}</strong>.
        </div>
        <div class="body-text">
          2. That the Tenant has paid a security deposit of Rs. <strong>${data.securityDeposit}</strong> to the Landlord.
        </div>
        <div class="body-text">
          3. That this lease is granted for a fixed period of <strong>${data.termMonths || "11"}</strong> months.
        </div>
        <div class="signatures" style="margin-top: 50px;">
          <div>LANDLORD<br/><br/>________________________</div>
          <div>TENANT<br/><br/>________________________</div>
        </div>
        <div class="signatures" style="margin-top: 30px;">
          <div>Witness 1: ${data.witness1 || "__________"}</div>
          <div>Witness 2: ${data.witness2 || "__________"}</div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 20. POWER OF ATTORNEY
// ==========================================
export const getPowerOfAttorneyHtml = (data: PowerOfAttorneyData, isHindi = false): string => {
  if (isHindi) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${getSharedStyles(true)}
        </head>
        <body>
          <div class="title">मुख्तारनामा (POWER OF ATTORNEY)</div>
          <div class="body-text">
            मैं, <strong>${data.principalName}</strong>, निवासी: ${data.principalAddress}, एतद्द्वारा <strong>${data.attorneyName}</strong>, निवासी: ${data.attorneyAddress} को अपना वैध मुख्तार (अटॉर्नी) नियुक्त करता हूँ।
          </div>
          <div class="body-text"><strong>अटॉर्नी को दी गई शक्तियां:</strong></div>
          <div class="body-text">
            ${data.powersGranted || "मेरी ओर से न्यायालय में उपस्थित होने, संपत्तियों का प्रबंधन करने और दस्तावेजों पर हस्ताक्षर करने की शक्ति।"}
          </div>
          <div class="body-text">
            यह विलेख आज दिनांक <strong>${data.executionDate || "__________"}</strong> को निष्पादित किया गया।
          </div>
          <div class="signatures">
            <div style="width: 100%; text-align: right; margin-top: 40px;">
              ________________________<br/>
              <strong>निष्पादक (PRINCIPAL)</strong>
            </div>
          </div>
          <div class="signatures" style="margin-top: 30px;">
            <div>गवाह 1: ${data.witness1 || "__________"}</div>
            <div>गवाह 2: ${data.witness2 || "__________"}</div>
          </div>
        </body>
      </html>
    `;
  }
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${getSharedStyles(false)}
      </head>
      <body>
        <div class="title">GENERAL POWER OF ATTORNEY</div>
        <div class="body-text">
          I, <strong>${data.principalName}</strong>, residing at ${data.principalAddress}, do hereby appoint <strong>${data.attorneyName}</strong>, residing at ${data.attorneyAddress}, as my lawful Attorney.
        </div>
        <div class="body-text"><strong>POWERS GRANTED:</strong></div>
        <div class="body-text">
          To manage my properties, sign documents, represent me before courts and authorities, as detailed: <strong>${data.powersGranted || "general management and litigation powers."}</strong>.
        </div>
        <div class="body-text">
          In witness whereof, I have signed this deed on <strong>${data.executionDate || "__________"}</strong>.
        </div>
        <div class="signatures" style="margin-top: 50px;">
          <div style="width: 100%; text-align: right;">
            ________________________<br/><strong>PRINCIPAL</strong>
          </div>
        </div>
        <div class="signatures" style="margin-top: 30px;">
          <div>Witness 1: ${data.witness1 || "__________"}</div>
          <div>Witness 2: ${data.witness2 || "__________"}</div>
        </div>
      </body>
    </html>
  `;
};

// ==========================================
// 21. TEXT PREVIEW COMPILER (BACKWARDS COMPATIBLE)
// ==========================================
export const getTemplateTextPreview = (type: string, data: any, language: "en" | "hi" = "en"): string => {
  const isHindi = language === "hi";

  switch (type) {
    case "vakalatnama":
      return isHindi
        ? `समक्ष न्यायालय श्रीमान ${data.courtName?.toUpperCase() || "[न्यायालय का नाम]"}\n\nवाद संख्या: ${data.suitNumber || "______"} वर्ष ${data.caseYear || "2026"}\n\nपक्षकार: ${data.parties?.toUpperCase() || "[पक्षकार विवरण]"}\n\n--- वकालतनामा ---\n\nमैं/हम, ${data.clientName || "[मुवक्किल का नाम]"}, एतद्द्वारा अधिवक्ता ${data.advocateName || "[अधिवक्ता का नाम]"} (पंजीकरण संख्या: ${data.advocateEnrollment || "______"}) को अपना वकील नियुक्त करता हूँ/करते हैं...\n\nस्वीकर्ता / अधिवक्ता              मुवक्किल`
        : `IN THE COURT OF ${data.courtName?.toUpperCase() || "[COURT NAME]"}\nAT DISTRICT COURTS\n\nSUIT/CASE NO: ${data.suitNumber || "______"} OF ${data.caseYear || "2026"}\n\nIN THE MATTER OF:\n${data.parties?.toUpperCase() || "[PARTIES]"}\n\n--- VAKALATNAMA ---\n\nI/We, ${data.clientName || "[CLIENT NAME]"}, do hereby appoint and authorize ${data.advocateName || "[ADVOCATE NAME]"} (Enrollment No: ${data.advocateEnrollment || "______"}), Advocate, to represent me/us...\n\n[EXECUTANT/CLIENT]             [ADVOCATE]`;
    
    case "adjournment":
      return isHindi
        ? `समक्ष न्यायालय श्रीमान ${data.courtName?.toUpperCase() || "[न्यायालय का नाम]"}\n\nपक्षकार: ${data.parties?.toUpperCase() || "[पक्षकार विवरण]"}\nवाद संख्या: ${data.caseNumber || "______"}\n\n--- स्थगन प्रार्थना पत्र ---\n\nसादर निवेदन है:\n1. उपरोक्त मामला आज साक्ष्य/सुनवाई हेतु नियत है।\n2. अधिवक्ता उपस्थित होने में असमर्थ हैं क्योंकि: ${data.reason || "[अस्वस्थता/अन्य कारण]"}\n\nप्रार्थना: मामले को स्थगित करने की कृपा करें।\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF ${data.courtName?.toUpperCase() || "[COURT NAME]"}\n\nIn re: ${data.parties?.toUpperCase() || "[PARTIES]"}\nCase No: ${data.caseNumber || "______"}\n\n--- APPLICATION FOR ADJOURNMENT ---\n\nMOST RESPECTFULLY SHOWETH:\n1. That the matter is listed today for hearing/evidence.\n2. That the Counsel is unable to assist the Court today due to: ${data.reason || "[REASON]"}.\n\nPRAYER: Prayed that this Hon'ble Court may adjourn the matter.\n\nFiled By: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;
    
    case "bail":
      return isHindi
        ? `समक्ष न्यायालय सत्र न्यायाधीश, ${data.courtName?.toUpperCase() || "[न्यायालय]"}\n\nराज्य बनाम ${data.accusedName?.toUpperCase() || "[आरोपी का नाम]"}\nप्राथमिकी संख्या: ${data.firNumber || "______"} / ${data.firYear || "2026"}\nधारा: ${data.underSection || "______"}\nथाना: ${data.policeStation || "[थाना]"}\n\n--- जमानत आवेदन अंतर्गत धारा 439 दंड प्रक्रिया संहिता ---\n\n1. आवेदक को झूठा फंसाया गया है और वह न्यायिक हिरासत में है।\n2. जमानत के मुख्य आधार: ${data.groundOfBail || "[जमानत के आधार]"}\n\nप्रार्थना: जमानत पर रिहा करने का आदेश देने की कृपा करें।\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF THE SESSIONS JUDGE, ${data.courtName?.toUpperCase() || "[COURT NAME]"}\n\nState vs. ${data.accusedName?.toUpperCase() || "[ACCUSED NAME]"}\nFIR No: ${data.firNumber || "______"} / ${data.firYear || "2026"}\nU/Sec: ${data.underSection || "______"}\nPolice Station: ${data.policeStation || "______"}\n\n--- APPLICATION FOR BAIL U/SEC 439 CrPC ---\n\nMOST RESPECTFULLY SHOWETH:\n1. That the applicant/accused is in custody.\n2. Key grounds: ${data.groundOfBail || "[GROUNDS]"}.\n\nPRAYER: Release the applicant/accused on bail.\n\nThrough: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Advocate`;
    
    case "affidavit":
      return isHindi
        ? `समक्ष न्यायालय श्रीमान ${data.courtName?.toUpperCase() || "[न्यायालय का नाम]"}\nवाद संख्या: ${data.caseNumber || "______"}\nपक्षकार: ${data.parties?.toUpperCase() || "[पक्षकार विवरण]"}\n\n--- शपथ पत्र (हलफनामा) ---\n\nमैं, ${data.deponentName || "[शपथकर्ता]"}, आयु लगभग ${data.deponentAge || "___"} वर्ष, निवासी: ${data.deponentAddress || "[पता]"}, शपथपूर्वक कथन करता हूँ:\n\n${data.facts || "1. शपथ पत्र की बातें सही हैं..."}\n\n[शपथकर्ता]\n\nसत्यापन: शपथ पत्र की बातें मेरे ज्ञान में सत्य हैं।`
        : `IN THE COURT OF ${data.courtName?.toUpperCase() || "[COURT NAME]"}\nCase No: ${data.caseNumber || "______"}\nIn the matter of: ${data.parties?.toUpperCase() || "[PARTIES]"}\n\n--- SUPPORTING AFFIDAVIT ---\n\nI, ${data.deponentName || "[DEPONENT]"}, aged about ${data.deponentAge || "___"} years, residing at ${data.deponentAddress || "[ADDRESS]"}, do hereby affirm on oath:\n\n${data.facts || "1. That the contents are true..."}\n\n[DEPONENT]\n\nVERIFICATION: Verified that the contents are true and correct.`;

    case "written_statement":
      return isHindi
        ? `समक्ष न्यायालय श्रीमान ${data.courtName?.toUpperCase() || "[न्यायालय का नाम]"}\nवाद संख्या: ${data.caseNumber || "______"}\nपक्षकार: ${data.parties?.toUpperCase() || "[पक्षकार विवरण]"}\n\n--- लिखित कथन (जवाब दावा) प्रतिवादी की ओर से ---\n\nप्रतिवादी: ${data.respondentName || "[प्रतिवादी का नाम]"}\n\nप्रारंभिक आपत्तियां:\n${data.preliminaryObjections || "1. वाद अस्वीकार योग्य है..."}\n\nमेरिट्स पर उत्तर:\n${data.replyOnMerits || "1. तथ्य गलत हैं..."}\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF ${data.courtName?.toUpperCase() || "[COURT NAME]"}\nCase No: ${data.caseNumber || "______"}\nIn the matter of: ${data.parties?.toUpperCase() || "[PARTIES]"}\n\n--- WRITTEN STATEMENT FOR RESPONDENT ---\n\nRespondent: ${data.respondentName || "[RESPONDENT NAME]"}\n\nPRELIMINARY OBJECTIONS:\n${data.preliminaryObjections || "1. Suit is not maintainable..."}\n\nREPLY ON MERITS:\n${data.replyOnMerits || "1. Denied..."}\n\nFiled By: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "legal_notice":
      return isHindi
        ? `अधिवक्ता कार्यालय: ${data.advocateName?.toUpperCase() || "[अधिवक्ता का नाम]"}\nपता: ${data.advocateAddress || "[कार्यालय का पता]"}\n\nसंदर्भ: LN/2026/____                  दिनांक: ${new Date().toLocaleDateString("en-IN")}\n\nसेवा में: ${data.receiverName || "[प्राप्तकर्ता का नाम]"}\n${data.receiverAddress || "[प्राप्तकर्ता का पता]"}\n\nविषय: कानूनी नोटिस मवक्किल ${data.senderName?.toUpperCase() || "[मवक्किल का नाम]"} की ओर से\n\nमैं आपको सूचित करता हूँ:\n${data.noticeFacts || "[नोटिस के तथ्य]"}\n\nमांग: ${data.demandText || "[मांग विवरण]"}\n\n[अधिवक्ता] भवदीय`
        : `LAW CHAMBERS OF: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}\nAddress: ${data.advocateAddress || "[ADVOCATE ADDRESS]"}\n\nRef: LN/2026/____                  Date: ${new Date().toLocaleDateString("en-IN")}\n\nTO: ${data.receiverName || "[RECEIVER NAME]"}\n${data.receiverAddress || "[RECEIVER ADDRESS]"}\n\nSUBJECT: LEGAL NOTICE ON BEHALF OF CLIENT ${data.senderName?.toUpperCase() || "[SENDER NAME]"}\n\nSir/Madam,\nUnder instructions, I serve you with this notice:\n${data.noticeFacts || "[FACTS]"}\n\nDemand: ${data.demandText || "[DEMAND]"}\n\n[ADVOCATE]`;

    case "caveat":
      return isHindi
        ? `समक्ष न्यायालय श्रीमान ${data.courtName?.toUpperCase() || "[न्यायालय का नाम]"}\n\nकैविएटर: ${data.caveatorName?.toUpperCase() || "[कैविएटर का नाम]"}\nबनाम\nविपक्षी: ${data.expectedOppositePartyName?.toUpperCase() || "[विपक्षी का नाम]"}\n\n--- कैविएट याचिका अंतर्गत धारा 148क स.प्र.सं. ---\n\n1. आशंका है कि विपक्षी कोई वाद या अपील ला सकता है विवाद: ${data.subjectMatter || "[विषय विवरण]"}\n2. प्रार्थना है कि पूर्व सूचना दिए बिना कोई एकपक्षीय आदेश पारित न किया जाए।\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF ${data.courtName?.toUpperCase() || "[COURT NAME]"}\n\n${data.caveatorName?.toUpperCase() || "[CAVEATOR]"} (Caveator)\nVERSUS\n${data.expectedOppositePartyName?.toUpperCase() || "[OPPOSITE PARTY]"} (Expected Opposite Party)\n\n--- CAVEAT PETITION U/SEC 148A CPC ---\n\n1. Caveator expects a suit or appeal in respect of: ${data.subjectMatter || "[SUBJECT MATTER]"}.\n2. Prayed that no ex-parte stay/relief be granted without prior notice.\n\nFiled By: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "injunction":
      return isHindi
        ? `समक्ष न्यायालय श्रीमान ${data.courtName?.toUpperCase() || "[न्यायालय का नाम]"}\nवाद संख्या: ${data.caseNumber || "______"}\nपक्षकार: ${data.parties?.toUpperCase() || "[पक्षकार विवरण]"}\n\n--- निषेधाज्ञा (निषेधाज्ञा प्रार्थना पत्र) अंतर्गत आदेश 39 नियम 1 व 2 ---\n\nआवेदक: ${data.applicantName || "[आवेदक का नाम]"}\n\nतथ्य:\n${data.injunctionFacts || "[तथ्य विवरण]"}\n\nप्रार्थना: विपक्षी को रोका जाए: ${data.restraintPrayer || "[निषेधाज्ञा विवरण]"}\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF ${data.courtName?.toUpperCase() || "[COURT NAME]"}\nCase No: ${data.caseNumber || "______"}\nIn the matter of: ${data.parties?.toUpperCase() || "[PARTIES]"}\n\n--- APPLICATION FOR TEMPORARY INJUNCTION (O.39 R.1/2 CPC) ---\n\nApplicant: ${data.applicantName || "[APPLICANT NAME]"}\n\nFACTS:\n${data.injunctionFacts || "[INJUNCTION FACTS]"}\n\nPRAYER: Restrain the opposite party from: ${data.restraintPrayer || "[RESTRAINT PRAYER]"}.\n\nFiled By: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "plaint":
      return isHindi
        ? `न्यायालय श्रीमान सिविल जज, ${data.courtName?.toUpperCase() || "[न्यायालय]"}\nवाद संख्या: ______ वर्ष ${data.caseYear || "2026"}\n\nवादी: ${data.plaintiffName || "[वादी]"} बनाम प्रतिवादी: ${data.defendantName || "[प्रतिवादी]"}\n\n--- वाद पत्र (PLAINT) अंतर्गत आदेश 7 नियम 1 स.प्र.सं. ---\n\n1. वाद के तथ्य:\n${data.suitFacts || "[वाद के तथ्य]"}\n\nमूल्यांकन: रु ${data.valuation || "______"}\nप्रार्थना: डिक्री की जाए: ${data.prayerText || "[प्रार्थना विवरण]"}\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF THE CIVIL JUDGE, ${data.courtName?.toUpperCase() || "[COURT NAME]"}\nCIVIL SUIT NO: ______ OF ${data.caseYear || "2026"}\n\n${data.plaintiffName || "[PLAINTIFF]"} VS ${data.defendantName || "[DEFENDANT]"}\n\n--- PLAINT UNDER ORDER VII RULE 1 CPC ---\n\nFACTS:\n${data.suitFacts || "[FACTS]"}\n\nValuation: Rs. ${data.valuation || "______"}\nPRAYER: Grant decree for: ${data.prayerText || "[PRAYER]"}\n\nThrough: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "rejoinder":
      return isHindi
        ? `समक्ष न्यायालय श्रीमान ${data.courtName?.toUpperCase() || "[न्यायालय]"}\nवाद संख्या: ${data.caseNumber || "______"}\nपक्षकार: ${data.parties?.toUpperCase() || "[पक्षकार]"}\n\n--- प्रत्युत्तर / प्रतिवाद पत्र (REJOINDER) ---\n\nउत्तर के बिंदु:\n${data.replyPoints || "[उत्तर के बिंदु]"}\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF ${data.courtName?.toUpperCase() || "[COURT NAME]"}\nCase No: ${data.caseNumber || "______"}\nIn re: ${data.parties?.toUpperCase() || "[PARTIES]"}\n\n--- REJOINDER / REPLICATION ON BEHALF OF PLAINTIFF ---\n\nPOINTS:\n${data.replyPoints || "[POINTS OF REPLY]"}\n\nThrough: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "execution":
      return isHindi
        ? `समक्ष न्यायालय श्रीमान सिविल जज, ${data.courtName?.toUpperCase() || "[न्यायालय]"}\nनिष्पादन वाद संख्या: ______ वर्ष ${data.caseYear || "2026"}\n\nडिक्रीदार: ${data.decreeHolder || "[डिक्रीदार]"} बनाम ऋणी: ${data.judgmentDebtor || "[ऋणी]"}\n\n--- निष्पादन याचिका अंतर्गत आदेश 21 नियम 11 स.प्र.सं. ---\n\n1. डिक्री दिनांक: ${data.decreeDate || "______"} डिक्री राशि: रु ${data.decreetalAmount || "______"}\n2. भुगतान की स्थिति: ${data.satisfactionDetails || "शून्य / बकाया"}\n\nप्रार्थना: संपत्ति कुर्क कर डिक्री निष्पादित की जाए: ${data.reliefSought || "[राहत विवरण]"}\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF THE CIVIL JUDGE, ${data.courtName?.toUpperCase() || "[COURT NAME]"}\nEXECUTION PETITION NO: ______ OF ${data.caseYear || "2026"}\n\n${data.decreeHolder || "[DECREE HOLDER]"} VS ${data.judgmentDebtor || "[JUDGMENT DEBTOR]"}\n\n--- EXECUTION PETITION UNDER ORDER XXI RULE 11 CPC ---\n\n1. Decree Date: ${data.decreeDate || "______"} Decree Amount: Rs. ${data.decreetalAmount || "______"}\n2. Satisfaction status: ${data.satisfactionDetails || "un-satisfied"}\n\nPRAYER: Attach and sell properties for: ${data.reliefSought || "[RELIEF]"}\n\nThrough: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "anticipatory_bail":
      return isHindi
        ? `समक्ष न्यायालय सत्र न्यायाधीश, ${data.courtName?.toUpperCase() || "[न्यायालय]"}\n\nआवेदक: ${data.applicantName?.toUpperCase() || "[आवेदक का नाम]"} बनाम राज्य\nप्राथमिकी संख्या: ${data.firNumber || "______"} / ${data.firYear || "2026"}\nधारा: ${data.underSection || "______"}\nथाना: ${data.policeStation || "[थाना]"}\n\n--- अग्रिम जमानत आवेदन अंतर्गत धारा 438 दंड प्रक्रिया संहिता ---\n\n1. गिरफ्तारी की आशंका का कारण: ${data.apprehensionReason || "[आशंका विवरण]"}\n2. जमानत के आधार: ${data.grounds || "[आधार]"}\n\nप्रार्थना: गिरफ्तार किए जाने की स्थिति में जमानत पर रिहा करने का निर्देश दें।\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF THE SESSIONS JUDGE, ${data.courtName?.toUpperCase() || "[COURT NAME]"}\n\nApplicant: ${data.applicantName?.toUpperCase() || "[APPLICANT]"} VS State\nFIR No: ${data.firNumber || "______"} / ${data.firYear || "2026"}\nU/Sec: ${data.underSection || "______"}\nPolice Station: ${data.policeStation || "[POLICE STATION]"}\n\n--- ANTICIPATORY BAIL APPLICATION U/SEC 438 CrPC ---\n\n1. Reason for Apprehension: ${data.apprehensionReason || "[REASON]"}\n2. Grounds: ${data.grounds || "[GROUNDS]"}\n\nPRAYER: Direct release on bail in event of arrest.\n\nThrough: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "private_complaint":
      return isHindi
        ? `समक्ष न्यायालय मुख्य न्यायिक मजिस्ट्रेट, ${data.courtName?.toUpperCase() || "[न्यायालय]"}\n\nपरिवादी: ${data.complainantName?.toUpperCase() || "[परिवादी]"} बनाम आरोपी: ${data.accusedName?.toUpperCase() || "[आरोपी]"}\n\n--- परिवाद पत्र अंतर्गत धारा 200 दंड प्रक्रिया संहिता ---\n\n1. घटना तिथि: ${data.incidentDate || "______"}\n2. घटना का विवरण: ${data.incidentFacts || "[घटना विवरण]"}\n3. अपराध: ${data.offences || "[अपराध धाराएं]"}\n\nप्रार्थना: आरोपी को तलब कर दंडित किया जाए।\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF THE CHIEF JUDICIAL MAGISTRATE, ${data.courtName?.toUpperCase() || "[COURT NAME]"}\n\nComplainant: ${data.complainantName?.toUpperCase() || "[COMPLAINANT]"} VS Accused: ${data.accusedName?.toUpperCase() || "[ACCUSED]"}\n\n--- COMPLAINT UNDER SECTION 200 CrPC ---\n\n1. Incident Date: ${data.incidentDate || "______"}\n2. incident facts: ${data.incidentFacts || "[FACTS]"}\n3. Offences: ${data.offences || "[OFFENCES]"}\n\nPRAYER: Summon and prosecute the Accused.\n\nThrough: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "fir_quashing":
      return isHindi
        ? `समक्ष माननीय उच्च न्यायालय, ${data.courtName?.toUpperCase() || "[न्यायालय]"}\n\nआवेदक: ${data.applicantName?.toUpperCase() || "[आवेदक का नाम]"} बनाम राज्य\nथाना: ${data.policeStation || "[थाना]"} प्राथमिकी संख्या: ${data.firNumber || "______"} / ${data.firYear || "2026"}\n\n--- एफआईआर निरस्तीकरण याचिका अंतर्गत धारा 482 दं.प्र.सं. ---\n\n1. निरस्तीकरण के आधार:\n${data.groundsOfQuashing || "[आधार विवरण]"}\n\nप्रार्थना: प्राथमिकी को निरस्त करने की कृपा करें।\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE HIGH COURT OF ${data.courtName?.toUpperCase() || "[COURT NAME]"}\n\nApplicant: ${data.applicantName?.toUpperCase() || "[APPLICANT]"} VS State\nPS: ${data.policeStation || "[PS]"} FIR No: ${data.firNumber || "______"} / ${data.firYear || "2026"}\n\n--- FIR QUASHING PETITION U/SEC 482 CrPC ---\n\n1. Grounds for Quashing:\n${data.groundsOfQuashing || "[GROUNDS]"}\n\nPRAYER: Quash the FIR and all connected proceedings.\n\nThrough: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "exemption":
      return isHindi
        ? `समक्ष न्यायालय श्रीमान ${data.courtName?.toUpperCase() || "[न्यायालय]"}\nवाद संख्या: ${data.caseNumber || "______"} वर्ष: ${data.caseYear || "2026"}\nपक्षकार: ${data.parties?.toUpperCase() || "[पक्षकार]"}\n\n--- व्यक्तिगत उपस्थिति से छूट हेतु आवेदन अंतर्गत धारा 205/317 दं.प्र.सं. ---\n\n1. आरोपी: ${data.accusedName || "[आरोपी का नाम]"} उपस्थित होने में असमर्थ है।\n2. कारण: ${data.excuseReason || "[कारण विवरण]"}\n\nप्रार्थना: आरोपी की आज की व्यक्तिगत उपस्थिति माफ की जाए।\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF ${data.courtName?.toUpperCase() || "[COURT NAME]"}\nCase No: ${data.caseNumber || "______"} OF ${data.caseYear || "2026"}\nparties: ${data.parties?.toUpperCase() || "[PARTIES]"}\n\n--- EXEMPTION APPLICATION U/SEC 205/317 CrPC ---\n\n1. Accused: ${data.accusedName || "[ACCUSED NAME]"} is unable to attend.\n2. Reason: ${data.excuseReason || "[REASON]"}\n\nPRAYER: Exempt the accused from personal appearance today.\n\nThrough: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "cheque_bounce":
      return isHindi
        ? `अधिवक्ता कार्यालय: ${data.advocateName?.toUpperCase() || "[अधिवक्ता का नाम]"}\n\nदिनांक: ${data.noticeDate || new Date().toLocaleDateString("en-IN")}\n\nसेवा में: ${data.receiverName || "[प्राप्तकर्ता का नाम]"}\n${data.receiverAddress || "[प्राप्तकर्ता का पता]"}\n\nविषय: चेक बाउंस कानूनी नोटिस अंतर्गत धारा 138 एनआई एक्ट\n\n1. चेक संख्या: ${data.chequeNumber || "______"} दिनांक: ${data.chequeDate || "______"} बैंक: ${data.bankName || "______"} राशि: रु ${data.chequeAmount || "______"}\n2. बाउंस दिनांक: ${data.dishonorDate || "______"} कारण: ${data.dishonorReason || "अपर्याप्त राशि"}\n\nमांग: 15 दिनों में चेक राशि का भुगतान करें अन्यथा मुकदमा होगा।\n\n[अधिवक्ता]`
        : `LAW CHAMBERS OF: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}\nDate: ${data.noticeDate || new Date().toLocaleDateString("en-IN")}\n\nTO: ${data.receiverName || "[RECEIVER NAME]"}\n${data.receiverAddress || "[RECEIVER ADDRESS]"}\n\nSUBJECT: DEMAND NOTICE UNDER SECTION 138 OF THE NI ACT\n\n1. Cheque No: ${data.chequeNumber || "______"} Date: ${data.chequeDate || "______"} Bank: ${data.bankName || "______"} Amount: Rs. ${data.chequeAmount || "______"}\n2. Dishonored Date: ${data.dishonorDate || "______"} Reason: ${data.dishonorReason || "funds insufficient"}\n\nDemand: Pay the cheque amount within 15 days, failing which legal action will ensue.\n\n[ADVOCATE]`;

    case "arbitration_sec9":
      return isHindi
        ? `समक्ष न्यायालय श्रीमान जिला न्यायाधीश, ${data.courtName?.toUpperCase() || "[न्यायालय]"}\nपक्षकार: ${data.parties?.toUpperCase() || "[पक्षकार]"}\n\n--- मध्यस्थता धारा 9 याचिका (अंतरिम राहत) ---\n\n1. समझौता दिनांक: ${data.agreementDate || "______"} विवाद: ${data.disputeDetails || "[विवाद विवरण]"}\n2. अंतरिम राहत: ${data.interimRelief || "[राहत विवरण]"}\n\nप्रार्थना: अंतरिम संरक्षण प्रदान किया जाए।\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `IN THE COURT OF THE DISTRICT JUDGE, ${data.courtName?.toUpperCase() || "[COURT NAME]"}\nparties: ${data.parties?.toUpperCase() || "[PARTIES]"}\n\n--- PETITION U/SEC 9 OF ARBITRATION ACT ---\n\n1. Agreement Date: ${data.agreementDate || "______"} Dispute: ${data.disputeDetails || "[DISPUTE DETAILS]"}\n2. Relief sought: ${data.interimRelief || "[INTERIM RELIEF]"}\n\nPRAYER: Grant interim protection pending arbitration.\n\nThrough: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "consumer_complaint":
      return isHindi
        ? `समक्ष जिला उपभोक्ता विवाद निवारण आयोग, ${data.forumName?.toUpperCase() || "[उपभोक्ता मंच]"}\n\nशिकायतकर्ता: ${data.complainantName || "[शिकायतकर्ता]"} बनाम विपक्षी: ${data.oppositePartyName || "[विपक्षी]"}\n\n--- उपभोक्ता शिकायत पत्र अंतर्गत उपभोक्ता संरक्षण अधिनियम ---\n\n1. उत्पाद/सेवा: ${data.productDetails || "[उत्पाद विवरण]"} मूल्य: रु ${data.costAmount || "______"}\n2. सेवा में कमी: ${data.deficiencyDetails || "[कमी विवरण]"}\n\nप्रार्थना: राशि वापस की जाए एवं मुआवजा: ${data.compensationSought || "[मुआवजा]"}\n\nद्वारा अधिवक्ता: ${data.advocateName?.toUpperCase() || "[अधिवक्ता]"}`
        : `BEFORE THE DISTRICT CONSUMER COMMISSION, ${data.forumName?.toUpperCase() || "[FORUM NAME]"}\n\nComplainant: ${data.complainantName || "[COMPLAINANT]"} VS Opposite Party: ${data.oppositePartyName || "[OPPOSITE PARTY]"}\n\n--- CONSUMER COMPLAINT U/SEC 35 CONSUMER PROTECTION ACT ---\n\n1. Product purchased: ${data.productDetails || "[DETAILS]"} Price: Rs. ${data.costAmount || "______"}\n2. Deficiency: ${data.deficiencyDetails || "[DEFICIENCY]"}\n\nPRAYER: Refund amount and pay compensation: ${data.compensationSought || "[COMPENSATION]"}\n\nThrough: ${data.advocateName?.toUpperCase() || "[ADVOCATE NAME]"}, Counsel`;

    case "rent_agreement":
      return isHindi
        ? `--- किरायानामा (RENT AGREEMENT) ---\n\nअनुबंध दिनांक: ${data.agreementDate || "______"}\nमकान मालिक: ${data.landlordName || "[मकान मालिक]"} (प्रथम पक्ष)\nकिरायेदार: ${data.tenantName || "[किरायेदार]"} (द्वितीय पक्ष)\n\nशर्ते:\n1. संपत्ति पता: ${data.propertyAddress || "[संपत्ति का पता]"}\n2. मासिक किराया: रु ${data.rentAmount || "______"} सुरक्षा राशि: रु ${data.securityDeposit || "______"}\n3. अवधि: ${data.termMonths || "11"} माह\n\nगवाह 1: ${data.witness1 || "______"}          गवाह 2: ${data.witness2 || "______"}`
        : `--- RENT AGREEMENT ---\n\nDate: ${data.agreementDate || "______"}\nLandlord: ${data.landlordName || "[LANDLORD]"} VS Tenant: ${data.tenantName || "[TENANT]"}\n\nTERMS:\n1. Property Address: ${data.propertyAddress || "[PROPERTY ADDRESS]"}\n2. Rent: Rs. ${data.rentAmount || "______"} Security: Rs. ${data.securityDeposit || "______"}\n3. Term: ${data.termMonths || "11"} months\n\nWitness 1: ${data.witness1 || "______"}          Witness 2: ${data.witness2 || "______"}`;

    case "power_of_attorney":
      return isHindi
        ? `--- मुख्तारनामा (POWER OF ATTORNEY) ---\n\nनिष्पादक: ${data.principalName || "[निष्पादक का नाम]"}\nअटॉर्नी: ${data.attorneyName || "[अटॉर्नी का नाम]"}\n\nअधिकार शक्तियां:\n${data.powersGranted || "[शक्तियां]"}\n\nदिनांक: ${data.executionDate || "______"}\n\nनिष्पादक (PRINCIPAL)             गवाह`
        : `--- POWER OF ATTORNEY ---\n\nPrincipal: ${data.principalName || "[PRINCIPAL]"} Appoints Attorney: ${data.attorneyName || "[ATTORNEY]"}\n\nPowers Granted:\n${data.powersGranted || "[POWERS]"}\n\nDate: ${data.executionDate || "______"}\n\n[PRINCIPAL]                     Witnesses`;

    default:
      return isHindi ? "पूर्वावलोकन देखने के लिए एक प्रारूप चुनें।" : "Select a template to view the preview.";
  }
};
