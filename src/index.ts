import axios from "axios"
import * as express from "express"
import * as dotenv from "dotenv"
import * as admin from "firebase-admin"
dotenv.config()

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_CRIDENTALS)
  ),
  databaseURL: "https://pharmacy-staging-2a233.firebaseio.com"
})

const ref = admin.database().ref("user")
ref.set({
  name: "Serhan"
})

// const app = express()
// const port = process.env.PORT || 3000

// app.get("/", (req: any, res: any) => {
//   res.send({ state: "OK" })
// })

// app.get("/user", (req: any, res: any) => {
//   res.send({ state: "user" })
// })

// app.listen(port, () => {
//   console.log("listening: ", port)
// })
