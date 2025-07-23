import React, { createContext, useState } from 'react';

export const OnboardingContext = createContext({
  onboardingData: {},
  setOnboardingData: (data: any) => {},
});

const OnboardingProvider = ({ children }) => {
  const [onboardingData, setOnboardingData] = useState({});

  return (
    <OnboardingContext.Provider value={{ onboardingData, setOnboardingData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export default OnboardingProvider;
