import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';
import FloatingBall from './FloatingBall';
import AIAssistantModal from './AIAssistantModal';
import { useAuth } from '../context/AuthContext';

function Layout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuth();
  const location = useLocation();
  const showPaths = ['/', '/post/'];
  const showFloatingBall = showPaths.some(p => 
    location.pathname === p || location.pathname.startsWith('/post/')
  );

  return (
    <div className={styles.layout}>
      <Outlet />
      {token && showFloatingBall && (
        <>
          <FloatingBall onClick={() => setIsModalOpen(true)} />
          <AIAssistantModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}

export default Layout;
