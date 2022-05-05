// import
const express = require("express")
const jwt = require("jsonwebtoken")
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
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

		jwt.verify(token, process.env.jwtSecret, (error, decoded) => {
			if (error) {
				res.status(401).send("authorization failed")
			} else {
				if (req.headers.email !== decoded.email) {
					res.status(403).send("forbidden request")
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
		expiresIn: "2d",
	})
	res.send({ token })
})

// Mongodb uri
const uri = `mongodb+srv://${process.env.mongoUserName}:${process.env.mongoPassword}@cluster0.9iutd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
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
		const reviewCollection = client.db("rapid-dealer").collection("review")
		app.post("/add-review", verifyToken, async (req, res) => {
			const review = req.body
			const result = await reviewCollection.insertOne(review)
			res.send(result)
		})
		app.get("/review", async (req, res) => {
			const cursor = reviewCollection.find({}).limit(3).sort({ _id: -1 })
			const result = await cursor.toArray()
			res.send(result)
		})
		app.get("/my-cars", verifyToken, async (req, res) => {
			const email = req.headers.email
			const query = { addedBy: email }
			const cursor = await carCollection.find(query)
			const result = await cursor.toArray()
			res.send(result)
		})
		app.get("/car/:id", async (req, res) => {
			const carId = req.params.id
			const query = { _id: ObjectId(carId) }
			const result = await carCollection.findOne(query)
			res.send(result)
		})
		app.get("/delivered/:id", async (req, res) => {
			const query = { _id: ObjectId(req.params.id) }
			const car = await carCollection.findOne(query)
			const options = { upsert: true }

			/* 
			if (car.stock == 1) {
				const result = carCollection.deleteOne(query)
				res.send({ delete: "deleted" })
			} 
			 */
			if (car.stock === 0) {
				res.send({ faild: "out of stock" })
			} 
			
			else {
				const updatedDoc = {
					$set: {
						...car,
						stock: car.stock - 1,
					},
				}
				const result = await carCollection.updateOne(
					query,
					updatedDoc,
					options
				)

				res.send(result)
			}
		})
		app.post("/add-car-stock/:id", verifyToken, async (req, res) => {
			const carId = req.params.id
			const query = { _id: ObjectId(carId) }
			const moreStock = +req.body.stock
			const options = { upsert: true }
			const car = await carCollection.findOne(query)
			const updatedDoc = {
				$set: {
					...car,
					stock: +car.stock + moreStock,
				},
			}
			const result = await carCollection.updateOne(
				query,
				updatedDoc,
				options
			)
			res.send(result)
		})
		app.get("/cars", async (req, res) => {
			const query = {}
			const limit = +req.query.limit || 0
			const page = req.query.page || 0
			console.log(limit)
			console.log(page)
			const cursor = carCollection
				.find(query)
				.sort({ _id: -1 })
				.skip(+page * limit)
				.limit(+limit)

			const result = await cursor.toArray()
			res.send(result)
		})
		app.post("/add-car", verifyToken, async (req, res) => {
			const carInfo = req.body
			const updatedInfo = {
				...carInfo,
			}
			const result = await carCollection.insertOne(updatedInfo)
			res.send(result)
		})
		app.delete("/delete/car/:id", verifyToken, async (req, res) => {
			const carId = req.params.id
			const query = { _id: ObjectId(carId) }
			const result = carCollection.deleteOne(query)
			res.send({ delete: "deleted" })
		})
		app.get("/get-total", async (req, res) => {
			const query = {}
			const result = await carCollection.countDocuments(query)
			res.send({ result })
		})
		app.post("/edit-car/:id", verifyToken, async (req, res) => {
			const query = { _id: ObjectId(req.params.id) }
			const car = await carCollection.findOne(query)
			const carInfo = req.body
			const options = { upsert: true }
			const updatedDoc = {
				$set: {
					...carInfo,
				},
			}
			const result = await carCollection.updateOne(
				query,
				updatedDoc,
				options
			)
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
