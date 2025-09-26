console.log('Starting basic server...');

import express from 'express';

const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Basic server is working!' });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
