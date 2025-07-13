import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

// 📊 HistoryChart Component
function HistoryChart({ history, getScoreColor }) {
  // Calculate average score
  const averageScore =
    history.length > 0
      ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length)
      : 0;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem' }}>
        {history.map((item, index) => (
          <div
            key={index}
            style={{
              background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3))',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: getScoreColor(item.score) }}>{item.score}</div>
              <div style={{ fontSize: '14px', color: '#757575', marginTop: '0.5rem' }}>{item.name}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'linear-gradient(to right, #e6ffe6, #e6f0ff)',
          borderRadius: '8px',
          padding: '1.5rem',
          border: '1px solid #a5d6a7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#424242', marginBottom: '0.5rem' }}>Average Score</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: getScoreColor(averageScore) }}>{averageScore}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '14px', color: '#757575' }}>Keep improving!</p>
          <p style={{ fontSize: '14px', color: '#757575' }}>🌱 You're making a difference</p>
        </div>
      </div>

      {history.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#4caf50" />
          </RechartsBarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default HistoryChart;