import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

import { SignUpStyle } from "./signupStyle";
import InputTextField from "../../CommonComponents/InputTextField";

interface Props {
  setIsSignUp: (value: boolean) => void;
}

const SignUp: React.FC<Props> = ({ setIsSignUp }) => {
  return (
    <View>
      <Text>Create Your Account</Text>
      <InputTextField
        label="Email"
        placeholder="Email"
        inputType="email"
        keyboardType="email-address"
      />
      <InputTextField
        label="PhoneNumber"
        placeholder="PhoneNumber"
        inputType="phonenumber"
        keyboardType="numeric"
      />
      <InputTextField
        label="Password"
        placeholder="Password"
        inputType="password"
      />
      <TouchableOpacity style={SignUpStyle.button} activeOpacity={0.8}>
        <Text style={SignUpStyle.buttonText}>SignUp</Text>
      </TouchableOpacity>

      <Text style={SignUpStyle.Signupstatement}>
        Have account please{" "}
        <TouchableOpacity onPress={() => setIsSignUp(false)}>
          <Text style={SignUpStyle.linkText}>Login</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
};

export default SignUp;
