"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/protected-route";
import "react-datepicker/dist/react-datepicker.css";

// Helper function to format date as YYYY-MM-DD
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get first day of current month
const getFirstOfMonth = (): string => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return formatDateToString(firstDay);
};

type RawTransaction = {
  merchantName: string;
  merchantId: string;
  batchDate: string;      // "2025-11-01"
  amountCents: number;    // 414575
  transactionCount: number;
  batchNumber: string;
};

type MonthlySummary = {
  monthKey: string;     // "2025-11"
  monthLabel: string;   // "November 2025"
  totalAmountCents: number;
  totalTransactions: number;
};

type DailySummary = {
  date: string;         // "2025-11-02"
  totalAmountCents: number;
  totalTransactions: number;
};

type Account = {
  merchantName: string;
  merchantId: string;
};

const formatMoney = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US");

const getMonthKey = (dateStr: string) => dateStr.slice(0, 7); // "YYYY-MM"

const getMonthLabel = (monthKey: string) => {
  const [y, m] = monthKey.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export default function PayarcReportPage() {
  const [transactions, setTransactions] = useState<RawTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = formatDateToString(new Date());
  const firstOfMonth = getFirstOfMonth();

  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(todayStr);

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountSearch, setAccountSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [errorAccounts, setErrorAccounts] = useState<string | null>(null);

  // Fetch raw data from your backend
  async function loadData() {
    try {
      setLoading(true);
      setError(null);

     const res = await api.get("/api/payarc/payarc-report", {
        params: {
          from: fromDate,          // already "YYYY-MM-DD"
          to: toDate,
        },
      });

      // Your API returns an array directly, not { success, data }
      const rows = res.data as any[];

      if (!Array.isArray(rows)) {
        throw new Error("Unexpected API response format (expected an array)");
      }

      const mapped: RawTransaction[] = rows.map((row) => ({
        merchantName: row.dba_name,
        merchantId: row.Merchant_Account_Number,
        batchDate: row.Settlement_Date,
        amountCents: row.Amounts ?? 0,
        transactionCount: row.Transactions ?? 0,
        batchNumber: String(row.Batch_Reference_Number ?? ""),
      }));

      setTransactions(mapped);
      setSelectedMonth(null);
      setSelectedDate(null);
    } catch (err: any) {
      console.error("Error loading Payarc data:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function loadAccounts() {
    try {
      setLoadingAccounts(true);
      setErrorAccounts(null);

      console.log("Fetching accounts from backend...");
      const res = await api.get("/api/payarc/my-accounts");
      const rows = res;

      if (!Array.isArray(rows)) {
        throw new Error("Unexpected API response (expected an array)");
      }

      // Map to simplified structure
      const filtered = rows.filter((r:any) => r.isActive)
      //console.log('filtered', filtered, filtered.length)
      // Map to simplified structure
      const mapped: Account[] = filtered.map((row: any) => ({
        merchantName: row.dba_name || row.business_name || "Unknown Merchant",
        merchantId: row.Merchant_Account_Number || Number(row.mid).toString() || "",
      }));

      setAccounts(mapped);
      console.log(`Loaded ${mapped.length} PayArc accounts`);
    } catch (err: any) {
      console.error("Error loading accounts:", err);
      setErrorAccounts(err.message || "Failed to load accounts");
    } finally {    
      setLoadingAccounts(false);
    }
  }

  useEffect(() => {
    // Optionally load with default range on first render
    loadData();
    loadAccounts();
  }, []);

  const merchantOptions = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.merchantName) set.add(t.merchantName);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Filter by merchant + date range on the client as an extra layer
const filtered = useMemo(() => {
  return transactions.filter((t) => {
    // filter by selected merchant MID (if selected)
    const matchMerchant = selectedAccount
      ? t.merchantId === '0' + selectedAccount.merchantId
      : true;

    // filter by date range
    const d = t.batchDate; // "YYYY-MM-DD"
    const inFrom = !fromDate || d >= fromDate;
    const inTo = !toDate || d <= toDate;

    return matchMerchant && inFrom && inTo;
  });
}, [transactions, selectedAccount, fromDate, toDate]);


  const filteredAccounts = useMemo(() => {
    const q = accountSearch.toLowerCase().trim();
    if (!q) return accounts.slice(0, 20);
    return accounts.filter((acc) => {
      const name = acc.merchantName.toLowerCase();
      const mid = acc.merchantId.toLowerCase();
      return name.includes(q) || mid.includes(q);
    });
  }, [accounts, accountSearch]);

  // LAYER 1: Monthly summary
  const monthlySummary: MonthlySummary[] = useMemo(() => {
    const map = new Map<string, { amount: number; txns: number }>();

    filtered.forEach((t) => {
      const key = getMonthKey(t.batchDate);
      const current = map.get(key) || { amount: 0, txns: 0 };
      current.amount += t.amountCents;
      current.txns += t.transactionCount;
      map.set(key, current);
    });

    return Array.from(map.entries())
      .map(([monthKey, v]) => ({
        monthKey,
        monthLabel: getMonthLabel(monthKey),
        totalAmountCents: v.amount,
        totalTransactions: v.txns,
      }))
      .sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
  }, [filtered]);

  // LAYER 2: Daily summary for selectedMonth
  const dailySummary: DailySummary[] = useMemo(() => {
    if (!selectedMonth) return [];

    const map = new Map<string, { amount: number; txns: number }>();
    filtered
      .filter((t) => getMonthKey(t.batchDate) === selectedMonth)
      .forEach((t) => {
        const key = t.batchDate;
        const current = map.get(key) || { amount: 0, txns: 0 };
        current.amount += t.amountCents;
        current.txns += t.transactionCount;
        map.set(key, current);
      });

    return Array.from(map.entries())
      .map(([date, v]) => ({
        date,
        totalAmountCents: v.amount,
        totalTransactions: v.txns,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [filtered, selectedMonth]);

  // LAYER 3: Detailed rows for selectedDate
  const detailRows = useMemo(() => {
    if (!selectedDate) return [];
    return filtered
      .filter((t) => t.batchDate === selectedDate)
      .sort((a, b) => a.batchNumber.localeCompare(b.batchNumber));
  }, [filtered, selectedDate]);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="min-h-screen">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Payarc Transactions
                </h1>
                <p className="text-sm text-slate-500">
                  Search by merchant and drill down from monthly to daily and batch
                  details.
                </p>
              </div>
            </header>

            <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-1 flex-col gap-2 md:flex-row">
                  <div className="flex-1 relative">
                    <label className="block text-xs font-medium text-slate-500">
                      Merchant (search by name or MID)
                    </label>

                    <input
                      type="search"
                      value={accountSearch}
                      onChange={(e) => {
                        setAccountSearch(e.target.value);
                        setSelectedAccount(null);
                      }}
                      placeholder="Start typing merchant name or MID…"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                    />

                    {/* Search dropdown */}
                    {accountSearch && filteredAccounts.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm shadow-lg">
                        {filteredAccounts.map((acc) => (
                          <button
                            key={acc.merchantId}
                            type="button"
                            className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
                            onClick={() => {
                              setSelectedAccount(acc);
                              setAccountSearch(`${acc.merchantName} (${acc.merchantId})`);
                            }}
                          >
                            <span className="font-medium text-slate-900">
                              {acc.merchantName}
                            </span>
                            <span className="text-xs text-slate-500">{acc.merchantId}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Loading or Error */}
                    {loadingAccounts && (
                      <p className="text-xs text-slate-400 mt-1">Loading accounts...</p>
                    )}
                    {errorAccounts && (
                      <p className="text-xs text-red-600 mt-1">{errorAccounts}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>
                <button
                  onClick={loadData}
                  className="inline-flex min-w-[180px] items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-400"
                  disabled={loading}
                >
                  {loading ? "Loading…" : "View Transactions"}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* LAYER 1 – Monthly totals */}
            <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">
                  Layer 1 – Monthly Totals
                </h2>
                {selectedMonth && (
                  <button
                    className="text-xs font-medium text-red-700 hover:underline"
                    onClick={() => {
                      setSelectedMonth(null);
                      setSelectedDate(null);
                    }}
                  >
                    Clear month selection
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Month</th>
                      <th className="px-4 py-2 text-right">Total Amount</th>
                      <th className="px-4 py-2 text-right">
                        Number of Transactions
                      </th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummary.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-4 text-center text-slate-400"
                        >
                          No data. Adjust filters and click &quot;View
                          Transactions&quot;.
                        </td>
                      </tr>
                    )}
                    {monthlySummary.map((m) => (
                      <tr
                        key={m.monthKey}
                        className={`border-b border-slate-100 ${selectedMonth === m.monthKey
                          ? "bg-red-50"
                          : "hover:bg-slate-50"
                          }`}
                      >
                        <td className="px-4 py-2">{m.monthLabel}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          ${formatMoney(m.totalAmountCents)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {m.totalTransactions.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            className="text-xs font-semibold text-red-700 hover:underline"
                            onClick={() => {
                              setSelectedMonth(
                                selectedMonth === m.monthKey ? null : m.monthKey,
                              );
                              setSelectedDate(null);
                            }}
                          >
                            {selectedMonth === m.monthKey
                              ? "Hide daily view"
                              : "View daily totals"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* LAYER 2 – Daily totals for selected month */}
            {selectedMonth && (
              <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Layer 2 – Daily Totals ({getMonthLabel(selectedMonth)})
                  </h2>
                  {selectedDate && (
                    <button
                      className="text-xs font-medium text-red-700 hover:underline"
                      onClick={() => setSelectedDate(null)}
                    >
                      Clear day selection
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2 text-right">Total Amount</th>
                        <th className="px-4 py-2 text-right">
                          Number of Transactions
                        </th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySummary.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-4 text-center text-slate-400"
                          >
                            No daily data for this month.
                          </td>
                        </tr>
                      )}
                      {dailySummary.map((d) => (
                        <tr
                          key={d.date}
                          className={`border-b border-slate-100 ${selectedDate === d.date
                            ? "bg-red-50"
                            : "hover:bg-slate-50"
                            }`}
                        >
                          <td className="px-4 py-2">{formatDate(d.date)}</td>
                          <td className="px-4 py-2 text-right font-medium">
                            ${formatMoney(d.totalAmountCents)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {d.totalTransactions.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              className="text-xs font-semibold text-red-700 hover:underline"
                              onClick={() =>
                                setSelectedDate(
                                  selectedDate === d.date ? null : d.date,
                                )
                              }
                            >
                              {selectedDate === d.date
                                ? "Hide details"
                                : "View batch details"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* LAYER 3 – Detail table for selected day */}
            {selectedDate && (
              <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Layer 3 – Batch Details ({formatDate(selectedDate)})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">DBA</th>
                        <th className="px-4 py-2">MID</th>
                        <th className="px-4 py-2">Batch #</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-right">
                          Number of Transactions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-4 text-center text-slate-400"
                          >
                            No detailed rows for this date.
                          </td>
                        </tr>
                      )}
                      {detailRows.map((r, idx) => (
                        <tr
                          key={`${r.batchNumber}-${idx}`}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-2">
                            <div className="font-medium text-slate-900">
                              {r.merchantName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {r.batchDate}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-700">
                            {r.merchantId}
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-700">
                            {r.batchNumber}
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-slate-900">
                            ${formatMoney(r.amountCents)}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-700">
                            {r.transactionCount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}


