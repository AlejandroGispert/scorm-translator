import { ConfidentialClientApplication } from '@azure/msal-node';

import dotenv from 'dotenv'
dotenv.config();

const config = {
  auth: {
    authority: `https://login.microsoftonline.com/${process.env.MS_AUTHORITY}`,
    clientId: process.env.MS_CLIENT_ID!,
    clientSecret:  process.env.MS_CLIENT_SECRET,
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
