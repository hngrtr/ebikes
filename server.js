const express = require('express');
const path = require('path');

const app = express();
console.log("Server file started.");
const port = 8081;

app.get('/test', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});