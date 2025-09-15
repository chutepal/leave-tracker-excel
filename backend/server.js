const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 3001;
const EXCEL_FILE_PATH = path.join(__dirname, 'leave-records.xlsx');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Excel file if it doesn't exist
async function initializeExcelFile() {
  try {
    const fileExists = await fs.pathExists(EXCEL_FILE_PATH);
    
    if (!fileExists) {
      console.log('Excel file not found. Creating new file...');
      
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['ID', 'EmployeeName', 'LeaveDate', 'Status', 'LeaveType', 'Comment']
      ]);
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Records');
      XLSX.writeFile(workbook, EXCEL_FILE_PATH);
      
      console.log(`Created new Excel file at: ${EXCEL_FILE_PATH}`);
    } else {
      console.log(`Excel file found at: ${EXCEL_FILE_PATH}`);
    }
  } catch (error) {
    console.error('Error initializing Excel file:', error);
  }
}

// Generate simple, URL-safe ID
function generateId(employeeName, leaveDate) {
  const cleanName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanDate = leaveDate.replace(/[^0-9]/g, '_');
  const timestamp = Date.now();
  return `${cleanName}_${cleanDate}_${timestamp}`;
}

// Read records from Excel file
async function readExcelRecords() {
  try {
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    console.log('Raw data from Excel:', rawData.length, 'records');
    
    const records = rawData
      .filter(row => row.EmployeeName && row.LeaveDate)
      .map(row => ({
        id: row.ID,
        employeeName: row.EmployeeName,
        leaveDate: row.LeaveDate,
        status: row.Status || 'Active',
        leaveType: row.LeaveType || 'Annual Leave',
        comment: row.Comment || ''
      }));
    
    console.log('Processed records:', records.length);
    return records;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return [];
  }
}

// Write records to Excel file
async function writeExcelRecords(records) {
  try {
    const excelData = records.map(record => ({
      ID: record.id,
      EmployeeName: record.employeeName,
      LeaveDate: record.leaveDate,
      Status: record.status,
      LeaveType: record.leaveType,
      Comment: record.comment
    }));

    console.log('Writing to Excel:', excelData.length, 'records');

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Records');

    worksheet['!cols'] = [
      { wch: 35 }, // ID
      { wch: 20 }, // EmployeeName
      { wch: 15 }, // LeaveDate
      { wch: 12 }, // Status
      { wch: 18 }, // LeaveType
      { wch: 50 }  // Comment
    ];

    XLSX.writeFile(workbook, EXCEL_FILE_PATH);
    console.log(`Successfully wrote ${records.length} records to Excel file`);
  } catch (error) {
    console.error('Error writing to Excel file:', error);
    throw error;
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Leave Tracker API is running',
    excelFile: EXCEL_FILE_PATH,
    timestamp: new Date().toISOString()
  });
});

// Get all leave records
app.get('/api/leave-records', async (req, res) => {
  try {
    const records = await readExcelRecords();
    res.json({
      success: true,
      data: records,
      count: records.length
    });
  } catch (error) {
    console.error('GET /api/leave-records error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read leave records from Excel file'
    });
  }
});

// Add new leave record
app.post('/api/leave-records', async (req, res) => {
  try {
    const { id, employeeName, leaveDate, leaveType, comment } = req.body;
    console.log('POST request received:', { id, employeeName, leaveDate, leaveType, comment });
    
    if (!employeeName || !leaveDate || !leaveType) {
      return res.status(400).json({
        success: false,
        error: 'Employee name, leave date, and leave type are required'
      });
    }

    const existingRecords = await readExcelRecords();
    
    const newRecord = {
      id: id || generateId(employeeName, leaveDate),
      employeeName: employeeName.trim(),
      leaveDate: leaveDate,
      status: 'Active',
      leaveType: leaveType,
      comment: comment || ''
    };

    console.log('Creating new record:', newRecord);

    const updatedRecords = [...existingRecords, newRecord];
    await writeExcelRecords(updatedRecords);
    
    res.json({
      success: true,
      data: newRecord,
      message: 'Leave record added successfully'
    });
    
  } catch (error) {
    console.error('POST /api/leave-records error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add leave record to Excel file'
    });
  }
});

// Cancel leave record (update status to Cancelled)
app.put('/api/leave-records/:id/cancel', async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    console.log('PUT cancel request for ID:', id);
    
    const existingRecords = await readExcelRecords();
    console.log('Existing record IDs:', existingRecords.map(r => r.id));
    
    const recordIndex = existingRecords.findIndex(r => r.id === id);
    console.log('Found record at index:', recordIndex);
    
    if (recordIndex === -1) {
      console.log('Record not found for ID:', id);
      return res.status(404).json({
        success: false,
        error: 'Leave record not found',
        debug: {
          searchedId: id,
          availableIds: existingRecords.map(r => r.id)
        }
      });
    }

    existingRecords[recordIndex].status = 'Cancelled';
    console.log('Updated record:', existingRecords[recordIndex]);
    
    await writeExcelRecords(existingRecords);
    
    res.json({
      success: true,
      data: existingRecords[recordIndex],
      message: 'Leave record cancelled successfully'
    });
    
  } catch (error) {
    console.error('PUT /api/leave-records/:id/cancel error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel leave record'
    });
  }
});

// Remove leave record completely
app.delete('/api/leave-records/:id', async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    console.log('DELETE request for ID:', id);
    
    const existingRecords = await readExcelRecords();
    console.log('Existing record IDs:', existingRecords.map(r => r.id));
    
    const filteredRecords = existingRecords.filter(r => r.id !== id);
    console.log('Records after filter:', filteredRecords.length);
    
    if (filteredRecords.length === existingRecords.length) {
      console.log('No record found to delete for ID:', id);
      return res.status(404).json({
        success: false,
        error: 'Leave record not found',
        debug: {
          searchedId: id,
          availableIds: existingRecords.map(r => r.id)
        }
      });
    }

    await writeExcelRecords(filteredRecords);
    
    res.json({
      success: true,
      message: 'Leave record removed successfully'
    });
    
  } catch (error) {
    console.error('DELETE /api/leave-records/:id error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove leave record'
    });
  }
});

// Start server
async function startServer() {
  await initializeExcelFile();
  
  app.listen(PORT, () => {
    console.log(`🚀 Leave Tracker API server running on http://localhost:${PORT}`);
    console.log(`📊 Excel file location: ${EXCEL_FILE_PATH}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(console.error);