require('dotenv').config();
const express= require('express')
const app =express()
const routes = require('./routes')
const Web3 = require('web3');
const mongodb = require('mongodb').MongoClient
const contract = require('truffle-contract');
app.use(express.json())



if(typeof Web3 !== "undefined")
{
  var web3 = new Web3(web3.currentProvider)
}
else{
  var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost/8545'))
}
//build a contract based on the migrated json file and truffle contract package 
const LMS = contract(artifacts);
//set the contract provider to the web3 instance provider initialized on line 11
LMS.setProvider(web3.currentProvider);

mongodb.connect(process.env.DB,{useUnifiedTopology:true},async(err, client)=>{

  const dbe = client.db('Cluster0')
  //get accounts
  const accounts = await web3.eth.getAccounts();
  //lms is the instance of the contract, app is app instance, db is database instance, and the accounts data
  const lms = await LMS.deployed();
    //the commented function is called inputting the address as an argument if we have deployed our contract to a remote node 
    //const lms = LMS.at(contract_address) for remote nodes deployed on ropsten or rinkeby
  routes(app, dbe, lms, accounts)
  app.listen(process.env.PORT || 8082,()=>{
    console.log('listening on port 8082')

  })

})