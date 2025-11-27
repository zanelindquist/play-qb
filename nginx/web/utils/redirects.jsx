import { useRouter } from 'expo-router';
import { useAlert } from './alerts';

const RedirectToSignIn = () => {
    console.log("redirect to signin")
    const router = useRouter();
    const showAlert = useAlert()

    // Redirect user to "/signin"
    router.replace('/signin');

    useAlert("Your session has expired, please log in again")

    return null; // This component doesn't render anything
};

export {RedirectToSignIn}