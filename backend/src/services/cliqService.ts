import axios from "axios";

/**
 * ---------------------------------------------------------------------------
 *  Axios Client (CLIQ Portal API)
 * ---------------------------------------------------------------------------
 */

const CLIQ_API_URL = process.env.CLIQ_API_URL || "https://portal.cliq.com";

const cliqApi = axios.create({
  baseURL: `${CLIQ_API_URL}/api`,
  timeout: 120000,
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
  year?: number; // 'YYYY-MM-DD'
  month: number;
  day: number;
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
        timeout: 120000, // ⬅ 2 minutes
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
    )}/deposits/${year}/${month}/${day}?end_date${toDate}`,
    {
      timeout: 120000, // override here
    }
  );

  const raw = res.data;

  return {
    deposits: Array.isArray(raw?.deposits) ? raw.deposits : [],
    adjustments: Array.isArray(raw?.adjustments) ? raw.adjustments : [],
    totals: raw?.totals ?? null,
  };
}

export async function getTotalVolumeActiveMerchants(
  year: number,
  month: number,
  day: number,
  toDate: any
): Promise<{
  totalVolume: number;
  merchantCount: number;
  processedCount: number;
  failedMerchants: string[];
}> {
  const merchantResponse: any = await getCliqMerchants();

  const merchants = Array.isArray(merchantResponse)
    ? merchantResponse
    : Array.isArray(merchantResponse?.data)
    ? merchantResponse.data
    : [];

  const activeMerchants = merchants.filter(
    (m: any) => m.active === "Yes" || m.status === "Active"
  );

  let totalVolume = 0;
  let processedCount = 0;
  const failedMerchants: string[] = [];

  const batchSize = 10; // try 5 first, can increase to 10 later

  for (let i = 0; i < activeMerchants.length; i += batchSize) {
    const batch = activeMerchants.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((m: any) =>
        getCliqDeposits({
          merchantNumber: m.mid,
          year,
          month,
          day,
          toDate
        })
      )
    );

    results.forEach((result, index) => {
      const merchant = batch[index];

      if (result.status === "fulfilled") {
        const data = result.value;

        let merchantTotal = 0;

        if (data.totals?.monthly_total != null) {
          merchantTotal = Number(data.totals.monthly_total) || 0;
        } else {
          merchantTotal = data.deposits.reduce(
            (sum: number, d: any) => sum + (Number(d.amount) || 0),
            0
          );
        }

        totalVolume += merchantTotal;
        processedCount++;
      } else {
        console.error(`Failed for merchant ${merchant.mid}:`, result.reason);
        failedMerchants.push(merchant.mid);
      }
    });
  }

  return {
    totalVolume,
    merchantCount: activeMerchants.length,
    processedCount,
    failedMerchants,
  };
}