
/**
 * Manages all reporting logic. It takes transactions and a user profile
 * to generate data structures suitable for frontend charts and reports.
 */
class ReportGenerator {
    /**
     * @param {Transaction[]} transactions - An array of Transaction objects for a specific user.
     * @param {UserProfile} userProfile - The profile of the user for whom the report is generated.
     */
    constructor(transactions, userProfile) {
        this.transactions = transactions.sort((a, b) => a.date - b.date);
        this.userProfile = userProfile;
    }

    /**
     * Filters transactions to include only those within a specific date range.
     * @param {Date} startDate - The start of the reporting period.
     * @param {Date} endDate - The end of the reporting period.
     * @returns {Transaction[]} - A filtered array of transactions.
     */
    _getTransactionsInDateRange(startDate, endDate) {
        return this.transactions.filter(tx => tx.date >= startDate && tx.date <= endDate);
    }

    /**
     * Generates data for a spending analysis report (e.g., for a pie chart).
     * @param {Date} startDate - The start of the reporting period.
     * @param {Date} endDate - The end of the reporting period.
     * @returns {Object[]} - An array of objects, e.g., [{ category: 'Groceries', total: 450.75 }, ...].
     */
    generateSpendingAnalysis(startDate, endDate) {
        const relevantTransactions = this._getTransactionsInDateRange(startDate, endDate);
        const spendingByCategory = {};

        for (const tx of relevantTransactions) {
            if (tx.type === 'expense') {
                if (!spendingByCategory[tx.category]) {
                    spendingByCategory[tx.category] = 0;
                }
                spendingByCategory[tx.category] += tx.amount;
            }
        }

        return Object.keys(spendingByCategory).map(category => ({
            category: category,
            total: spendingByCategory[category]
        }));
    }

    /**
     * Generates data for an Income vs. Expenses report.
     * @param {Date} startDate - The start of the reporting period.
     * @param {Date} endDate - The end of the reporting period.
     * @returns {{totalIncome: number, totalExpenses: number}} - An object containing total income and expenses.
     */
    generateIncomeVsExpenseReport(startDate, endDate) {
        const relevantTransactions = this._getTransactionsInDateRange(startDate, endDate);
        let totalIncome = 0;
        let totalExpenses = 0;

        for (const tx of relevantTransactions) {
            if (tx.type === 'income') {
                totalIncome += tx.amount;
            } else {
                totalExpenses += tx.amount;
            }
        }

        return { totalIncome, totalExpenses };
    }

    /**
     * Generates data to show savings growth over time (e.g., for a line chart).
     * @param {Date} startDate - The start of the reporting period.
     * @param {Date} endDate - The end of the reporting period.
     * @returns {Object[]} - An array of objects, e.g., [{ date: '2023-01-15', balance: 500.00 }, ...].
     */
    generateSavingsGrowth(startDate, endDate) {
        // This function remains the same as before.
        const relevantTransactions = this._getTransactionsInDateRange(startDate, endDate);
        const growthData = [];
        let currentBalance = 0;
        if (relevantTransactions.length === 0) return [];
        const dailyNetChange = new Map();
        for (const tx of relevantTransactions) {
            const day = tx.date.toISOString().split('T')[0];
            const change = tx.type === 'income' ? tx.amount : -tx.amount;
            const currentDailyTotal = dailyNetChange.get(day) || 0;
            dailyNetChange.set(day, currentDailyTotal + change);
        }
        let dayIterator = new Date(startDate);
        while (dayIterator <= endDate) {
            const dayString = dayIterator.toISOString().split('T')[0];
            if (dailyNetChange.has(dayString)) {
                currentBalance += dailyNetChange.get(dayString);
            }
            growthData.push({ date: dayString, balance: currentBalance });
            dayIterator.setDate(dayIterator.getDate() + 1);
        }
        return growthData;
    }

    /**
     * NEW: Generates a report comparing the user's savings goal to their actual performance for a period.
     * @param {Date} startDate - The start of the reporting period.
     * @param {Date} endDate - The end of the reporting period.
     * @returns {object} - An object detailing the budget vs. actual performance.
     */
    generateBudgetVsActualReport(startDate, endDate) {
        const { totalIncome, totalExpenses } = this.generateIncomeVsExpenseReport(startDate, endDate);
        const savingsGoalAmount = this.userProfile.getMonthlySavingsGoalAmount();
        const actualSavings = totalIncome - totalExpenses;

        return {
            expectedIncome: this.userProfile.monthlySalary,
            actualIncome: totalIncome,
            savingsGoal: savingsGoalAmount,
            actualSavings: actualSavings,
            // A "variance" shows if they are ahead (positive) or behind (negative) their goal.
            variance: actualSavings - savingsGoalAmount
        };
    }
}
