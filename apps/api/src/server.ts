import { app } from "./app";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";

app.listen(config.PORT, () => {
  logger.info(`API listening on http://localhost:${config.PORT}`);
});
