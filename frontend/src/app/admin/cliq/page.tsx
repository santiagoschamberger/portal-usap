"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute } from "@/components/protected-route";
import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { api } from "@/lib/api";
import MerchantSelect from "./MerchantSelect";
import useNormalizedTableData from "./useNormalizedTableData";

type CliqTransaction = {
  id: number;
  batchDate: string; // "09/16/2022"
  batchNumber: string;
  amountCents: number;
  transactionCount: number;
  merchantName?: string;
  merchantId?: string;
};

type MonthlySummary = {
  monthKey: string; // "2025-12"
  monthLabel: string; // "December 2025"
  totalAmountCents: number; // summed
  totalTransactions: number; // summed
};

type cliqDeposits = {
  date: string; // "12/01/2025"
  amount: number;
  transactions: number;
  batch: string;
};

export default function CliqReportPage() {
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const firstOfMonth = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(todayStr);
  const [loadingMerchants, setLoadingMerchants] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<cliqDeposits[]>([]);
  const [totals, setTotals] = useState(null);

  const fetchMerchants = async () => {
    try {
      setLoadingMerchants(true);
      setError(null);

      const res = await api.get("/api/cliq/cliq-merchants");

      const data = res.data;

      setMerchants(data);

      if (data.length > 0) {
        setSelectedMerchant(data[0]);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Failed to load merchants"
      );
    } finally {
      setLoadingMerchants(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  useEffect(() => {
    handleViewReport();
  }, [selectedMerchant, fromDate, toDate]);

  const parseMMDDYYYY = (dateStr: string): Date => {
    const [mm, dd, yyyy] = dateStr.split("/");
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  };

  const yyyyMMddToMMDDYYYY = (dateStr: string): string => {
    const [yyyy, mm, dd] = dateStr.split("-");
    return `${mm}/${dd}/${yyyy}`;
  };

  const handleViewReport = async () => {
    if (!selectedMerchant) {
      setError("Please select a merchant.");
      return;
    }

    if (!fromDate) {
      setError("Please select From Date.");
      return;
    }

    setError(null);
    setLoadingReport(true);

    try {
      // ---- Transactions params ----
      const params = {
        merchantNumber: selectedMerchant.mid,
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      };

      // ---- Extract Y/M/D safely ----
      const date = new Date(fromDate + "T00:00:00");

      const day = date.getDate();
      const month = date.getMonth() + 1; // 0-based
      const year = date.getFullYear();

      // ---- Deposits params (MANDATORY) ----
      const params1 = {
        merchantNumber: selectedMerchant.mid,
        year,
        month,
        day,
        ...(toDate && { toDate }),
      };

      const [dqResult] = await Promise.allSettled([
        api.get("/api/cliq/cliq-deposits", { params: params1 }),
      ]);
      // ---- Deposits ----
      if (dqResult.status === "fulfilled") {
        setDeposits(dqResult.value.deposits);
        setTotals(dqResult.value.totals);
      } else {
        setError((prev) => prev ?? "Failed to load deposits");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (selectedDate) fetchDetails(selectedDate);
  }, [selectedDate]);

  const fetchDetails = async (selectedDate: string) => {
    if (!selectedMerchant) {
      setError("Please select a merchant.");
      return;
    }

    setError(null);
    setLoadingReport(true);

    try {
      const [mm, dd, yyyy] = selectedDate.split("/");
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const params = {
        merchantNumber: selectedMerchant.mid,
        fromDate: formattedDate,
        toDate: formattedDate,
      };
      console.log(params);
      const [txResult] = await Promise.allSettled([
        api.get("/api/cliq/cliq-transactions", { params }),
      ]);

      // console.log(txResult);

      if (txResult.status === "fulfilled") {
        const rawBatches = txResult.value; // adjust if API nests under .data

        const tt = rawBatches
          .flatMap((batch: any) =>
            batch.transactions.map((txn: any) => ({
              id: txn.id,
              count: batch.count,
              totalAmount: batch.amount,
              reference_number: batch.reference_number,
              amount: txn.amount,
              auth_code: txn.auth_code,
              card_type: txn.card_type,
              cardholder: txn.cardholder,
              transDate: txn.date,
              batchDate: batch.date,
              merchantId: selectedMerchant.mid,
              // batchDate: batch.date, // YYYY-MM-DD from API
              // batchNumber: batch.reference_number,
              // amountCents: Math.round(Number(txn.amount) * 100),
              // transactionCount: 1,
              // merchantName: txn.card_type,
              // merchantId: txn.cardholder,
            }))
          )
          .filter((t: any) => {
            return t.batchDate === selectedDate;
          })
          .sort((a, b) => a.reference_number.localeCompare(b.reference_number));
          // .filter((t: any) => {
          //   return t.batchDate === selectedDate;
          // })
          // .sort((a, b) => a.batchNumber.localeCompare(b.batchNumber));
          console.log('transactions===>', tt);
        setTransactions(tt);
      } else {
        setTransactions([]);
        setError("Failed to load transactions");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoadingReport(false);
    }
  };

  const formatMoney = (cents: number) =>
    (cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US");

  const getMonthKey = (dateStr: string): string => {
    if (!dateStr) return "invalid";

    const [mm, dd, yyyy] = dateStr.split("/");

    if (!mm || !yyyy) return "invalid";

    return `${yyyy}-${mm.padStart(2, "0")}`; // 2022-09
  };

  const getMonthLabel = (monthKey: string): string => {
    const [year, month] = monthKey.split("-");

    if (!year || !month) return "Invalid Date";

    return new Date(Number(year), Number(month) - 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  const filteredDeposites = useMemo(() => {
    if (!fromDate || !toDate) return deposits;

    const from = parseMMDDYYYY(yyyyMMddToMMDDYYYY(fromDate));
    const to = parseMMDDYYYY(yyyyMMddToMMDDYYYY(toDate));

    return deposits.filter((t) => {
      const d = parseMMDDYYYY(t.date);
      return d >= from && d <= to;
    });
  }, [deposits, fromDate, toDate]); // ✅ FIX

  const monthlySummary = useMemo(() => {
    const map = new Map<string, { amount: number; txns: number }>();

    filteredDeposites.forEach((d) => {
      const key = getMonthKey(d.date);

      const current = map.get(key) || { amount: 0, txns: 0 };

      // amount is in rupees/dollars → convert to cents if needed
      current.amount += Math.round(d.amount * 100);
      current.txns += d.transactions;

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
  }, [filteredDeposites]);

  const dailySummary = useMemo(() => {
    if (!selectedMonth) return [];

    const map = new Map<string, { amount: number; txns: number }>();

    filteredDeposites
      .filter((d) => getMonthKey(d.date) === selectedMonth)
      .forEach((d) => {
        const key = d.date;
        const current = map.get(key) || { amount: 0, txns: 0 };

        current.amount += Math.round(d.amount * 100);
        current.txns += d.transactions;

        map.set(key, current);
      });

    return Array.from(map.entries())
      .map(([date, v]) => ({
        date,
        totalAmountCents: v.amount,
        totalTransactions: v.txns,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredDeposites, selectedMonth]);


 const tableData = useNormalizedTableData(transactions);

console.log('tableData', tableData);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <div className="min-h-screen">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Cliq Transactions
                </h1>
                <p className="text-sm text-slate-500">
                  Search by merchant and drill down from monthly to daily and
                  batch details.
                </p>
              </div>
            </header>
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-1 flex-col gap-2 md:flex-row">
                  <div className="flex-1 relative">
                    <MerchantSelect
                      merchants={merchants}
                      value={selectedMerchant}
                      onChange={setSelectedMerchant}
                      loading={loadingMerchants}
                      onClearParent={() => {
                        setSelectedMonth(null);
                        setSelectedDate(null);
                        setDeposits([]);
                      }}
                    />
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
                  onClick={handleViewReport}
                  disabled={loadingReport || loadingMerchants}
                  className="inline-flex min-w-[180px] items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-400"
                >
                  {loadingReport ? "Loading…" : "View Transactions"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
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
                      setTransactions([]);
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
                        className={`border-b border-slate-100 ${
                          selectedMonth === m.monthKey
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
                                selectedMonth === m.monthKey ? null : m.monthKey
                              );
                              // setSelectedDate(null);
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
                      {deposits.length === 0 && (
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
                          className={`border-b border-slate-100 ${
                            selectedDate === d.date
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
                                  selectedDate === d.date ? null : d.date
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
                      {transactions.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-4 text-center text-slate-400"
                          >
                            No detailed rows for this date.
                          </td>
                        </tr>
                      )}
                      {tableData.map((r, idx) => (
                        <tr
                          key={`${r.batchNumber}-${idx}`}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-2">
                            <div className="font-medium text-slate-900">
                              {r.dba}
                            </div>
                            <div className="text-xs text-slate-500">
                              {r.batchDate}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-700">
                            {r.mid}
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-700">
                            {r.reference_number}
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-slate-900">
                            ${formatMoney(parseFloat(r.amount))}
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
