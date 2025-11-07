import axios from "axios";

export interface PayarcTransactionSummary {
  Merchant_Account_Number: number;
  Settlement_Date: string;
  ad_total_sale: null;
  ad_total_refunds: null;
  ad_net_amt: null;
  Amounts: number;
  total_refunds: null;
  total_net_amt: number;
  rj_total_sale: null;
  rj_total_refunds: null;
  rj_net_amt: null;
  Transactions: number;
  Batch_Reference_Number: number;
  reject_record: null;
  dba_name: string;
  pfac_account_type: string;
}

export async function getPayarcTransactions(
  from?: string,
  to?: string
): Promise<PayarcTransactionSummary[]> {
  try {
    // 1️⃣ Get report list  

    const baseUrl = process.env.PAYARC_API_URL ?? "";
    const reportResponse = await axios.get(`${baseUrl}/v1/agent/token/`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYARC_API_TOKEN}`,
      },
    });
    //console.log("reportResponse", reportResponse.data.data.access_token);
    const accessToken = reportResponse.data?.data?.access_token;

    if (!accessToken) {
      console.error("No access token found.");
      return [];
    }

    // 2️⃣ Fetch details for each batch  
    const detailResponse = await axios.get(
      `${baseUrl}/v1/agent/batch/reports?from_date=${from}&to_date=${to}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log('detailResponse', detailResponse.data.data);
    const detailedReports = Array.isArray(detailResponse.data.data)
      ? detailResponse.data.data : [];
    console.log('detailedReports', detailedReports, detailedReports.length)
    if (detailedReports.length === 0) {
      console.log("No reports found for the given date range");
      return [];
    }
    return detailedReports;
  } catch (error: any) {
    console.error("Error in getFullPayarcReport:", error.message);
    throw error;
  }
}

export async function getPayarcAccounts() {
  try {
    const baseUrl = process.env.PAYARC_API_URL ?? "";
    const response = await axios.get(
      `${baseUrl}/v1/account/my-accounts/`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PAYARC_API_TOKEN}`, // ensure it's in .env
        },
      }
    );

    // Return the array of merchants directly
    return response.data;
  } catch (error: any) {
    console.error("getPayarcAccounts error:", error?.response?.data || error);
    throw new Error(
      error.response?.data?.message ||
      "Failed to fetch PayArc merchant accounts"
    );
  }
}
