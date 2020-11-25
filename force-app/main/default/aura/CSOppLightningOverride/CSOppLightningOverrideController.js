({
    doInit: function(component, event, helper) {          
        
        var createRecordEvent = $A.get("e.force:createRecord");
        var  projId = component.get("v.recordId");
        console.log('projId=='+projId);
        createRecordEvent.setParams({
            "entityApiName": "C_S_Opportunity__c"
            
        });
        if(projId!=null && projId!='' && projId!='undefined')
        {
            createRecordEvent.setParams({
                "defaultFieldValues": {                                
                    "Project__c" : projId
                }     
            });
        }
        createRecordEvent.fire();          
        // $A.get('e.force:refreshView').fire();
    }
    
})