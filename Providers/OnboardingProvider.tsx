import React, { createContext, useState, ReactNode } from 'react';

export interface OnboardingData {
  fullName?: string;
  phone?: string;
  email?: string;
  gender?: string;
  avatarUrl?: string;
  title?: string;
  experience?: string;
  license?: string;
  location?: string;
  practiceAreas?: string[];
}

interface OnboardingContextProps {
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

export const OnboardingContext = createContext<OnboardingContextProps>({
  onboardingData: {},
  setOnboardingData: () => {},
});

const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  return (
    <OnboardingContext.Provider value={{ onboardingData, setOnboardingData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export default OnboardingProvider;
