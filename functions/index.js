
const functions = require('firebase-functions');
const cors = require('cors');
const admin = require('firebase-admin');
admin.initializeApp();

const LIFETIME_LIMIT = 4;
const corsHandler = cors({ origin: true });

/**
 * Validates and increments LIFETIME demo image usage for a specific user.
 * Limit: 4 images total, ever. No resets.
 */
exports.checkAndIncrementUsageDemo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to generate images.');
  }

  const uid = context.auth.uid;
  const count = data.count || 1;
  const usageRef = admin.firestore().collection('users').doc(uid);

  try {
    return await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);
      let lifetimeUsed = 0;

      if (doc.exists) {
        lifetimeUsed = doc.data().lifetimeImagesUsed || 0;
      }

      if (lifetimeUsed + count > LIFETIME_LIMIT) {
        throw new functions.https.HttpsError('resource-exhausted', 'LIFETIME_IMAGE_LIMIT_REACHED');
      }

      transaction.set(usageRef, {
        lifetimeImagesUsed: lifetimeUsed + count
      }, { merge: true });

      return { success: true, used: lifetimeUsed + count, remaining: LIFETIME_LIMIT - (lifetimeUsed + count) };
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Usage tracking error:', error);
    throw new functions.https.HttpsError('internal', 'Internal server error tracking usage.');
  }
});

/**
 * Refunds credits back to a user when image generation fails.
 */
exports.refundUsageDemo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const uid = context.auth.uid;
  const count = data.count || 1;
  const usageRef = admin.firestore().collection('users').doc(uid);

  try {
    return await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);
      if (!doc.exists) return { success: true };

      const lifetimeUsed = doc.data().lifetimeImagesUsed || 0;
      const newUsed = Math.max(0, lifetimeUsed - count);

      transaction.set(usageRef, { lifetimeImagesUsed: newUsed }, { merge: true });

      return { success: true, used: newUsed, remaining: LIFETIME_LIMIT - newUsed };
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Refund usage error:', error);
    throw new functions.https.HttpsError('internal', 'Internal server error refunding usage.');
  }
});
