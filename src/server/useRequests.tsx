import useDB from "../hooks/useDB";
import { addDoc, collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { JoinRequest } from "../utils/Types";
import { notification } from "antd";

const collectionName = "requests";

export default function useRequests() {
  const db = useDB();

  async function create(newRequest: JoinRequest) {
    try {
      const requestsCollection = collection(db, collectionName);
      await addDoc(requestsCollection, newRequest);

      notification.success({ message: "הבקשה נשלחה בהצלחה" });
      return newRequest;
    } catch (error) {
      notification.error({
        message: "אופס, הייתה בעיה בשליחת הבקשה. נסה שוב",
      });
    }
  }

  async function remove(id: string) {
    try {
      const docRef = doc(db, collectionName, id);

      await deleteDoc(docRef);

      notification.success({ message: "הבקשה אושרה בהצלחה" });
      return true;
    } catch (error) {
      notification.error({
        message: "אופס, הייתה בעיה במחיקת הבקשה.",
      });
    }
  }

  async function getAll() {
    try {
      const requestsCollection = collection(db, collectionName)
      const querySnapshot = await getDocs<any, any>(requestsCollection);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return data as JoinRequest[];
    } catch (error) {
      return []
    }
  }

  return { create, remove, getAll };
}
