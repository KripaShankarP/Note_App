require("dotenv").config()
const express = require('express')
const app = express()
const path = require('path')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname , "public")))
const cookiparser = require('cookie-parser')
app.use(cookiparser())
const usermodel = require('./models/usermodel')
const postmodel = require('./models/postmodel')
const { log } = require('console')
const connectDb = require("./config/db")


connectDb()

app.get('/',(req,res)=>{
    res.render('index')
})

app.post('/register',async (req,res)=>{
    let {username ,age,email,password }= req.body
   let user =  await usermodel.findOne({email})
   if(user) return res.status(500).send('user already registered')

   bcrypt.genSalt(10,(err , salt)=>{
      bcrypt.hash(password , salt,async (err, hash)=>{
        let myuser = await usermodel.create({
            username,
            age,
            email,
            password:hash,
        });
      let token = jwt.sign({email : email ,userid : myuser._id},'kripa')
      res.redirect('/login')
      })
})
})

app.get('/login',(req,res)=>{
     res.render('login')
})

app.post('/login',async (req,res)=>{
    let {email,password }= req.body
   let user =  await usermodel.findOne({email})
   if(!user) return res.status(500).send('something went wrong')
    
    bcrypt.compare(password ,user.password,(err,result)=>{
        if(result){ 
              let token = jwt.sign({email : email ,userid :user._id},'kripa')
              res.cookie('token' , token)
            res.redirect('/profile')
        }
        else return res.send('email or passsword did not matched')
    })

})

app.get('/logout',(req,res)=>{
    res.clearCookie('token')
    res.redirect('/login')
})

app.get('/profile',isLoggedIn,async (req,res)=>{
    let user =await usermodel.findOne({email : req.user.email}).populate('posts')
    res.render('profile',{user : user})
})

app.get('/like/:id',isLoggedIn,async (req,res)=>{
    let post =await postmodel.findOne({_id: req.params.id}).populate('user')
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid)
    }else{
        post.likes.splice(post.likes.indexOf(req.user.userid) ,1)
    }
   
    await post.save()
    res.redirect('/profile')
})

app.get('/edit/:id',isLoggedIn,async (req,res)=>{
    let post =await postmodel.findOne({_id: req.params.id}).populate('user')
    res.render('edit' , {post})
})

app.get('/delete/:id', isLoggedIn, async (req, res) => {
    let post = await postmodel.findById(req.params.id);
    await postmodel.findByIdAndDelete(req.params.id);
    res.redirect("/profile")
})
app.post('/update/:id',isLoggedIn,async (req,res)=>{
    let post =await postmodel.findOneAndUpdate({_id: req.params.id},{content : req.body.content})
    res.redirect('/profile')
})




app.post('/post', isLoggedIn , async(req,res)=>{
   let user = await usermodel.findOne({email:req.user.email})
   let {content} = req.body
   if(content.trim().length<1){
    return res.send("field required")
   }
   let post = await postmodel.create({
    user: user._id,
    content
   })
   user.posts.push(post._id)
    await user.save()
    res.redirect('/profile')
})

function isLoggedIn(req,res,next){
     if( !req.cookies.token){
         res.redirect('/login')
     }else{
        let data = jwt.verify(req.cookies.token,'kripa')
        req.user = data
        next()
     }
     
}

app.listen(process.env.PORT || 4000,(err)=>{
   if(err){
    console.log("Found Error");
    
   }
   console.log("Server Running On port :3000");
   
})