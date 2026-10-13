// Yönetici için kullanıcı şifresi sıfırlama (callable function).
// İstemci: firebase.functions().httpsCallable("sifreSifirla")({uid, sifre})
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sifreSifirla = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Giriş gerekli.");
  }
  // Çağıran gerçekten onaylı bir yönetici mi? (veritabanından kontrol edilir)
  const snap = await admin.database().ref("kullanicilar/" + context.auth.uid).once("value");
  const k = snap.val() || {};
  if (k.yonetici !== true || k.onay !== true) {
    throw new functions.https.HttpsError("permission-denied", "Yönetici olmalısınız.");
  }
  const uid = String((data && data.uid) || "");
  const sifre = String((data && data.sifre) || "");
  if (!uid || sifre.length < 6 || sifre.length > 128) {
    throw new functions.https.HttpsError("invalid-argument", "Geçersiz bilgi (şifre en az 6 karakter).");
  }
  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError("failed-precondition", "Kendi şifrenizi 'Şifremi değiştir' ile değiştirin.");
  }
  await admin.auth().updateUser(uid, { password: sifre });
  await admin.auth().revokeRefreshTokens(uid); // eski oturumlar kapansın
  return { ok: true };
});
