export function generateJuniorDutyWhatsApp(params: {
  memberName: string;
  memberRole?: string | null;
  date: string;
  assignments: Array<{
    courtName?: string | null;
    judgeName?: string | null;
    caseTitle?: string | null;
    caseNumber?: string | null;
    duty_type?: string | null;
    notes?: string | null;
    stage?: string | null;
  }>;
  chamberHead?: string | null;
}): string {
  const head = params.chamberHead || "Adv. Rajesh Sharma (Chamber Head)";
  let msg = `⚖️ *MORNING COURTROOM DUTY ROSTER*\n`;
  msg += `📅 *Date:* ${params.date}\n`;
  msg += `👤 *Assigned To:* ${params.memberName} (${params.memberRole || "Counsel"})\n\n`;
  msg += `Here are your assigned courtroom matters for today:\n\n`;

  if (params.assignments.length === 0) {
    msg += `No courtroom hearings scheduled for you today.\n`;
  } else {
    params.assignments.forEach((a, idx) => {
      msg += `*${idx + 1}. ${a.courtName || "Court Unassigned"}*\n`;
      if (a.judgeName) msg += `   Judge: ${a.judgeName}\n`;
      msg += `   Matter: ${a.caseTitle || "Untitled Case"}${a.caseNumber ? ` (${a.caseNumber})` : ""}\n`;
      msg += `   *Task:* ${a.duty_type || "Attend Hearing"}\n`;
      if (a.notes) msg += `   *Instructions:* ${a.notes}\n`;
      msg += `\n`;
    });
  }

  msg += `Please acknowledge and confirm when you reach the court premises.\n\n`;
  msg += `Regards,\n*${head}*`;
  return msg;
}

export function generateSingleMatterJuniorBriefing(params: {
  memberName: string;
  caseTitle: string;
  caseNumber?: string | null;
  courtName?: string | null;
  judgeName?: string | null;
  nextDate?: string | null;
  stage?: string | null;
  dutyType?: string | null;
  instructions?: string | null;
  chamberHead?: string | null;
}): string {
  const head = params.chamberHead || "Adv. Rajesh Sharma (Chamber Head)";
  let msg = `⚖️ *COURT BRIEFING & INSTRUCTIONS*\n`;
  msg += `👤 *To:* ${params.memberName}\n`;
  msg += `📋 *Matter:* ${params.caseTitle}${params.caseNumber ? ` (${params.caseNumber})` : ""}\n`;
  if (params.courtName) msg += `🏛️ *Court:* ${params.courtName}\n`;
  if (params.judgeName) msg += `👨‍⚖️ *Judge:* ${params.judgeName}\n`;
  if (params.nextDate) msg += `📅 *Date:* ${params.nextDate}\n`;
  if (params.stage) msg += `📌 *Stage:* ${params.stage}\n`;
  if (params.dutyType) msg += `⚡ *Your Duty:* ${params.dutyType}\n`;
  if (params.instructions) msg += `📝 *Instructions:* ${params.instructions}\n`;
  msg += `\nPlease update the chamber immediately after the matter is called.\n\n`;
  msg += `Regards,\n*${head}*`;
  return msg;
}

