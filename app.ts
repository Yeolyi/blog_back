import express = require('express');
import cors = require('cors');
import { convertAll } from './convert';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

convertAll();
app.use(express.static('converted'));
app.listen(process.env.PORT);
console.log(process.env.PORT);
