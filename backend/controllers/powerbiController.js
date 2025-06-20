import axios from "axios";
import "dotenv/config";

const getPowerBIAccessToken = async () => {
  try {
    const tenantId = process.env.POWERBI_TENANT_ID;
    const clientId = process.env.POWERBI_CLIENT_ID;
    const clientSecret = process.env.POWERBI_CLIENT_SECRET;
    
    console.log('Tenant ID:', tenantId?.substring(0, 3) + '...');
    console.log('Client ID:', clientId?.substring(0, 3) + '...');
    console.log('Client Secret:', clientSecret ? 'Provided' : 'Missing');
    console.log('Workspace ID:', process.env.POWERBI_WORKSPACE_ID?.substring(0, 3) + '...');
    
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;
    
    const tokenResponse = await axios.post(tokenEndpoint, 
      new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': clientId,
        'client_secret': clientSecret,
        'resource': 'https://analysis.windows.net/powerbi/api'
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return tokenResponse.data.access_token;
  } catch (error) {
    console.error('Error getting Power BI access token:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const getEmbedToken = async (req, res) => {
  const useMockData = !process.env.POWERBI_TENANT_ID || 
                     process.env.POWERBI_TENANT_ID === "your-tenant-id";
  
  if (useMockData) {
    console.log('Using mock data for embed token');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return res.json({
      embedToken: "mock-embed-token-for-testing-purposes-only",
      embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${req.params.reportId}&groupId=mock-workspace-id`,
      reportId: req.params.reportId
    });
  }
  
  try {
    const accessToken = await getPowerBIAccessToken();
    const workspaceId = process.env.POWERBI_WORKSPACE_ID;
    const reportId = req.params.reportId;
    
    const tokenEndpoint = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`;
    
    const tokenResponse = await axios.post(tokenEndpoint, {
      accessLevel: 'View'
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      embedToken: tokenResponse.data.token,
      embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${workspaceId}`,
      reportId
    });
  } catch (error) {
    console.error('Error generating embed token:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to generate embed token' });
  }
};

export const getReports = async (req, res) => {
  const useMockData = !process.env.POWERBI_TENANT_ID || 
                     process.env.POWERBI_TENANT_ID === "your-tenant-id";
  
  if (useMockData) {
    console.log('Using mock data for reports');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return res.json([
      {
        id: "mock-report-1",
        name: "Food Sales Analysis",
        webUrl: "https://app.powerbi.com/reports/mock-report-1",
        embedUrl: "https://app.powerbi.com/reportEmbed?reportId=mock-report-1",
        datasetId: "mock-dataset-1"
      },
      {
        id: "mock-report-2",
        name: "Customer Insights Dashboard",
        webUrl: "https://app.powerbi.com/reports/mock-report-2",
        embedUrl: "https://app.powerbi.com/reportEmbed?reportId=mock-report-2",
        datasetId: "mock-dataset-2"
      },
      {
        id: "mock-report-3",
        name: "Delivery Performance Metrics",
        webUrl: "https://app.powerbi.com/reports/mock-report-3",
        embedUrl: "https://app.powerbi.com/reportEmbed?reportId=mock-report-3",
        datasetId: "mock-dataset-3"
      }
    ]);
  }
  
  try {
    const accessToken = await getPowerBIAccessToken();
    const workspaceId = process.env.POWERBI_WORKSPACE_ID;
    
    const reportsEndpoint = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports`;
    
    const reportsResponse = await axios.get(reportsEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    res.json(reportsResponse.data.value);
  } catch (error) {
    console.error('Error fetching reports:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};