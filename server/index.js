const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const OpenAI = require('openai');

// 🌍 Load environment variables
dotenv.config();

// 🌱 Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// 🔑 OpenAI Setup (SDK v4)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// 🔥 Firebase Admin Setup
admin.initializeApp({
  credential: admin.credential.cert(require('./firebase-key.json')),
});
const db = admin.firestore();

// 🛍️ Route: Add Product with AI Carbon Score
app.post('/api/products', async (req, res) => {
  try {
    const { name, weightKg, packaging, manufacturedPlace, transportMode, renewableEnergy, isOrganic } = req.body;

    const prompt = `
      Estimate the carbon score (1-100) for a product as a percentage of carbon footprint reduction, where 100 is the most sustainable:
      - Weight: ${weightKg || 'N/A'}kg
      - Packaging: ${packaging || 'none'}
      - Manufactured Place: ${manufacturedPlace || 'unknown'}
      - Transport Mode: ${transportMode || 'truck'}
      - Renewable Energy: ${renewableEnergy ? 'yes' : 'no'} (bonus for renewable energy usage)
      - Organic Certification: ${isOrganic ? 'yes' : 'no'} (bonus for organic products)
      Higher scores indicate lower carbon footprint. Consider proximity of manufacturing to customer location (assumed Chennai, India) as a positive factor.
      Respond with only the number.
    `;

    const aiRes = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const scoreText = aiRes.choices[0].message.content || '';
    const carbonScore = parseInt(scoreText.replace(/\D/g, '')) || 0;

    const doc = await db.collection('products').add({
      name,
      weightKg: weightKg || 'N/A',
      packaging,
      manufacturedPlace,
      transportMode,
      renewableEnergy: renewableEnergy || false,
      isOrganic: isOrganic || false,
      carbonScore,
    });

    res.json({ success: true, id: doc.id, carbonScore });
  } catch (err) {
    console.error('❌ Error in /api/products:', err.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// 🏠 Root Route
app.get('/', (req, res) => {
  res.send('🌱 EcoBasket API running');
});

// 🛒 Route: Calculate Cart Carbon Score
app.post('/api/cart/score', async (req, res) => {
  try {
    const { cart, customerLocation = 'Chennai, India' } = req.body;

    if (!Array.isArray(cart) || cart.length === 0 || !customerLocation) {
      return res.status(400).json({ error: 'Cart and customerLocation are required' });
    }

    const enrichedCart = cart.map(item => ({
      ...item,
      weightKg: item.weightKg || 'N/A',
      transportMode: item.transportMode || 'truck',
      renewableEnergy: item.renewableEnergy || false,
      isOrganic: item.isOrganic || false,
    }));

    const prompt = `
      You are a carbon sustainability expert.
      Evaluate this shopping cart's carbon footprint reduction score (1-100), where 100 is the most sustainable:
      - Product weight (can be 'N/A')
      - Packaging material
      - Manufactured Place
      - Customer location: ${customerLocation}
      - Transport mode (e.g., truck, train, ship, air)
      - Renewable energy usage (bonus for yes)
      - Organic certification (bonus for yes)
      - Proximity of manufacturing to customer location as a positive factor
      Return strictly:
      Score: <number between 1–100>
      Reason: <short explanation>
      Cart:
      ${JSON.stringify(enrichedCart, null, 2)}
    `;

    const aiRes = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat:free',
      messages: [
        { role: 'system', content: 'Only respond in this format: Score: <number> Reason: <text>. No markdown or extra text.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    });

    const content = aiRes.choices[0].message.content;
    console.log('📊 AI SCORE RESPONSE:', content);

    const scoreMatch = content.match(/Score:\s*(\d+)/);
    const reasonMatch = content.match(/Reason:\s*(.+)/);

    const score = parseInt(scoreMatch?.[1]);
    const reason = reasonMatch?.[1]?.trim();

    if (!score || isNaN(score)) {
      return res.status(500).json({ error: 'AI failed to provide a valid score.' });
    }

    res.json({ success: true, score, reason: reason || 'No explanation provided by AI.' });
  } catch (err) {
    console.error('❌ Error in /api/cart/score:', err.message);
    res.status(500).json({ error: 'Something went wrong while scoring.' });
  }
});

// ♻️ Route: Suggest Greener Product Swaps
app.post('/api/cart/swaps', async (req, res) => {
  try {
    const { cart, products, customerLocation = 'Chennai, India' } = req.body;

    if (!Array.isArray(cart) || !Array.isArray(products) || !customerLocation) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const enrichedCart = cart.map(item => ({
      ...item,
      weightKg: item.weightKg || 'N/A',
      transportMode: item.transportMode || 'truck',
      renewableEnergy: item.renewableEnergy || false,
      isOrganic: item.isOrganic || false,
    }));

    const enrichedProducts = products.map(item => ({
      ...item,
      weightKg: item.weightKg || 'N/A',
      transportMode: item.transportMode || 'truck',
      renewableEnergy: item.renewableEnergy || false,
      isOrganic: item.isOrganic || false,
    }));

    const prompt = `
      You are a sustainability expert.
      Suggest greener swaps (if any) for the following grocery cart:
      - Packaging
      - Product weight ('N/A' means not applicable)
      - Manufactured Place
      - Customer location: ${customerLocation}
      - Transport method (e.g., truck, train, ship, air)
      - Renewable energy usage
      - Organic certification
      - Proximity of manufacturing to customer location as a positive factor
      If no better alternative exists, return null for that item.
      Output format (STRICT):
      [
        { "original": "Product Name", "suggested": "Alternative Name" or null, "reason": "Why it's greener" }
      ]
      Cart:
      ${JSON.stringify(enrichedCart, null, 2)}
      Alternatives:
      ${JSON.stringify(enrichedProducts, null, 2)}
    `;

    const aiRes = await openai.chat.completions.create({
      model: 'deepseek/deepseek-chat:free',
      messages: [
        { role: 'system', content: 'Return only a JSON array. No extra explanation or formatting.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    const content = aiRes.choices[0].message.content || '';
    const jsonArrayMatch = content.match(/\[\s*{[\s\S]*?}\s*\]/);

    if (!jsonArrayMatch) throw new Error('No valid JSON array found in AI response.');

    const swaps = JSON.parse(jsonArrayMatch[0]);
    res.json({ success: true, swaps });
  } catch (err) {
    console.error('❌ Error in /api/cart/swaps:', err.message);
    res.status(500).json({ error: 'Could not extract JSON array from AI response.' });
  }
});

// 📜 Route: Save Cart History
app.post('/api/history', async (req, res) => {
  try {
    const { cart, score, user, id } = req.body;

    await db.collection('history').doc(id).set({
      cart,
      score,
      uid: user?.uid || 'anon',
      email: user?.email || 'unknown',
      timestamp: Date.now(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ History Save Error:', err.message);
    res.status(500).json({ error: 'Could not save history' });
  }
});

// 📜 Route: Fetch Cart History
app.get('/api/history', async (req, res) => {
  try {
    const uid = req.query.uid;
    const snapshot = await db.collection('history').where('uid', '==', uid).get();

    const history = snapshot.docs.map(doc => doc.data());
    res.json({ success: true, history });
  } catch (err) {
    console.error('❌ History Fetch Error:', err.message);
    res.status(500).json({ error: 'Could not fetch history' });
  }
});

// 👤 Route: Save Customer Data
app.post('/api/customers', async (req, res) => {
  try {
    const { uid, displayName, email, phone, photoURL } = req.body;

    await db.collection('customers').doc(uid).set({
      name: displayName,
      email,
      phone,
      photoURL,
      createdAt: Date.now(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Customer Save Error:', err.message);
    res.status(500).json({ error: 'Could not save customer' });
  }
});

// 👤 Route: Fetch Customer Data
app.get('/api/customers/:uid', async (req, res) => {
  try {
    const doc = await db.collection('customers').doc(req.params.uid).get();
    if (!doc.exists) return res.json({ exists: false });
    res.json({ exists: true, data: doc.data() });
  } catch (err) {
    console.error('❌ Customer Fetch Error:', err.message);
    res.status(500).json({ error: 'Could not fetch customer' });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🌱 Server running at http://localhost:${PORT}`);
});