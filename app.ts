import express = require('express');
import cors = require('cors');
import * as dotenv from 'dotenv';
import fetchLanguageRatio, { Language } from './fetchLanguageRatio';
import parseBlogStat from './parseblogStat';
import { convertAll } from './convert';

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
app.get('/blogSrcStat', async (req, res) => {
  if (parseBlogStatCache === null) {
    const blogSrcDir = process.env.BLOG_SRC_DIR;
    if (blogSrcDir === undefined) {
      throw new Error('BLOG_SRC_DIR 환경변수 없음');
    }
    parseBlogStatCache = await parseBlogStat(blogSrcDir);
    res.send(parseBlogStatCache);
  } else {
    res.send(parseBlogStatCache);
  }
});

app.use(express.static('converted'));
app.listen(process.env.PORT);
