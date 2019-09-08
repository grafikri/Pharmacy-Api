import axios from "axios"
import * as express from "express"
import * as dotenv from "dotenv"
import * as admin from "firebase-admin"

const cors = require("cors")({
  origin: true
})

dotenv.config()

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_CRIDENTALS)
  ),
  databaseURL: process.env.FIREBASE_DATABASE
})

const app = express()
const port = process.env.PORT || 3000

app.get("/", (req: any, res: any) => {
  res.send({ state: "OK" })
})

app.get("/pharmacies", async (req: any, res: any) => {
  const istanbul = await admin
    .database()
    .ref("/istanbul")
    .once("value")

  const bursa = await admin
    .database()
    .ref("/bursa")
    .once("value")

  const data = [...istanbul.val(), ...bursa.val()]

  return cors(req, res, () => {
    res.send({ data: data })
  })
})

app.listen(port, () => {
  console.log("listening: ", port)
})
