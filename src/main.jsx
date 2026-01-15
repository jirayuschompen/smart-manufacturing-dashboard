import React, { useState } from 'react';
import LoginMockup from './login';
import Dashboard from './AppDashboard'; // แยก Dashboard ชัดเจน

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

  return (
    <>
      {!isAuthenticated ? (
        <LoginMockup onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </>
  );
};

export default App;
  