import { useAuth } from '../../context/AuthContext';
import CourseCatalog from './MyCourses';
import CourseManagement from './CourseManagement';

const Courses = () => {
  const { user } = useAuth();
  const role = user?.user?.role;
  if (role === 'student') {
    return <CourseCatalog />;
  }
  return <CourseManagement />;
};

export default Courses;