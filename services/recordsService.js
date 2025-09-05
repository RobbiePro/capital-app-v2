// services/recordsService.js
import { db, doc, getDoc, setDoc } from './firebase.js';
import { calculateTotalCapital } from './capitalService.js';

const RECORDS_DOC_REF = doc(db, 'records', 'allTime');

/**
 * Checks for new profit/loss records and updates the database if necessary.
 * Then, it fetches and returns all current records.
 * @returns {Promise<object>} An object containing all peak and trough records.
 */
export async function updateAndFetchRecords() {
    let records = {
        peakProfitILS: { value: -Infinity, date: null },
        troughProfitILS: { value: Infinity, date: null },
        peakProfitUSD: { value: -Infinity, date: null },
        troughProfitUSD: { value: Infinity, date: null },
        previousProfitILS: null
    };

    // 1. Get existing records from Firestore
    try {
        const docSnap = await getDoc(RECORDS_DOC_REF);
        if (docSnap.exists()) {
            records = { ...records, ...docSnap.data() };
        }
    } catch (error) {
        console.error("Error fetching existing records:", error);
    }

    // 2. Get current profit/loss figures
    const capitalData = await calculateTotalCapital();
    const { totalProfitLossILS, totalProfitLossUSD } = capitalData;
    const today = new Date().toISOString().split('T')[0];

    let hasChanges = false;

    // 3. Compare and update if new records are found
    if (totalProfitLossILS > records.peakProfitILS.value) {
        records.peakProfitILS = { value: totalProfitLossILS, date: today };
        hasChanges = true;
    }
    if (totalProfitLossILS < records.troughProfitILS.value) {
        records.troughProfitILS = { value: totalProfitLossILS, date: today };
        hasChanges = true;
    }
    if (totalProfitLossUSD > records.peakProfitUSD.value) {
        records.peakProfitUSD = { value: totalProfitLossUSD, date: today };
        hasChanges = true;
    }
    if (totalProfitLossUSD < records.troughProfitUSD.value) {
        records.troughProfitUSD = { value: totalProfitLossUSD, date: today };
        hasChanges = true;
    }

    // עדכן את הרווח הקודם
    records.previousProfitILS = totalProfitLossILS;
    hasChanges = true;

    // 4. If any record was updated, save the changes to Firestore
    if (hasChanges) {
        try {
            await setDoc(RECORDS_DOC_REF, records, { merge: true });
        } catch (error) {
            console.error("Error updating records in Firestore:", error);
        }
    }

    // 5. Return the latest records (either old or newly updated)
    return records;
}