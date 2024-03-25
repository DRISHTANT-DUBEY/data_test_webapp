const express = require('express');
const multer = require('multer');
const cors = require('cors');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3003; 
// Enable CORS for requests from your React application
app.use(cors());

function validateUserID(userID) {
  if (typeof userID !== 'number' || userID <= 0) {
      return 'User ID must be a positive number.';
  }
}

function validateFirstName(firstName) {
  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
      return 'First Name is required.';
  }
}

function validateLastName(lastName) {
  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
      return 'Last Name is required.';
  }
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
      return 'Email is invalid.';
  }
}

function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
  if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      return 'Phone Number is invalid. Expected format: XXX-XXX-XXXX';
  }
}

function validateDateOfBirth(dateOfBirth) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || isNaN(new Date(dateOfBirth).getTime())) {
      return 'Date of Birth is invalid. Expected format: YYYY-MM-DD';
  }
}

function validateMembershipStatus(membershipStatus) {
  const validStatuses = ['Active', 'Inactive'];
  if (!validStatuses.includes(membershipStatus)) {
      return 'Membership Status is invalid. Expected: Active or Inactive';
  }
}



// Configure Multer (DiskStorage)
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.xlsx');
  }
});

const upload = multer({ storage: storage });
const { Client } = require('pg');

require('dotenv').config();

const client = new Client({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    port: process.env.PG_PORT,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE
});
 client.connect();
  app.use(express.static('public'));
  app.post('/upload', upload.single('file'), async (req, res) => {
    const workbook = xlsx.readFile(req.file.path);
    const sheetNames = workbook.SheetNames;
    const sheet = workbook.Sheets[sheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
  
    const errors = [];
    const validatedRows = [];

    data.forEach((row, index) => {
        const errorMessages = [
            validateUserID(row['User ID']),
            validateFirstName(row['First Name']),
            validateLastName(row['Last Name']),
            validateEmail(row.Email),
            validatePhoneNumber(row['Phone Number']),
            validateDateOfBirth(row['Date of Birth']),
            validateMembershipStatus(row['Membership Status'])
        ].filter(error => error);

        if (errorMessages.length) {
            errors.push({ row: index + 1, errors: errorMessages });
        } else {
            validatedRows.push(row);
        }
    });
    if (errors.length > 0) {
        // Create a new workbook and worksheet
        const errorWorkbook = xlsx.utils.book_new();
        const errorWorksheetData = [["Row", "Errors"]]; // Headers
    
        // Populate the worksheet
        errors.forEach(error => {
            // Assuming each error object has a 'row' and 'errors' array
            error.errors.forEach(err => {
                errorWorksheetData.push([`Row ${error.row}`, err]);
            });
        });
    
        const errorWorksheet = xlsx.utils.aoa_to_sheet(errorWorksheetData);
        xlsx.utils.book_append_sheet(errorWorkbook, errorWorksheet, "Errors");
    
        // Write the workbook to a buffer
        const errorsDirPath = path.join(__dirname, 'public', 'errors');

        // Check if the directory exists, if not, create it
        if (!fs.existsSync(errorsDirPath)){
            fs.mkdirSync(errorsDirPath, { recursive: true });
        }
        const filePath = path.join(errorsDirPath, `validation_errors_${Date.now()}.xlsx`);

        // Write the workbook to a file
        xlsx.writeFile(errorWorkbook, filePath);


        const downloadLink = `${req.protocol}://${req.get('host')}/errors/${path.basename(filePath)}`;

        // Prepare a combined response including the success message and the download link for the error file
        const responseMessage = {
            message: 'Data partially inserted. Some rows contained errors.',
            downloadLink: downloadLink
        };

        console.log(res.status(200).json(responseMessage));
    } else {
        console.log("All rows validated successfully.");
    }

// Proceed with inserting `validatedRows` into the database...

try {
    await Promise.all(validatedRows.map(row => {
      return new Promise((resolve, reject) => {
          const query = 'INSERT INTO users(user_id, first_name, last_name, email, phone_number, date_of_birth, membership_status) VALUES($1, $2, $3, $4, $5, $6, $7)';
          const values = [row['User ID'], row['First Name'], row['Last Name'], row.Email, row['Phone Number'], row['Date of Birth'], row['Membership Status']];
          client.query(query, values, (err, queryResult) => {
              if (err) {
                  reject(err);
              } else {
                  resolve(queryResult);
              }
          });
      });
  }));
    res.send('Data inserted successfully');
} catch (err) {
    console.error('Database insertion error:', err.message);
    if (!res.headersSent) {
      res.status(500).send('Failed to insert data into the database: ' + err.message);
    }
}
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

