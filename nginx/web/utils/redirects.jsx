import { useRouter } from 'expo-router';
import { useAlert } from './alerts';

const RedirectToSignIn = () => {
    const router = useRouter();
    const showAlert = useAlert()

    // Redirect user to "/signin"
    router.replace('/signin');

    showAlert("Your session has expired, please log in again")

    return null; // This component doesn't render anything
};

export {RedirectToSignIn}