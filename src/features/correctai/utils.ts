/**
 * Shared utility functions used across all feature screen domains.
 * Single source of truth — imported by professor/shared, student/shared, super-admin/shared.
 */
import type { AppScreen, NavItem } from '@/features/correctai/types';

/**
 * Normalises a string for accent-insensitive search comparison.
 * Converts to lowercase and strips diacritical marks.
 */
export function normalizeSearch(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Returns an `onPress` handler for bottom-nav tab items that
 * calls `onNavigate` with the item's associated screen name.
 */
export function tabPress(onNavigate: (screen: AppScreen) => void) {
  return (item: NavItem) => onNavigate(item.screen);
}
