import express from 'express';

const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('index.html');
});

app.get('/write/:folderPath/:fileName/:text', async (req, res) => {
  const { folderPath, fileName, text } = req.params;
  const decodedText = decodeURIComponent(text);
  const fullPath = path.join(".", folderPath, fileName);
  
  await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, decodedText, "utf8");
  res.end("File written!");
});

app.get('/read/:filePath', (req, res) => {
  const { filePath } = req.params;
  const fileContent = fs.readFileSync(filePath, 'utf8');
  res.end(fileContent);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
