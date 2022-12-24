import express = require('express');
import cors = require('cors');
import * as dotenv from 'dotenv';
import fetchLanguageRatio from './src/languageRatio/fetchLanguageRatio';
import parseBlogStat from './src/recentCommits/parseblogStat';
import { convertAll } from './src/convert/convert';
import { Language } from './src/languageRatio/type';

dotenv.config();

const app = express();
app.use(cors());

convertAll();

let languageRatioCache: Language[] | null = null;
app.get('/languageRatio', async (req, res) => {
  if (languageRatioCache === null) {
    languageRatioCache = await fetchLanguageRatio();
    res.send(languageRatioCache);
  } else {
    res.send(languageRatioCache);
  }
});

let parseBlogStatCache: Awaited<ReturnType<typeof parseBlogStat>> | null = null;
app.get(
  '/blogSrcStat',
  async (req: express.Request<{ count?: number }>, res) => {
    if (parseBlogStatCache === null) {
      parseBlogStatCache = await parseBlogStat(req.params.count ?? 5);
      res.send(parseBlogStatCache);
    } else {
      res.send(parseBlogStatCache);
    }
  }
);

app.use(express.static('converted'));
app.listen(process.env.PORT);
console.log(`서버 시작, 포트: ${process.env.PORT}`);
