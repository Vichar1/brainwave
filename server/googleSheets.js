import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load variables in case they aren't loaded yet
dotenv.config();

/**
 * Appends registration rows to the specified Google Sheet.
 * @param {Array<Array<string>>} rows - An array of rows to push to Google Sheets.
 * Each row should map to: [Team Name, Team ID, Domain Name, Participant Name, Semester, USN, Phone No, Email, Timestamp]
 */
export async function appendToGoogleSheet(rows) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    let auth;

    // Check if the user provided the absolute path to the downloaded JSON file
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      // Fallback: Manually parse the private key from .env string
      let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
      let formattedKey = process.env.GOOGLE_PRIVATE_KEY || '';
      
      if (!clientEmail || !formattedKey || !spreadsheetId) {
        console.warn('⚠️ Google Sheets integration skipped: Missing credentials in .env');
        return false;
      }
      
      // Scrub random spaces, quotes, or trailing commas from .env copy/paste
      clientEmail = clientEmail.replace(/^["', ]+|["', ]+$/g, '').trim();
      formattedKey = formattedKey.trim();
      formattedKey = formattedKey.replace(/^["',]+|["',]+$/g, '').trim();
      // Extremely aggressive newline normalization to prevent DECODER errors
      formattedKey = formattedKey.split(String.raw`\n`).join('\n').replace(/\\n/g, '\n');

      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: formattedKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    // Clean the spreadsheetId
    // Clean the spreadsheetId
    let cleanSpreadsheetId = spreadsheetId.replace(/^["', ]+|["', ]+$/g, '').trim();
    
    // If they pasted the entire URL instead of the ID, cleanly extract it
    if (cleanSpreadsheetId.includes('docs.google.com/spreadsheets')) {
      const match = cleanSpreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        cleanSpreadsheetId = match[1];
      }
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Step 1: Request root info to dynamically detect the first available sheet's true name
    const metadata = await sheets.spreadsheets.get({ spreadsheetId: cleanSpreadsheetId });
    const firstSheetTitle = metadata.data.sheets[0].properties.title; // Safely gets "Sheet1", "Form Responses", whatever is there!

    // Step 2: Check if this sheet is completely empty (no headers)
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId: cleanSpreadsheetId,
      range: `${firstSheetTitle}!A1:I1`
    });

    // If completely empty, inject the column names as the very first row
    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      console.log('Inserting column headers into blank sheet...');
      rows.unshift([
        'Team Name', 
        'Team ID', 
        'Domain Name', 
        'Participant Name', 
        'Semester', 
        'USN', 
        'Phone No', 
        'Email', 
        'Timestamp'
      ]);
    }

    // Step 2: Append the rows exactly to that sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: cleanSpreadsheetId,
      range: firstSheetTitle,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });

    console.log(`✓ Synchronized ${rows.length} rows to Google Sheet (${firstSheetTitle})`);
    return true;
  } catch (error) {
    // We log the error but don't strictly throw it out so it doesn't crash the server.
    console.error('❌ Google Sheets Sync Error:', error.message);
    return false;
  }
}
