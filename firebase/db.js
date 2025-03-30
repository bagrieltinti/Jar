import admin from 'firebase-admin';
import { getDatabase } from 'firebase-admin/database';
import { config } from 'dotenv';

config();

// Inicialização única do Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: "https://jardsbot-default-rtdb.firebaseio.com"
  });
}

export const db = getDatabase();

export async function getCampaignData(channelId) {
  try {
    const snapshot = await db.ref(`campanhas/${channelId}`).once('value');
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Erro ao obter dados da campanha:", error);
    return null;
  }
}

export async function setCampaignData(channelId, data) {
  try {
    await db.ref(`campanhas/${channelId}`).set(data);
    return true;
  } catch (error) {
    console.error("Erro ao definir dados da campanha:", error);
    return false;
  }
}

export async function updateCampaignData(channelId, partialData) {
  try {
    await db.ref(`campanhas/${channelId}`).update(partialData);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar dados da campanha:", error);
    return false;
  }
}

export async function deleteCampaignData(channelId) {
  try {
    const ref = db.ref(`campanhas/${channelId}`);
    await ref.remove();
    return true;
  } catch (error) {
    console.error("Erro ao excluir dados da campanha:", error);
    return false;
  }
}