// backend/src/routes/payarc.ts
import { Router } from 'express';
import {
  getPayarcTransactions,
  getPayarcAccounts, // ✅ import real function
} from "../services/payarcService";

const router = Router();

router.get('/payarc-report', async (req, res) => {
  try {
   
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const data = await getPayarcTransactions(from, to)

    return res.json({
      success: true,
      data,
    })
  } catch (err) {
    console.error('GET /payarc-report error:', err)
    return res.status(500).json({
      success: false,
      error: 'Failed to load Payarc transaction summary',
      message: err instanceof Error ? err.message : 'Unknown error',
    })
  }
});

router.get("/my-accounts", async (req, res) => {
  try {
    const data = await getPayarcAccounts();
    return res.json(data); // returns array of accounts
  } catch (err: any) {
    console.error("GET /payarc/my-accounts error:", err);
    return res.status(500).json({
      success: false,
      error:
        err.message || "Failed to load PayArc merchant accounts",
    });
  }
});

export default router
