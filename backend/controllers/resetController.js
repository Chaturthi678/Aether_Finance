import { deleteUserDataFiles } from '../db/db.js';
import { generateMockBankData } from '../mock/setuMock.js';

/**
 * Reset all database files for the active user context back to mock defaults.
 */
export async function resetUserData(req, res) {
  try {
    const email = req.userEmail;
    console.log(`Resetting database files for user context: ${email}`);

    // Clean user files
    await deleteUserDataFiles(email);

    // Re-populate mock banking logs matching user demographic
    const defaultTransactions = await generateMockBankData(email);

    res.json({
      success: true,
      message: `Reset database files successfully. Loaded defaults for ${email}.`,
      transactions: defaultTransactions
    });
  } catch (error) {
    console.error(`Failed to reset user database files for ${req.userEmail}:`, error);
    res.status(500).json({ error: "Failed to purge and reset user assets." });
  }
}
