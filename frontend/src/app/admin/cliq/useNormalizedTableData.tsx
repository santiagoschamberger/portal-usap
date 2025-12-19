import { useMemo } from "react";

type Txn = {
  card_type: string;
  merchantId: string;
  id: number;
  amount: string;
  batchDate: string;
  reference_number: string;
};

type TableRow = {
  dba: string;          // card_type
  batchDate: string;
  mid: string;          // merchantId
  batchNumber: number;  // id
  amount: string;       // summed
  transactionCount: number;
  reference_number: string;
};

const useNormalizedTableData = (transactions: Txn[]): TableRow[] => {
  const tableData = useMemo<TableRow[]>(() => {
    const map = new Map<string, TableRow>();

    for (const txn of transactions) {
      const key = txn.card_type; // group by card_type
      const amt = Number(txn.amount) || 0;

      if (!map.has(key)) {
        map.set(key, {
          dba: txn.card_type,
          batchDate: txn.batchDate,
          mid: txn.merchantId,
          batchNumber: txn.id,
          amount: amt.toFixed(2),
          transactionCount: 1,
          reference_number: txn.reference_number,
        });
      } else {
        const existing = map.get(key)!;
        existing.transactionCount += 1;
        existing.amount = (
          Number(existing.amount) + amt
        ).toFixed(2);
      }
    }

    return Array.from(map.values());
  }, [transactions]);

  return tableData;
};

export default useNormalizedTableData;
