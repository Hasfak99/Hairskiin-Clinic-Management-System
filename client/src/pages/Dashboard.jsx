import { useAuth } from '../context/AuthContext';
import HairSkinDirectorDashboard from './HairSkinDirectorDashboard';
import HarskinDirectorDashboard from './HarskinDirectorDashboard';
import HairSkinDashboard from './HairSkinDashboard';
import HarskinDashboard from './HarskinDashboard';

export default function Dashboard() {
    const { user } = useAuth();
    const isHarskin = user?.department_name === 'Harskin';

    // Priority 1: Director Role
    if (user?.role === 'director') {
        if (isHarskin) {
            return <HarskinDirectorDashboard />;
        }
        return <HairSkinDirectorDashboard />;
    }

    // Priority 2: Department-based (Reuse isHarskin)
    if (isHarskin) {
        return <HarskinDashboard />;
    }

    return <HairSkinDashboard />;
}
