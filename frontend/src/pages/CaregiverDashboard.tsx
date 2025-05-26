import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import ShiftList from '../components/ShiftList';

export const CaregiverDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Caregiver Dashboard</h1>
        <ShiftList />
      </div>
    </div>
  );
}; 