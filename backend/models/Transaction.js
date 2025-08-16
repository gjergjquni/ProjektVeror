/**
 * Represents a single financial transaction (either income or expense).
 * This class is responsible for validating its own data upon creation.
 */
class Transaction {
    constructor(id, amount, date, type, category, description = '', userId) {
        // --- 1. Robust Validation ---
        if (!id) throw new Error('Transaction ID is required.');
        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error('Transaction amount must be a positive number.');
        }
        if (!['income', 'expense'].includes(type)) {
            throw new Error("Transaction type must be either 'income' or 'expense'.");
        }
        if (!date || isNaN(new Date(date).getTime())) {
            throw new Error('Invalid or missing transaction date.');
        }
        if (!category || typeof category !== 'string' || category.trim() === '') {
            throw new Error('Transaction category is required.');
        }
        if (!userId) throw new Error('User ID is required.');

        this.id = id;
        this.amount = amount;
        this.date = new Date(date);
        this.type = type;
        this.category = category;
        this.description = description || '';
        this.userId = userId;
    }

    /**
     * --- 2. Static Factory Method ---
     * Creates a new Transaction instance from a raw database row.
     * This keeps the creation logic clean and centralized.
     * @param {object} dbRow - The row object from the SQLite database.
     * @returns {Transaction} A new instance of the Transaction class.
     */
    static fromDatabaseRow(dbRow) {
        if (!dbRow) return null;
        return new Transaction(
            dbRow.id,
            dbRow.amount,
            dbRow.date, // Assumes 'date' is the column name in your DB
            dbRow.type,
            dbRow.category,
            dbRow.description,
            dbRow.user_id
        );
    }

    /**
     * Formats the transaction data into a plain object for API responses.
     * @returns {object} A clean object representation of the transaction.
     */
    toAPIObject() {
        return {
            id: this.id,
            amount: this.amount,
            date: this.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            type: this.type,
            category: this.category,
            description: this.description
        };
    }
}

module.exports = Transaction;