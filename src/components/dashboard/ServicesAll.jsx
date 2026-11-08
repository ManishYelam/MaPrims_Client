import { useAuth } from '../../context/AuthContext';
import ServicesCatalog from './ServicesCatalog';
import ServiceManagement from './ServiceManagement';

const Services = () => {
  const { user } = useAuth();
  const role = user?.user?.role;
  if (role === 'student') {
    return <ServicesCatalog />;
  }
  return <ServiceManagement />;
};

export default Services;