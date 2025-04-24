const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Blockchain } = require('./blockchain');

const app = express();
const port = 3000;

// Initialize blockchain
const studentRecordChain = new Blockchain();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Add a new student record
app.post('/api/records', (req, res) => {
    try {
        const { studentName, studentId, courseDetails, grades } = req.body;
        
        const recordData = {
            studentName,
            studentId,
            courseDetails,
            grades,
            timestamp: new Date().toISOString()
        };

        studentRecordChain.addBlock(recordData);
        
        res.json({
            message: 'Record added successfully',
            blockHash: studentRecordChain.getLatestBlock().hash
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all records
app.get('/api/records', (req, res) => {
    res.json(studentRecordChain.getAllBlocks());
});

// Get a specific record by hash
app.get('/api/records/:hash', (req, res) => {
    const block = studentRecordChain.getBlock(req.params.hash);
    if (block) {
        res.json(block);
    } else {
        res.status(404).json({ error: 'Record not found' });
    }
});

// Delete a record by hash
app.delete('/api/records/:hash', (req, res) => {
    try {
        const hash = req.params.hash;
        const blockIndex = studentRecordChain.chain.findIndex(block => block.hash === hash);
        
        if (blockIndex === -1) {
            return res.status(404).json({ error: 'Record not found' });
        }
        
        // Don't allow deletion of genesis block
        if (blockIndex === 0) {
            return res.status(400).json({ error: 'Cannot delete genesis block' });
        }
        
        // Remove the block from the chain
        studentRecordChain.chain.splice(blockIndex, 1);
        
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify chain integrity
app.get('/api/verify', (req, res) => {
    res.json({
        isValid: studentRecordChain.isChainValid(),
        blockCount: studentRecordChain.chain.length
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 