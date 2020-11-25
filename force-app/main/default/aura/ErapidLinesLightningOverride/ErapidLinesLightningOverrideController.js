({
    doInit : function(component, event, helper) 
    {           
        //alert('IN QuoteDetails');
        var action = component.get("c.quoteAllFields");
        var erapidBaseUrl = $A.get("$Label.c.ERAPID_INT_URL");
        
        var erapidqtno;
        action.setParams({ "quoteId" : component.get("v.recordId") });            
        action.setCallback(this, function(response) {
            var state = response.getState();                
            console.log('state=='+state);
            if (state === "SUCCESS") {                
                //GET USER DETAILS--START
                var userId = $A.get("$SObjectType.CurrentUser.Id");
                var userAction = component.get("c.fetchLoggedInUser");
                erapidqtno=response.getReturnValue().Erapid_Quote_no__c;
                var erapidId;
                userAction.setParams({ "userid" : userId });            
                userAction.setCallback(this, function(response) {
                    var state = response.getState();                
                    console.log('state=='+state);
                    if (state === "SUCCESS") {
                        //console.log("response.getReturnValue()=="+JSON.stringify(response.getReturnValue()));
                        console.log('response.getReturnValue().Erapid_id__c'+response.getReturnValue().Erapid_id__c);
                        component.set("v.erapidId",response.getReturnValue().Erapid_id__c);
                        console.log("Opening URL-ERAPID==="+erapidBaseUrl+"erapid/salesforceSession.jsp?page=line&login="+response.getReturnValue().Erapid_id__c+"&order_no="+erapidqtno+"&env=dev");
                        window.open(erapidBaseUrl+"erapid/salesforceSession.jsp?page=line&login="+response.getReturnValue().Erapid_id__c+"&order_no="+erapidqtno+"&env=dev","_top");
                    }                
                    else {                    
                        console.log(state);                                        
                    }                
                });            
                $A.enqueueAction(userAction);
                
                //GET USER DETAILS--END
            }                
            else {                    
                console.log(state);                                        
            }                
        });            
        $A.enqueueAction(action);
    }
    
})