import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import {
  ShoppingCart,
  Plus,
  Leaf,
  TrendingUp,
  BarChart3,
  LogOut,
  User,
  Package,
  Truck,
  MapPin,
  Weight,
  Recycle,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import HistoryChart from './HistoryChart';

// 🎨 Dashboard Component - Constants and Styles
const DISCOUNT_THRESHOLDS = {
  HIGH: { min: 80, discount: 20 }, // 20% discount for score 80+
  MEDIUM: { min: 60, max: 79, discount: 10 }, // 10% discount for score 60-79
  LOW: { max: 59, discount: 5 }, // 5% discount for score below 60
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e6ffe6, #e6f0ff, #f0e6ff)',
    padding: '2rem',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(5px)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  headerContent: { maxWidth: '1200px', margin: '0 auto', padding: '1rem' },
  tabNav: {
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(5px)',
    padding: '0.5rem',
    borderRadius: '16px',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  tabButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  activeTab: {
    background: 'linear-gradient(to right, #4caf50, #2196f3)',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  formContainer: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(5px)',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    margin: '0.5rem 0',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.7)',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    margin: '0.5rem 0',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.7)',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    margin: '0.5rem 0',
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
  disabledButton: { opacity: 0.5, cursor: 'not-allowed' },
  cartItem: {
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'background 0.2s',
    marginBottom: '1rem',
  },
  removeButton: { color: '#d32f2f', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', background: 'none', border: 'none' },
  scoreDisplay: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(5px)',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    textAlign: 'center',
  },
  swapCard: {
    background: 'linear-gradient(to right, #e6ffe6, #e6f0ff)',
    borderRadius: '8px',
    padding: '1.5rem',
    border: '1px solid #a5d6a7',
    margin: '1rem 0',
  },
  historyCard: {
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(5px)',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  discountText: { color: '#2e7d32', fontWeight: 'bold', marginTop: '0.5rem' },
};

// 🎨 Dashboard Component - State and Handlers
function Dashboard({ user }) {
  const [cart, setCart] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({
    name: '',
    weightKg: '',
    packaging: '',
    manufacturedPlace: '',
    transportMode: '',
    renewableEnergy: false,
    isOrganic: false,
  });
  const [customerLocation, setCustomerLocation] = useState('Chennai, India');
  const [score, setScore] = useState(null);
  const [swaps, setSwaps] = useState([]);
  const [activeTab, setActiveTab] = useState('cart');
  const [isLoading, setIsLoading] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Add item to cart with discount
  const handleAddItem = () => {
    if (!form.name.trim()) return;
    const parsedWeight =
      form.weightKg.trim().toLowerCase() === 'n/a' || form.weightKg === ''
        ? 'N/A'
        : parseFloat(form.weightKg);
    const newItem = { ...form, weightKg: parsedWeight, id: Date.now() };
    setCart([...cart, newItem]);
    setForm({
      name: '',
      weightKg: '',
      packaging: '',
      manufacturedPlace: '',
      transportMode: '',
      renewableEnergy: false,
      isOrganic: false,
    });
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // Calculate discount based on carbon score
  const calculateDiscount = (score) => {
    if (score >= DISCOUNT_THRESHOLDS.HIGH.min) return DISCOUNT_THRESHOLDS.HIGH.discount;
    if (score >= DISCOUNT_THRESHOLDS.MEDIUM.min && score <= DISCOUNT_THRESHOLDS.MEDIUM.max)
      return DISCOUNT_THRESHOLDS.MEDIUM.discount;
    if (score <= DISCOUNT_THRESHOLDS.LOW.max) return DISCOUNT_THRESHOLDS.LOW.discount;
    return 0;
  };

  // Fetch AI insights
  const handleGetInsights = async () => {
    setIsLoading(true);
    try {
      const scoreRes = await axios.post('http://localhost:4000/api/cart/score', {
        cart,
        customerLocation,
      });
      setScore(scoreRes.data);

      const allProducts = [
        {
          name: 'Indian Apple',
          weightKg: 0.4,
          packaging: 'paper',
          manufacturedPlace: 'India',
          transportMode: 'Truck',
          renewableEnergy: true,
          isOrganic: true,
        },
        {
          name: 'Tomato',
          weightKg: 0.5,
          packaging: 'plastic',
          manufacturedPlace: 'India',
          transportMode: 'Truck',
          renewableEnergy: false,
          isOrganic: false,
        },
      ];

      const swapRes = await axios.post('http://localhost:4000/api/cart/swaps', {
        cart,
        products: allProducts,
        customerLocation,
      });
      setSwaps(swapRes.data.swaps);

      await axios.post('http://localhost:4000/api/history', {
        cart,
        score: scoreRes.data.score,
        user: { uid: user?.uid, email: user?.email },
        id: uuidv4(),
      });
    } catch (err) {
      console.error('❌ AI Error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user history
  useEffect(() => {
    if (!user) return;
    axios
      .get('http://localhost:4000/api/history', { params: { uid: user.uid } })
      .then((res) => {
        setHistory(
          res.data.history.map((h, i) => ({
            name: `Cart ${i + 1}`,
            score: h.score,
          }))
        );
      })
      .catch((err) => console.error('❌ History Fetch Error:', err.message));
  }, [score, user]);

  // Score color utilities
  const getScoreColor = (score) => {
    if (score >= 80) return '#2e7d32';
    if (score >= 60) return '#f4a261';
    return '#d32f2f';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'linear-gradient(to right, #a5d6a7, #4caf50)';
    if (score >= 60) return 'linear-gradient(to right, #ffe082, #ffca28)';
    return 'linear-gradient(to right, #ef9a9a, #f44336)';
  };

  // 🎨 Dashboard Component - Render
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'linear-gradient(to right, #4caf50, #2196f3)', padding: '0.5rem', borderRadius: '8px' }}>
                <Leaf style={{ color: 'white', width: '24px', height: '24px' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(to right, #4caf50, #2196f3)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                  EcoBasket
                </h1>
                <p style={{ fontSize: '14px', color: '#757575' }}>Sustainable Shopping with Discounts</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '999px', padding: '0.5rem 1rem' }}>
                <User style={{ width: '20px', height: '20px', color: '#757575' }} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{user.displayName}</span>
              </div>
              <button
                onClick={() => signOut(auth)}
                style={{ padding: '0.5rem', borderRadius: '999px', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <LogOut style={{ width: '20px', height: '20px', color: '#d32f2f' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Tab Navigation */}
        <div style={styles.tabNav}>
          {[
            { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart },
            { id: 'insights', label: 'Eco Insights', icon: TrendingUp },
            { id: 'history', label: 'History', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={
                activeTab === tab.id
                  ? { ...styles.tabButton, ...styles.activeTab }
                  : styles.tabButton
              }
            >
              <tab.icon style={{ width: '20px', height: '20px' }} />
              <span style={{ fontWeight: '500' }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Cart Tab */}
        {activeTab === 'cart' && (
          <div style={{ marginTop: '2rem' }}>
            {/* Add Item Form */}
            <div style={styles.formContainer}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(to right, #4caf50, #2196f3)', padding: '0.5rem', borderRadius: '8px' }}>
                  <Plus style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#424242' }}>Add Item to Cart</h2>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#424242', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Package style={{ width: '16px', height: '16px' }} />
                  Product Name
                </label>
                <input
                  name="name"
                  placeholder="e.g., Organic Apples"
                  value={form.name}
                  onChange={handleChange}
                  style={styles.input}
                />

                <label style={{ fontSize: '14px', fontWeight: '500', color: '#424242', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Weight style={{ width: '16px', height: '16px' }} />
                  Weight (kg)
                </label>
                <input
                  name="weightKg"
                  placeholder="0.5 or N/A"
                  value={form.weightKg}
                  onChange={handleChange}
                  style={styles.input}
                />

                <label style={{ fontSize: '14px', fontWeight: '500', color: '#424242', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Package style={{ width: '16px', height: '16px' }} />
                  Packaging
                </label>
                <select
                  name="packaging"
                  value={form.packaging}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select packaging</option>
                  <option value="plastic">Plastic</option>
                  <option value="paper">Paper</option>
                  <option value="cardboard">Cardboard</option>
                  <option value="none">No packaging</option>
                </select>

                <label style={{ fontSize: '14px', fontWeight: '500', color: '#424242', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <MapPin style={{ width: '16px', height: '16px' }} />
                  Manufactured Place
                </label>
                <input
                  name="manufacturedPlace"
                  placeholder="e.g., India"
                  value={form.manufacturedPlace}
                  onChange={handleChange}
                  style={styles.input}
                />

                <label style={{ fontSize: '14px', fontWeight: '500', color: '#424242', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Truck style={{ width: '16px', height: '16px' }} />
                  Transport Mode
                </label>
                <select
                  name="transportMode"
                  value={form.transportMode}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select transport</option>
                  <option value="truck">Truck</option>
                  <option value="train">Train</option>
                  <option value="ship">Ship</option>
                  <option value="air">Air</option>
                </select>

                <label style={{ fontSize: '14px', fontWeight: '500', color: '#424242', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <MapPin style={{ width: '16px', height: '16px' }} />
                  Your Location
                </label>
                <input
                  placeholder="Chennai, India"
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  style={styles.input}
                />

                <div style={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    name="renewableEnergy"
                    checked={form.renewableEnergy}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label style={{ fontSize: '14px', color: '#424242' }}>Renewable Energy</label>
                </div>

                <div style={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    name="isOrganic"
                    checked={form.isOrganic}
                    onChange={handleChange}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label style={{ fontSize: '14px', color: '#424242' }}>Organic Certification</label>
                </div>

                <button
                  onClick={handleAddItem}
                  disabled={!form.name.trim()}
                  style={
                    !form.name.trim()
                      ? { ...styles.button, ...styles.disabledButton }
                      : styles.button
                  }
                >
                  <Plus style={{ width: '20px', height: '20px' }} />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>

            {/* Cart Items with Discounts */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={styles.formContainer}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#424242', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShoppingCart style={{ width: '24px', height: '24px' }} />
                    Your Cart ({cart.length})
                  </h3>
                  {cart.length > 0 && (
                    <button
                      onClick={handleGetInsights}
                      disabled={isLoading}
                      style={
                        isLoading
                          ? { ...styles.button, ...styles.disabledButton }
                          : styles.button
                      }
                    >
                      {isLoading ? (
                        <svg
                          style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}
                          viewBox="0 0 24 24"
                        >
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
                        <Sparkles style={{ width: '16px', height: '16px' }} />
                      )}
                      <span>{isLoading ? 'Analyzing...' : 'Get Insights'}</span>
                    </button>
                  )}
                </div>

                <div style={{ marginTop: '1rem' }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#757575' }}>
                      <ShoppingCart style={{ width: '64px', height: '64px', margin: '0 auto 1rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '18px' }}>Your cart is empty</p>
                      <p style={{ fontSize: '14px' }}>Add some items to get started!</p>
                    </div>
                  ) : (
                    <>
                      {cart.map((item) => {
                        const itemScore = score?.cartScores?.find((s) => s.name === item.name)?.score || 50; // Default score if not calculated
                        const discount = calculateDiscount(itemScore);
                        return (
                          <div key={item.id} style={styles.cartItem} onMouseOver={{ background: 'rgba(255, 255, 255, 0.8)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                              <div>
                                <h4 style={{ fontWeight: '500', color: '#424242' }}>{item.name}</h4>
                                <div style={{ fontSize: '14px', color: '#757575', marginTop: '0.5rem' }}>
                                  <p>Weight: {item.weightKg}kg</p>
                                  <p>From: {item.manufacturedPlace}</p>
                                  <p>Packaging: {item.packaging}</p>
                                </div>
                              </div>
                              <div>
                                <button onClick={() => removeFromCart(item.id)} style={styles.removeButton}>
                                  <X style={{ width: '20px', height: '20px' }} />
                                </button>
                                {discount > 0 && (
                                  <p style={styles.discountText}>
                                    Discount: {discount}% (Walmart/DMart Offer)
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#2e7d32' }}>
                          Total Discount: {score ? Math.round(cart.reduce((sum, item) => sum + calculateDiscount(score?.cartScores?.find((s) => s.name === item.name)?.score || 50) / 100, 0)) : 0}%
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div style={{ marginTop: '2rem' }}>
            {/* Score Display */}
            {score && (
              <div style={styles.scoreDisplay}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div
                      style={{
                        fontSize: '48px',
                        fontWeight: 'bold',
                        background: getScoreGradient(score.score),
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                      }}
                    >
                      {score.score}
                    </div>
                    <div style={{ fontSize: '24px', color: '#757575', marginLeft: '0.5rem' }}>/100</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    {score.score >= 80 ? (
                      <CheckCircle style={{ width: '32px', height: '32px', color: '#2e7d32', marginRight: '0.5rem' }} />
                    ) : (
                      <AlertCircle style={{ width: '32px', height: '32px', color: '#f4a261', marginRight: '0.5rem' }} />
                    )}
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#424242' }}>
                      {score.score >= 80 ? 'Excellent!' : score.score >= 60 ? 'Good!' : 'Needs Improvement'}
                    </h3>
                  </div>

                  <p style={{ fontSize: '18px', color: '#757575', maxWidth: '800px', margin: '0 auto' }}>{score.reason}</p>

                  <div style={{ marginTop: '1.5rem', background: '#e0e0e0', borderRadius: '999px', height: '16px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: getScoreGradient(score.score),
                        width: `${score.score}%`,
                        transition: 'width 1s',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Swaps */}
            {swaps.length > 0 && (
              <div style={styles.formContainer}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'linear-gradient(to right, #4caf50, #2196f3)', padding: '0.5rem', borderRadius: '8px' }}>
                    <Recycle style={{ color: 'white', width: '24px', height: '24px' }} />
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#424242' }}>Greener Alternatives</h3>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  {swaps.map((swap, index) => (
                    <div key={index} style={styles.swapCard}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ fontSize: '18px', fontWeight: '500', color: '#424242' }}>{swap.original}</div>
                          <ChevronRight style={{ width: '20px', height: '20px', color: '#757575' }} />
                          <div style={{ fontSize: '18px', fontWeight: '500', color: '#2e7d32' }}>{swap.suggested || 'No alternative'}</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '14px', color: '#757575' }}>{swap.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div style={styles.historyCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'linear-gradient(to right, #4caf50, #2196f3)', padding: '0.5rem', borderRadius: '8px' }}>
                <BarChart3 style={{ color: 'white', width: '24px', height: '24px' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#424242' }}>Your Sustainability Journey</h3>
            </div>

            <HistoryChart history={history} getScoreColor={getScoreColor} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;