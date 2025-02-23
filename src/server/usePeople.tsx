import useDB from '../hooks/useDB';
import { Person } from '../utils/Types';
import { addDoc, collection, getDocs } from 'firebase/firestore';

const collectionName = "people";

export default function usePeople() {
  const db = useDB();

  async function create(newPerson: Person) {
    try {
      const peopleCollection = collection(db, collectionName)
      await addDoc(peopleCollection, newPerson);

      return newPerson
    } catch (error) {

    }
  }

  async function get() {
    try {
      const peopleCollection = collection(db, collectionName)
      const querySnapshot = await getDocs<any, any>(peopleCollection);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return data.map(person => ({...person, timestamp: person.timestamp.toDate(), birthDate: person.birthDate.toDate() })) as Person[];
    } catch (error) {
      return []
    }
  }

  return { create, get }
}
