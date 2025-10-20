import { Client, Environment } from "@paypal/paypal-server-sdk"

function getEnvironment() {
  if (process.env.PAYPAL_ENV === "production") {
    return Environment.Production
  }
  return Environment.Sandbox
}
export const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET
  },
  environment: getEnvironment()
})