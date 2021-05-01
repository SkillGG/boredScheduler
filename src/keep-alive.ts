import * as Express from "express";
export default () => {
  const app = Express();
  app.get('/', (_req, res) => res.send('Server is up.'));
  Express.application.listen(3000);
}