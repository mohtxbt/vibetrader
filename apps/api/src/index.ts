import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat.js";
import portfolioRouter from "./routes/portfolio.js";
import { initWallet } from "./services/wallet.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize wallet on startup
initWallet();

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/chat", chatRouter);
app.use("/portfolio", portfolioRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
