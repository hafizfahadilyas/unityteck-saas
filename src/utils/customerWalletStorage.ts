export type WalletTransactionRecord = {
  id: string;
  store_id: string;
  customer_id: string;
  type: 'add' | 'deduct';
  amount: number;
  balance_before: number;
  balance_after: number;
  reason?: string | null;
  employee_id?: string | null;
  employee_name?: string | null;
  notify_channel?: string | null;
  reset_loyalty: boolean;
  created_at: string;
  /** Pending sync to API when offline */
  pending_sync?: boolean;
};

export type LocalWalletState = {
  balance: number;
  loyalty_points: number;
  transactions: WalletTransactionRecord[];
};

function walletLedgerKey(storeId: string): string {
  return `unityteck_customer_wallet_ledger_${storeId}`;
}

function readLedger(storeId: string): Record<string, LocalWalletState> {
  try {
    const raw = localStorage.getItem(walletLedgerKey(storeId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LocalWalletState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLedger(storeId: string, ledger: Record<string, LocalWalletState>): void {
  try {
    localStorage.setItem(walletLedgerKey(storeId), JSON.stringify(ledger));
  } catch {
    /* quota */
  }
}

export function getLocalCustomerWallet(
  storeId: string,
  customerId: string,
): LocalWalletState {
  const ledger = readLedger(storeId);
  return (
    ledger[customerId] ?? {
      balance: 0,
      loyalty_points: 0,
      transactions: [],
    }
  );
}

export function applyLocalWalletAdjust(
  storeId: string,
  customerId: string,
  input: {
    type: 'add' | 'deduct';
    amount: number;
    reason?: string;
    reset_loyalty?: boolean;
    notify_channel?: string | null;
    employee_id?: string | null;
    employee_name?: string | null;
  },
): { ok: true; state: LocalWalletState } | { ok: false; error: string } {
  const amount = Math.round(input.amount * 100) / 100;
  if (amount <= 0) return { ok: false, error: 'invalid_amount' };

  const ledger = readLedger(storeId);
  const current = ledger[customerId] ?? {
    balance: 0,
    loyalty_points: 0,
    transactions: [],
  };

  const balanceBefore = current.balance;
  if (input.type === 'deduct' && balanceBefore < amount) {
    return { ok: false, error: 'insufficient_balance' };
  }

  const balanceAfter =
    input.type === 'add'
      ? Math.round((balanceBefore + amount) * 100) / 100
      : Math.round((balanceBefore - amount) * 100) / 100;

  if (balanceAfter < 0) return { ok: false, error: 'negative_balance' };

  const tx: WalletTransactionRecord = {
    id: `wtx-local-${Date.now()}`,
    store_id: storeId,
    customer_id: customerId,
    type: input.type,
    amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    reason: input.reason ?? null,
    employee_id: input.employee_id ?? null,
    employee_name: input.employee_name ?? null,
    notify_channel: input.notify_channel ?? null,
    reset_loyalty: Boolean(input.reset_loyalty),
    created_at: new Date().toISOString(),
    pending_sync: true,
  };

  const next: LocalWalletState = {
    balance: balanceAfter,
    loyalty_points: input.reset_loyalty ? 0 : current.loyalty_points,
    transactions: [tx, ...current.transactions].slice(0, 200),
  };

  ledger[customerId] = next;
  writeLedger(storeId, ledger);
  return { ok: true, state: next };
}

export function setLocalWalletFromApi(
  storeId: string,
  customerId: string,
  balance: number,
  loyaltyPoints: number,
  transactions: WalletTransactionRecord[],
): void {
  const ledger = readLedger(storeId);
  ledger[customerId] = {
    balance,
    loyalty_points: loyaltyPoints,
    transactions,
  };
  writeLedger(storeId, ledger);
}

export function listPendingSyncTransactions(
  storeId: string,
  customerId: string,
): WalletTransactionRecord[] {
  const state = getLocalCustomerWallet(storeId, customerId);
  return state.transactions.filter((t) => t.pending_sync);
}
