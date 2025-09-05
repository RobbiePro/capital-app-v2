// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.updatePreviousProfit = functions.https.onCall(async (data, context) => {
  console.log("Function triggered. Received data object:", data);

  // Robustly parse the incoming value from the object
  const incomingValue = data.currentProfit;
  const currentProfit = parseFloat(incomingValue);

  // Final validation: Check if the result is a valid number
  if (isNaN(currentProfit)) {
    console.error("Validation failed: 'currentProfit' was not a valid number. Received:", incomingValue);
    throw new functions.https.HttpsError(
        "invalid-argument",
        "The 'currentProfit' argument must be a valid number.",
    );
  }

  const recordsDocRef = db.collection("records").doc("allTime");

  try {
    await recordsDocRef.set({
      previousProfitILS: currentProfit,
    }, {merge: true});
    return {status: "success"};
  } catch (error) {
    console.error("Error writing to Firestore:", error);
    throw new functions.https.HttpsError("internal", "Failed to write to database.");
  }
});
