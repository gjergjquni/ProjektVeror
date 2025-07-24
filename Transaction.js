/**
 * @file This file contains the core JavaScript classes for handling the backend logic
 * of the reporting and planning features in a personal finance application.
 * These classes are designed to be used in a Node.js environment (e.g., with an Express server).
 */

/**
 * Represents a single financial transaction (either income or expense).
 * This is the fundamental data model for all reporting.
 */
class Transaction {
    /**
     * @param {string} id - Unique identifier for the transaction (e.g., from a database).
     * @param {number} amount - The monetary value of the transaction. Should always be positive.
     * @param {Date} date - The date and time the transaction occurred.
     * @param {'income' | 'expense'} type - The type of transaction.
     * @param {string} category - The category of the transaction (e.g., "Groceries", "Salary", "Transport").
     * @param {string} [description] - An optional description for the transaction.
     * @param {string} userId - The ID of the user this transaction belongs to.
     */
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


// --- EXAMPLE USAGE ---
// In your backend, you would fetch both the user's profile and their transactions.

// 1. Fetch/create user profile data.
const userProfile = new UserProfile('user123', 'Software Developer', 2500, 20); // Goal is to save 20%

// 2. Fetch user's transactions from your database.
const dbTransactions = [
    new Transaction('1', 2500, '2023-10-01', 'income', 'Salary', 'Monthly Paycheck', 'user123'),
    new Transaction('2', 75.50, '2023-10-05', 'expense', 'Groceries', 'Weekly shopping', 'user123'),
    new Transaction('3', 30, '2023-10-07', 'expense', 'Transport', 'Bus pass', 'user123'),
    new Transaction('4', 120, '2023-10-12', 'expense', 'Bills', 'Internet bill', 'user123'),
    new Transaction('5', 50, '2023-10-15', 'expense', 'Entertainment', 'Cinema tickets', 'user123'),
    new Transaction('6', 85, '2023-10-20', 'expense', 'Groceries', 'More shopping', 'user123'),
];

// 3. Define the reporting period.
const startDate = new Date('2023-10-01');
const endDate = new Date('2023-10-31');

// 4. Create a ReportGenerator instance with both transactions and profile.
const reportGenerator = new ReportGenerator(dbTransactions, userProfile);

// 5. Generate all the reports.
const spendingReport = reportGenerator.generateSpendingAnalysis(startDate, endDate);
const incomeExpenseReport = reportGenerator.generateIncomeVsExpenseReport(startDate, endDate);
const budgetVsActualReport = reportGenerator.generateBudgetVsActualReport(startDate, endDate); // New report

// 6. Send the generated data as a JSON response to your frontend app.
console.log('--- Spending Analysis ---');
console.log(spendingReport);

console.log('\n--- Income vs. Expense Report ---');
console.log(incomeExpenseReport);

console.log('\n--- NEW: Budget vs. Actual Performance ---');
console.log(budgetVsActualReport);
/*
Expected Output:
{
  expectedIncome: 2500,
  actualIncome: 2500,
  savingsGoal: 500,      // 20% of 2500
  actualSavings: 2139.5, // 2500 (income) - 360.5 (expenses)
  variance: 1639.5       // User saved 1639.5 more than their goal
}
*/
