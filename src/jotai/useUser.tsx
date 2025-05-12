import { User } from "firebase/auth";
import { atom, useAtom } from "jotai";

export const userAtom = atom<null | User>(null);

export default function useUser() {
    const [user, setUser] = useAtom(userAtom);

    return { user, setUser };
}
