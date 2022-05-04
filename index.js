// import
const express = require("express")
const jwt = require("jsonwebtoken")
const { MongoClient, ServerApiVersion } = require("mongodb")
const cors = require("cors")
const app = express()
require("dotenv").config()

// Middleware configuration
app.use(cors())
app.use(express.json())

// custom middleware

const verifyToken = (req, res, next) => {
	const bearer = req?.headers?.authorization

	if (!bearer) {
		res.send("token not found")
	} else {
		const token = bearer.split(" ")[1]
		console.log(token)
		jwt.verify(token, process.env.jwtSecret, (error, decoded) => {
			if (error) {
				res.status(401).send("authorization failed")
			} else {
				console.log(decoded)
				if (req.headers.email !== decoded.email) {
					res.status(401).send("authorization failed")
				} else {
					next()
				}
			}
		})
	}
}

// create jwt token
app.post("/create-jwt-token", (req, res) => {
	const email = req.body.email
	const token = jwt.sign({ email }, process.env.jwtSecret, {
		expiresIn: "5hr",
	})
	res.send({ token })
})

// Mongodb uri
const uri = `mongodb+srv://${process.env.mongoUserName}:${process.env.mongoPassword}@cluster0.9iutd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
// console.log(uri);
// Mongodb client
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
})

// // Mongodb
const runMongo = async () => {
	try {
		client.connect()
		const carCollection = client.db("rapid-dealer").collection("cars")
		app.get("/", verifyToken, (req, res) => {
			res.send("hello world")
		})
		app.get("/cars", async (req, res) => {
			const query = {}
			const limit = req.query.limit || 0
			const cursor = carCollection
				.find(query)
				.sort({ _id: -1 })
				.limit(+limit)

			const result = await cursor.toArray()
			res.send(result)
		})
		app.post("/add-car", async (req, res) => {
			const carInfo = req.body
			console.log(carInfo)
			const updatedInfo = {
				...carInfo,
			}
			const result = await carCollection.insertOne(updatedInfo)
			res.send(result)
		})
	} finally {
		//
	}
}

runMongo().catch(console.dir)

app.listen(process.env.PORT || 4000, () =>
	console.log("Server running on port " + 4000)
)
