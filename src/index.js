const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')

const swaggerDoc = YAML.load('docApi.yaml')

const app = express()
const port = process.env.PORT 


app.use(express.json()) // to automatically parse incomming JSON to an object, so we can access it in our request handlers

app.use('/users', userRouter)
app.use('/tasks', taskRouter)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc))


app.listen(port, () => {
    console.log('Server is on port ' + port)
})

