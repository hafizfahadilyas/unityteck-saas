import { useEffect, useMemo, useState } from 'react';
import { DateFilterPreset, DateFilterRange, NotificationItem } from '../types/notification.types';
import { filterNotificationsByDate } from '../utils/dateFilters';

export function useNotificationFilter(initialItems: NotificationItem[]) {
  const [dateFilter, setDateFilter] = useState<DateFilterRange>({
    preset: 'today',
  });
  const [debouncedDateFilter, setDebouncedDateFilter] = useState<DateFilterRange>(dateFilter);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Debounce filter changes by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDateFilter(dateFilter);
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [dateFilter, searchQuery]);

  const filteredItems = useMemo(() => {
    let list = initialItems;

    // 1. Date filter
    list = filterNotificationsByDate(list, debouncedDateFilter);

    // 2. Search query filter
    const query = debouncedSearchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.titleAr && item.titleAr.toLowerCase().includes(query)) ||
          (item.descriptionAr && item.descriptionAr.toLowerCase().includes(query)) ||
          item.category.toLowerCase().includes(query),
      );
    }

    // 3. Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    // 4. Severity filter
    if (selectedSeverity !== 'all') {
      list = list.filter((item) => item.severity === selectedSeverity);
    }

    return list;
  }, [initialItems, debouncedDateFilter, debouncedSearchQuery, selectedCategory, selectedSeverity]);

  return {
    dateFilter,
    setDateFilter: (filter: DateFilterRange | ((prev: DateFilterRange) => DateFilterRange)) =>
      setDateFilter(filter),
    setDatePreset: (preset: DateFilterPreset) =>
      setDateFilter((prev: DateFilterRange) => ({ ...prev, preset })),
    setCustomDateRange: (startDate: Date | null, endDate: Date | null) =>
      setDateFilter({ preset: 'custom', startDate, endDate }),
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedSeverity,
    setSelectedSeverity,
    filteredItems,
  };
}
