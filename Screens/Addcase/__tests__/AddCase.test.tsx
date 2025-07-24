import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AddCase from '../AddCase';
import * as db from '../../../DataBase';

jest.mock('../../../DataBase', () => ({
  ...jest.requireActual('../../../DataBase'),
  addCase: jest.fn(() => Promise.resolve(1)),
  addCaseType: jest.fn(() => Promise.resolve(1)),
  getSuggestionsForField: jest.fn((field) => {
    if (field === 'JudgeName') {
      return Promise.resolve([{ id: 1, name: 'Test Judge' }]);
    }
    return Promise.resolve([]);
  }),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

describe('AddCase', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form with all fields', () => {
    const { getByText } = render(<AddCase route={{ params: {} }} />);
    expect(getByText('Case Title*')).toBeTruthy();
    expect(getByText('Client Name')).toBeTruthy();
    expect(getByText('Case Number')).toBeTruthy();
    expect(getByText('CNR Number')).toBeTruthy();
    expect(getByText('Case Type')).toBeTruthy();
    expect(getByText('Court')).toBeTruthy();
    expect(getByText('Date Filed')).toBeTruthy();
    expect(getByText('Presiding Judge')).toBeTruthy();
    expect(getByText('Opposing Counsel')).toBeTruthy();
    expect(getByText('Case Status')).toBeTruthy();
    expect(getByText('Priority Level')).toBeTruthy();
    expect(getByText('Next Hearing Date')).toBeTruthy();
    expect(getByText('Statute of Limitations')).toBeTruthy();
    expect(getByText('First Party')).toBeTruthy();
    expect(getByText('Opposite Party')).toBeTruthy();
    expect(getByText('Client Contact No.')).toBeTruthy();
    expect(getByText('Accused')).toBeTruthy();
    expect(getByText('Under Section(s)')).toBeTruthy();
    expect(getByText('Case Description')).toBeTruthy();
    expect(getByText('Internal Notes')).toBeTruthy();
  });

  it('should show an error message if the case title is not provided', async () => {
    const { getByText } = render(<AddCase route={{ params: {} }} />);
    const saveButton = getByText('Save Case');
    fireEvent.press(saveButton);
    await waitFor(() => {
      expect(getByText('Case Title is required')).toBeTruthy();
    });
  });

  it('should save the case and navigate to the case details screen', async () => {
    const { getByText, getByPlaceholderText } = render(<AddCase route={{ params: {} }} />);
    const caseTitleInput = getByPlaceholderText('e.g., State vs. John Doe');
    fireEvent.changeText(caseTitleInput, 'Test Case');
    const saveButton = getByText('Save Case');
    fireEvent.press(saveButton);
    await waitFor(() => {
      expect(db.addCase).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('CaseDetails', {
        caseId: 1,
      });
    });
  });

  it('should show the "Other" input field when "Other" is selected in the case type dropdown', async () => {
    const { getByTestId, findByPlaceholderText } = render(<AddCase route={{ params: {} }} />);
    const caseTypeDropdown = getByTestId('case_type_id');
    fireEvent(caseTypeDropdown, 'onValueChange', 'Other');
    const otherInput = await findByPlaceholderText('Please specify');
    expect(otherInput).toBeTruthy();
  });

  it('should save the "Other" value when the form is submitted', async () => {
    const { getByText, getByTestId, getByPlaceholderText, findByPlaceholderText } = render(<AddCase route={{ params: {} }} />);
    const caseTypeDropdown = getByTestId('case_type_id');
    fireEvent(caseTypeDropdown, 'onValueChange', 'Other');
    const otherInput = await findByPlaceholderText('Please specify');
    fireEvent.changeText(otherInput, 'New Case Type');
    const saveButton = getByText('Save Case');
    const caseTitleInput = getByPlaceholderText('e.g., State vs. John Doe');
    fireEvent.changeText(caseTitleInput, 'Test Case');
    fireEvent.press(saveButton);
    await waitFor(() => {
      expect(db.addCaseType).toHaveBeenCalledWith('New Case Type');
    });
  });

  it('should show suggestions for the presiding judge field', async () => {
    let getByPlaceholderText, findByText;
    await act(async () => {
      const { getByPlaceholderText: getByPlaceholderTextResult, findByText: findByTextResult } = render(<AddCase route={{ params: {} }} />);
      getByPlaceholderText = getByPlaceholderTextResult;
      findByText = findByTextResult;
    });
    const judgeNameInput = getByPlaceholderText("Enter Judge's Name");
    fireEvent.changeText(judgeNameInput, 'Test');
    await waitFor(() => {
      expect(findByText('Test Judge')).toBeTruthy();
    });
  });

  it('should not show a duplicate placeholder in the dropdowns', async () => {
    let getAllByText;
    await act(async () => {
      const { getAllByText: getAllByTextResult } = render(<AddCase route={{ params: {} }} />);
      getAllByText = getAllByTextResult;
    });
    await waitFor(() => {
      expect(getAllByText('Select Case Type...').length).toBe(1);
      expect(getAllByText('Select Court...').length).toBe(1);
    });
  });
});
