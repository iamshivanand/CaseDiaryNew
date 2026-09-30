export interface HearingUpdateMessageParams {
  clientName?: string | null;
  caseTitle?: string | null;
  caseNumber?: string | null;
  cnrNumber?: string | null;
  courtName?: string | null;
  judgeName?: string | null;
  nextDate: string;
  stage?: string | null;
  notes?: string | null;
  advocateName?: string | null;
  phone?: string | null;
}

export function generateWhatsAppHearingUpdate(params: HearingUpdateMessageParams): string {
  const advocate = params.advocateName || "Adv. Rajesh Sharma";
  const client = params.clientName ? `Dear ${params.clientName},` : "Dear Client,";
  const caseRef = params.caseTitle ? `"${params.caseTitle}"` : "your matter";
  const caseNo = params.caseNumber ? ` (Case No: ${params.caseNumber})` : "";
  const cnr = params.cnrNumber ? `\nCNR: ${params.cnrNumber}` : "";
  const court = params.courtName ? ` before ${params.courtName}` : "";
  const judge = params.judgeName ? ` (${params.judgeName})` : "";
  const stage = params.stage ? `\n*Purpose/Stage:* ${params.stage}` : "";
  const notes = params.notes ? `\n*Proceedings:* ${params.notes}` : "";

  return (
    `⚖️ *COURT HEARING UPDATE*\n\n` +
    `${client}\n\n` +
    `Your case ${caseRef}${caseNo}${cnr} was taken up for hearing today${court}${judge}.\n\n` +
    `📅 *Next Hearing Date:* ${params.nextDate}${stage}${notes}\n\n` +
    `For any clarifications, please feel free to reach out to the chamber.\n\n` +
    `Regards,\n` +
    `*${advocate}*\n` +
    `Advocate & Legal Consultant`
  );
}

export function generateWhatsAppReminderMessage(params: {
  clientName?: string | null;
  caseTitle?: string | null;
  caseNumber?: string | null;
  courtName?: string | null;
  hearingDate: string;
  stage?: string | null;
  advocateName?: string | null;
}): string {
  const advocate = params.advocateName || "Adv. Rajesh Sharma";
  const client = params.clientName ? `Dear ${params.clientName},` : "Dear Client,";
  const caseRef = params.caseTitle ? `"${params.caseTitle}"` : "your matter";
  const court = params.courtName ? `\n*Court:* ${params.courtName}` : "";
  const stage = params.stage ? `\n*Stage:* ${params.stage}` : "";

  return (
    `⚖️ *UPCOMING COURT APPEARANCE REMINDER*\n\n` +
    `${client}\n\n` +
    `This is a friendly reminder that your matter ${caseRef} is listed for hearing on:\n\n` +
    `📅 *Date:* ${params.hearingDate}${court}${stage}\n\n` +
    `Please ensure you are present or that required documents are ready in advance.\n\n` +
    `Regards,\n` +
    `*${advocate}*`
  );
}
