import { StyleSheet } from 'react-native';
import { Theme } from '../../../Providers/ThemeProvider';

export const getContactItemStyles = (theme: Theme) => {
  return StyleSheet.create({
    touchable: {
      // No specific style needed if itemContainer provides enough padding
    },
    itemContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    icon: {
      marginRight: 18,
      width: 24,
      color: theme.colors.primary,
    },
    text: {
      fontSize: 14,
      color: theme.colors.text,
      flexShrink: 1,
      lineHeight: 22,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      borderBottomWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
  });
};
