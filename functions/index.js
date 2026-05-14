
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Validates and increments monthly image usage for a specific user.
 * Limit: 300 images per calendar month.
 */
exports.checkAndIncrementUsage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to generate images.');
  }

  const MONTHLY_LIMIT = 300;
  const uid = context.auth.uid;
  const count = data.count || 1;
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const usageRef = admin.firestore().collection('users').doc(uid);

  try {
    return await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);
      let currentUsage = 0;
      let lastMonth = "";

      if (doc.exists) {
        const usageData = doc.data();
        currentUsage = usageData.imagesUsedThisMonth || 0;
        lastMonth = usageData.usageMonth || "";
      }

      if (lastMonth !== thisMonth) {
        currentUsage = 0;
      }

      if (currentUsage + count > MONTHLY_LIMIT) {
        throw new functions.https.HttpsError('resource-exhausted', 'MONTHLY_IMAGE_LIMIT_REACHED');
      }

      transaction.set(usageRef, {
        usageMonth: thisMonth,
        imagesUsedThisMonth: currentUsage + count
      }, { merge: true });

      return { success: true, remaining: MONTHLY_LIMIT - (currentUsage + count) };
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Usage tracking error:', error);
    throw new functions.https.HttpsError('internal', 'Internal server error tracking usage.');
  }
});

/**
 * Demo version: Validates and increments image usage.
 * Limit: 4 images per calendar day.
 */
exports.checkAndIncrementUsageDemo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to generate images.');
  }

  const DEMO_LIMIT = 4;
  const uid = context.auth.uid;
  const count = data.count || 1;
  const today = new Date().toISOString().split('T')[0];
  const usageRef = admin.firestore().collection('users').doc(uid);

  try {
    return await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);
      let currentUsage = 0;
      let lastDate = "";

      if (doc.exists) {
        const usageData = doc.data();
        currentUsage = usageData.demoImagesUsedToday || 0;
        lastDate = usageData.demoUsageDate || "";
      }

      if (lastDate !== today) {
        currentUsage = 0;
      }

      if (currentUsage + count > DEMO_LIMIT) {
        throw new functions.https.HttpsError('resource-exhausted', 'DAILY_IMAGE_LIMIT_REACHED');
      }

      transaction.set(usageRef, {
        demoUsageDate: today,
        demoImagesUsedToday: currentUsage + count
      }, { merge: true });

      return { success: true, remaining: DEMO_LIMIT - (currentUsage + count) };
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Demo usage tracking error:', error);
    throw new functions.https.HttpsError('internal', 'Internal server error tracking usage.');
  }
});

/**
 * Demo version: Refunds credits back to a user when image generation fails.
 */
exports.refundUsageDemo = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const DEMO_LIMIT = 4;
  const uid = context.auth.uid;
  const count = data.count || 1;
  const today = new Date().toISOString().split('T')[0];
  const usageRef = admin.firestore().collection('users').doc(uid);

  try {
    return await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);

      if (!doc.exists) return { success: true };

      const usageData = doc.data();
      if (usageData.demoUsageDate !== today) return { success: true };

      const currentUsage = usageData.demoImagesUsedToday || 0;
      const newUsage = Math.max(0, currentUsage - count);

      transaction.set(usageRef, { demoImagesUsedToday: newUsage }, { merge: true });

      return { success: true, remaining: DEMO_LIMIT - newUsage };
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Demo refund usage error:', error);
    throw new functions.https.HttpsError('internal', 'Internal server error refunding usage.');
  }
});

/**
 * Refunds credits back to a user when image generation fails.
 * Called client-side after a generation error so failed attempts don't consume credits.
 */
exports.refundUsage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const MONTHLY_LIMIT = 300;
  const uid = context.auth.uid;
  const count = data.count || 1;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const usageRef = admin.firestore().collection('users').doc(uid);

  try {
    return await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);

      if (!doc.exists) return { success: true };

      const usageData = doc.data();
      if (usageData.usageMonth !== thisMonth) return { success: true };

      const currentUsage = usageData.imagesUsedThisMonth || 0;
      const newUsage = Math.max(0, currentUsage - count);

      transaction.set(usageRef, { imagesUsedThisMonth: newUsage }, { merge: true });

      return { success: true, remaining: MONTHLY_LIMIT - newUsage };
    });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Refund usage error:', error);
    throw new functions.https.HttpsError('internal', 'Internal server error refunding usage.');
  }
});
