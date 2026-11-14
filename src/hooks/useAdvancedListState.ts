import { useCallback, useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

export type AdvancedListFilterMap = Record<string, string>;

export type UseAdvancedListStateOptions = {
  initialPageSize?: number;
  initialSortKey?: string | null;
  initialSortDir?: SortDir;
  initialFilters?: AdvancedListFilterMap;
};

/**
 * Shared advanced list controls — search, facet filters, date range, sort, pagination.
 * Use with AdvancedDataTable / AdvancedFilterBar (Holst tokens).
 */
export function useAdvancedListState(options: UseAdvancedListStateOptions = {}) {
  const {
    initialPageSize = 10,
    initialSortKey = null,
    initialSortDir = 'desc',
    initialFilters = {},
  } = options;

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AdvancedListFilterMap>(initialFilters);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(initialSortDir);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const onPageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const onSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
    setPage(1);
  }, []);

  const resetAll = useCallback(() => {
    setSearch('');
    setFilters(initialFilters);
    setDateFrom('');
    setDateTo('');
    setSortKey(initialSortKey);
    setSortDir(initialSortDir);
    setPage(1);
    setPageSize(initialPageSize);
  }, [initialFilters, initialSortKey, initialSortDir, initialPageSize]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (search.trim()) n += 1;
    if (dateFrom) n += 1;
    if (dateTo) n += 1;
    for (const v of Object.values(filters)) {
      if (v && v !== 'all') n += 1;
    }
    return n;
  }, [search, dateFrom, dateTo, filters]);

  return {
    search,
    setSearch: onSearchChange,
    filters,
    setFilter,
    setFilters,
    dateFrom,
    setDateFrom: (v: string) => {
      setDateFrom(v);
      setPage(1);
    },
    dateTo,
    setDateTo: (v: string) => {
      setDateTo(v);
      setPage(1);
    },
    sortKey,
    sortDir,
    onSort,
    page,
    setPage,
    pageSize,
    setPageSize: onPageSizeChange,
    resetAll,
    activeFilterCount,
  };
}

export type PipelineOptions<T> = {
  rows: T[];
  search: string;
  getSearchBlob: (row: T) => string;
  filters: AdvancedListFilterMap;
  matchFilter?: (row: T, key: string, value: string) => boolean;
  dateFrom?: string;
  dateTo?: string;
  getDate?: (row: T) => string | null | undefined;
  sortKey: string | null;
  sortDir: SortDir;
  getSortValue?: (row: T, key: string) => string | number | null | undefined;
  page: number;
  pageSize: number;
};

/** Filter → sort → paginate. Empty stays empty (no mock fill). */
export function pipelineAdvancedList<T>(opts: PipelineOptions<T>): {
  filtered: T[];
  total: number;
  pageRows: T[];
  safePage: number;
  pageCount: number;
} {
  const {
    rows,
    search,
    getSearchBlob,
    filters,
    matchFilter,
    dateFrom,
    dateTo,
    getDate,
    sortKey,
    sortDir,
    getSortValue,
    page,
    pageSize,
  } = opts;

  let next = rows.slice();

  const q = search.trim().toLowerCase();
  if (q) {
    next = next.filter((row) => getSearchBlob(row).toLowerCase().includes(q));
  }

  for (const [key, value] of Object.entries(filters)) {
    if (!value || value === 'all') continue;
    next = next.filter((row) => {
      if (matchFilter) return matchFilter(row, key, value);
      return true;
    });
  }

  if ((dateFrom || dateTo) && getDate) {
    const fromTs = dateFrom ? Date.parse(dateFrom) : Number.NEGATIVE_INFINITY;
    const toTs = dateTo ? Date.parse(`${dateTo}T23:59:59.999`) : Number.POSITIVE_INFINITY;
    next = next.filter((row) => {
      const raw = getDate(row);
      if (!raw) return false;
      const ts = Date.parse(String(raw));
      if (Number.isNaN(ts)) return false;
      return ts >= fromTs && ts <= toTs;
    });
  }

  if (sortKey && getSortValue) {
    const dir = sortDir === 'asc' ? 1 : -1;
    next.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' }) * dir;
    });
  }

  const total = next.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const pageRows = next.slice(start, start + pageSize);

  return { filtered: next, total, pageRows, safePage, pageCount };
}
