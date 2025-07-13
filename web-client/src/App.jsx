import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import { Leaf } from 'lucide-react';

// 🌱 EcoBasket App Component
function App() {
  const [user] = useAuthState(auth);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e6ffe6, #e6f0ff, #f0e6ff)' }}>
      {user ? <Dashboard user={user} /> : <LoginPage />}
    </div>
  );
}

export default App;