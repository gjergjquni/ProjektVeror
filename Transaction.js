/**
 * Represents a single financial transaction (either income or expense).
 */
class Transaction {
    constructor(id, amount, date, type, category, description = '', userId) {
        if (amount <= 0) {
            throw new Error('Transaction amount must be a positive number.');
        }
        this.id = id;
        this.amount = amount;
        this.date = new Date(date);
        this.type = type; // 'income' or 'expense'
        this.category = category;
        this.description = description;
        this.userId = userId;
    }
}

module.exports = Transaction;