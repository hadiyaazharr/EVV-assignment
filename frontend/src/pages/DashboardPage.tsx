import { useQuery } from '@tanstack/react-query';
import { caregiverApi } from '../lib/api';
import { ShiftCard } from '../components/ShiftCard';
import { Navbar } from '../components/Navbar';
import ShiftList from '../components/ShiftList';

export const DashboardPage = () => (
  <>
    <Navbar />
    <ShiftList />
  </>
);

export default DashboardPage; 