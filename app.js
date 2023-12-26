const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema, reviewSchema} = require("./schema.js");
const Review = require("./models/review.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to the database");
    } catch (err) {
        console.error("Error connecting to the database:", err);
    }
}

main(); // Call the main function immediately to establish the database connection.

app.get("/", (req, res) => {
    res.send("Root is working");
});

    const validateListing =  (err, req, res, next)=>{
        let {error} = listingSchema.validate(req.body);
        if(error){
            let errMsg = error.details.map((el) => el.message).join(",");
            throw new ExpressError(400, errMsg)
        }else{
            next()
        }
    };


    const validateReview =  (err, req, res, next)=>{
        let {error} = reviewSchema.validate(req.body);
        if(error){
            let errMsg = error.details.map((el) => el.message).join(",");
            throw new ExpressError(400, errMsg)
        }else{
            next()
        }
    };

    // (err, req, res, next) => {
    //     if (err.details) {
    //         const errorMessage = err.details.map((el) => el.message).join(',');
    //         res.status(400).json({ error: errorMessage });
    //     } else {
    //         next(err);
    //     }
    // };
    


app.get("/listings", validateListing, wrapAsync(async (req, res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});
}));

app.get("/listings/new", (req, res)=>{
    res.render("listings/new.ejs");  
});

app.get("/listings/:id", validateListing,  wrapAsync(async (req, res)=>{
    let {id} =  req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", {listing});
}));

//Reviews
// Post Route
app.post("/listings/:id/reviews", validateReview, wrapAsync(async(req, res)=>{
   let listing = await Listing.findById(req.params.id);  
   let newReview = new Review(req.body.review);
   listing.reviews.push(newReview);

   await newReview.save();
   await listing.save();

   console.log("new review saved");
   res.redirect(`/listings/${listing._id}`);
}));


app.post("/listings",  validateListing,  wrapAsync(async (req, res)=>{
    const newListing = new Listing(req.body.listing);
// await newListing.save();

    await newListing.save();
    res.redirect("/listings");

}));
    // let {title, description, image, price, country, location} = req.body;
    // console.log(price);
    // if(!req.body.listing){
    //     throw new ExpressError(400, "Send valid data for listing");
    // } 
    // 
    //  if(!newListing.title){
    //     throw new ExpressError(400, "Valid title for listing");
    //  }
    //  if(!newListing.description){
    //     throw new ExpressError(400, "Valid description for listing");
    //  }
    //   if(!newListing.price){
    //     throw new ExpressError(400, "Valid price for listing");
    //  }
    //  if(newListing.price<0){
    //     throw new ExpressError(400, "Valid price for listing");
    //  }
    //  if(!newListing.location){
    //     throw new ExpressError(400, "Valid location for listing");
    //  }

 /* instead of all of the if conditions we can use joi to reduce code*/

  
  

app.get("/listings/:id/edit", validateListing,  wrapAsync(async(req, res)=>{
    let {id}= req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", {listing});
}));

//update route
app.put("/listings/:id", validateListing, wrapAsync(async (req, res)=>{
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listings/${id}`);
}));

// delete route
app.delete("/listings/:id", validateListing, wrapAsync(async(req, res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

// app.use((err, req, res, next)=>{
//     res.send('something went wrong');
// })

// app.get("/testListing", async (req, res) => {
//     try {
//         const sampleListing = new Listing({
//             title: "My New Villa",
//             description: "By the beach",
//             price: 1200,
//             location: "Calangute, Goa",
//             country: "India",
//         });
//         await sampleListing.save();
//         console.log("Saved to DB");
//         res.send("Successful testing");
//     } catch (err) {
//         console.error("Error while saving the listing:", err);
//         res.status(500).send("Error during testing");
//     }
// });

app.all("*", (req, res, next)=>{
    next(new ExpressError(404, "Page not found!"));
}); 

app.use((err, req, res, next)=>{
let {statusCode=500, message="something went wrong"} = err;
res.status(statusCode).render("error.ejs", {message})
// res.status(statusCode).send(message);
})

app.listen(8080, () => {
    console.log("Listening on port 8080");
});
