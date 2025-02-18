import { getFirestore } from "firebase/firestore";
import useFireBase from "./useFireBase";

export default function useDB() {
  const { firebaseApp } = useFireBase();
  const db = getFirestore(firebaseApp);

  return db;
}