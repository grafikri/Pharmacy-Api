import axios from "axios"
import * as express from "express"

const app = express()
const port = process.env.PORT || 3000

app.get("/", (req: any, res: any) => {
  res.send({ state: "OK" })
})

app.get("/user", (req: any, res: any) => {
  res.send({ state: "user" })
})

app.listen(3000, () => {
  console.log("listening: ", port)
})
