import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  console.log(`StockFlow API escuchando en http://localhost:${env.port}`);
});
