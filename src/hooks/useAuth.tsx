import { useEffect, useState } from "react";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    reauthenticateWithPopup,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from "firebase/auth";
import useFireBase from "./useFireBase";
import { App } from "antd";
import useUser from "../jotai/useUser";

export default function useAuth() {
    const { message } = App.useApp();
    const { firebaseAuth } = useFireBase();
    const { user, setUser } = useUser();
    const [loading, setLoading] = useState(true);

    async function firebaseLogin({
        email,
        password,
    }: {
        email: string;
        password: string;
    }) {
        try {
            const result = await signInWithEmailAndPassword(
                firebaseAuth,
                email,
                password
            );
            return result;
        } catch (error: any) {
            message.error("Error login in");
        }
    }

    async function firebaseSignUp({
        email,
        password,
    }: {
        email: string;
        password: string;
    }) {
        setLoading(true);
        try {
            const result = await createUserWithEmailAndPassword(
                firebaseAuth,
                email,
                password
            );
            setLoading(false);
            return result;
        } catch (error: any) {
            message.error("Error Signing up");
        }
        setLoading(false);
    }

    async function firebaseLoginWithGoogle() {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(firebaseAuth, provider);
            setLoading(false);
            return result;
        } catch (error: any) {
            alert("נראה שאין לך הרשאה, נא לפנות לשיר להרשאות.");
            message.error("Error Signing up through Google");
        }
        setLoading(false);
    }

    const firebaseLogout = () => {
        setUser(null);
        return signOut(firebaseAuth);
    };

    async function reauthenticateUser(
        providerType: "default" | "Google",
        email?: string,
        password?: string
    ) {
        if (!firebaseAuth.currentUser) return;

        if (providerType === "Google") {
            const googleProvider = new GoogleAuthProvider();
            // For Google sign-in, you must reauthenticate with a popup.
            await reauthenticateWithPopup(
                firebaseAuth.currentUser,
                googleProvider
            );
        } else {
            // For email/password sign-in:
            if (!email || !password) {
                return;
            }
            const credential = EmailAuthProvider.credential(email, password);
            await reauthenticateWithCredential(
                firebaseAuth.currentUser,
                credential
            );
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            firebaseAuth,
            async (currentUser) => {
                setLoading(true);
                if (currentUser && !user) {
                    setUser(currentUser);
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [firebaseAuth]);

    return {
        login: firebaseLogin,
        logout: firebaseLogout,
        googleLogin: firebaseLoginWithGoogle,
        signup: firebaseSignUp,
        loading,
        email: user,
        reauth: reauthenticateUser,
    };
}
