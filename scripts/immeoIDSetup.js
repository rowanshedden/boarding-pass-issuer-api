const readline = require('readline');

const CredDefs = require('../agentLogic/credDefs.js');
const DIDs = require('../agentLogic/dids.js');
const Ledger = require('../agentLogic/ledger.js');

console.log("Setting Up Enterprise Agent");

const setup = async () => {
	try{
		//Perform TAA Agreement
		const TAA = await Ledger.fetchTAA();

		const rl = readline.createInterface({
	    input: process.stdin,
	    output: process.stdout
		});

		let agreement = false;

		rl.write(`Read the following Transaction Author Agreement:, \n ${TAA.taa_record.text} \n\n\n\n`);
		rl.question("Do you agree to the above Transaction Author Agreement? y/n: ", (response) => {
		  if(response === "y" || response === "Y" || response === "yes" || response === "Yes"){
		   	rl.write("You've Agreed to the Transaction Author Agreement");
		   	agreement = true;

		   	rl.close();
		  } 
		  else if (response === "n" || response === "N"){
		  	rl.write("You have not agreed to the Transaction Author Agreement, please cease use of the Enterprise Application");
		   	agreement = false;
		  	rl.close();
		  }
		  else{
		  	rl.write("Unrecognized Answer, you have not agreed to the Transaction Author Agreement, please cease use of the Enterprise Application");
		   	agreement = false;
		  	rl.close();
		  }
		});

		//Continue taking actions after acceptance
		rl.on("close", async () => {
			if(!agreement){
				throw new Error("TAA Not Accepted");
			}

			
			//Perform TAA Agreement
			await Ledger.acceptTAA(TAA.taa_record.version, TAA.taa_record.text, 'wallet_agreement');


			//Create a Public DID
	    const did = await DIDs.createDID();

	    

	    const rlDID = readline.createInterface({
		    input: process.stdin,
		    output: process.stdout
			});


	    rlDID.write(`The following DID Has Been Generated For You: \n\n DID: ${did.did} \n\n Verkey: ${did.verkey}\n\n`);
	    rlDID.question("Have you anchored the above DID? y/n: ", async (response) => {
			  if(response === "y" || response === "Y" || response === "yes" || response === "Yes"){
			   	rlDID.write("Continuing...\n");

			   	await DIDs.setPublicDID(did.did);

			   	rlDID.close();
			  } 
			  else if (response === "n" || response === "N"){
			  	rlDID.write("Aborting...");
			   	throw new Error("DID Not Anchored");
			  	rlDID.close();
			  }
			  else{
			  	rlDID.write("Unrecognized Answer, Aborting...");
			   	throw new Error("DID Not Anchored");
			  	rlDID.close();
			  }
			});

		  rlDID.on("close", async () => {
			  //Create Cred Def
			  const credDefID = await CredDefs.createCredDef("default", "W1vtCQVTy1aMJAjsHt5UK4:2:Covid_19_Lab_Result:1.3");

			  const rlCred = readline.createInterface({
			    input: process.stdin,
			    output: process.stdout
				});

			  rlCred.write(`The following Credential Definition Has Been Generated For You: \n\n Credential ID: ${credDefID}\n\n`);
		    rlCred.question("Press enter to continue... ", async (response) => {
				  rlCred.close();
				});

				rlCred.on("close", async () => {
					console.log("Continuing...");

					console.log("Finished Setup");
				})

			})

			
		});
		
	} catch (error){
		console.error(error);
		throw error;
		return;
	}
}

setup();