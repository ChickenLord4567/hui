import { storage } from "../storage";
import { oandaService } from "./oanda";

export class TradeMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log("Starting trade monitoring...");
    
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllTrades();
    }, 5000); // Check every 5 seconds
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log("Stopped trade monitoring");
  }

  private async checkAllTrades() {
    try {
      // Get all active trades for all users
      const users = await storage.getUserByUsername("trader");
      if (!users) return;

      const activeTrades = await storage.getActiveTrades(users.id);
      
      for (const trade of activeTrades) {
        await this.checkTrade(trade);
      }
    } catch (error) {
      console.error("Error in trade monitoring:", error);
    }
  }

  private async checkTrade(trade: any) {
    try {
      // Get current market price
      const marketData = await oandaService.getCurrentPrice("XAU_USD");
      const currentPrice = parseFloat(trade.side === "buy" ? marketData.bid : marketData.ask);
      
      // Update current price
      await storage.updateTrade(trade.id, {
        currentPrice: currentPrice.toString()
      });

      // Calculate P&L
      const entryPrice = parseFloat(trade.entryPrice || "0");
      const lotSize = parseFloat(trade.lotSize);
      const pointValue = 1; // For XAU/USD
      
      let pnl = 0;
      if (trade.side === "buy") {
        pnl = (currentPrice - entryPrice) * lotSize * pointValue;
      } else {
        pnl = (entryPrice - currentPrice) * lotSize * pointValue;
      }

      await storage.updateTrade(trade.id, {
        unrealizedPL: pnl.toFixed(2)
      });

      // Check TP1 hit
      if (!trade.tp1Hit) {
        const tp1 = parseFloat(trade.tp1);
        const shouldTriggerTP1 = trade.side === "buy" ? currentPrice >= tp1 : currentPrice <= tp1;
        
        if (shouldTriggerTP1) {
          await this.handleTP1Hit(trade, currentPrice);
        }
      }

      // Check TP2 hit (final close)
      if (trade.tp1Hit && !trade.closeTime) {
        const tp2 = parseFloat(trade.tp2);
        const shouldTriggerTP2 = trade.side === "buy" ? currentPrice >= tp2 : currentPrice <= tp2;
        
        if (shouldTriggerTP2) {
          await this.handleTP2Hit(trade, currentPrice);
        }
      }

      // Check SL hit
      if (!trade.closeTime) {
        const sl = parseFloat(trade.sl);
        const shouldTriggerSL = trade.side === "buy" ? currentPrice <= sl : currentPrice >= sl;
        
        if (shouldTriggerSL) {
          await this.handleSLHit(trade, currentPrice);
        }
      }

    } catch (error) {
      console.error(`Error checking trade ${trade.id}:`, error);
    }
  }

  private async handleTP1Hit(trade: any, currentPrice: number) {
    console.log(`TP1 hit for trade ${trade.id} at price ${currentPrice}`);
    
    try {
      // Calculate partial close amount
      const lotSize = parseFloat(trade.lotSize);
      const closePercent = trade.partialClosePercent / 100;
      const closeAmount = lotSize * closePercent;
      
      // Close partial position via OANDA
      const units = trade.side === "buy" ? Math.round(closeAmount * 100000) : -Math.round(closeAmount * 100000);
      await oandaService.closePosition("XAU_USD", Math.abs(units));
      
      // Calculate realized P&L for closed portion
      const entryPrice = parseFloat(trade.entryPrice || "0");
      const partialPnL = trade.side === "buy" 
        ? (currentPrice - entryPrice) * closeAmount
        : (entryPrice - currentPrice) * closeAmount;
      
      // Move SL to breakeven (entry price)
      if (trade.oandaTradeId) {
        await oandaService.modifyStopLoss(trade.oandaTradeId, trade.entryPrice || "0");
      }
      
      // Update trade record
      await storage.updateTrade(trade.id, {
        tp1Hit: true,
        slMovedToBreakeven: true,
        status: "tp1_hit",
        sl: trade.entryPrice, // Move SL to breakeven
        lotSize: (lotSize * (1 - closePercent)).toString(), // Reduce lot size
        realizedPL: partialPnL.toFixed(2)
      });

      console.log(`Partially closed ${closePercent * 100}% of trade ${trade.id}, SL moved to breakeven`);
    } catch (error) {
      console.error(`Error handling TP1 for trade ${trade.id}:`, error);
    }
  }

  private async handleTP2Hit(trade: any, currentPrice: number) {
    console.log(`TP2 hit for trade ${trade.id} at price ${currentPrice} - closing trade`);
    
    try {
      // Close remaining position via OANDA
      await oandaService.closePosition("XAU_USD");
      
      // Calculate final realized P&L
      const entryPrice = parseFloat(trade.entryPrice || "0");
      const remainingLotSize = parseFloat(trade.lotSize);
      const finalPnL = trade.side === "buy" 
        ? (currentPrice - entryPrice) * remainingLotSize
        : (entryPrice - currentPrice) * remainingLotSize;
      
      const totalRealizedPL = parseFloat(trade.realizedPL || "0") + finalPnL;
      
      // Close trade completely
      await storage.closeTrade(trade.id, new Date(), totalRealizedPL.toFixed(2));

      console.log(`Trade ${trade.id} fully closed at TP2 with total P&L: ${totalRealizedPL.toFixed(2)}`);
    } catch (error) {
      console.error(`Error handling TP2 for trade ${trade.id}:`, error);
    }
  }

  private async handleSLHit(trade: any, currentPrice: number) {
    console.log(`Stop loss hit for trade ${trade.id} at price ${currentPrice}`);
    
    try {
      // Close position via OANDA
      await oandaService.closePosition("XAU_USD");
      
      // Calculate final realized P&L
      const entryPrice = parseFloat(trade.entryPrice || "0");
      const lotSize = parseFloat(trade.lotSize);
      const slPnL = trade.side === "buy" 
        ? (currentPrice - entryPrice) * lotSize
        : (entryPrice - currentPrice) * lotSize;
      
      const totalRealizedPL = parseFloat(trade.realizedPL || "0") + slPnL;
      
      // Close trade
      await storage.closeTrade(trade.id, new Date(), totalRealizedPL.toFixed(2));

      console.log(`Trade ${trade.id} closed at SL with total P&L: ${totalRealizedPL.toFixed(2)}`);
    } catch (error) {
      console.error(`Error handling SL for trade ${trade.id}:`, error);
    }
  }
}

export const tradeMonitor = new TradeMonitor();
