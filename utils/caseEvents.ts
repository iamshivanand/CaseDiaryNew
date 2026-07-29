import { DeviceEventEmitter } from 'react-native';

export const CASE_UPDATED_EVENT = 'CASE_UPDATED_EVENT';

export const notifyCaseUpdated = (caseId?: number) => {
  DeviceEventEmitter.emit(CASE_UPDATED_EVENT, { caseId, timestamp: Date.now() });
};
