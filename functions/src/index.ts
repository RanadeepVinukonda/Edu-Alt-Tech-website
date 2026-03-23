import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Razorpay from "razorpay";
import * as crypto from "crypto";

admin.initializeApp();

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_live_SUakULterTMUkm";
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_secret) {
    throw new functions.https.HttpsError(
      "failed-precondition", 
      "Razorpay Secret Key is not configured on this server environment."
    );
  }

  return new Razorpay({ key_id, key_secret });
}

// 1. Create Order Backend API
export const createRazorpayOrder = functions.https.onCall(async (data, context) => {
  try {
    const razorpay = getRazorpayInstance();
    const amount = data.amount;

    if (!amount) {
      throw new functions.https.HttpsError("invalid-argument", "Payment amount must be provided.");
    }

    // Razorpay orders.create expects amount in the lowest denomination (paise)
    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });

    return order;
  } catch (error: any) {
    console.error("Error creating Razorpay Order:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to create payment order.");
  }
});

// 2. Verify Payment Signature Backend API
export const verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      throw new functions.https.HttpsError("failed-precondition", "Razorpay Secret Key missing from server environment.");
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required signature fields.");
    }

    // Mathematically generate what the signature SHOULD be, using your private secret key.
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Signature is valid. You can safely record this transaction into Firestore or perform subsequent actions.
      // await admin.firestore().collection('transactions').add({ order_id: razorpay_order_id, status: 'success' });
      return { success: true, message: "Payment verified successfully" };
    } else {
      throw new functions.https.HttpsError("invalid-argument", "Payment verification failed. Invalid signature mismatch.");
    }

  } catch (error: any) {
    console.error("Error verifying signature:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to verify signature.");
  }
});
