import { useAuth } from '../context/AuthContext';
import DirectorDashboard from './DirectorDashboard';
import HairSkinDashboard from './HairSkinDashboard';
import HarskinDashboard from './HarskinDashboard';

export default function Dashboard() {
    const { user } = useAuth();

    // Priority 1: Director Role
    if (user?.role === 'director') {
        return <DirectorDashboard />;
    }

    // Priority 2: Department-based
    const isHarskin = user?.department_name === 'Harskin';

    if (isHarskin) {
        return <HarskinDashboard />;
    }

    return <HairSkinDashboard />;
}
