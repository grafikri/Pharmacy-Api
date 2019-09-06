import axios from "axios"
import * as express from "express"
import * as dotenv from "dotenv"
import * as admin from "firebase-admin"
import * as qs from "qs"
import * as jsdom from "jsdom"

import { Coordinate, Pharmacy } from "./appInterfaces"

const cors = require("cors")({
  origin: true
})

const { JSDOM } = jsdom

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
  const ref = admin.database().ref("user")

  // ref.set({
  //   name: "Date " + Math.random()
  // })

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

/**
 * This method saves all pharmacies of Bursa to db
 */
app.get("/saveBursa", async (req: any, res: any) => {
  const url = process.env.URL_BURSA
  const response = await axios.get(url)
  const data = response.data.data

  const pharmacies: Pharmacy[] = data.map((item: any) => {
    const pharmacy: Pharmacy = {}
    pharmacy.name = item.eczane_adi
    pharmacy.address = item.eczane_adres
    pharmacy.phone = (item.phone as string).replace("-", "").split("/")[0]
    if (typeof item.konum === "string") {
      const arr = item.konum.split(",")
      pharmacy.coordinate = {
        lat: +arr[0],
        lng: +arr[1]
      }
    }
    return pharmacy
  })

  const ref = await admin.database().ref("bursa")
  await ref.set(pharmacies)

  res.send({ status: "OK" })
})

/**
 * This method saves all pharmacies of Istanbul to db
 */
app.get("/saveIstanbul", async (req: any, res: any) => {
  /**
   * Firsty gets raw html to access hash code that will use post request later
   */
  const siteResponse = await axios.get(process.env.URL_ISTANBUL)

  /**
   * Accessing hash code to use in post request
   */
  const rawHtml = siteResponse.data
  const dom = new JSDOM(rawHtml)
  const hash = (dom.window.document.querySelector("#h")! as any).value

  /**
   * Getting list of pharmacies
   */
  const response = await axios.post(
    "https://www.istanbuleczaciodasi.org.tr/nobetci-eczane/index.php",
    qs.stringify({
      jx: 1,
      islem: "get_eczane_markers",
      h: hash
    })
  )

  /**
   * Mapping pharmacies to save our own db
   */
  const pharmacies = response.data.eczaneler.map((item: any) => ({
    name: item.eczane_ad.split(" ")[0],
    address: [
      item.mahalle,
      item.cadde_sokak,
      item.semt,
      item.ilce,
      item.il
    ].join(" "),
    coordinate: {
      lat: +item.lat,
      lng: +item.lng
    },
    phone: "0" + item.eczane_tel
  }))

  const ref = await admin.database().ref("istanbul")
  await ref.set(pharmacies)

  res.send({ status: "OK" })
})

app.listen(port, () => {
  console.log("listening: ", port)
})
