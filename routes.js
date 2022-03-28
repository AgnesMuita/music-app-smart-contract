const shortid = require('short-id')
const IPFS = require('ipfs-api');
//initialize IPFS with the http client using the backend url as host and port 5001
//This allows us to use IPFS methods to upload and retrieve data from IPFS
const ipfs = IPFS({host:'ipfs.infura.io',port:5001,protocol:"https"})
// import { nanoid } from 'nanoid';
// nanoid = require('nanoid')

function routes(app, dbe,lms, accounts){
  let db = dbe.collection('music-users')
  let music = dbe.collection('music-store')

  app.post('/register',(req,res)=>{
    let email = req.body.email
    // model.id =nanoid();
    // let idd = model.id
    let idd = shortid.generate()
    if(email){
      db.findOne({email},(err, doc)=>{
        if(doc){
          res.status(400).json({"status":"Failed","reason":"Already registered"})
        }
        else{
          db.insertOne({email})
          res.json({"status":"success","id":idd})
        }
    
    })
    }else{
      res.status(400).json({"status":"Failed","reason":"Wrong Input"})
    }
  })
  app.post('/login',(req,res)=>{
    let email = req.body.email
    if(email){
      db.findOne({email},(err,doc)=>{
        if(doc){
          res.json({"status":"success","id":doc.id})
        }else{
          res.status(400).json({"status":"Failed","reason":"Not recognized"})
        }
      })
    }else{
        res.status(400).json({"status":"Failed","reason":"Wrong Input"})
    }
  })
  app.post('/upload',(req,res)=>async()=>{
      let buffer = req.body.buffer
      let name = req.body.name
      let title = req.body.title
      let id = shortid.generate()+shortid.generate()

      if(buffer && title){
        //save the audio buffer to IPFS instead of storing it on the blockchain for anyone to use
        let ibfsHash = await ibfs.add(buffer);
        //save the buffer's address in the blockchain by generating an ID and using it as an identifier in the SendIPFS function
        let hash = ibfsHash[0].hash
        lms.sendIPFS(id,hash,{from:accounts[0]})
        //save all the other data associated with the music file in our DB
        .then((_hash,_address)=>{
          music.insertOne({id, hash, title, name})
          res.json({"status":"success",id})
        })
        .catch(err=>{
            res.status(400).json({"status":"Failed","reason":"wrong input"})
        })
      }else{
          res.status(400).json({"status":"Failed","reason":"Wrong input"})
      }
  })
  app.get('/access/:email/"id',(req,res)=>{
    let id = req.params.id
    if(req.params.id && req.params.email){
      db.findOne({email:req.body.email},(err,doc)=>{
        if(doc){
          //we retrieve our data by getting the id from the request using the id to access the IPFS hash address, and accessing the audio buffer using the address
          lms.getHash(id, {from:accounts[0]})
          .then(async(hash)=>{
              let data = await ipfs.files.get(hash)
              res.json({"status":"success",data:data.content})
          })
        }else{
              res.status(400).json({"status":"Failed","reason":"Wrong input"})
        }
      })
    
    }else{
      res.status(400).json({"status":"Failed", "reason":"Wrong input"})
    }
  })
}
module.exports=routes