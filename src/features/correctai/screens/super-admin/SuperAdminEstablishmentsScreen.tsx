import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, FilterChips, FloatingButton, Icon, Icons, SearchRow, ScreenFrame, StatusPill } from '@/features/correctai/components/ui';
import { superAdminTabs } from '@/features/correctai/data/mock-data';
import type { EstablishmentStatus } from '@/features/correctai/types';
import { EstablishmentCard, SuperAdminScreenProps, normalizeSearch, styles } from './shared';

export function SuperAdminEstablishmentsScreen({ activeTab, onNavigate, establishmentsData, onSelectEstablishment }: SuperAdminScreenProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | EstablishmentStatus>('all');
  const [query, setQuery] = useState('');

  const visibleEstablishments = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    return establishmentsData.filter((est) => {
      if (filter !== 'all' && est.status !== filter) return false;
      if (!normalizedQuery) return true;
      const haystack = normalizeSearch(`${est.name} ${est.city} ${est.adminName} ${est.adminEmail}`);
      return haystack.includes(normalizedQuery);
    });
  }, [filter, query, establishmentsData]);

  const resultLabel = visibleEstablishments.length === 1 ? '1 etablissement' : `${visibleEstablishments.length} etablissements`;

  return (
    <ScreenFrame
      activeTab={activeTab}
      greeting="Etablissements"
      onTabPress={(item) => onNavigate(item.screen)}
      scrollable={false}
      tabs={superAdminTabs}>
      <View style={styles.page}>
        <FlatList
          data={visibleEstablishments}
          keyExtractor={(item) => item.id}
          style={styles.listView}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.list, visibleEstablishments.length === 0 && styles.listEmpty]}
          ListHeaderComponent={
            <View style={styles.header}>
              <SearchRow
                onChangeText={setQuery}
                onClear={() => setQuery('')}
                placeholder="Rechercher un etablissement"
                value={query}
              />
              <FilterChips
                active={filter}
                onChange={(value) => setFilter(value as 'all' | EstablishmentStatus)}
                options={[
                  { id: 'all', label: 'Tous' },
                  { id: 'ACTIF', label: 'Actif' },
                  { id: 'INACTIF', label: 'Inactif' },
                  { id: 'SUSPENDU', label: 'Suspendu' },
                ]}
              />
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{resultLabel}</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Card icon={Icons.search} style={styles.emptyCard} title="Aucun resultat">
              <Text style={styles.emptyText}>Essayez une autre recherche.</Text>
            </Card>
          }
          renderItem={({ item }) => (
            <EstablishmentCard
              establishment={item}
              onPress={() => {
                onSelectEstablishment?.(item);
                onNavigate('super-admin-establishment-detail');
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
        <View style={[styles.fabWrap, { bottom: 84 + Math.max(insets.bottom, 16) }]}>
          <FloatingButton icon={Icons.plus} onPress={() => onNavigate('super-admin-new-establishment')} style={styles.fabButton}>
            Nouveau
          </FloatingButton>
        </View>
      </View>
    </ScreenFrame>
  );
}
