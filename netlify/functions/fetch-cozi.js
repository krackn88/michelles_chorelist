const fetch = require('node-fetch');
const ical = require('ical');

exports.handler = async (event) => {
  // CORS headers to allow requests from any origin
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }
  
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { url } = event.queryStringParameters;

  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing Cozi URL parameter' }),
    };
  }

  try {
    // Enhanced headers to appear more like a browser request
    const fetchHeaders = {
      'Accept': 'text/calendar,application/calendar+xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://www.cozi.com/'
    };
    
    // Try multiple approaches if needed
    let response;
    let icalData;
    
    // First attempt - direct fetch
    try {
      console.log('Attempting direct fetch from Cozi...');
      response = await fetch(url, { headers: fetchHeaders });
      
      if (!response.ok) {
        if (response.status === 403) {
          console.log('Received 403 from direct fetch. Trying with proxy...');
          throw new Error('Forbidden, will try proxy');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      icalData = await response.text();
    } catch (directError) {
      // Second attempt - try with a proxy
      console.log('Trying with proxy...');
      
      // List of potential proxies to try
      const proxies = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url='
      ];
      
      let proxySuccess = false;
      
      for (const proxyUrl of proxies) {
        try {
          const proxyResponse = await fetch(`${proxyUrl}${encodeURIComponent(url)}`, {
            headers: fetchHeaders
          });
          
          if (proxyResponse.ok) {
            icalData = await proxyResponse.text();
            proxySuccess = true;
            console.log(`Successfully fetched with proxy: ${proxyUrl}`);
            break;
          }
        } catch (proxyError) {
          console.log(`Proxy fetch failed with ${proxyUrl}:`, proxyError.message);
        }
      }
      
      if (!proxySuccess) {
        throw new Error('Failed to fetch data with all available methods');
      }
    }
    
    // Make sure we have iCal data to parse
    if (!icalData || !icalData.includes('BEGIN:VCALENDAR')) {
      throw new Error('Invalid iCalendar data received');
    }

    // Parse iCal data
    const parsedData = ical.parseICS(icalData);
    
    // Transform data into a more convenient format
    const events = Object.values(parsedData)
      .filter(item => item.type === 'VEVENT')
      .map(event => ({
        id: event.uid,
        summary: event.summary,
        description: event.description || '',
        location: event.location || '',
        start: event.start ? event.start.toISOString() : null,
        end: event.end ? event.end.toISOString() : null,
        allDay: !event.start || !event.start.getHours(),
        categories: event.categories || []
      }));

    // Log success and return events
    console.log(`Successfully parsed ${events.length} events from Cozi`);
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(events)
    };
  } catch (error) {
    console.error('Error fetching Cozi calendar:', error);
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch Cozi calendar data',
        details: error.message
      })
    };
  }
};