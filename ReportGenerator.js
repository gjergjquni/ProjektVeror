/**
 * Generates financial reports based on a user's transactions and profile.
 */
class ReportGenerator {
    constructor(transactions, userProfile) {
        this.transactions = transactions;
        this.userProfile = userProfile;
    }

    /**
     * Filters transactions to a specific date range.
     */
    _filterTransactionsByDate(startDate, endDate) {
        return this.transactions.filter(t => t.date >= startDate && t.date <= endDate);
    }

    /**
     * Analyzes spending by category within a date range.
     */
    generateSpendingAnalysis(startDate, endDate) {
        const filtered = this._filterTransactionsByDate(startDate, endDate);
        const spending = {};
        let totalSpent = 0;

        filtered.forEach(t => {
            if (t.type === 'expense') {
                spending[t.category] = (spending[t.category] || 0) + t.amount;
                totalSpent += t.amount;
            }
        });

        return {
            totalSpent,
            categoryBreakdown: spending
        };
    }

    /**
     * Compares total income vs. total expenses for a period.
     */
    generateIncomeVsExpenseReport(startDate, endDate) {
        const filtered = this._filterTransactionsByDate(startDate, endDate);
        let totalIncome = 0;
        let totalExpense = 0;

        filtered.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else {
                totalExpense += t.amount;
            }
        });

        return {
            totalIncome,
            totalExpense,
            netSavings: totalIncome - totalExpense
        };
    }

    /**
     * Compares the user's savings goal with their actual savings.
     */
    generateBudgetVsActualReport(startDate, endDate) {
        const { totalIncome, netSavings } = this.generateIncomeVsExpenseReport(startDate, endDate);
        const savingsGoal = this.userProfile.getMonthlySavingsGoalAmount();

        return {
            expectedIncome: this.userProfile.monthlySalary,
            actualIncome: totalIncome,
            savingsGoal,
            actualSavings: netSavings,
            variance: netSavings - savingsGoal
        };
    }
}

module.exports = ReportGenerator;