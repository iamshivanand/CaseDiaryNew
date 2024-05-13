import { CaseDetails } from "../Screens/CaseDetailsScreen/CaseDetailsScreen";

export type RootStackParamList = {
  AddCase: { update?: boolean; initialValues?: CaseDetails; uniqueId: string };
  CaseDetail: { caseDetails: CaseDetails };
  Documents: { update?: boolean; uniqueId: string };
  Fees: { update?: boolean; uniqueId: string };
};
