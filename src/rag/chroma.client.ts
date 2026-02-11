import { CloudClient } from "chromadb";

const chromaClient = new CloudClient({
  apiKey: 'ck-9JavvBocBnJpQUK6jLrPr3YErrhbBQtb3XfTaR9wYXha',
  tenant: 'b3046f4f-c7da-454c-8771-d6408ec04de7',
  database: 'Streaming-talk'
});

export default chromaClient;
