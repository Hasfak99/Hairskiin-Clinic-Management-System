import { useAuth } from '../context/AuthContext';
import HairSkinDashboard from './HairSkinDashboard';
import HarskinDashboard from './HarskinDashboard';

export default function Dashboard() {
    const { user } = useAuth();

    // Check optional chaining for department_name
    // If Admin/Manager has no specific department or 'Hair Skin Clinic', show default
    // If department is 'Harskin', show Harskin Dashboard

    // Normalizing logic:
    // Hair Skin Clinic -> HairSkinDashboard
    // Harskin -> HarskinDashboard
    // Other/Null -> HairSkinDashboard (Default)

    const isHarskin = user?.department_name === 'Harskin';

    if (isHarskin) {
        return <HarskinDashboard />;
    }

    return <HairSkinDashboard />;
}
