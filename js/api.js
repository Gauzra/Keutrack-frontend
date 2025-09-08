/**
 * API Client untuk KeuTrack
 * Utility functions untuk komunikasi dengan backend
 */

const API_BASE_URL = 'http://localhost:2001/api'; 

class KeuTrackAPI {
  
  /**
   * Health check untuk memastikan backend tersedia
   */
  async healthCheck() {
    return this.apiCall('/health');
  }

  /**
   * Generic fetch wrapper dengan error handling
   */
  async apiCall(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ==================== USERS ====================
  
  /**
   * User login
   */
  async login(username, password) {
    return await this.apiCall('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  /**
   * User registration
   */
  async register(username, email, password) {
    return await this.apiCall('/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
  }

  // ==================== ACCOUNTS ====================
  
  /**
   * Get all accounts
   */
  async getAccounts() {
    return await this.apiCall('/accounts');
  }

  /**
   * Create new account
   */
  async createAccount(accountData) {
    return await this.apiCall('/accounts', {
      method: 'POST',
      body: JSON.stringify({
        name: accountData.name,
        balance: accountData.balance || 0,
        code: accountData.code,
        category: accountData.category
      })
    });
  }

  /**
   * Alias for createAccount - for compatibility
   */
  async addAccount(accountData) {
    return await this.createAccount(accountData);
  }

  /**
   * Update account
   */
  async updateAccount(accountId, accountData) {
    return await this.apiCall(`/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: accountData.name,
        balance: accountData.balance,
        category: accountData.category
      })
    });
  }

  /**
   * Delete account
   */
  async deleteAccount(accountId) {
    return await this.apiCall(`/accounts/${accountId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get default accounts template
   */
  async getDefaultAccounts() {
    return await this.apiCall('/default-accounts');
  }

  // ==================== TRANSACTIONS ====================
  
  /**
   * Get all transactions
   */
  async getTransactions() {
    return await this.apiCall('/transactions');
  }

  /**
   * Create new transaction
   */
  async createTransaction(transactionData) {
    return await this.apiCall('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        debit_account_id: transactionData.debit_account_id,
        credit_account_id: transactionData.credit_account_id,
        amount: transactionData.amount,
        description: transactionData.description,
        transaction_date: transactionData.date
      })
    });
  }

  /**
   * Alias for createTransaction - for compatibility
   */
  async addTransaction(transactionData) {
    return await this.createTransaction(transactionData);
  }

  /**
   * Update transaction
   */
  async updateTransaction(transactionId, transactionData) {
    return await this.apiCall(`/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify({
        debit_account_id: transactionData.debit_account_id,
        credit_account_id: transactionData.credit_account_id,
        amount: transactionData.amount,
        description: transactionData.description,
        transaction_date: transactionData.date
      })
    });
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(transactionId) {
    return await this.apiCall(`/transactions/${transactionId}`, {
      method: 'DELETE'
    });
  }

  // ==================== REPORTS ====================
  
  /**
   * Get general journal entries
   */
  async getGeneralJournal() {
    return await this.apiCall('/reports/general-journal');
  }
  
  /**
   * Get ledger entries (Buku Besar)
   */
  async getLedger() {
    return await this.apiCall('/reports/ledger');
  }
  
  /**
   * Get trial balance (Neraca Saldo)
   */
  async getTrialBalance() {
    return await this.apiCall('/reports/trial-balance');
  }
  
  /**
   * Get income statement
   */
  async getIncomeStatement() {
    return await this.apiCall('/reports/income-statement');
  }

  /**
   * Get balance sheet
   */
  async getBalanceSheet() {
    return await this.apiCall('/reports/balance-sheet');
  }
}

// Export instance
const api = new KeuTrackAPI();

// Export untuk penggunaan global
window.KeuTrackAPI = api;

// Debug logging
console.log('🔧 [API.js] Loaded successfully - Version 5.1 - General Journal Support [' + new Date().toISOString() + ']');
console.log('🌐 [API.js] Base URL:', API_BASE_URL);
console.log('📦 [API.js] KeuTrackAPI instance created:', api);
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(api)).filter(name => name !== 'constructor');
console.log('🎯 [API.js] Available methods (' + methods.length + '):', methods);
window.KeuTrackAPI = api;
console.log('✅ [API.js] window.KeuTrackAPI assigned successfully');
console.log('✅ [API.js] Verification - window.KeuTrackAPI.getAccounts:', typeof window.KeuTrackAPI.getAccounts);
console.log('✅ [API.js] Verification - window.KeuTrackAPI.getTransactions:', typeof window.KeuTrackAPI.getTransactions);
