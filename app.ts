import express = require('express');
import cors = require('cors');
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

app.use(express.static('converted'));
app.listen(process.env.PORT);
console.log(process.env.PORT);
