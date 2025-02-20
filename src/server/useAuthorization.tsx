import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import useDB from "../hooks/useDB";

const collectionName = "authorization";

export default function useAuthorization() {
  const db = useDB();

  async function get(): Promise<{ id: string, emails: string[] }[] | null> {
    try {
      const authCollection = collection(db, collectionName);
      return (await getDocs<any, any>(authCollection)).docs.map(doc => ({id: doc.id, ...doc.data()}))
    } catch (error) {
      return null
    }
  }

  async function update(emails: string[]) {
    try {
      const authList = await get();
      if (authList) {
        const updatedEmails = Array.from(new Set([...emails, ...authList[0].emails]))
        const authDocRef = doc(db, collectionName, authList[0].id)
        await updateDoc(authDocRef, {
          emails: updatedEmails
        })
      }
    } catch (error) {

    }
  }

  return { update, get }
}
