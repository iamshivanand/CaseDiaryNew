import { DeviceEventEmitter } from "react-native";

import { CASE_UPDATED_EVENT } from "./caseEvents";

class DbCacheManager {
  private casesDirty: boolean = true;
  private countsDirty: boolean = true;

  constructor() {
    // Automatically listen to case updates to flag cache as dirty
    DeviceEventEmitter.addListener(CASE_UPDATED_EVENT, () => {
      this.markDirty();
    });
  }

  public markDirty() {
    this.casesDirty = true;
    this.countsDirty = true;
  }

  public shouldRefreshCases(isLoaded: boolean = false): boolean {
    if (!isLoaded || this.casesDirty) {
      this.casesDirty = false;
      return true;
    }
    return false;
  }

  public shouldRefreshCounts(isLoaded: boolean = false): boolean {
    if (!isLoaded || this.countsDirty) {
      this.countsDirty = false;
      return true;
    }
    return false;
  }

  public invalidate() {
    this.markDirty();
    DeviceEventEmitter.emit(CASE_UPDATED_EVENT);
  }

  public resetForTesting() {
    this.markDirty();
  }
}

export const dbCacheManager = new DbCacheManager();
export default dbCacheManager;
