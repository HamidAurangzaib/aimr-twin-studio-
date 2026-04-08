
const functions = require('firebase-functions');
const cors = require('cors');
const admin = require('firebase-admin');
admin.initializeApp();

const LIFETIME_LIMIT = 4;
const corsHandler = cors({ origin: true });

/**
 * HTTP endpoint to check and increment LIFETIME demo image usage.
 * Enforces per-user lifetime limit of 4 images.
 */
exports.checkAndIncrementUsageDemo = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const authToken = req.headers.authorization?.split('Bearer ')[1];
      if (!authToken) {
        return res.status(401).json({ error: 'Unauthenticated' });
      }

      const decodedToken = await admin.auth().verifyIdToken(authToken);
      const uid = decodedToken.uid;
      const count = req.body.count || 1;
      const usageRef = admin.firestore().collection('users').doc(uid);

      const result = await admin.firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(usageRef);
        let lifetimeUsed = 0;

        if (doc.exists) {
          lifetimeUsed = doc.data().lifetimeImagesUsed || 0;
        }

        if (lifetimeUsed + count > LIFETIME_LIMIT) {
          throw new Error('LIFETIME_IMAGE_LIMIT_REACHED');
        }

        transaction.set(usageRef, {
          lifetimeImagesUsed: lifetimeUsed + count
        }, { merge: true });

        return { success: true, used: lifetimeUsed + count, remaining: LIFETIME_LIMIT - (lifetimeUsed + count) };
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Usage tracking error:', error);
      if (error.message === 'LIFETIME_IMAGE_LIMIT_REACHED') {
        return res.status(429).json({ error: 'LIFETIME_IMAGE_LIMIT_REACHED' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

/**
 * HTTP endpoint to refund credits when image generation fails.
 */
exports.refundUsageDemo = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const authToken = req.headers.authorization?.split('Bearer ')[1];
      if (!authToken) {
        return res.status(401).json({ error: 'Unauthenticated' });
      }

      const decodedToken = await admin.auth().verifyIdToken(authToken);
      const uid = decodedToken.uid;
      const count = req.body.count || 1;
      const usageRef = admin.firestore().collection('users').doc(uid);

      const result = await admin.firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(usageRef);
        if (!doc.exists) {
          return { success: true };
        }

        const lifetimeUsed = doc.data().lifetimeImagesUsed || 0;
        const newUsed = Math.max(0, lifetimeUsed - count);

        transaction.set(usageRef, { lifetimeImagesUsed: newUsed }, { merge: true });

        return { success: true, used: newUsed, remaining: LIFETIME_LIMIT - newUsed };
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Refund usage error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});
