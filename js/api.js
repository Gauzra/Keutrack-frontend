/**
 * API Client untuk KeuTrack
 * Utility functions untuk komunikasi dengan backend dengan retry mechanism
 */

const API_BASE_URL = 'https://keutrack-backend-production.up.railway.app/api';

class KeuTrackAPI {
    constructor() {
        this.baseUrl = API_BASE_URL;
        this.timeout = 15000; // 15 seconds timeout
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second initial delay
        this.isConnected = false;

        console.log('🔧 [API.js] Initializing KeuTrackAPI with enhanced connection handling...');
        console.log('🌐 [API.js] Base URL:', this.baseUrl);
    }

    /**
     * 🔄 Generic API call method with retry mechanism
     */
    async apiCall(endpoint, options = {}, retries = this.maxRetries) {
        const token = localStorage.getItem('authToken'); // ✅ AMBIL TOKEN
        const url = `${this.baseUrl}${endpoint}`;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '', // ✅ TAMBAH INI
                        ...options.headers
                    },
                    signal: controller.signal,
                    ...options
                };

                // Remove body if method is GET/HEAD
                if (['GET', 'HEAD'].includes(config.method?.toUpperCase())) {
                    delete config.body;
                }

                console.log(`🌐 [API.js] Attempt ${attempt}/${retries} - ${config.method || 'GET'} ${endpoint}`);

                const response = await fetch(url, config);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorData;

                    try {
                        errorData = JSON.parse(errorText);
                    } catch {
                        errorData = { error: errorText || `HTTP ${response.status}` };
                    }

                    // Don't retry on client errors (4xx) except 429
                    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        throw new Error(errorData.error || `HTTP ${response.status}: ${errorData.message || 'Client error'}`);
                    }

                    // Throw error to trigger retry
                    throw new Error(errorData.error || `HTTP ${response.status}`);
                }

                const data = await response.json();
                this.isConnected = true;

                console.log(`✅ [API.js] Success - ${config.method || 'GET'} ${endpoint}`);
                return data;

            } catch (error) {
                clearTimeout(timeoutId);

                if (attempt === retries) {
                    this.isConnected = false;
                    console.error(`❌ [API.js] Failed after ${retries} attempts - ${endpoint}:`, error.message);

                    const enhancedError = new Error(
                        error.name === 'AbortError'
                            ? `Request timeout after ${this.timeout}ms`
                            : error.message
                    );
                    enhancedError.originalError = error;
                    enhancedError.endpoint = endpoint;
                    enhancedError.attempts = attempt;

                    throw enhancedError;
                }

                // Exponential backoff with jitter
                const delay = this.retryDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5);
                console.warn(`⚠️ [API.js] Attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`);

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    /**
     * 🩺 Health check dengan connection testing
     */
    async healthCheck() {
        try {
            const result = await this.apiCall('/health', {}, 2); // Fewer retries for health check
            this.isConnected = true;
            return result;
        } catch (error) {
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * 🔄 Check connection status dengan timeout pendek
     */
    async checkConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.baseUrl}/health`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            this.isConnected = response.ok;
            return this.isConnected;
        } catch (error) {
            this.isConnected = false;
            return false;
        }
    }

    // ==================== GOOGLE OAUTH ====================
    async loginWithGoogle(token) {
        return await this.apiCall('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }
    
    // ==================== USERS ====================
    async login(username, password) {
        return await this.apiCall('/users/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async register(username, email, password) {
        return await this.apiCall('/users/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    // ==================== ACCOUNTS ====================
    async getAccounts() {
        return await this.apiCall('/accounts');
    }

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

    async addAccount(accountData) {
        return await this.createAccount(accountData);
    }

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

    async deleteAccount(accountId) {
        return await this.apiCall(`/accounts/${accountId}`, {
            method: 'DELETE'
        });
    }

    async getDefaultAccounts() {
        return await this.apiCall('/default-accounts');
    }

    // ==================== TRANSACTIONS ====================
    async getTransactions() {
        return await this.apiCall('/transactions');
    }

    async createTransaction(transactionData) {
        return await this.apiCall('/transactions', {
            method: 'POST',
            body: JSON.stringify({
                debit_account_id: transactionData.debit_account_id,
                credit_account_id: transactionData.credit_account_id,
                amount: transactionData.amount,
                description: transactionData.description,
                transaction_date: transactionData.date || new Date().toISOString().split('T')[0]
            })
        });
    }

    async addTransaction(transactionData) {
        return await this.createTransaction(transactionData);
    }

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

    async deleteTransaction(transactionId) {
        return await this.apiCall(`/transactions/${transactionId}`, {
            method: 'DELETE'
        });
    }

    // ==================== REPORTS ====================
    async getGeneralJournal() {
        return await this.apiCall('/reports/general-journal');
    }

    async getLedger() {
        return await this.apiCall('/reports/ledger');
    }

    async getTrialBalance() {
        return await this.apiCall('/reports/trial-balance');
    }

    async getIncomeStatement() {
        return await this.apiCall('/reports/income-statement');
    }

    async getBalanceSheet() {
        return await this.apiCall('/reports/balance-sheet');
    }
}

// Initialize and export
const api = new KeuTrackAPI();

// Global availability
window.KeuTrackAPI = api;

// Enhanced debug logging
console.log('🔧 [API.js] Loaded successfully - Version 6.0 - Enhanced Connection Handling [' + new Date().toISOString() + ']');
console.log('🌐 [API.js] Base URL:', api.baseUrl);
console.log('📦 [API.js] KeuTrackAPI instance created:', api);

// Test connection on startup
setTimeout(async () => {
    try {
        const health = await api.healthCheck();
        console.log('✅ [API.js] Initial health check:', health);
    } catch (error) {
        console.warn('⚠️ [API.js] Initial health check failed:', error.message);
    }
}, 1000);

// Export methods for verification
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(api)).filter(name =>
    name !== 'constructor' && typeof api[name] === 'function'
);

console.log('🎯 [API.js] Available methods (' + methods.length + '):', methods);
console.log('✅ [API.js] window.KeuTrackAPI assigned successfully');
console.log('✅ [API.js] Verification - window.KeuTrackAPI.getAccounts:', typeof window.KeuTrackAPI.getAccounts);
console.log('✅ [API.js] Verification - window.KeuTrackAPI.getTransactions:', typeof window.KeuTrackAPI.getTransactions);