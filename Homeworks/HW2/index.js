import http from "http";
import fs from "fs";
import { URL } from "url";
import path from "path";
import querystring from "querystring";

function decodeText(encodedText) {
  const decodedText = querystring.unescape(encodedText);
  return decodedText;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  const writeRegex = /^\/write\/((?:[^/]+\/)*[^/]+)\/([^/]+)\/(.+)$/;
  const readRegex = /^\/read\/(.+)$/;

  if (writeRegex.test(url.pathname)) {
    const [, folderPath, fileName, text] = url.pathname.match(writeRegex);
    const decodedText = decodeText(text);
    const fullPath = path.join(".", folderPath, fileName);

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, decodedText, "utf8");
    res.end("File written!");
  } else if (readRegex.test(url.pathname)) {
    const [, filePath] = url.pathname.match(readRegex);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    res.end(fileContent);
  } else {
    const page = fs.readFileSync("index.html", "utf8");
    res.end(page);
  }
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
});
