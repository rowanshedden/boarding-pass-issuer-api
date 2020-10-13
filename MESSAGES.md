Messages

## Contacts

### Get Contacts

SPA -> Controller
Context: CONTACTS
Type: GET_ALL
Data: {}


### Send Contact(s)

Controller -> SPA
Context: CONTACTS
Type: CONTACTS
Data:{
	contacts: [0...n]
}


## Credentials
	
### Get Credentials

SPA -> Controller
Context: CREDENTIALS
Type: GET_ALL_ATTRIBUTES_LIST
Data:{
	credentials: [0...n]
}

TODO:
API Filter Credentials


### Send Credential(s)

Controller -> SPA
Context: CREDENTIALS
Type: CREDENTIALS
Data:{
	credential_record:{
		credential_id,
		credential:{
			attributes = [
			 	{
			    "name": "result",
			    "mime-type": "string",
			    "value": e.target.result.value
			  },
			  /*
			  Parse to look like:
			  result: {
			    "name": "result",
			    "mime-type": "string",
			    "value": e.target.result.value
			  },
			  */
			]
		},
		...
	},
	...
}

## Settings

### Set Settings

SPA -> Controller
Context: SETTINGS
Type: SET_THEME
Data:{
	theme: {}
}

### Get Settings

SPA -> Controller
Context: SETTINGS
Type: GET_THEME
Data:{
}

### Send Settings

Controller -> SPA
Context: SETTINGS
Type: THEME_SETTINGS
Data:{
	theme: {}
}
