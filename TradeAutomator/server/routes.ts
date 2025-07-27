import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { oandaService } from "./services/oanda";
import { tradeMonitor } from "./services/tradeMonitor";
import { insertTradeSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Start trade monitoring
  tradeMonitor.start();

  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ 
        user: { id: user.id, username: user.username },
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get market data
  app.get("/api/market/xauusd", async (req, res) => {
    try {
      const marketData = await oandaService.getCurrentPrice("XAU_USD");
      res.json(marketData);
    } catch (error) {
      console.error("Market data error:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // Get candlestick data
  app.get("/api/market/xauusd/candles", async (req, res) => {
    try {
      const { granularity = "M1", count = "500" } = req.query;
      const candleData = await oandaService.getCandlestickData(
        "XAU_USD", 
        granularity as string, 
        parseInt(count as string)
      );
      res.json(candleData);
    } catch (error) {
      console.error("Candlestick data error:", error);
      res.status(500).json({ message: "Failed to fetch candlestick data" });
    }
  });

  // Place trade
  app.post("/api/trades", async (req, res) => {
    try {
      const tradeData = insertTradeSchema.parse(req.body);
      const userId = "default-user"; // Since we have single user
      
      // Validate trade parameters
      const tp1 = parseFloat(tradeData.tp1);
      const tp2 = parseFloat(tradeData.tp2);
      const sl = parseFloat(tradeData.sl);
      
      if (tradeData.side === "buy") {
        if (tp1 <= sl || tp2 <= tp1) {
          return res.status(400).json({ message: "Invalid TP/SL levels for buy order" });
        }
      } else {
        if (tp1 >= sl || tp2 >= tp1) {
          return res.status(400).json({ message: "Invalid TP/SL levels for sell order" });
        }
      }

      // Get current market price for entry
      const marketData = await oandaService.getCurrentPrice("XAU_USD");
      const entryPrice = tradeData.side === "buy" ? marketData.ask : marketData.bid;
      
      // Calculate units for OANDA (lot size * 100,000 for XAU/USD)
      const lotSize = parseFloat(tradeData.lotSize);
      const units = tradeData.side === "buy" ? lotSize * 100000 : -lotSize * 100000;
      
      // Place order with OANDA
      const oandaResponse = await oandaService.placeMarketOrder(
        "XAU_USD",
        units,
        tradeData.tp2, // Set TP2 as final take profit
        tradeData.sl   // Set initial stop loss
      );

      // Create trade record
      const trade = await storage.createTrade({
        userId,
        oandaTradeId: oandaResponse.orderId,
        instrument: "XAU_USD",
        side: tradeData.side,
        lotSize: tradeData.lotSize,
        entryPrice: oandaResponse.fillPrice || entryPrice,
        currentPrice: oandaResponse.fillPrice || entryPrice,
        tp1: tradeData.tp1,
        tp2: tradeData.tp2,
        sl: tradeData.sl,
        partialClosePercent: tradeData.partialClosePercent,
        status: "open",
        tp1Hit: false,
        slMovedToBreakeven: false,
        unrealizedPL: "0",
        realizedPL: "0",
        closeTime: null
      });

      res.json({ 
        trade,
        message: `${tradeData.side.toUpperCase()} order placed successfully` 
      });
    } catch (error) {
      console.error("Trade placement error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trade data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to place trade" });
    }
  });

  // Get user trades
  app.get("/api/trades", async (req, res) => {
    try {
      const userId = "default-user";
      const trades = await storage.getUserTrades(userId);
      res.json(trades);
    } catch (error) {
      console.error("Get trades error:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Get active positions
  app.get("/api/positions", async (req, res) => {
    try {
      const userId = "default-user";
      const activeTrades = await storage.getActiveTrades(userId);
      res.json(activeTrades);
    } catch (error) {
      console.error("Get positions error:", error);
      res.status(500).json({ message: "Failed to fetch positions" });
    }
  });

  // Close trade manually
  app.post("/api/trades/:id/close", async (req, res) => {
    try {
      const tradeId = req.params.id;
      const trade = await storage.getTrade(tradeId);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      if (trade.status === "closed") {
        return res.status(400).json({ message: "Trade already closed" });
      }

      // Close position via OANDA
      const closeResult = await oandaService.closePosition("XAU_USD");
      
      if (closeResult.success) {
        // Calculate final P&L
        const entryPrice = parseFloat(trade.entryPrice || "0");
        const currentPrice = parseFloat(closeResult.closedPrice);
        const lotSize = parseFloat(trade.lotSize);
        
        const finalPnL = trade.side === "buy" 
          ? (currentPrice - entryPrice) * lotSize
          : (entryPrice - currentPrice) * lotSize;
        
        const totalRealizedPL = parseFloat(trade.realizedPL || "0") + finalPnL;
        
        // Update trade as closed
        const closedTrade = await storage.closeTrade(tradeId, new Date(), totalRealizedPL.toFixed(2));
        
        res.json({ 
          trade: closedTrade,
          message: "Trade closed successfully" 
        });
      } else {
        res.status(500).json({ message: "Failed to close position with broker" });
      }
    } catch (error) {
      console.error("Close trade error:", error);
      res.status(500).json({ message: "Failed to close trade" });
    }
  });

  // Get account summary
  app.get("/api/account", async (req, res) => {
    try {
      const userId = "default-user";
      let account = await storage.getAccount(userId);
      
      if (!account) {
        account = await storage.createAccount(userId, "10000.00");
      }

      // Get updated account data from OANDA
      try {
        const oandaAccount = await oandaService.getAccountSummary();
        await storage.updateAccount(userId, {
          balance: oandaAccount.balance,
          unrealizedPL: oandaAccount.unrealizedPL,
          marginUsed: oandaAccount.marginUsed
        });
        
        account = await storage.getAccount(userId);
      } catch (oandaError) {
        console.warn("Could not fetch OANDA account data, using stored data");
      }

      res.json(account);
    } catch (error) {
      console.error("Get account error:", error);
      res.status(500).json({ message: "Failed to fetch account data" });
    }
  });

  // Trade status (for real-time monitoring)
  app.get("/api/trades/status", async (req, res) => {
    try {
      const userId = "default-user";
      const activeTrades = await storage.getActiveTrades(userId);
      const account = await storage.getAccount(userId);
      
      res.json({
        activeTrades,
        account
      });
    } catch (error) {
      console.error("Trade status error:", error);
      res.status(500).json({ message: "Failed to fetch trade status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
