import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import useDB from "../hooks/useDB";
import useUser from "../jotai/useUser";

const collectionName = "authorization";

export default function useAuthorization() {
    const db = useDB();
    const { user: email } = useUser();

    async function hasWritePermissions() {
        if (!email) return false;

        const testDocRef = doc(db, collectionName, "test-write-permission");
        try {
            await setDoc(testDocRef, { test: true });
            await deleteDoc(testDocRef);
            return true;
        } catch (error: any) {
            if (error.code === "permission-denied") return false;
            return false;
        }
    }

    async function get(): Promise<{ id: string; emails: string[] }[] | null> {
        try {
            const authCollection = collection(db, collectionName);
            return (await getDocs<any, any>(authCollection)).docs.map(
                (doc) => ({ id: doc.id, ...doc.data() })
            );
        } catch (error) {
            return null;
        }
    }

    async function update(emails: string[]) {
        try {
            const authList = await get();
            if (authList) {
                const updatedEmails = Array.from(new Set(emails));
                const authDocRef = doc(db, collectionName, authList[0].id);
                await updateDoc(authDocRef, {
                    emails: updatedEmails,
                });
            }
        } catch (error) {}
    }

    return { update, get, hasWritePermissions };
}
