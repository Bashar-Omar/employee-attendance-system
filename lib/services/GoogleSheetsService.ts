import { google } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

export class GoogleSheetsService {
  private static async getAuth() {
    try {
      // Priority 1: GOOGLE_SERVICE_ACCOUNT_KEY (JSON string)
      const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
      
      if (credentialsJson) {
        return new google.auth.GoogleAuth({
          credentials: JSON.parse(credentialsJson),
          scopes: SCOPES,
        })
      }

      // Priority 2: Split variables
      const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") // Handle escaped newlines

      if (clientEmail && privateKey) {
          return new google.auth.GoogleAuth({
              credentials: {
                  client_email: clientEmail,
                  private_key: privateKey,
              },
              scopes: SCOPES,
          })
      }

      throw new Error("Google Credentials not found. Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY.")

    } catch (error) {
       console.error("Google Sheets Auth Error:", error)
       return null
    }
  }

  static async createEmployeeSheet(employeeName: string): Promise<string | null> {
    const auth = await this.getAuth()
    if (!auth) return null

    const sheets = google.sheets({ version: "v4", auth })
    const mainSpreadsheetId = process.env.MAIN_SPREADSHEET_ID

    if (!mainSpreadsheetId) {
         console.error("MAIN_SPREADSHEET_ID not set.")
         return null
    }

    try {
        // Check if sheet exists or create new tab associated with logic?
        // Actually, requirement says "Each EMPLOYEE gets their own sheet (tab)" in "One main Google Spreadsheet".
        // So we add a Sheet (Tab) to the Main Spreadsheet.
        
        const response = await sheets.spreadsheets.batchUpdate({
            spreadsheetId: mainSpreadsheetId,
            requestBody: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: employeeName,
                        },
                    },
                }],
            },
        })

        const properties = response.data.replies?.[0]?.addSheet?.properties
        if (properties?.sheetId) {
             // We initiate headers
             await sheets.spreadsheets.values.append({
                 spreadsheetId: mainSpreadsheetId,
                 range: `${employeeName}!A1`,
                 valueInputOption: "USER_ENTERED",
                 requestBody: {
                     values: [["Date", "Check-In", "Check-Out", "Location Status", "Total Hours"]],
                 },
             })
             // We might return the sheetId or Title. 
             // Ideally we store the 'title' (Sheet Name) in user record? Or ID.
             // Storing Title is safer for referencing in 'range'.
             return employeeName
        }
        return null

    } catch (error: any) {
        console.error("Failed to create sheet for employee:", (error as Error).message)
        // If sheet already exists (400 probably), we can assume it's fine or handle unique naming.
        // For now, logging error.
        return null
    }
  }

  static async logAttendance(sheetTitle: string, data: any[]) {
      const auth = await this.getAuth()
      if (!auth) return
      const sheets = google.sheets({ version: "v4", auth })
      const mainSpreadsheetId = process.env.MAIN_SPREADSHEET_ID

       try {
            await sheets.spreadsheets.values.append({
                 spreadsheetId: mainSpreadsheetId,
                 range: `${sheetTitle}!A1`, // Appends to table
                 valueInputOption: "USER_ENTERED",
                 requestBody: {
                     values: [data],
                 },
             })
       } catch (error) {
           console.error(`Failed to log attendance for ${sheetTitle}:`, error)
       }
  }
}
