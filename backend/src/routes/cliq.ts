// backend/src/routes/cliq.ts
import express, { Request, Response } from "express";
import {
  getCliqDeposits,
  getCliqMerchants,
  getCliqTransactions,
} from "../services/cliqService";

const router = express.Router();

// GET /api/cliq/merchants
router.get("/cliq-merchants", async (req: Request, res: Response) => {
  try {
    const merchants = await getCliqMerchants();
    res.json(merchants);
  } catch (err: any) {
    console.error("Error fetching CLIQ merchants:", err?.message);
    res.status(500).json({ error: "Failed to fetch CLIQ merchants" });
  }
});

// GET /api/cliq/transactions
router.get(
  "/cliq-transactions",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { merchantNumber, fromDate, toDate, page, pageSize } =
        req.query as any;

      if (!merchantNumber) {
        res.status(400).json({ error: "merchantNumber is required" });
        return;
      }

      const txns = await getCliqTransactions({
        merchantNumber,
        fromDate,
        toDate,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });

      res.json(txns);
      return;
    } catch (err: any) {
      console.error("Error fetching CLIQ transactions:", err?.message);
      res.status(500).json({ error: "Failed to fetch CLIQ transactions" });
      return;
    }
  }
);

// GET /api/cliq/deposites
router.get("/cliq-deposits", async (req: Request, res: Response) => {
  try {
    const { merchantNumber, year, month, day,toDate } = req.query as any;

    if (!merchantNumber) {
      res.status(400).json({ error: "merchantNumber is required" });
      return;
    }

    const data = await getCliqDeposits({
      merchantNumber,
      year,
      month,
      day,
      toDate
    });

    res.json(data); // 👈 send structured response
  } catch (err: any) {
    console.error("Error fetching CLIQ Deposits:", err?.message);
    res.status(500).json({ error: "Failed to fetch CLIQ Deposits" });
  }
});

export default router;
