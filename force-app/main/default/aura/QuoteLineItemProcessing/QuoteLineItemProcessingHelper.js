({
    lineItemAPICallout : function(component,erapidno,quoteid) {
        var errorMsgLabel =  $A.get("$Label.c.TestLink_Error_message");
        var errormsgs = errorMsgLabel.split("##");
        console.log('in HELPER=='+erapidno+quoteid);
        component.set("v.quoteid",quoteid);
        var calloutAction = component.get("c.fetchQuoteLineItemsAPI");
        calloutAction.setParams({ "erapidNo":erapidno,"quoteId" : quoteid });
        console.log('calloutAction=='+JSON.stringify(calloutAction));
        calloutAction.setCallback(this, function(response) {
            console.log('response.getState()='+response);
            var state = response.getState();                
            console.log('response.getState()='+response.getState());
            if (state == "SUCCESS") {
                console.log('calloutAction=retval=='+response.getReturnValue());
                //Navigating to Quote detail page START
                var resMessage=response.getReturnValue();
                if(resMessage=="success")
                {
                	this.redirectToQuote(component);    
                }
                else if(resMessage!="" && resMessage!=null && resMessage.indexOf(errormsgs[1]))
                {
                    component.set("v.hasError",true);               
                    //var errors = calloutAction.getError();
                    component.set("v.errorMessage",resMessage);
                }
                else
                {
                    component.set("v.hasError",true);               
                    //var errors = calloutAction.getError();
                    component.set("v.errorMessage",resMessage);
                }
                //Navigating to Quote detail page END
            }                
            else if (state == "ERROR") {                    
                console.log(state); 
                component.set("v.hasError",true);               
                component.set("v.errorMessage",errormsgs[0]+' '+errors[0].message);
            }           
                else
                {
                    console.log(state);                    
                    component.set("v.hasError",true);               
                    component.set("v.errorMessage",errormsgs[0]);
                }                                
        });            
        $A.enqueueAction(calloutAction);
    },
    redirectToQuote : function(component) {
        
        console.log("in Navigation=="+component.get("v.quoteid"));
        var navService = component.find("navService");
        var pageReference = {
            "type": "standard__recordPage",
            "attributes": {
                "recordId": component.get("v.quoteid"),
                "objectApiName": "Quotes__c",
                "actionName": "view"
            }
        };
        console.log("pageReference=="+JSON.stringify(pageReference));
        navService.navigate(pageReference);
    }
})