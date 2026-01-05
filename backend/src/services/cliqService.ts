import axios from "axios";

/**
 * ---------------------------------------------------------------------------
 *  Axios Client (CLIQ Portal API)
 * ---------------------------------------------------------------------------
 */

const CLIQ_API_URL = process.env.CLIQ_API_URL || "https://portal.cliq.com";

const cliqApi = axios.create({
  baseURL: `${CLIQ_API_URL}/api`,
  timeout: 30000,
});

cliqApi.interceptors.request.use((config) => {
  if (!config.headers) {
    config.headers = new axios.AxiosHeaders();
  }

  config.headers.set("Accept", "application/json");
  config.headers.set("Content-Type", "application/json");
  config.headers.set("X-Api-Key", process.env.CLIQ_API_TOKEN || "");

  return config;
});

console.log(cliqApi);
/**
 * ---------------------------------------------------------------------------
 *  Types
 * ---------------------------------------------------------------------------
 */

export interface CliqMerchant {
  merchantNumber: string;
  dbaName: string;
  legalName?: string;
  status?: string;
  // Add more fields as per actual CLIQ /merchants response
}

export interface CliqTransaction {
  id: string;
  merchantNumber: string;
  transactionDate: string; // ISO datetime string
  amount: number;
  status: string; // APPROVED / DECLINED / etc.
  cardBrand?: string;
  authCode?: string;
  batchNumber?: string;
  // Add more fields as per actual CLIQ /transactions response
}

/**
 * ---------------------------------------------------------------------------
 *  Service Functions
 * ---------------------------------------------------------------------------
 */

export async function getCliqMerchants(): Promise<CliqMerchant[]> {
  const res = await cliqApi.get("/v1/merchants");
  // Adjust this depending on actual CLIQ response:
  // - Could be { merchants: [...] }
  // - Or directly [...]
  const data = (res.data as any).merchants ?? res.data;
  return data as CliqMerchant[];
}

export interface CliqTransactionFilter {
  merchantNumber: string;
  fromDate?: string; // 'YYYY-MM-DD'
  toDate?: string; // 'YYYY-MM-DD'
  page?: number;
  pageSize?: number;
}

export interface CliqDepositsFilter {
  merchantNumber: string;
  year?: string; // 'YYYY-MM-DD'
  month: string;
  day: string;
  toDate?: string; // 'YYYY-MM-DD'
}

/**
 * Get transactions for a merchant using:
 *   GET /merchants/{merchantNumber}/transactions
 */
export async function getCliqTransactions(
  filter: CliqTransactionFilter
): Promise<any[]> {
  const { merchantNumber, fromDate, toDate, page = 1, pageSize = 500 } = filter;
   
  const adjustedToDate = addOneDay(toDate);

  try {
    const res = await cliqApi.get(
      `/v1/merchants/${encodeURIComponent(merchantNumber)}/transactions`,
      {
        params: { start_date:fromDate, end_date:adjustedToDate, page, pageSize },
      }
    );

    const raw = res.data;

    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.transactions)) return raw.transactions;
    if (Array.isArray(raw?.transactions?.content))
      return raw.transactions.content;

    return []; // no data, not an error
  } catch (err: any) {
    throw err;
  }
}

function addOneDay(dateStr?: string) {
  if (!dateStr) return dateStr;

  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);

  // keep YYYY-MM-DD format
  return d.toISOString().substring(0, 10);
}
/**
 * Get List od deposits
 */

export async function getCliqDeposits(
  filter: CliqDepositsFilter
): Promise<{
  deposits: any[];
  adjustments: any[];
  totals: any;
}> {
  const { merchantNumber, year, month, day, toDate } = filter;
  const res = await cliqApi.get(
    `/v1/merchants/${encodeURIComponent(
      merchantNumber
    )}/deposits/${year}/${month}/${day}`
  );

  const raw = res.data;

  return {
    deposits: Array.isArray(raw?.deposits) ? raw.deposits : [],
    adjustments: Array.isArray(raw?.adjustments) ? raw.adjustments : [],
    totals: raw?.totals ?? null,
  };
}
