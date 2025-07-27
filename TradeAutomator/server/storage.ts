import { type User, type InsertUser, type Trade, type InsertTrade, type Account } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trade methods
  getTrade(id: string): Promise<Trade | undefined>;
  getUserTrades(userId: string): Promise<Trade[]>;
  getActiveTrades(userId: string): Promise<Trade[]>;
  createTrade(trade: Omit<Trade, "id" | "openTime">): Promise<Trade>;
  updateTrade(id: string, updates: Partial<Trade>): Promise<Trade | undefined>;
  closeTrade(id: string, closeTime: Date, realizedPL: string): Promise<Trade | undefined>;
  
  // Account methods
  getAccount(userId: string): Promise<Account | undefined>;
  updateAccount(userId: string, updates: Partial<Account>): Promise<Account | undefined>;
  createAccount(userId: string, balance: string): Promise<Account>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private trades: Map<string, Trade>;
  private accounts: Map<string, Account>;

  constructor() {
    this.users = new Map();
    this.trades = new Map();
    this.accounts = new Map();
    
    // Create default user
    const defaultUser: User = {
      id: "default-user",
      username: "trader",
      password: "password123"
    };
    this.users.set(defaultUser.id, defaultUser);
    
    // Create default account
    const defaultAccount: Account = {
      id: randomUUID(),
      userId: defaultUser.id,
      balance: "10000.00",
      unrealizedPL: "0.00",
      marginUsed: "0.00",
      lastUpdated: new Date()
    };
    this.accounts.set(defaultUser.id, defaultAccount);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTrade(id: string): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async getUserTrades(userId: string): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(trade => trade.userId === userId);
  }

  async getActiveTrades(userId: string): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(
      trade => trade.userId === userId && trade.status !== "closed"
    );
  }

  async createTrade(trade: Omit<Trade, "id" | "openTime">): Promise<Trade> {
    const id = randomUUID();
    const newTrade: Trade = {
      ...trade,
      id,
      openTime: new Date(),
      closeTime: null
    };
    this.trades.set(id, newTrade);
    return newTrade;
  }

  async updateTrade(id: string, updates: Partial<Trade>): Promise<Trade | undefined> {
    const trade = this.trades.get(id);
    if (!trade) return undefined;
    
    const updatedTrade = { ...trade, ...updates };
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }

  async closeTrade(id: string, closeTime: Date, realizedPL: string): Promise<Trade | undefined> {
    return this.updateTrade(id, {
      status: "closed",
      closeTime,
      realizedPL
    });
  }

  async getAccount(userId: string): Promise<Account | undefined> {
    return this.accounts.get(userId);
  }

  async updateAccount(userId: string, updates: Partial<Account>): Promise<Account | undefined> {
    const account = this.accounts.get(userId);
    if (!account) return undefined;
    
    const updatedAccount = { ...account, ...updates, lastUpdated: new Date() };
    this.accounts.set(userId, updatedAccount);
    return updatedAccount;
  }

  async createAccount(userId: string, balance: string): Promise<Account> {
    const account: Account = {
      id: randomUUID(),
      userId,
      balance,
      unrealizedPL: "0.00",
      marginUsed: "0.00",
      lastUpdated: new Date()
    };
    this.accounts.set(userId, account);
    return account;
  }
}

export const storage = new MemStorage();
