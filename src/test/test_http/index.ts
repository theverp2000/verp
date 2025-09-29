import express, { Request, Response } from 'express';

export class Context {
  constructor(public someContextVariable) {
  }

  log(message: string) {
    console.log(this.someContextVariable, { message });
  }
}

declare global {
  namespace Express {
    interface Request {
      context: Context;
      requestTime: Date;
    }
  }
}

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const myLogger = function (req, res, next) {
  console.log('LOGGED')
  next()
}

app.use(myLogger);

// app.use((req, res, next) => {
//   const body = {msg: 'Hello World!', url: req.url, method: req.method, }; 
//   res.send(body);
//   next();
// })

// error handler
app.use((err, req, res, next) => {
  res.status(400).send(err.message)
})

const requestTime = function (req, res, next) {
  req.requestTime = Date.now();
  req.context = new Context(req.url);
  next()
}

app.use(requestTime)

app.get('/', (req, res) => {
  let responseText = 'Hello World!<br>'
  responseText += `<small>Requested at: ${req.requestTime}</small>`
  req.context.log('about to return');
  res.send(responseText)
})
