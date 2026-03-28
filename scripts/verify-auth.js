
require('dotenv').config();
const { google } = require('googleapis');

async function verify() {
  console.log("Verifying Auth...");
  try {
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

      console.log("Email present:", !!clientEmail);
      console.log("PF Key present:", !!privateKey);
      console.log("JSON Key present:", !!serviceAccountJson);

      let auth;

      if (serviceAccountJson) {
          console.log("Using JSON key...");
          auth = new google.auth.GoogleAuth({
              credentials: JSON.parse(serviceAccountJson),
              scopes: ["https://www.googleapis.com/auth/spreadsheets"],
          });
      } else if (clientEmail && privateKey) {
          console.log("Using Split keys...");
          auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey,
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
          });
      } else {
          throw new Error("No creds found");
      }

      const client = await auth.getClient();
      console.log("✅ Auth Client created.");
      
      const sheets = google.sheets({ version: 'v4', auth: client });
      const mainSpreadsheetId = process.env.MAIN_SPREADSHEET_ID;
      
      if (!mainSpreadsheetId) throw new Error("No Spreadsheet ID");
      console.log("Spreadsheet ID:", mainSpreadsheetId);

      // Try to read metadata
      const meta = await sheets.spreadsheets.get({
          spreadsheetId: mainSpreadsheetId
      });
      console.log("✅ Spreadsheet Title:", meta.data.properties.title);
      
      const testSheetName = "VerifyTest_" + Date.now();
      console.log("Creating sheet:", testSheetName);

      const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId: mainSpreadsheetId,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: testSheetName,
                        },
                    },
                }],
            },
      });
      console.log("✅ Created Sheet ID:", response.data.replies[0].addSheet.properties.sheetId);

  } catch (err) {
      console.error("❌ Failed:", err);
  }
}

verify();
