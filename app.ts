import express = require('express');
const app = express();
const port = 3000;

app.use(express.static('blog_src'));

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
