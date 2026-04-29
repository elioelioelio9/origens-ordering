import { existsSync, readFileSync } from "fs";
import path from "path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (base64ServiceAccount) {
const json = Buffer.from(base64ServiceAccount, "base64").toString("utf8");
return JSON.parse(json);
}

const localServiceAccountPath = path.join(
process.cwd(),
"secrets",
"service-account.json"
);

if (existsSync(localServiceAccountPath)) {
return JSON.parse(readFileSync(localServiceAccountPath, "utf8"));
}

throw new Error("Missing Firebase service account credentials");
}

const serviceAccount = getServiceAccount();

export const firebaseAdminApp =
getApps().length === 0
? initializeApp({
credential: cert(serviceAccount),
})
: getApps()[0];

export const adminDb = getFirestore(firebaseAdminApp);