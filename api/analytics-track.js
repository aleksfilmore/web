export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, data } = req.body;
    
    // Log the analytics event (you can enhance this to send to your analytics service)
    console.log('Analytics Event:', {
      event,
      data,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Event tracked successfully',
      event: event
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ 
      error: 'Failed to track event',
      message: error.message 
    });
  }
}