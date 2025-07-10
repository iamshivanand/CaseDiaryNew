import { StyleSheet, Dimensions } from 'react-native';
// You might need to import your theme type if you use it extensively for typing
// import { Theme } from '../../Providers/ThemeProvider'; // Adjust path as needed

// It's good practice to define styles with a theme argument if you plan to use context-based theming
export const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerContainer: { // Renamed from 'header' to avoid conflict if you import a Header component
    paddingVertical: 15,
    // borderBottomWidth: 1, // Common for headers
    // borderBottomColor: theme.colors.border, // Common for headers
    alignItems: 'center', // For title centering
    // backgroundColor: theme.colors.headerBackground || theme.colors.background, // Optional: specific header background
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary, // Using theme's primary color for accents
    marginTop: 25,
    marginBottom: 15,
  },
  templateSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // justifyContent: 'space-around', // This might cause issues with uneven spacing if cards have different widths
    // Consider 'flex-start' and add margin to cards if needed
    justifyContent: 'flex-start',
    gap: 10, // Adds space between cards (React Native 0.71+)
  },
  templateCard: {
    backgroundColor: theme.colors.card,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    // margin: 5, // Use `gap` on container or add marginHorizontal/Vertical for more control
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    minWidth: (Dimensions.get('window').width - 40 - 20) / 3, // Example: 3 cards per row, accounting for padding and gap
    maxWidth: (Dimensions.get('window').width - 40 - 10) / 2, // Example: 2 cards per row
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  templateCardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  templateCardText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.colors.inputBackground || theme.colors.card, // Fallback to card color
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8, // More modern, slightly rounded
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top', // For Android
  },
  previewSection: {
    marginTop: 10,
    padding: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    minHeight: 150, // Increased height for better preview area
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDashed || theme.colors.border, // Optional: dashed border for preview
    // borderStyle: theme.colors.borderDashed ? 'dashed' : 'solid', // If using dashed border
  },
  placeholderText: {
    color: theme.colors.textMuted || '#888', // Fallback color
    textAlign: 'center',
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 15,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  actionButtonText: {
    color: theme.colors.buttonText || '#FFFFFF', // Themeable button text color
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Basic dropdown styling (if not using a component from a library)
  dropdownContainer: { // Wrapper for the custom dropdown
    backgroundColor: theme.colors.inputBackground || theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10, // Padding for the text inside
    paddingVertical: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: theme.colors.textMuted || '#888',
  },
  // Styles for the modal/list part of a custom dropdown (if you build one)
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  // Add other styles as needed, e.g., for icons, specific component parts
});

// Example of how you might structure your theme (adjust to your actual ThemeContext structure)
// interface ThemeColors {
//   background: string;
//   text: string;
//   primary: string;
//   card: string;
//   border: string;
//   inputBackground?: string;
//   textMuted?: string;
//   buttonText?: string;
//   headerBackground?: string;
//   borderDashed?: string;
// }

// interface AppTheme {
//   colors: ThemeColors;
//   // other theme properties like spacing, typography
// }
