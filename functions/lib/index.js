"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayPayment = exports.createRazorpayOrder = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
admin.initializeApp();
function getRazorpayInstance() {
    const key_id = process.env.RAZORPAY_KEY_ID || "rzp_live_SUbr4cftio73uJ";
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
        throw new functions.https.HttpsError("failed-precondition", "Razorpay Secret Key is not configured on this server environment.");
    }
    return new razorpay_1.default({ key_id, key_secret });
}
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
    try {
        const razorpay = getRazorpayInstance();
        const amount = data.amount;
        if (!amount) {
            throw new functions.https.HttpsError("invalid-argument", "Payment amount must be provided.");
        }
        const order = await razorpay.orders.create({
            amount: amount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        });
        return order;
    }
    catch (error) {
        console.error("Error creating Razorpay Order:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to create payment order.");
    }
});
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            throw new functions.https.HttpsError("failed-precondition", "Razorpay Secret Key missing from server environment.");
        }
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new functions.https.HttpsError("invalid-argument", "Missing required signature fields.");
        }
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", key_secret)
            .update(body.toString())
            .digest("hex");
        if (expectedSignature === razorpay_signature) {
            return { success: true, message: "Payment verified successfully" };
        }
        else {
            throw new functions.https.HttpsError("invalid-argument", "Payment verification failed. Invalid signature mismatch.");
        }
    }
    catch (error) {
        console.error("Error verifying signature:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to verify signature.");
    }
});
//# sourceMappingURL=index.js.map