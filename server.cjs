const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// import { createServer } from 'http';
// import { parse } from 'url';
// import next from 'next';

// Check if we are in production
const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;

// Initialize the Next.js app
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    // Parse the URL to allow Next.js to handle dynamic routes
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});