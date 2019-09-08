#!/usr/bin/env node
import axios from "axios"
import { Pharmacy } from "../appInterfaces"
import * as admin from "firebase-admin"
import * as jsdom from "jsdom"
import * as dotenv from "dotenv"
import * as qs from "qs"
dotenv.config()

const { JSDOM } = jsdom

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_CRIDENTALS)
  ),
  databaseURL: process.env.FIREBASE_DATABASE
})

/**
 * This method saves all pharmacies of Bursa to db
 */
async function saveBursa() {
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
  return true
}

/**
 * This method saves all pharmacies of Istanbul to db
 */
async function saveIstanbul() {
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
    process.env.URL_ISTANBUL,
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
}

Promise.all([saveBursa(), saveIstanbul()])
  .then(result => {
    console.log("All pharmacies saved")
  })
  .catch(err => {
    console.log("Pharmacies couldn't save. Error: ", err)
  })
  .finally(() => {
    process.exit(0)
  })
