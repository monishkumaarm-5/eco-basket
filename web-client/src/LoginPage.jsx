import React, { useState } from 'react';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import axios from 'axios';
import { LogIn, User, Phone, Leaf, CheckCircle } from 'lucide-react';

// 🔐 LoginPage Component
function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Google login
  const loginWithGoogle = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const { displayName, email, uid, photoURL } = user;

      // Check if user exists in DB
      const res = await axios.get(`http://localhost:4000/api/customers/${uid}`);
      if (res.data.exists) {
        onLogin(user);
      } else {
        setUserInfo({ uid, displayName, email, photoURL });
        setShowPhonePrompt(true);
      }
    } catch (err) {
      console.error('❌ Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle phone number submission
  const handleSubmitPhone = async () => {
    if (!phone.trim()) return;
    setIsLoading(true);
    try {
      await axios.post('http://localhost:4000/api/customers', {
        ...userInfo,
        phone,
      });
      onLogin(userInfo);
    } catch (err) {
      console.error('❌ Failed to save customer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e6ffe6, #e6f0ff, #f0e6ff)',
    },
    card: {
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRadius: '24px',
      padding: '2rem',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center',
    },
    logo: {
      background: 'linear-gradient(to right, #4caf50, #2196f3)',
      padding: '1rem',
      borderRadius: '16px',
      marginBottom: '1.5rem',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      background: 'linear-gradient(to right, #4caf50, #2196f3)',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      marginBottom: '0.5rem',
    },
    subtitle: {
      fontSize: '16px',
      color: '#757575',
      marginBottom: '2rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      margin: '0.5rem 0',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      background: 'rgba(255, 255, 255, 0.7)',
      outline: 'none',
      fontSize: '14px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#424242',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.25rem',
    },
    button: {
      width: '100%',
      padding: '1rem',
      background: 'linear-gradient(to right, #4caf50, #2196f3)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      fontWeight: '500',
    },
    disabledButton: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    welcome: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      fontSize: '18px',
      fontWeight: '500',
      color: '#424242',
    },
    spinner: {
      width: '20px',
      height: '20px',
      animation: 'spin 1s linear infinite',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <Leaf style={{ color: 'white', width: '32px', height: '32px' }} />
        </div>
        <h1 style={styles.title}>EcoBasket</h1>
        <p style={styles.subtitle}>Sustainable Shopping Made Simple</p>

        {!showPhonePrompt ? (
          <button
            onClick={loginWithGoogle}
            disabled={isLoading}
            style={isLoading ? { ...styles.button, ...styles.disabledButton } : styles.button}
          >
            {isLoading ? (
              <svg style={styles.spinner} viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                />
              </svg>
            ) : (
              <LogIn style={{ width: '20px', height: '20px' }} />
            )}
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        ) : (
          <div>
            <div style={styles.welcome}>
              <User style={{ width: '20px', height: '20px', color: '#757575' }} />
              <span>Welcome, {userInfo.displayName}!</span>
            </div>
            <div>
              <label style={styles.label}>
                <Phone style={{ width: '16px', height: '16px' }} />
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>
            <button
              onClick={handleSubmitPhone}
              disabled={isLoading || !phone.trim()}
              style={
                isLoading || !phone.trim()
                  ? { ...styles.button, ...styles.disabledButton }
                  : styles.button
              }
            >
              {isLoading ? (
                <svg style={styles.spinner} viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="4"
                    fill="none"
                  />
                </svg>
              ) : (
                <CheckCircle style={{ width: '20px', height: '20px' }} />
              )}
              <span>{isLoading ? 'Submitting...' : 'Submit'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;