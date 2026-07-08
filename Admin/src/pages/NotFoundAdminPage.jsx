import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AdminLayout from '../components/AdminLayout';

const NotFoundAdminPage = () => (
  <AdminLayout title="Not Found">
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
        className="font-playfair text-[100px] md:text-[140px] font-bold leading-none"
        style={{color:'transparent',WebkitTextStroke:'2px #C9A24B'}}>404</motion.h1>
      <p className="font-playfair text-2xl font-semibold mt-2 mb-2">Page Not Found</p>
      <p className="text-brand-grey text-sm mb-8">This admin page doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary" id="admin-404-home">Back to Dashboard</Link>
    </div>
  </AdminLayout>
);
export default NotFoundAdminPage;
