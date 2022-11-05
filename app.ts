import express = require('express');
import cors = require('cors');
import * as dotenv from 'dotenv';
import fetchLanguageRatio, { Language } from './fetchLanguageRatio';

dotenv.config();

const app = express();
app.use(cors());

let languageRatioCache: Language[] | null = null;

app.get('/languageRatio', async (req, res) => {
  if (languageRatioCache === null) {
    languageRatioCache = await fetchLanguageRatio();
    res.send(languageRatioCache);
  } else {
    res.send(languageRatioCache);
  }
});

app.use(express.static('converted'));
app.listen(process.env.PORT);
