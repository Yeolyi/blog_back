import express = require('express');
import cors = require('cors');
import { convertAll } from './convert';

const app = express();
app.use(cors());

convertAll();
app.use(express.static('converted'));
app.listen(3000);
