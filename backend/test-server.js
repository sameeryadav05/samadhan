import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

console.log('Environment variables loaded:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');
console.log('HF_TOKEN:', process.env.HF_TOKEN ? 'set' : 'not set');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'set' : 'not set');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
