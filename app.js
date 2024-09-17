const express = require('express')
const app = express()

const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')

app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const initalizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server started at http://loclahost:3000')
    })
  } catch (e) {
    console.log(`DB error: ${e.message}`)
  }
}

initalizeDbAndServer()

const convertResponseObjToStateDetailsObj = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

convertResponseObjToDistrictDetailsObj = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}
// API to get states details

app.get('/states/', async (request, response) => {
  const getStatesDetailsQuery = `
        SELECT 
            *
        FROM 
            state
        ORDER BY state_id
    `
  const statesList = await db.all(getStatesDetailsQuery)
  response.send(statesList.map(convertResponseObjToStateDetailsObj))
})

// api to get a specific state

app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getStateDetailsQuery = `
    SELECT * FROM state WHERE state_id=${stateId}
  `
  const stateDetails = await db.get(getStateDetailsQuery)
  response.send(convertResponseObjToStateDetailsObj(stateDetails))
})

// api to add a district
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const addDistrictDetailsQuery = `
    INSERT INTO
      district (district_name, state_id,cases,cured,active,deaths)
    VALUES
      ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths})
  `
  await db.run(addDistrictDetailsQuery)
  response.send('District Successfully Added')
})

// api to get a specific district details

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictDetails = `
    SELECT 
      *
    FROM district
      WHERE district_id=${districtId}
  `
  const districtDetails = await db.get(getDistrictDetails)
  response.send(convertResponseObjToDistrictDetailsObj(districtDetails))
})

// api to a specific distirct

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id=${districtId}
  `
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

// api to get district details
app.get('/districts/', async (request, response) => {
  const getDistrictsDetails = `
    SELECT * FROM district ORDER BY district_id
  `
  const districtsList = await db.all(getDistrictsDetails)
  response.send(districtsList.map(convertResponseObjToDistrictDetailsObj))
})
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictDetails = `
    UPDATE 
      district
    SET 
      district_name='${districtName}',
      state_id=${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE 
      district_id=${districtId}
  `
  await db.run(updateDistrictDetails)
  response.send('District Details Updated')
})

// api to get stats of a state
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = `
    SELECT 
      SUM(cases) AS  totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM district 
    WHERE state_id=${stateId}
  `
  const stats = await db.get(getStatsQuery)
  response.send(stats)
})

// api to get district details
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateDetailOfDistrict = `
    SELECT state_name AS stateName
    FROM state NATURAL JOIN district
    WHERE district.district_id=${districtId}
  `
  const stateDetails = await db.get(getStateDetailOfDistrict)
  response.send(stateDetails)
})

module.exports = app;