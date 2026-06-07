import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../Providers/ThemeProvider';
import { useTranslation } from '../../Providers/LanguageProvider';
import ActionButton from '../CommonComponents/ActionButton';
import { findDuplicatesInDatabase, DuplicateCasePair } from '../../utils/backupManager';
import { deleteCase } from '../../DataBase';
import { formatDate } from '../../utils/commonFunctions';

const DuplicateReviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [duplicatePairs, setDuplicatePairs] = useState<DuplicateCasePair[]>([]);

  const scanForDuplicates = async () => {
    setLoading(true);
    try {
      const pairs = await findDuplicatesInDatabase();
      setDuplicatePairs(pairs);
    } catch (error) {
      console.error("Scan failed:", error);
      Alert.alert(t("alert_error"), "Failed to scan database for duplicates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanForDuplicates();
  }, []);

  const handleDeleteCase = async (caseId: number, pairIndex: number, side: 1 | 2) => {
    Alert.alert(
      t("editcase_confirm_delete") || "Confirm Delete",
      "Are you sure you want to delete this duplicate case record permanently?",
      [
        { text: t("alert_cancel"), style: 'cancel' },
        {
          text: t("editcase_delete") || "Delete",
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteCase(caseId);
              if (success) {
                Alert.alert(t("alert_success"), "Duplicate case deleted successfully.");
                
                // Remove the resolved pair from state
                const updatedPairs = [...duplicatePairs];
                updatedPairs.splice(pairIndex, 1);
                setDuplicatePairs(updatedPairs);
              } else {
                Alert.alert(t("alert_error"), "Failed to delete case from database.");
              }
            } catch (err) {
              console.error("Failed to delete case:", err);
              Alert.alert(t("alert_error"), "An error occurred while deleting the case.");
            }
          }
        }
      ]
    );
  };

  const renderPairItem = ({ item, index }: { item: DuplicateCasePair; index: number }) => {
    const isCnrMatch = item.case1.CNRNumber && item.case1.CNRNumber === item.case2.CNRNumber;
    
    return (
      <View style={[styles.pairContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.matchBadgeContainer}>
          <Text style={styles.matchBadgeText}>
            {isCnrMatch 
              ? t("duplicate_row_cnr").replace("{cnr}", item.case1.CNRNumber) 
              : t("duplicate_row_num_court").replace("{num}", item.case1.case_number || 'N/A').replace("{court}", item.case1.court_name || 'N/A')}
          </Text>
        </View>

        <View style={styles.casesGrid}>
          {/* CASE 1 CARD */}
          <View style={[styles.caseCard, { borderColor: theme.colors.border }]}>
            <Text style={[styles.caseTitle, { color: theme.colors.text }]} numberOfLines={2}>{item.case1.CaseTitle}</Text>
            <Text style={[styles.caseDetail, { color: theme.colors.textSecondary }]}>
              Client: {item.case1.ClientName || 'N/A'}
            </Text>
            <Text style={[styles.caseDetail, { color: theme.colors.textSecondary }]}>
              Next Date: {formatDate(item.case1.NextDate)}
            </Text>
            <Text style={[styles.caseDetail, { color: theme.colors.textSecondary }]}>
              Court: {item.case1.court_name || 'N/A'}
            </Text>
            
            <ActionButton
              title={t("duplicate_delete_side")}
              onPress={() => handleDeleteCase(item.case1.id, index, 1)}
              type="dashed"
              style={styles.deleteBtn}
              textStyle={{ color: '#EF4444' }}
            />
          </View>

          {/* CASE 2 CARD */}
          <View style={[styles.caseCard, { borderColor: theme.colors.border }]}>
            <Text style={[styles.caseTitle, { color: theme.colors.text }]} numberOfLines={2}>{item.case2.CaseTitle}</Text>
            <Text style={[styles.caseDetail, { color: theme.colors.textSecondary }]}>
              Client: {item.case2.ClientName || 'N/A'}
            </Text>
            <Text style={[styles.caseDetail, { color: theme.colors.textSecondary }]}>
              Next Date: {formatDate(item.case2.NextDate)}
            </Text>
            <Text style={[styles.caseDetail, { color: theme.colors.textSecondary }]}>
              Court: {item.case2.court_name || 'N/A'}
            </Text>
            
            <ActionButton
              title={t("duplicate_delete_side")}
              onPress={() => handleDeleteCase(item.case2.id, index, 2)}
              type="dashed"
              style={styles.deleteBtn}
              textStyle={{ color: '#EF4444' }}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t("duplicate_title")}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {duplicatePairs.length > 0 ? t("duplicate_desc") : t("duplicate_no_found")}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={duplicatePairs}
          renderItem={renderPairItem}
          keyExtractor={(item, idx) => `pair-${item.case1.id}-${item.case2.id}-${idx}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-checkmark-outline" size={80} color="#10B981" />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t("duplicate_no_found")}
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <ActionButton
          title={t("duplicate_btn_done")}
          onPress={() => navigation.goBack()}
          type="primary"
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  pairContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  matchBadgeContainer: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  casesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caseCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  caseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  caseDetail: {
    fontSize: 12,
    marginBottom: 4,
  },
  deleteBtn: {
    marginTop: 12,
    height: 36,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFF',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default DuplicateReviewScreen;
