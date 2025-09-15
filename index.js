import { inngest, functions } from "./inngest/index.js"
import { serve } from "inngest/express";
import express from "express";


const app = express();
const port = 3000;

// Important: ensure you add JSON middleware to process incoming JSON POST payloads.
app.use(express.json());


// Define a basic route
app.get('/', (req, res) => {
    res.send('Hello World from Express!');
});


// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));



app.get('/api/hello',async function(req,res,next){
    await inngest.send({
        name:"test/hello.world",
        data:{
            email: 'baappeee@gmail.com'
        }
    }).catch(e=>next(e))

    res.json({
        message: 'Event sent!'
    })


})


// Start the server
app.listen(port, () => {
    console.log(`Express server listening at http://localhost:${port}`);
});