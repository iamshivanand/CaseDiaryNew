import React, { ComponentType, useState, useEffect } from "react";
import { Dimensions, ScaledSize, EmitterSubscription } from "react-native";

interface ScreenDimensions {
  width: number;
  height: number;
}

const withResponsiveDimensions = <P extends object>(
  WrappedComponent: ComponentType<P>
) => {
  const WithResponsiveDimensions: React.FC<P> = (props) => {
    const [dimensions, setDimensions] = useState<ScreenDimensions>(
      Dimensions.get("window")
    );

    useEffect(() => {
      const onChange = ({ window }: { window: ScaledSize }) => {
        setDimensions(window);
      };

      const subscription: EmitterSubscription = Dimensions.addEventListener(
        "change",
        onChange
      );

      return () => subscription.remove();
    }, []);

    return <WrappedComponent {...props} dimensions={dimensions} />;
  };

  return WithResponsiveDimensions;
};

export default withResponsiveDimensions;
