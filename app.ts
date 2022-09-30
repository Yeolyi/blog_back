import express = require('express');
import { convertAll } from './convert';

const app = express();
convertAll();
app.use(express.static('converted'));
app.listen(3000);
