/**
 * Holds profile information for a user, including financial goals.
 */
class UserProfile {
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

module.exports = UserProfile;