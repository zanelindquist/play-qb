import * as Linking from 'expo-linking';
import { useEffect } from "react";
import { useAuth } from './AuthContext';


export default function AuthUrlListener() {
    const { setOAuthCode } = useAuth()

    useEffect(() => {
        const handleUrl = ({ url }) => {
            if (!url.includes('/authenticated')) return;
            const code = new URL(url).searchParams.get('code');
            const verifier = localStorage.getItem('oauth_code_verifier');
            if (!code) return;
            setOAuthCode(code, verifier);
        };

        const sub = Linking.addEventListener('url', handleUrl);
        Linking.getInitialURL().then(url => {
            if (url) handleUrl({ url });
        });

        return () => sub.remove();
    }, []);

    return null;
}