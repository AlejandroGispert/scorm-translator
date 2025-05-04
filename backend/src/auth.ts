import { ConfidentialClientApplication } from '@azure/msal-node';

const config = {
  auth: {
    clientId: 'YOUR_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
  },
};

const cca = new ConfidentialClientApplication(config);

export async function getAccessToken(): Promise<string> {
  const result = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });

  if (!result) throw new Error('Failed to acquire token');
  return result.accessToken;
}
