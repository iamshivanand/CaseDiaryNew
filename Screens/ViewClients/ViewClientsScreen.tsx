import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as db from '../../DataBase';
import { CaseData } from '../../Types/appTypes';
import CaseCard from '../CommonComponents/CaseCard';
import { useNavigation } from '@react-navigation/native';

interface Client {
  name: string;
  contact: string;
  cases: CaseData[];
}

const ViewClientsScreen = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const allCases = await db.getAllCases();
        const clientsMap = new Map<string, Client>();

        allCases.forEach(c => {
          const clientName = c.ClientName || 'Unknown Client';
          if (!clientsMap.has(clientName)) {
            clientsMap.set(clientName, {
              name: clientName,
              contact: c.ClientContactNumber || 'No contact info',
              cases: [],
            });
          }
          clientsMap.get(clientName)!.cases.push(c);
        });

        setClients(Array.from(clientsMap.values()));
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const toggleClientExpansion = (clientName: string) => {
    if (expandedClient === clientName) {
      setExpandedClient(null);
    } else {
      setExpandedClient(clientName);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderClient = ({ item }: { item: Client }) => (
    <View style={styles.clientContainer}>
      <TouchableOpacity onPress={() => toggleClientExpansion(item.name)} style={styles.clientHeader}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientContact}>{item.contact}</Text>
      </TouchableOpacity>
      {expandedClient === item.name && (
        <FlatList
          data={item.cases}
          keyExtractor={(caseItem) => caseItem.id.toString()}
          renderItem={({ item: caseItem }) => (
            <CaseCard
              caseData={caseItem}
              onPress={() => navigation.navigate('CaseDetails', { caseId: caseItem.id })}
            />
          )}
        />
      )}
    </View>
  );

  return (
    <FlatList
      data={clients}
      keyExtractor={(item) => item.name}
      renderItem={renderClient}
      ListEmptyComponent={<Text style={styles.emptyText}>No clients found.</Text>}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  clientContainer: {
    marginBottom: 16,
    backgroundColor: '#F3F3F3',
    borderRadius: 12,
    padding: 12,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clientContact: {
    fontSize: 14,
    color: '#777',
  },
});

export default ViewClientsScreen;
