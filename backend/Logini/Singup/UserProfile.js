
class UserProfile {
    /**
     * @param {string} userId - The unique ID for the user.
     * @param {string} jobTitle - The user's job title.
     * @param {number} monthlySalary - The user's fixed monthly income.
     * @param {number} savingsGoalPercentage - The percentage of income the user wants to save (e.g., 20).
     */
    constructor(userId, jobTitle, monthlySalary, savingsGoalPercentage) {
        this.userId = userId;
        this.jobTitle = jobTitle;
        this.monthlySalary = monthlySalary;
        this.savingsGoalPercentage = savingsGoalPercentage;
    }

    /**
     * Calculates the target amount to save each month based on the user's goal.
     * @returns {number} The monthly savings goal amount.
     */
    getMonthlySavingsGoalAmount() {
        return this.monthlySalary * (this.savingsGoalPercentage / 100);
    }
}