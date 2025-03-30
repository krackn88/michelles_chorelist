const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for Cozi calendar
app.get('/api/proxy/cozi', async (req, res) => {
  const coziUrl = req.query.url;
  
  if (!coziUrl) {
    return res.status(400).json({ error: 'Missing Cozi URL parameter' });
  }
  
  try {
    const response = await axios.get(coziUrl, {
      headers: {
        'Accept': 'text/calendar',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      responseType: 'text'
    });
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/calendar');
    res.send(response.data);
  } catch (error) {
    console.error('Error proxying Cozi request:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Cozi calendar data',
      details: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});