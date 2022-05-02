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
	res.send({token})
})

// Mongodb uri
const uri = `mongodb+srv://${process.env.mongoUserName}:${process.env.mongoPassword}@cluster0.9iutd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`

// Mongodb client
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
})

// Mongodb
const runMongo = async () => {
	try {
		client.connect()
		const carCollection = client.db("rapid-dealer").collection("cars")
		app.get("/", verifyToken, (req, res) => {
			res.send("hello world")
		})
	} finally {
		//
	}
}

runMongo().catch(console.dir)

app.listen(process.env.PORT || 5000, () =>
	console.log("Server running on port " + 5000)
)
