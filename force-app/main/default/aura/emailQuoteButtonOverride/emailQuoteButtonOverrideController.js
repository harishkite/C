({
    doInit : function(component, event, helper) 
    {
        
        //CHECK-Egnyte Token
        var quoteId = component.get("v.recordId");
        var egnyteDomain = $A.get("$Label.c.Egnyte_Domain_URL");
        var egnyteToken = $A.get("$Label.c.Egnyte_Token_for_Authorization");
        var action = component.get("c.getEgnyteToken");
        action.setCallback(this, function(response) {
            
            var state = response.getState();
            if (state === "SUCCESS") {
                // Alert the user with the value returned 
                // from the server
                console.log("From server: " + response.getReturnValue());
                var retVal = response.getReturnValue();
                if(retVal=='false')
                {
                	window.open(egnyteDomain+"/puboauth/token?client_id="+egnyteToken+"&redirect_uri=https://c-sgroup--dev.my.salesforce.com/apex/egnyteEmailFile?id="+quoteId+"&mobile=0&source=Lightning","_top");    
                }
                else if(retVal!='' && retVal!=null)
                {
                    var navService = component.find("navService");
                    var pageReference = {
                        "type": "standard__component",
                        "attributes": {
                            "componentName": "c__emailQuoteDocuments"
                        }, 
                        "state": {
                            "c__recordId":quoteId 
                        }
                    };
                    console.log("pageReference=="+JSON.stringify(pageReference));
                    navService.navigate(pageReference);
                }
            }            
            else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + 
                                 errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
        });
        $A.enqueueAction(action);
    }
})